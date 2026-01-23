import { documentDir } from "@tauri-apps/api/path";
import { runCommand, spawnCommand, convertToToolPath } from "./execution";
import type { ToolCallbacks } from "./types";

export interface WhatWebOptions {
  target: string;
  aggression?: 1 | 2 | 3 | 4;
  verbose?: boolean;
  engagementName?: string;
}

//run whatweb against target url
export async function runWhatWeb(
  options: WhatWebOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string }> {
  const { target, aggression = 1, verbose = false, engagementName = "Default" } = options;

  //setup output paths
  const docDir = await documentDir();
  const engagement = engagementName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const winPath = `${docDir}\\NetView\\results\\${engagement}\\whatweb_${target.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.json`;
  const toolPath = convertToToolPath(winPath);
  const outputDir = toolPath.substring(0, toolPath.lastIndexOf('/'));

  //build command
  let whatwebCmd = `whatweb -a ${aggression} --log-json="${toolPath}"`;
  if (verbose) whatwebCmd += " -v";
  whatwebCmd += ` "${target}"`;

  const fullCmd = `mkdir -p "${outputDir}" && ${whatwebCmd}`;
  callbacks.onOutput?.(`Executing: ${whatwebCmd}`);

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

//install whatweb via apt
export async function installWhatWeb(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  const escapedPassword = password.replace(/'/g, "'\\''");
  callbacks.onOutput?.("Installing WhatWeb...");
  
  const script = `echo '${escapedPassword}' | sudo -S apt-get update && echo '${escapedPassword}' | sudo -S apt-get install -y whatweb && echo 'WHATWEB_INSTALL_SUCCESS'`;
  
  const result = await runCommand(script, {
    onOutput: (line) => {
      if (!line.includes(password)) callbacks.onOutput?.(line);
    },
  });

  const success = result.output.some((line) => line.includes("WHATWEB_INSTALL_SUCCESS"));

  if (success) {
    callbacks.onOutput?.("\nWhatWeb installed successfully!");
    callbacks.onComplete?.(true, 0);
  } else {
    callbacks.onOutput?.("\nWhatWeb installation failed");
    callbacks.onComplete?.(false, result.code);
  }

  return success;
}

//check if whatweb is installed
export async function checkWhatWebInstalled(): Promise<boolean> {
  const result = await runCommand("which whatweb > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some((line) => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}
