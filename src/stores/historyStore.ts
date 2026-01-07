import { create } from "zustand";
import { query, execute } from "./db";
import type { HistoryEntry } from "./types";

interface HistoryState {
  entries: HistoryEntry[];
  loading: boolean;

  // Actions
  loadFromDb: () => Promise<void>;
  addEntry: (entry: Omit<HistoryEntry, "id" | "startedAt">) => Promise<number>;
  updateEntry: (id: number, updates: Partial<HistoryEntry>) => Promise<void>;
  clearHistory: () => Promise<void>;
  getByCategory: (category: string) => HistoryEntry[];
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  loading: true,

  loadFromDb: async () => {
    try {
      const rows = await query<{
        id: number;
        tool_name: string;
        action: string;
        target: string;
        category: string;
        status: string;
        started_at: string;
        completed_at: string;
      }>("SELECT * FROM history ORDER BY started_at DESC LIMIT 100");

      const entries: HistoryEntry[] = rows.map((r) => ({
        id: r.id,
        toolName: r.tool_name,
        action: r.action,
        target: r.target,
        category: r.category,
        status: r.status as HistoryEntry["status"],
        startedAt: r.started_at,
        completedAt: r.completed_at,
      }));

      set({ entries, loading: false });
    } catch (e) {
      console.error("Failed to load history from DB:", e);
      set({ loading: false });
    }
  },

  addEntry: async (entry) => {
    const now = new Date().toISOString();
    await execute(
      "INSERT INTO history (tool_name, action, target, category, status, started_at) VALUES (?, ?, ?, ?, ?, ?)",
      [entry.toolName, entry.action, entry.target, entry.category || null, entry.status, now]
    );

    // Get the inserted ID
    const result = await query<{ id: number }>("SELECT last_insert_rowid() as id");
    const id = result[0]?.id || 0;

    const newEntry: HistoryEntry = { ...entry, id, startedAt: now };
    set((state) => ({ entries: [newEntry, ...state.entries] }));
    return id;
  },

  updateEntry: async (id, updates) => {
    if (updates.status) {
      const completedAt = updates.status !== "Running" ? new Date().toISOString() : null;
      await execute("UPDATE history SET status = ?, completed_at = ? WHERE id = ?", [
        updates.status,
        completedAt,
        id,
      ]);
    }
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  },

  clearHistory: async () => {
    await execute("DELETE FROM history");
    set({ entries: [] });
  },

  getByCategory: (category) => {
    return get().entries.filter((e) => e.category === category);
  },
}));
