import { documentDir } from "@tauri-apps/api/path";
import { runWslCommand, spawnWslCommand, convertToWslPath } from "./wsl";
import type { ToolCallbacks } from "./types";

export interface AmassOptions {
  target: string;
  passive?: boolean;
  apiKey?: string;
}

//run amass enumeration against target
export async function runAmass(
  options: AmassOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string }> {
  const { target, passive = true } = options;

  //setup output paths
  const docDir = await documentDir();
  const winPath = `${docDir}\\NetView\\results\\amass_${target}_${Date.now()}.json`;
  const wslPath = convertToWslPath(winPath);
  const outputDir = wslPath.substring(0, wslPath.lastIndexOf('/'));

  const amassCmd = `/snap/bin/amass enum ${passive ? '-passive' : ''} -d ${target} -json "${wslPath}"`;
  const fullCmd = `mkdir -p "${outputDir}" && ${amassCmd}`;

  callbacks.onOutput?.(`Executing: ${amassCmd}`);

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

//install amass via snap
export async function installAmass(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  const escapedPassword = password.replace(/'/g, "'\\''");
  callbacks.onOutput?.("Installing Amass via snap...");
  
  const script = `echo '${escapedPassword}' | sudo -S snap install amass && echo 'AMASS_INSTALL_SUCCESS'`;
  
  const result = await runWslCommand(script, {
    onOutput: (line) => {
      if (!line.includes(password)) callbacks.onOutput?.(line);
    },
  });

  const success = result.output.some((line) => line.includes("AMASS_INSTALL_SUCCESS"));

  if (success) {
    callbacks.onOutput?.("\nAmass installed successfully!");
    callbacks.onComplete?.(true, 0);
  } else {
    callbacks.onOutput?.("\nAmass installation failed");
    callbacks.onComplete?.(false, result.code);
  }

  return success;
}

//check if amass is installed
export async function checkAmassInstalled(): Promise<boolean> {
  const result = await runWslCommand("/snap/bin/amass -h > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some((line) => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}
