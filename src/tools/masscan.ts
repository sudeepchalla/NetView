import { documentDir } from "@tauri-apps/api/path";
import { spawnCommand, convertToToolPath, runCommand } from "./execution";
import type { BaseToolOptions, ToolCallbacks } from "./types";

export interface MasscanOptions extends BaseToolOptions {
  ports?: string; // -p
  rate?: number; // --rate
}

export async function runMasscan(
  options: MasscanOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string }> {
  const { target, engagementName = "Default", ports = "80,443", rate = 1000 } = options;

  if (!target) throw new Error("Target is required");

  const docDir = await documentDir();
  const engagement = engagementName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const winPath = `${docDir}\\NetView\\results\\${engagement}\\masscan_${target}_${Date.now()}.json`;
  const toolPath = convertToToolPath(winPath);
  const outputDir = toolPath.substring(0, toolPath.lastIndexOf('/'));

  // Masscan requires sudo/root privileges for raw socket access.
  // This is a limitation if we don't have password. 
  // However, `masscan` is useless without root.
  // For now, we'll try to execute. The user might have passwordless sudo or be running as root.
  // Ideally, UI should prompt for sudo password if not cached. 
  // We'll exclude 'sudo' for now and assume capabilities are set or user handles it.
  
  let cmd = `masscan "${target}" -p${ports} --rate=${rate} -oJ "${toolPath}"`;
  
  // NOTE: Typically needs sudo. 
  // cmd = `echo '${options.password}' | sudo -S ` + cmd; // IF we had password in options.

  const fullCmd = `mkdir -p "${outputDir}" && ${cmd}`;
  
  callbacks.onOutput?.(`Executing: ${cmd}`);
  callbacks.onOutput?.("NOTE: Masscan usually requires root privileges (sudo).");

  await spawnCommand(["bash", "-c", fullCmd], {
    onOutput: callbacks.onOutput,
    onComplete: callbacks.onComplete,
    onError: callbacks.onError,
  });

  return { outputPath: winPath };
}

export async function installMasscan(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  const escapedPassword = password.replace(/'/g, "'\\''");
  callbacks.onOutput?.("Installing Masscan...");
  
  // Masscan from apt is often old, but easiest. Source build is better but longer.
  const script = `echo '${escapedPassword}' | sudo -S apt-get update && echo '${escapedPassword}' | sudo -S apt-get install -y masscan && echo 'INSTALL_SUCCESS'`;
  
  const result = await runCommand(script, {
    onOutput: (line) => {
      if (!line.includes(password)) callbacks.onOutput?.(line);
    }
  });

  if (result.output.some(line => line.includes("INSTALL_SUCCESS"))) {
    callbacks.onOutput?.("\nMasscan installed successfully!");
    callbacks.onComplete?.(true, 0);
    return true;
  } else {
    callbacks.onOutput?.("\nMasscan installation failed.");
    callbacks.onComplete?.(false, result.code);
    return false;
  }
}

export async function checkMasscanInstalled(): Promise<boolean> {
  const result = await runCommand("which masscan || echo 'NOT_FOUND'");
  return !result.output.some(line => line.includes("NOT_FOUND"));
}
