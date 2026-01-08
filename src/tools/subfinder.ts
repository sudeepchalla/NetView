import { documentDir } from "@tauri-apps/api/path";
import { runWslCommand, spawnWslCommand, convertToWslPath } from "./wsl";
import type { SubfinderOptions, ToolCallbacks } from "./types";

//run subfinder against target domain
export async function runSubfinder(
  options: SubfinderOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string }> {
  const { target, all, recursive, engagementName = "Default" } = options;

  //setup output paths
  const docDir = await documentDir();
  const engagement = engagementName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const winPath = `${docDir}\\NetView\\results\\${engagement}_subfinder_${target}_${Date.now()}.json`;
  const wslPath = convertToWslPath(winPath);
  const outputDir = wslPath.substring(0, wslPath.lastIndexOf('/'));

  let subfinderCmd = `~/go/bin/subfinder -d ${target} -json -o "${wslPath}" -silent`;
  if (all) subfinderCmd += " -all";
  if (recursive) subfinderCmd += " -recursive";

  const fullCmd = `mkdir -p "${outputDir}" && ${subfinderCmd}`;
  callbacks.onOutput?.(`Executing: ${subfinderCmd}`);

  await spawnWslCommand(["bash", "-c", fullCmd], {
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

//install subfinder
export async function installSubfinder(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  const escapedPassword = password.replace(/'/g, "'\\''");

  callbacks.onOutput?.("Starting installation process...");
  callbacks.onOutput?.("Step 1: Installing Go and dependencies...");

  //install go and git
  const goScript = `echo '${escapedPassword}' | sudo -S apt-get update && echo '${escapedPassword}' | sudo -S apt-get install -y golang-go git && echo 'GO_INSTALL_SUCCESS'`;

  const goResult = await runWslCommand(goScript, {
    onOutput: (line) => {
      if (!line.includes(password)) callbacks.onOutput?.(line);
    },
  });

  const goSuccess = goResult.output.some((line) => line.includes("GO_INSTALL_SUCCESS"));

  if (goResult.code !== 0 || !goSuccess) {
    callbacks.onOutput?.(`\n✕ Go installation failed with code ${goResult.code}`);
    callbacks.onComplete?.(false, goResult.code);
    return false;
  }

  callbacks.onOutput?.("\nStep 1 Completed: Go installed successfully!");
  callbacks.onOutput?.("\nStep 2: Installing Subfinder...");

  //install subfinder
  const subfinderScript = `go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest 2>&1 && echo 'SUBFINDER_INSTALL_SUCCESS'`;

  const subfinderResult = await runWslCommand(subfinderScript, {
    onOutput: callbacks.onOutput,
  });

  const subfinderSuccess = subfinderResult.output.some((line) =>
    line.includes("SUBFINDER_INSTALL_SUCCESS")
  );

  if (subfinderResult.code === 0 && subfinderSuccess) {
    callbacks.onOutput?.("\nStep 2 Completed: Subfinder installed successfully!");
    callbacks.onOutput?.("\nALL STEPS COMPLETED SUCCESSFULLY!");
    callbacks.onComplete?.(true, 0);
    return true;
  } else {
    callbacks.onOutput?.(`\nSubfinder installation failed with code ${subfinderResult.code}.`);
    callbacks.onComplete?.(false, subfinderResult.code);
    return false;
  }
}

//check if subfinder is installed
export async function checkSubfinderInstalled(): Promise<boolean> {
  const result = await runWslCommand("~/go/bin/subfinder -h > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some((line) => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}
