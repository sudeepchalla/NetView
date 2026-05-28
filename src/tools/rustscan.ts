import { documentDir } from "@tauri-apps/api/path";
import { spawnCommand, convertToToolPath, runCommand } from "./execution";
import type { BaseToolOptions, ToolCallbacks } from "./types";

export interface RustScanOptions extends BaseToolOptions {
  addresses?: string; // -a (CIDR or IP)
  ports?: string; // -p
  range?: string; // -r
}

export async function runRustScan(
  options: RustScanOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string }> {
  const { target, engagementName = "Default", addresses, ports, range } = options;

  const targetHost = addresses || target;

  if (!targetHost) {
    throw new Error("Target address is required");
  }

  const docDir = await documentDir();
  const engagement = engagementName.replace(/[^a-zA-Z0-9_-]/g, "_");
  // RustScan isn't JSON native usually, it pipes to Nmap.
  // But we can just capture output.
  const winPath = `${docDir}\\NetView\\results\\${engagement}\\active-recon\\RustScan\\rustscan_${targetHost.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
  const toolPath = convertToToolPath(winPath);
  const outputDir = toolPath.substring(0, toolPath.lastIndexOf('/'));

  // Using Docker alias often, or native binary?
  // Let's assume native install via .deb or cargo.
  // Standard command: rustscan -a <target> -- <nmap flags>
  let cmd = `rustscan -a "${targetHost}"`;

  if (ports) cmd += ` -p "${ports}"`;
  if (range) cmd += ` -r "${range}"`;

  // Pipe output to file
  cmd = `${cmd} | tee "${toolPath}"`;

  const fullCmd = `mkdir -p "${outputDir}" && ${cmd}`;

  callbacks.onOutput?.(`Executing: ${cmd}`);

  await spawnCommand(["bash", "-c", fullCmd], {
    onOutput: callbacks.onOutput,
    onComplete: callbacks.onComplete,
    onError: callbacks.onError,
  });
  callbacks.onOutput?.("\n[+] Scan completed successfully");
  callbacks.onOutput?.(`Results saved to:\n${winPath}`);
  return { outputPath: winPath };
}

export async function installRustScan(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  const escapedPassword = password.replace(/'/g, "'\\''");
  callbacks.onOutput?.("Installing RustScan...");

  // RustScan .deb is best.
  const debUrl = "https://github.com/RustScan/RustScan/releases/download/2.0.1/rustscan_2.0.1_amd64.deb";

  const script = `
    wget ${debUrl} -O /tmp/rustscan.deb && 
    echo '${escapedPassword}' | sudo -S dpkg -i /tmp/rustscan.deb && 
    echo 'INSTALL_SUCCESS'
  `;

  const result = await runCommand(script, {
    onOutput: (line) => {
      if (!line.includes(password)) callbacks.onOutput?.(line);
    }
  });

  if (result.output.some(line => line.includes("INSTALL_SUCCESS"))) {
    callbacks.onOutput?.("\nRustScan installed successfully!");
    callbacks.onComplete?.(true, 0);
    return true;
  } else {
    callbacks.onOutput?.("\nRustScan installation failed.");
    callbacks.onComplete?.(false, result.code);
    return false;
  }
}

export async function checkRustScanInstalled(): Promise<boolean> {
  const result = await runCommand("which rustscan || echo 'NOT_FOUND'");
  return !result.output.some(line => line.includes("NOT_FOUND"));
}
