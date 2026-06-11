import { documentDir } from "@tauri-apps/api/path";
import { spawnCommand, convertToToolPath, runCommand } from "./execution";
import type { BaseToolOptions, ToolCallbacks } from "./types";

export interface HttpxOptions extends BaseToolOptions {
  statusCode?: boolean;
  title?: boolean;
  tech?: boolean;
  followRedirects?: boolean;
  ip?: boolean;
  cname?: boolean;
  asn?: boolean;
  cdn?: boolean;
  location?: boolean;


}

//run httpx against target or list of targets
export async function runHttpx(
  options: HttpxOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string }> {
  const {
    target,
    inputFile,
    engagementName = "Default",
    statusCode,
    title,
    tech,
    followRedirects,
    ip,
    cname,
    asn,
    cdn,
    location,
    originalTarget,
    presetName,
  } = options;

  // Validate: either target or inputFile must be provided
  if (!target && !inputFile) {
    throw new Error("Either target or inputFile must be provided");
  }

  //setup output paths
  const docDir = await documentDir();
  const engagement = engagementName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const targetLabel =
  presetName && originalTarget
    ? `${presetName}_${originalTarget}`
    : originalTarget ??
      (inputFile ? "multi" : target);
  // Ensure we have a valid filename even if target is a URL with special chars
  const safeTargetLabel = targetLabel?.replace(/[^a-zA-Z0-9_-]/g, "_") || "unknown";
  const winPath = `${docDir}\\NetView\\results\\${engagement}\\active-recon\\httpx\\httpx_${safeTargetLabel}_${Date.now()}.json`;
  const toolPath = convertToToolPath(winPath);
  const outputDir = toolPath.substring(0, toolPath.lastIndexOf('/'));

  let httpxCmd: string;
  // Aggressive timeout settings for faster completion:
  // -timeout 3: 3 second timeout per host
  // -retries 1: only 1 retry attempt
  // -no-fallback: don't try HTTP if HTTPS fails (faster)
  // -threads 25: moderate parallelism
  const baseFlags = "-timeout 3 -retries 1 -no-fallback -threads 25";

  if (inputFile) {
    const toolInputPath = convertToToolPath(inputFile);
    // Use cat + pipe instead of -l flag (more reliable with WSL paths)
    // Also convert CRLF to LF in case of Windows line endings
    httpxCmd = `cat "${toolInputPath}" | tr -d '\\r' | ~/go/bin/httpx ${baseFlags} -json -o "${toolPath}"`;
  } else {
    httpxCmd = `echo "${target}" | ~/go/bin/httpx ${baseFlags} -json -o "${toolPath}"`;
  }

  if (statusCode) httpxCmd += " -status-code";
  if (title) httpxCmd += " -title";
  if (tech) httpxCmd += " -tech-detect";
  if (followRedirects) httpxCmd += " -follow-redirects";
  if (ip) httpxCmd += " -ip";
  if (cname) httpxCmd += " -cname";
  if (asn) httpxCmd += " -asn";
  if (cdn) httpxCmd += " -cdn";
  if (location) httpxCmd += " -location";

  const fullCmd = `mkdir -p "${outputDir}" && ${httpxCmd}`;
  callbacks.onOutput?.(`Executing: ${httpxCmd}`);

  await spawnCommand(["bash", "-c", fullCmd], {
    onOutput: callbacks.onOutput,
    onComplete: (success, code) => {
      if (success) {
        callbacks.onOutput?.(`\n[Process completed with exit code ${code}]`);
        callbacks.onOutput?.(`Results saved to: ${winPath}`);
      }
      callbacks.onComplete?.(success, code);
    },
    onError: callbacks.onError,
  });

  return { outputPath: winPath };
}

//install httpx
export async function installHttpx(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  const escapedPassword = password.replace(/'/g, "'\\''");

  callbacks.onOutput?.("Starting httpx installation...");
  callbacks.onOutput?.("Step 1: Ensuring Go is installed...");

  //check if Go is installed
  const goCheck = await runCommand("which go || echo 'GO_NOT_FOUND'");
  if (goCheck.output.some((line) => line.includes("GO_NOT_FOUND"))) {
    callbacks.onOutput?.("\nGo not found. Installing Go...");
    const goScript = `echo '${escapedPassword}' | sudo -S apt-get update && echo '${escapedPassword}' | sudo -S apt-get install -y golang-go && echo 'GO_INSTALL_SUCCESS'`;
    const goResult = await runCommand(goScript, {
      onOutput: (line) => {
        if (!line.includes(password)) callbacks.onOutput?.(line);
      },
    });
    if (!goResult.output.some((line) => line.includes("GO_INSTALL_SUCCESS"))) {
      callbacks.onOutput?.(`\n✕ Go installation failed`);
      callbacks.onComplete?.(false, goResult.code);
      return false;
    }
  }

  callbacks.onOutput?.("\nStep 2: Installing httpx...");
  const httpxScript = `go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest 2>&1 && echo 'HTTPX_INSTALL_SUCCESS'`;

  const httpxResult = await runCommand(httpxScript, {
    onOutput: callbacks.onOutput,
  });

  const httpxSuccess = httpxResult.output.some((line) =>
    line.includes("HTTPX_INSTALL_SUCCESS")
  );

  if (httpxResult.code === 0 && httpxSuccess) {
    callbacks.onOutput?.("\nHttpx installed successfully!");
    callbacks.onComplete?.(true, 0);
    return true;
  } else {
    callbacks.onOutput?.(`\nHttpx installation failed with code ${httpxResult.code}.`);
    callbacks.onComplete?.(false, httpxResult.code);
    return false;
  }
}

//check if httpx is installed
export async function checkHttpxInstalled(): Promise<boolean> {
  const result = await runCommand("~/go/bin/httpx -h > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some((line) => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}
