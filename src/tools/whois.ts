import { documentDir } from "@tauri-apps/api/path";
import { runWslCommand, spawnWslCommand, convertToWslPath } from "./wsl";
import type { ToolCallbacks } from "./types";

export interface WhoisOptions {
  target: string;
  engagementName?: string;
}

//run whois lookup against target
export async function runWhois(
  options: WhoisOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string }> {
  const { target, engagementName = "Default" } = options;

  //setup output paths
  const docDir = await documentDir();
  const engagement = engagementName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const winPath = `${docDir}\\NetView\\results\\${engagement}_whois_${target.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.txt`;
  const wslPath = convertToWslPath(winPath);
  const outputDir = wslPath.substring(0, wslPath.lastIndexOf('/'));

  const whoisCmd = `whois "${target}" > "${wslPath}" 2>&1`;
  const fullCmd = `mkdir -p "${outputDir}" && ${whoisCmd}`;

  callbacks.onOutput?.(`Executing: whois ${target}`);

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

//install whois via apt
export async function installWhois(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  const escapedPassword = password.replace(/'/g, "'\\''");
  callbacks.onOutput?.("Installing Whois...");
  
  const script = `echo '${escapedPassword}' | sudo -S apt-get update && echo '${escapedPassword}' | sudo -S apt-get install -y whois && echo 'WHOIS_INSTALL_SUCCESS'`;
  
  const result = await runWslCommand(script, {
    onOutput: (line) => {
      if (!line.includes(password)) callbacks.onOutput?.(line);
    },
  });

  const success = result.output.some((line) => line.includes("WHOIS_INSTALL_SUCCESS"));

  if (success) {
    callbacks.onOutput?.("\nWhois installed successfully!");
    callbacks.onComplete?.(true, 0);
  } else {
    callbacks.onOutput?.("\nWhois installation failed");
    callbacks.onComplete?.(false, result.code);
  }

  return success;
}

//check if whois is installed
export async function checkWhoisInstalled(): Promise<boolean> {
  const result = await runWslCommand("which whois > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some((line) => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}
