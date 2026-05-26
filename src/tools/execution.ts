import { Command } from "@tauri-apps/plugin-shell";
import type { WslCommandResult, ToolCallbacks } from "./types";
import { isWindows } from "../utils/platform";

// Convert path to tool-compatible path (WSL path for Windows, normal path for Linux)
export function convertToToolPath(sysPath: string): string {
  if (isWindows()) {
    return sysPath
      .replace(/^([a-zA-Z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`)
      .replace(/\\/g, "/");
  }
  return sysPath;
}

// Run a command (WSL on Windows, native on Linux)
export function runCommand(
  script: string,
  callbacks?: ToolCallbacks
): Promise<WslCommandResult> {
  return new Promise((resolve) => {
    const output: string[] = [];
    let command: Command<string>;

    if (isWindows()) {
      command = Command.create("wsl", ["bash", "-c", script]);
    } else {
      // On Linux, we run bash explicitly to handle the script string the same way
      command = Command.create("bash", ["-c", script]);
    }

    command.stdout.on("data", (line: string) => {
      output.push(line);
      callbacks?.onOutput?.(line);
    });

    command.stderr.on("data", (line: string) => {
      output.push(line);
      callbacks?.onOutput?.(line);
    });

    command.on("close", (data: { code: number | null; signal: number | null }) => {
      const exitCode = data.code ?? -1;
      callbacks?.onComplete?.(exitCode === 0, exitCode);
      resolve({ code: exitCode, output });
    });

    command.on("error", (error: unknown) => {
      output.push(`Error: ${error}`);
      callbacks?.onError?.(String(error));
      resolve({ code: -1, output });
    });

    command.spawn().catch((error: unknown) => {
      output.push(`Spawn Error: ${error}`);
      callbacks?.onError?.(String(error));
      resolve({ code: -1, output });
    });
  });
}

// Spawn command with streaming output
export function spawnCommand(
  args: string[],
  callbacks: ToolCallbacks
): Promise<{ success: boolean; code: number }> {
  return new Promise((resolve) => {
    let command: Command<string>;

    if (isWindows()) {
      // args[0] should be the executable, but for WSL we wrap it
      command = Command.create("wsl", args);
    } else {
        const [program, ...cmdArgs] = args;
        command = Command.create(program, cmdArgs);
    }

    command.stdout.on("data", (line: string) => {
      callbacks.onOutput?.(line);
    });

    command.stderr.on("data", (line: string) => {
      callbacks.onOutput?.(line);
    });

    command.on("close", (data: { code: number | null; signal: number | null }) => {
      const exitCode = data.code ?? -1;
      const success = exitCode === 0;
      callbacks.onComplete?.(success, exitCode);
      resolve({ success, code: exitCode });
    });

    command.on("error", (error: unknown) => {
      callbacks.onError?.(String(error));
      resolve({ success: false, code: -1 });
    });
    command.spawn().catch((error: unknown) => {
      callbacks.onError?.(String(error));
      resolve({ success: false, code: -1 });
    });
  });
}
//runSudo command as helper function to execute sudo commands inside WSL for dependency installation
export async function runSudoCommand(
  password: string,
  command: string,
  options?: {
    onOutput?: (line: string) => void;
  }
) {
  const sudoCmd =
    `echo "${password}" | sudo -S bash -c '${command}'`;

  return await runCommand(sudoCmd, {
    onOutput: options?.onOutput,
  });
}
// Re-export specific aliases if needed during transition, or just use the new names
export const runWslCommand = runCommand;
export const spawnWslCommand = spawnCommand;
export const convertToWslPath = convertToToolPath;

