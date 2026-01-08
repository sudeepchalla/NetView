import { documentDir } from "@tauri-apps/api/path";
import { runWslCommand, spawnWslCommand, convertToWslPath } from "./wsl";
import { checkPythonInstalled, installPython } from "./prerequisites";
import type { ToolCallbacks } from "./types";

export interface ShodanOptions {
  target: string;
  apiKey: string;
  searchType?: "host" | "search" | "domain";
  engagementName?: string;
}

//run shodan cli against target
export async function runShodan(
  options: ShodanOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string }> {
  const { target, apiKey, searchType = "host", engagementName = "Default" } = options;

  //setup output paths
  const docDir = await documentDir();
  const engagement = engagementName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const winPath = `${docDir}\\NetView\\results\\${engagement}_shodan_${target.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.json`;
  const wslPath = convertToWslPath(winPath);
  const outputDir = wslPath.substring(0, wslPath.lastIndexOf('/'));

  //build command based on search type
  let shodanCmd: string;
  switch (searchType) {
    case "search":
      shodanCmd = `shodan init ${apiKey} && shodan search --fields ip_str,port,org,hostnames "${target}" > "${wslPath}"`;
      break;
    case "domain":
      shodanCmd = `shodan init ${apiKey} && shodan domain "${target}" > "${wslPath}"`;
      break;
    default:
      shodanCmd = `shodan init ${apiKey} && shodan host "${target}" > "${wslPath}"`;
  }

  const fullCmd = `mkdir -p "${outputDir}" && ${shodanCmd}`;
  callbacks.onOutput?.(`Executing Shodan ${searchType}...`);

  await spawnWslCommand(["bash", "-c", fullCmd], {
    onOutput: (line) => {
      if (!line.includes(apiKey)) callbacks.onOutput?.(line);
    },
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

//install shodan cli
export async function installShodan(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  //check python first
  callbacks.onOutput?.("Checking for Python installation...");
  const pythonInstalled = await checkPythonInstalled();
  
  if (!pythonInstalled) {
    callbacks.onOutput?.("Python not found. Installing Python first...");
    const pySuccess = await installPython(password, callbacks);
    if (!pySuccess) {
      callbacks.onComplete?.(false, -1);
      return false;
    }
  } else {
    callbacks.onOutput?.("Python is already installed");
  }

  callbacks.onOutput?.("\nInstalling Shodan CLI...");
  
  const script = `pip3 install shodan 2>&1 && echo 'SHODAN_INSTALL_SUCCESS'`;
  const result = await runWslCommand(script, { onOutput: callbacks.onOutput });

  const success = result.output.some((line) => line.includes("SHODAN_INSTALL_SUCCESS"));

  if (success) {
    callbacks.onOutput?.("\nShodan CLI installed successfully!");
    callbacks.onComplete?.(true, 0);
  } else {
    callbacks.onOutput?.("\nShodan installation failed");
    callbacks.onComplete?.(false, result.code);
  }

  return success;
}

//check if shodan cli is installed
export async function checkShodanInstalled(): Promise<boolean> {
  const result = await runWslCommand("shodan --help > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some((line) => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}
