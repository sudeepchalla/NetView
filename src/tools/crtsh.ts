import {
  mkdir,
  writeTextFile,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import type { ToolCallbacks } from "./types";
import { runCommand } from "./execution";

export interface CrtshOptions {
  target: string;
  includeExpired?: boolean;
  engagementName?: string;
}

//query crt.sh for subdomains via certificate transparency logs
export async function runCrtsh(
  options: CrtshOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string; results: string[] }> {
  const { target, engagementName = "Default" } = options;

  callbacks.onOutput?.(`Querying crt.sh for: ${target}`);

  try {
    const url =
      `https://crt.sh/?q=%25.${encodeURIComponent(target)}&output=json`;

    callbacks.onOutput?.(`Fetching: ${url}`);

    const curlCommand =
      `curl -sL -A "Mozilla/5.0" "${url}"`;

    const result = await runCommand(curlCommand);

    if (result.code !== 0 || !result.output.length) {
      throw new Error("Failed to fetch crt.sh data");
    }

    const rawResponse =
      result.output.join("\n").trim();

    const jsonStart =
      rawResponse.indexOf("[");

    if (jsonStart === -1) {
      callbacks.onOutput?.(
        `RAW RESPONSE:\n${rawResponse.substring(0, 1000)}`
      );

      throw new Error(
        "crt.sh did not return valid JSON"
      );
    }

    const cleanedJson =
      rawResponse.substring(jsonStart);

    const data = JSON.parse(cleanedJson);

    //extract unique domains
    const domains = new Set<string>();

    for (const entry of data) {
      const nameValue = entry.name_value;

      if (nameValue) {
        for (const name of nameValue.split("\n")) {
          const cleanName =
            name.trim().toLowerCase();

          if (
            cleanName &&
            !cleanName.startsWith("*")
          ) {
            domains.add(cleanName);
          }
        }
      }
    }

    const results =
      Array.from(domains).sort();

    callbacks.onOutput?.(
      `\nFound ${results.length} unique subdomains:`
    );

    for (const domain of results) {
      callbacks.onOutput?.(domain);
    }

    const engagement =
      engagementName.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );

    const fileName =
      `crtsh_${target}_${Date.now()}.txt`;

    const outputDir =
      `NetView/results/${engagement}/passive-recon/crtsh`;

    const outputPath =
      `${outputDir}/${fileName}`;

    try {
      // create folder
      await mkdir(outputDir, {
        baseDir: BaseDirectory.Document,
        recursive: true,
      });

      // write file
      await writeTextFile(
        outputPath,
        results.join("\n"),
        {
          baseDir: BaseDirectory.Document,
        }
      );

      callbacks.onOutput?.(
        `\nResults saved to: ${outputPath}`
      );
    } catch (fileError) {
      callbacks.onOutput?.(
        `\n[File Write Error: ${fileError}]`
      );
    }

    callbacks.onOutput?.(
      `\n[Query completed successfully]`
    );

    callbacks.onComplete?.(true, 0);

    return {
      outputPath,
      results,
    };
  } catch (error) {
    callbacks.onOutput?.(
      `\n[Error: ${error}]`
    );

    callbacks.onError?.(String(error));

    callbacks.onComplete?.(false, -1);

    return {
      outputPath: "",
      results: [],
    };
  }
}

//crt.sh is api-based - always available
export async function checkCrtshInstalled(): Promise<boolean> {
  return true;
}
