import { documentDir } from "@tauri-apps/api/path";
import { spawnCommand, convertToToolPath, runCommand } from "./execution";
import type { BaseToolOptions, ToolCallbacks } from "./types";
import { ensureGoInstalledAndUpdated,checkGoInstalled } from "./prerequisites";

export interface NucleiOptions extends BaseToolOptions {
  templates?: string[]; // -t (list of templates or tags)
  severity?: string[];  // -severity
  noInteractsh?: boolean; // -no-interactsh (privacy)
}

export async function runNuclei(
  options: NucleiOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string }> {
  const { target, engagementName = "Default", templates, severity, noInteractsh } = options;

  if (!target) throw new Error("Target is required");

  const docDir = await documentDir();
  const engagement = engagementName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const winPath = `${docDir}\\NetView\\results\\${engagement}\\nuclei_${target.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
  const toolPath = convertToToolPath(winPath);
  const outputDir = toolPath.substring(0, toolPath.lastIndexOf('/'));

  let cmd = `~/go/bin/nuclei -u "${target}" -silent -jsonl -o "${toolPath}"`;

  if (templates && templates.length > 0) {
    templates.forEach(t => cmd += ` -t "${t}"`);
  }

  if (severity && severity.length > 0) {
    cmd += ` -severity ${severity.join(",")}`;
  }
  
  if (noInteractsh) {
    cmd += ` -no-interactsh`;
  }

  // Auto-update templates is common, but maybe skip for speed?
  // cmd += " -update-templates"; 

  const fullCmd = `mkdir -p "${outputDir}" && ${cmd}`;
  
  callbacks.onOutput?.(`Executing: ${cmd}`);

  await spawnCommand(["bash", "-c", fullCmd], {
    onOutput: callbacks.onOutput,
    onComplete: callbacks.onComplete,
    onError: callbacks.onError,
  });

  return { outputPath: winPath };
}

export async function installNuclei(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  callbacks.onOutput?.("Preparing Go environment...");

  callbacks.onOutput?.(
  `Go Installed: ${await checkGoInstalled()}`
);
const goReady = await ensureGoInstalledAndUpdated(
  password,
  callbacks
);

if (!goReady) {
  callbacks.onError?.("Failed to prepare Go environment.");
  return false;
}
  callbacks.onOutput?.("Installing Nuclei...");



  callbacks.onOutput?.("Installing Nuclei via Go...");
  const script = `go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest 2>&1 && echo 'INSTALL_SUCCESS'`;
  
  const result = await runCommand(script, {
    onOutput: callbacks.onOutput,
  });

  if (result.output.some(line => line.includes("INSTALL_SUCCESS"))) {
    callbacks.onOutput?.("\nNuclei installed successfully!");
    callbacks.onComplete?.(true, 0);
    return true;
  } else {
    callbacks.onOutput?.("\nNuclei installation failed.");
    callbacks.onComplete?.(false, result.code);
    return false;
  }
}

export async function checkNucleiInstalled(): Promise<boolean> {
  const result = await runCommand("~/go/bin/nuclei -version > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some(line => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}
