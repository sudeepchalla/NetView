import { documentDir } from "@tauri-apps/api/path";
import { writeTextFile, mkdir } from "@tauri-apps/plugin-fs";
import type { ToolCallbacks } from "./types";

export interface ShodanOptions {
  target: string;
  apiKey: string;
  searchType?: "host" | "search" | "domain";
  engagementName?: string;
}

//run shodan api against target
export async function runShodan(
  options: ShodanOptions,
  callbacks: ToolCallbacks
): Promise<{ outputPath: string }> {

  const {
    target,
    apiKey,
    searchType = "host",
    engagementName = "Default"
  } = options;

  //validate api key
  if (!apiKey.trim()) {

    callbacks.onOutput?.(
      "Shodan API key is missing"
    );

    callbacks.onComplete?.(false, -1);

    throw new Error(
      "Shodan API key is required"
    );
  }

  callbacks.onOutput?.(
    "Initializing Shodan..."
  );

  callbacks.onOutput?.(
    "Validating API key..."
  );

  //setup output path
  const docDir = await documentDir();

  const engagement =
    engagementName.replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );

  const winPath = [
  docDir,
  "NetView",
  "results",
  engagement,
  `shodan_${target.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.json`
].join("/");

  //build api url
  let url = "";

  switch (searchType) {

    case "search":

      url =
        `https://api.shodan.io/shodan/host/search?key=${apiKey}&query=${encodeURIComponent(target)}`;

      break;

    case "domain":

      url =
        `https://api.shodan.io/dns/domain/${target}?key=${apiKey}`;

      break;

    default:

      url =
        `https://api.shodan.io/shodan/host/${target}?key=${apiKey}`;
  }

  callbacks.onOutput?.(
    "Connecting to Shodan API..."
  );

  callbacks.onOutput?.(
    `Target: ${target}`
  );

  callbacks.onOutput?.(
    `Search type: ${searchType}`
  );

  callbacks.onOutput?.(
    "Sending request..."
  );

  try {

    //send api request
    const response = await fetch(url);

    //handle api errors
    if (!response.ok) {

      const errorText =
        await response.text();

      callbacks.onOutput?.(
        `Shodan API error: ${response.status}`
      );

      callbacks.onOutput?.(
        errorText
      );
if (
  errorText.includes("Requires membership")
) {

  callbacks.onOutput?.(
    "This Shodan endpoint requires a paid membership."
  );

  callbacks.onOutput?.(
    "Try using domain lookup or upgrade your API plan."
  );
}

      callbacks.onComplete?.(
        false,
        response.status
      );

      throw new Error(
        `Shodan API failed: ${response.status}`
      );
    }

    callbacks.onOutput?.(
      "Receiving response..."
    );

    //parse response
    const data = await response.json();

    callbacks.onOutput?.(
      "Response received successfully"
    );

    callbacks.onOutput?.(
      "Processing intelligence data..."
    );

    callbacks.onOutput?.(
      "Saving results..."
    );

    //create output directory
const winOutputDir =
  [
    docDir,
    "NetView",
    "results",
    engagement
  ].join("/");

    try {
      await mkdir(
        winOutputDir,
        {
          recursive: true,
        }
      );
      callbacks.onOutput?.(
        "Directory created successfully"
      );
    }
    catch (err) {
      console.error("mkdir failed:", err);
      callbacks.onOutput?.(
        `Directory creation failed: ${err}`
      );
    }

    //save json results
    try{
    await writeTextFile(
      winPath,
      JSON.stringify(data, null, 2)
    );
    callbacks.onOutput?.("Results file written succesfully");
  }catch(err){
    console.error(err);
    callbacks.onOutput?.(`Write failed:${err}`);
  }

    callbacks.onOutput?.(
      `Results saved to: ${winPath}`
    );

    callbacks.onOutput?.(
      "Shodan scan completed successfully"
    );

    callbacks.onComplete?.(
      true,
      0
    );

    return {
      outputPath: winPath
    };

  } catch (err) {

    callbacks.onOutput?.(
      `Shodan request failed: ${err}`
    );

    callbacks.onComplete?.(
      false,
      -1
    );

    throw err;
  }
}
export async function installShodan(): Promise<boolean> {
  return true;
}

export async function checkShodanInstalled(): Promise<boolean> {
  return true;
}