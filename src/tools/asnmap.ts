import { documentDir } from "@tauri-apps/api/path";
import { runWslCommand, spawnWslCommand, convertToWslPath } from "./wsl";
import { checkGoInstalled, installGo } from "./prerequisites";
import type { ToolCallbacks } from "./types";

export interface AsnmapOptions {
  target: string;
  type?: "asn" | "ip" | "domain" | "org";
  engagementName?: string;
}

//run asnmap against target
export async function runAsnmap(
  options: AsnmapOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string }> {
  const { target, type = "domain", engagementName = "Default" } = options;

  //setup output paths
  const docDir = await documentDir();
  const engagement = engagementName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const winPath = `${docDir}\\NetView\\results\\${engagement}_asnmap_${target}_${Date.now()}.txt`;
  const wslPath = convertToWslPath(winPath);
  const outputDir = wslPath.substring(0, wslPath.lastIndexOf('/'));

  //build command based on type
  let typeFlag = "-d";
  switch (type) {
    case "asn": typeFlag = "-a"; break;
    case "ip": typeFlag = "-ip"; break;
    case "org": typeFlag = "-org"; break;
  }
  
  const asnmapCmd = `~/go/bin/asnmap ${typeFlag} ${target} -o "${wslPath}"`;
  const fullCmd = `mkdir -p "${outputDir}" && ${asnmapCmd}`;

  callbacks.onOutput?.(`Executing: ${asnmapCmd}`);

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

//install asnmap (requires go)
export async function installAsnmap(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  //check go first
  callbacks.onOutput?.("Checking for Go installation...");
  const goInstalled = await checkGoInstalled();
  
  if (!goInstalled) {
    callbacks.onOutput?.("Go not found. Installing Go first...");
    const goSuccess = await installGo(password, callbacks);
    if (!goSuccess) {
      callbacks.onComplete?.(false, -1);
      return false;
    }
  } else {
    callbacks.onOutput?.("✓ Go is already installed");
  }

  callbacks.onOutput?.("\nInstalling Asnmap...");
  
  const script = `go install -v github.com/projectdiscovery/asnmap/cmd/asnmap@latest 2>&1 && echo 'ASNMAP_INSTALL_SUCCESS'`;
  const result = await runWslCommand(script, { onOutput: callbacks.onOutput });

  const success = result.output.some((line) => line.includes("ASNMAP_INSTALL_SUCCESS"));

  if (success) {
    callbacks.onOutput?.("\nAsnmap installed successfully!");
    callbacks.onComplete?.(true, 0);
  } else {
    callbacks.onOutput?.("\nAsnmap installation failed");
    callbacks.onComplete?.(false, result.code);
  }

  return success;
}

//check if asnmap is installed
export async function checkAsnmapInstalled(): Promise<boolean> {
  const result = await runWslCommand("~/go/bin/asnmap -h > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some((line) => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}
