import { documentDir } from "@tauri-apps/api/path";
import type { ToolCallbacks } from "./types";

export interface CrtshOptions {
  target: string;
  includeExpired?: boolean;
}

//query crt.sh for subdomains via certificate transparency logs
export async function runCrtsh(
  options: CrtshOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string; results: string[] }> {
  const { target } = options;

  callbacks.onOutput?.(`Querying crt.sh for: ${target}`);

  try {
    const url = `https://crt.sh/?q=%25.${encodeURIComponent(target)}&output=json`;
    callbacks.onOutput?.(`Fetching: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    
    //extract unique domains
    const domains = new Set<string>();
    for (const entry of data) {
      const nameValue = entry.name_value;
      if (nameValue) {
        for (const name of nameValue.split("\n")) {
          const cleanName = name.trim().toLowerCase();
          if (cleanName && !cleanName.startsWith("*")) domains.add(cleanName);
        }
      }
    }

    const results = Array.from(domains).sort();
    
    callbacks.onOutput?.(`\nFound ${results.length} unique subdomains:`);
    for (const domain of results) callbacks.onOutput?.(domain);

    const docDir = await documentDir();
    const winPath = `${docDir}\\NetView\\results\\crtsh_${target}_${Date.now()}.txt`;
    
    callbacks.onOutput?.(`\n[Query completed successfully]`);
    callbacks.onComplete?.(true, 0);

    return { outputPath: winPath, results };
  } catch (error) {
    callbacks.onOutput?.(`\n[Error: ${error}]`);
    callbacks.onError?.(String(error));
    callbacks.onComplete?.(false, -1);
    return { outputPath: "", results: [] };
  }
}

//crt.sh is api-based - always available
export async function checkCrtshInstalled(): Promise<boolean> {
  return true;
}
