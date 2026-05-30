import type { WorkflowNode, WorkflowEdge, Preset } from "@/stores/presetStore";
import { runSubfinder, runHttpx, runCrtsh, runAmass, runWhois, runWhatWeb, runMasscan, runRustScan, runNuclei } from "@/tools";
import type { ToolCallbacks } from "@/tools";
import {
  mkdir,
  BaseDirectory,
  writeTextFile,
  copyFile,
} from "@tauri-apps/plugin-fs";

export interface PresetRunnerCallbacks {
  onStepStart?: (stepIndex: number, toolName: string) => void;
  onStepOutput?: (stepIndex: number, line: string) => void;
  onStepComplete?: (stepIndex: number, success: boolean, outputPath?: string) => void;
  onPresetComplete?: (success: boolean, results: string[]) => void;
  onError?: (error: string) => void;

}

interface ToolRunner {

  run: (
    options: {
      target?: string;
      inputFile?: string;
      engagementName?: string;
      presetName?: string;
      originalTarget?: string;
    },
    callbacks: ToolCallbacks
  ) => Promise<{ outputPath: string }>;
}
// Map tool names to their runner functions
const TOOL_RUNNERS: Record<string, ToolRunner> = {
  // Passive Recon:-Subfinder, CRT.sh, Amass, WhatWeb, Whois
  //Active Reconnaissance:-Httpx,Rustscan,Masscan
  //Vulnerability Scanning:-Nuclei
  Subfinder: {
    run: (options, callbacks) =>
      runSubfinder(options, callbacks),
  },

  Httpx: {
    run: (options, callbacks) =>
      runHttpx(options, callbacks),
  },

  Whois: {
    run: (options, callbacks) => {
      if (!options.target) {
        throw new Error("Whois requires target");
      }

      return runWhois(
        {
          target: options.target,
          engagementName: options.engagementName,
        },
        callbacks
      );
    },
  },

  "CRT.sh": {
    run: (options, callbacks) => {
      if (!options.target) {
        throw new Error("CRT.sh requires target");
      }

      return runCrtsh(
        {
          target: options.target,
          engagementName: options.engagementName,
        },
        callbacks
      );
    },
  },

  Amass: {
    run: (options, callbacks) => {
      if (!options.target) {
        throw new Error("Amass requires target");
      }

      return runAmass(
        {
          target: options.target,
          engagementName: options.engagementName,
        },
        callbacks
      );
    },
  },

  WhatWeb: {
    run: (options, callbacks) => {
      if (!options.target) {
        throw new Error("WhatWeb requires target");
      }

      return runWhatWeb(
        {
          target: options.target,
          engagementName: options.engagementName,
        },
        callbacks
      );
    },
  },
  Masscan: {
    run: (options, callbacks) => {
      if (!options.target) {
        throw new Error("Masscan requires target");
      }

      return runMasscan(
        {
          target: options.target,
          engagementName: options.engagementName,
        },
        callbacks
      );
    },
  },

  RustScan: {
    run: (options, callbacks) => {
      if (!options.target) {
        throw new Error("RustScan requires target");
      }

      return runRustScan(
        {
          target: options.target,
          engagementName: options.engagementName,
        },
        callbacks
      );
    },
  },

  Nuclei: {
    run: (options, callbacks) => {
      if (!options.target) {
        throw new Error("Nuclei requires target");
      }

      return runNuclei(
        {
          target: options.target,
          engagementName: options.engagementName,
        },
        callbacks
      );
    },
  },
};

// Get execution order from nodes and edges (topological sort)
function getExecutionOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize
  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    adjacency.set(n.id, []);
  });

  // Build graph
  edges.forEach(e => {
    adjacency.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  // Find starting nodes (in-degree 0)
  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  const result: WorkflowNode[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const node = nodeMap.get(current);
    if (node) result.push(node);

    adjacency.get(current)?.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    });
  }

  return result;
}

