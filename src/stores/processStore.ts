import { create } from "zustand";
import type { ActiveProcess } from "./types";

interface ProcessState {
  processes: Record<number, ActiveProcess>;
  outputs: Record<string, string[]>;

  // Actions
  addProcess: (proc: ActiveProcess) => void;
  removeProcess: (pid: number) => void;
  updateProcess: (pid: number, updates: Partial<ActiveProcess>) => void;
  addOutput: (toolName: string, line: string) => void;
  setOutput: (toolName: string, lines: string[]) => void;
  clearOutput: (toolName: string) => void;
}

export const useProcessStore = create<ProcessState>((set) => ({
  processes: {},
  outputs: {},

  addProcess: (proc) =>
    set((state) => ({
      processes: { ...state.processes, [proc.pid]: proc },
    })),

  removeProcess: (pid) =>
    set((state) => {
      const { [pid]: _, ...rest } = state.processes;
      return { processes: rest };
    }),

  updateProcess: (pid, updates) =>
    set((state) => ({
      processes: {
        ...state.processes,
        [pid]: { ...state.processes[pid], ...updates },
      },
    })),

  addOutput: (toolName, line) =>
    set((state) => ({
      outputs: {
        ...state.outputs,
        [toolName]: [...(state.outputs[toolName] || []), line],
      },
    })),

  setOutput: (toolName, lines) =>
    set((state) => ({
      outputs: { ...state.outputs, [toolName]: lines },
    })),

  clearOutput: (toolName) =>
    set((state) => {
      const { [toolName]: _, ...rest } = state.outputs;
      return { outputs: rest };
    }),
}));
