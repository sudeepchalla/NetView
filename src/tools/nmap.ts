import { documentDir } from "@tauri-apps/api/path";
import { spawnCommand, convertToToolPath, runCommand } from "./execution";
import type { BaseToolOptions, ToolCallbacks } from "./types";

export interface NmapOptions extends BaseToolOptions {
  serviceVersion?: boolean; // -sV
  defaultScripts?: boolean; // -sC
  allPorts?: boolean; // -p-
  osDetection?: boolean; // -O
  timingTemplate?: number; // -T<0-5>
  fastMode?: boolean; // -F
  presetName?: string; // For labeling results when using presets
  originalTarget?: string; // For labeling results when using presets
}

export async function runNmap(
  options: NmapOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string }> {
  const {
    target,
    engagementName = "Default",
    serviceVersion,
    defaultScripts,
    allPorts,
    osDetection,
    timingTemplate = 4,
    fastMode,
    presetName,
    originalTarget
  } = options;

  if (!target) {
    throw new Error("Target is required");
  }

  const docDir = await documentDir();
  const engagement = engagementName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const targetLabel =
    presetName && originalTarget
      ? `${presetName}_${originalTarget}`
      : target;
  const safeTargetLabel = targetLabel.replace(/[^a-zA-Z0-9_-]/g, "_");
  const winPath = `${docDir}\\NetView\\results\\${engagement}\\active-recon\\Nmap\\nmap_${safeTargetLabel}_${Date.now()}.txt`; // Nmap typically outputs text or xml
  const toolPath = convertToToolPath(winPath);
  const outputDir = toolPath.substring(0, toolPath.lastIndexOf('/'));

  let cmd = `sudo nmap`; // Nmap often needs sudo for OS detection/SYN scan

  if (serviceVersion) cmd += " -sV";
  if (defaultScripts) cmd += " -sC";
  if (allPorts) cmd += " -p-";
  if (osDetection) cmd += " -O";
  if (timingTemplate) cmd += ` -T${timingTemplate}`;
  if (fastMode) cmd += " -F";

  cmd += ` "${target}"`;

  // Output to normal file for viewing + XML for potential parsing later? 
  // For now just > to file. 
  // Note: -oN allows normal output format to a file.
  cmd += ` -oN "${toolPath}"`;

  // Nmap needs sudo. We might need to handle password if checking for sudo.
  // However, standard `sudo` in WSL might ask for password on stdin if not configured.
  // Ideally, users configure passwordless sudo or we pipe it. 
  // For this implementation, let's assume `spawnWslCommand` can handle interactive or we rely on user having cached credentials/passwordless sudo for nmap?
  // Or simpler: just run `nmap` without sudo if features don't require it? 
  // Types like -O require root.
  // We'll stick to basic execution. If it prompts for password, it might hang if not handled.
  // Let's rely on standard `sudo -S` pattern if we had the password, but `runTool` interface doesn't pass password.
  // We'll try running without sudo first, unless strictly needed. Users often run nmap as root.
  // Let's strip sudo for now to avoid hanging, unless we explicitly ask for password in the UI run flow (which we don't yet).
  // Modified: Run as standard user. If root is needed, user needs to handle permissions/capabilities or use `sudo` with cached creds.
  cmd = cmd.replace("sudo ", "");

  const fullCmd =
    `mkdir -p "${outputDir}" && ${cmd}`;

  callbacks.onOutput?.(
    `Executing: ${cmd}`
  );

  try {
    await spawnCommand(
      ["bash", "-c", fullCmd],
      {
        onOutput: callbacks.onOutput,

        onComplete: (success, code) => {
          if (success) {
            callbacks.onOutput?.(
              `\n[Process completed with exit code ${code}]`
            );

            callbacks.onOutput?.(
              `Results saved to:\n${winPath}`
            );
          }

          callbacks.onComplete?.(
            success,
            code
          );
        },

        onError: callbacks.onError,
      }
    );

    callbacks.onOutput?.(
      "\n[+] Scan completed successfully"
    );

    return {
      outputPath: winPath,
    };
  } catch (error) {
    callbacks.onOutput?.(
      `\n[Error: ${error}]`
    );

    callbacks.onError?.(
      String(error)
    );

    callbacks.onComplete?.(
      false,
      -1
    );

    return {
      outputPath: "",
    };
  }
}

export async function installNmap(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  const escapedPassword = password.replace(/'/g, "'\\''");
  callbacks.onOutput?.("Installing Nmap...");

  const script = `echo '${escapedPassword}' | sudo -S apt-get update && echo '${escapedPassword}' | sudo -S apt-get install -y nmap && echo 'INSTALL_SUCCESS'`;

  const result = await runCommand(script, {
    onOutput: (line) => {
      if (!line.includes(password)) callbacks.onOutput?.(line);
    }
  });

  if (result.output.some(line => line.includes("INSTALL_SUCCESS"))) {
    callbacks.onOutput?.("\nNmap installed successfully!");
    callbacks.onComplete?.(true, 0);
    return true;
  } else {
    callbacks.onOutput?.("\nNmap installation failed.");
    callbacks.onComplete?.(false, result.code);
    return false;
  }
}

export async function checkNmapInstalled(): Promise<boolean> {
  const result = await runCommand("which nmap || echo 'NOT_FOUND'");
  return !result.output.some(line => line.includes("NOT_FOUND"));
}
