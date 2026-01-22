import type { WorkflowNode, WorkflowEdge, Preset } from "@/stores/presetStore";
import { runSubfinder, runHttpx } from "@/tools";
import type { ToolCallbacks } from "@/tools";

export interface PresetRunnerCallbacks {
  onStepStart?: (stepIndex: number, toolName: string) => void;
  onStepOutput?: (stepIndex: number, line: string) => void;
  onStepComplete?: (stepIndex: number, success: boolean, outputPath?: string) => void;
  onPresetComplete?: (success: boolean, results: string[]) => void;
  onError?: (error: string) => void;
}

interface ToolRunner {
  run: (options: { target?: string; inputFile?: string; engagementName?: string }, callbacks: ToolCallbacks) => Promise<{ outputPath: string }>;
}

// Map tool names to their runner functions
const TOOL_RUNNERS: Record<string, ToolRunner> = {
  "Subfinder": { run: runSubfinder },
  "Httpx": { run: runHttpx },
  // Add more tools as they are implemented
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

export async function runPreset(
  preset: Preset,
  targetDomain: string,
  engagementName: string,
  callbacks: PresetRunnerCallbacks
): Promise<boolean> {
  const executionOrder = getExecutionOrder(preset.nodes, preset.edges);
  const outputMap = new Map<string, string>(); // nodeId -> outputPath
  const allResults: string[] = [];

  callbacks.onStepOutput?.(0, `Starting preset: ${preset.name}`);
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
    
    let options: { target?: string; inputFile?: string; engagementName: string };
    
    if (previousOutputs.length > 0) {
      // Use output from previous tool as input file
      callbacks.onStepOutput?.(i, `Using input file: ${previousOutputs[0]}`);
      options = { inputFile: previousOutputs[0], engagementName };
    } else {
      // First tool in chain - use target domain
      options = { target: targetDomain, engagementName };
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
  callbacks.onPresetComplete?.(true, allResults);
  return true;
}
