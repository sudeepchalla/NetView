import { Command } from "@tauri-apps/plugin-shell";
import type { WslCommandResult, ToolCallbacks } from "./types";

//convert windows path to wsl path
export function convertToWslPath(winPath: string): string {
  return winPath
    .replace(/^([a-zA-Z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`)
    .replace(/\\/g, "/");
}

//run a bash script in wsl and return result
export function runWslCommand(
  script: string,
  callbacks?: ToolCallbacks
): Promise<WslCommandResult> {
  return new Promise((resolve) => {
    const output: string[] = [];
    const command = Command.create("wsl", ["bash", "-c", script]);

    command.stdout.on("data", (line) => {
      output.push(line);
      callbacks?.onOutput?.(line);
    });

    command.stderr.on("data", (line) => {
      output.push(line);
      callbacks?.onOutput?.(line);
    });

    command.on("close", (data) => {
      const exitCode = data.code ?? -1;
      callbacks?.onComplete?.(exitCode === 0, exitCode);
      resolve({ code: exitCode, output });
    });

    command.on("error", (error) => {
      output.push(`Error: ${error}`);
      callbacks?.onError?.(String(error));
      resolve({ code: -1, output });
    });

    command.spawn().catch((error) => {
      output.push(`Spawn Error: ${error}`);
      callbacks?.onError?.(String(error));
      resolve({ code: -1, output });
    });
  });
}

//spawn wsl command with streaming output
export function spawnWslCommand(
  args: string[],
  callbacks: ToolCallbacks
): Promise<{ success: boolean; code: number }> {
  return new Promise((resolve) => {
    const command = Command.create("wsl", args);

    command.stdout.on("data", (line) => {
      callbacks.onOutput?.(line);
    });

    command.stderr.on("data", (line) => {
      callbacks.onOutput?.(line);
    });

    command.on("close", (data) => {
      const exitCode = data.code ?? -1;
      const success = exitCode === 0;
      callbacks.onComplete?.(success, exitCode);
      resolve({ success, code: exitCode });
    });

    command.on("error", (error) => {
      callbacks.onError?.(String(error));
      resolve({ success: false, code: -1 });
    });

    command.spawn().catch((error) => {
      callbacks.onError?.(String(error));
      resolve({ success: false, code: -1 });
    });
  });
}