// Get output from previous nodes that connect to this node
function getPreviousOutputs(
  nodeId: string,
  edges: WorkflowEdge[],
  outputMap: Map<string, string>
): string[] {
  return edges
    .filter(e => e.target === nodeId)
    .map(e => outputMap.get(e.source))
    .filter((p): p is string => !!p);
}
async function copyResultToPresetFolder(
  sourcePath: string,
  engagementName: string,
  presetFolder: string,
  presetRunFolder: string
) {
  const fileName =
    sourcePath.split(/[\\/]/).pop();

  if (!fileName) return;

  // Convert Windows absolute path to Document-relative path
  const relativeSource =
    sourcePath.replace(
      /^.*?NetView[\\/]/,
      "NetView/"
    ).replace(/\\/g, "/");

  const destination =
    `NetView/results/${engagementName}/presets/${presetFolder}/${presetRunFolder}/${fileName}`;
  console.log("SOURCE:", relativeSource);
  console.log("DEST:", destination);
  await copyFile(
    relativeSource,
    destination,
    {
      fromPathBaseDir: BaseDirectory.Document,
      toPathBaseDir: BaseDirectory.Document,
    }
  );
}
export async function runPreset(
  preset: Preset,
  targetDomain: string,
  engagementName: string,
  callbacks: PresetRunnerCallbacks
): Promise<boolean> {
  const executionOrder = getExecutionOrder(preset.nodes, preset.edges);
  const outputMap = new Map<string, string>(); // nodeId -> outputPath
  const allResults: string[] = [];
  const safePresetName =
    preset.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const presetFolder =
    safePresetName;
  const presetRunFolder =
    `${targetDomain}_${Date.now()}`
      .replace(/[^a-zA-Z0-9_-]/g, "_");
  callbacks.onStepOutput?.(0, `Starting preset: ${preset.name}`);
  try {
    await mkdir(
      `NetView/results/${engagementName}/presets/${presetFolder}/${presetRunFolder}`,
      {
        baseDir: BaseDirectory.Document,
        recursive: true,
      }
    );
  } catch (error) {
    callbacks.onError?.(
      `Failed to create preset folder: ${error}`
    );
    return false;
  }
  callbacks.onStepOutput?.(
    0,
    `Preset folder created: ${presetRunFolder}`
  );
  callbacks.onStepOutput?.(0, `Target domain: ${targetDomain}`);
  callbacks.onStepOutput?.(0, `Execution order: ${executionOrder.map(n => n.data.toolName).join(" → ")}\n`);

  for (let i = 0; i < executionOrder.length; i++) {
    const node = executionOrder[i];
    const toolName = node.data.toolName;
    const runner = TOOL_RUNNERS[toolName];

    callbacks.onStepStart?.(i, toolName);
    callbacks.onStepOutput?.(i, `\n${"=".repeat(50)}`);
    callbacks.onStepOutput?.(i, `Step ${i + 1}: Running ${toolName}`);
    callbacks.onStepOutput?.(i, `${"=".repeat(50)}\n`);

    if (!runner) {
      callbacks.onStepOutput?.(i, `⚠ Tool "${toolName}" is not yet implemented. Skipping...`);
      callbacks.onStepComplete?.(i, false);
      continue;
    }

    // Determine input: first tool uses domain, subsequent tools use file from previous
    const previousOutputs = getPreviousOutputs(node.id, preset.edges, outputMap);

    let options: {
      target?: string; inputFile?: string; engagementName: string;
      presetName?: string;
      originalTarget?: string;
    };

    if (previousOutputs.length > 0) {
      // Use output from previous tool as input file
      callbacks.onStepOutput?.(i, `Using input file: ${previousOutputs[0]}`);
      options = { inputFile: previousOutputs[0], engagementName, presetName: safePresetName, originalTarget: targetDomain };
    } else {
      // First tool in chain - use target domain
      options = {
        target: targetDomain, engagementName, presetName: safePresetName,
        originalTarget: targetDomain
      };
    }

    try {
      // Run the tool and wait for both the output path AND completion
      let toolSuccess = false;
      let toolOutputPath = "";

      const runPromise = runner.run(options, {
        onOutput: (line) => {
          callbacks.onStepOutput?.(i, line);
        },
        onComplete: (success, _code) => {
          toolSuccess = success;
        },
        onError: (error) => {
          callbacks.onStepOutput?.(i, `Error: ${error}`);
          toolSuccess = false;
        },
      });

      // Wait for the tool to finish and get the output path
      const runResult = await runPromise;
      toolOutputPath = runResult.outputPath;

      outputMap.set(node.id, toolOutputPath);
      allResults.push(toolOutputPath);

      try {
        await copyResultToPresetFolder(
          toolOutputPath,
          engagementName,
          presetFolder,
          presetRunFolder
        );
      } catch (error) {
        callbacks.onStepOutput?.(
          i,
          `Failed to copy result to preset folder: ${error}`
        );
      }
      callbacks.onStepComplete?.(i, toolSuccess, toolOutputPath);

      if (!toolSuccess) {
        callbacks.onStepOutput?.(i, `\n✕ ${toolName} failed. Stopping preset execution.`);
        callbacks.onPresetComplete?.(false, allResults);
        return false;
      }

      callbacks.onStepOutput?.(i, `\n✓ ${toolName} completed. Output: ${toolOutputPath}`);
    } catch (error) {
      callbacks.onError?.(String(error));
      callbacks.onPresetComplete?.(false, allResults);
      return false;
    }
  }

  callbacks.onStepOutput?.(executionOrder.length - 1, `\n${"=".repeat(50)}`);
  callbacks.onStepOutput?.(executionOrder.length - 1, `✓ Preset "${preset.name}" completed successfully!`);
  callbacks.onStepOutput?.(executionOrder.length - 1, `${"=".repeat(50)}`);
  const summaryPath =
    `NetView/results/${engagementName}/presets/${presetFolder}/${presetRunFolder}/summary.json`;
  await writeTextFile(
    summaryPath,
    JSON.stringify(
      {
        preset: preset.name,
        target: targetDomain,
        engagement: engagementName,
        status: "success",
        completedAt: new Date().toISOString(),
        results: allResults,
      },
      null,
      2
    ),
    {
      baseDir: BaseDirectory.Document,
    }
  );
  callbacks.onStepOutput?.(
    executionOrder.length - 1,
    `Summary saved: ${summaryPath}`
  );
  callbacks.onStepOutput?.(
    executionOrder.length - 1,
    `Copies of each tool output have been saved to the preset folder.\n 
    Path: NetView/results/${engagementName}/presets/${presetFolder}/${presetRunFolder}}`
  );
  callbacks.onPresetComplete?.(true, allResults);
  return true;
}
