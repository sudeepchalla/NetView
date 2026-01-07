import { create } from "zustand";
import { query, execute } from "./db";
import type { Engagement, EngagementFile } from "./types";

interface EngagementState {
  engagements: Engagement[];
  currentEngagement: Engagement | null;
  currentFiles: EngagementFile[];
  loading: boolean;

  loadFromDb: () => Promise<void>;
  createEngagement: (name: string, description?: string) => Promise<Engagement | null>;
  selectEngagement: (id: number | null) => Promise<void>;
  deleteEngagement: (id: number) => Promise<void>;
  addFile: (engagementId: number, fileName: string, filePath: string, toolName: string) => Promise<void>;
  loadFiles: (engagementId: number) => Promise<void>;
}

export const useEngagementStore = create<EngagementState>((set, get) => ({
  engagements: [],
  currentEngagement: null,
  currentFiles: [],
  loading: true,

  loadFromDb: async () => {
    try {
      const rows = await query<{ id: number; name: string; description: string; created_at: string }>(
        "SELECT * FROM engagements ORDER BY created_at DESC"
      );
      const engagements = rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        createdAt: r.created_at,
      }));

      //restore last selected engagement from localStorage
      const lastId = localStorage.getItem("netview-current-engagement");
      let currentEngagement: Engagement | null = null;
      if (lastId) {
        currentEngagement = engagements.find((e) => e.id === parseInt(lastId)) || null;
      }

      set({ engagements, currentEngagement, loading: false });

      if (currentEngagement?.id) {
        get().loadFiles(currentEngagement.id);
      }
    } catch (e) {
      console.error("Failed to load engagements:", e);
      set({ loading: false });
    }
  },

  createEngagement: async (name, description) => {
    try {
      await execute(
        "INSERT INTO engagements (name, description) VALUES (?, ?)",
        [name, description || null]
      );
      const rows = await query<{ id: number; name: string; description: string; created_at: string }>(
        "SELECT * FROM engagements WHERE name = ?",
        [name]
      );
      if (rows.length > 0) {
        const newEngagement: Engagement = {
          id: rows[0].id,
          name: rows[0].name,
          description: rows[0].description,
          createdAt: rows[0].created_at,
        };
        set((state) => ({
          engagements: [newEngagement, ...state.engagements],
          currentEngagement: newEngagement,
        }));
        localStorage.setItem("netview-current-engagement", String(newEngagement.id));
        return newEngagement;
      }
      return null;
    } catch (e) {
      console.error("Failed to create engagement:", e);
      return null;
    }
  },

  selectEngagement: async (id) => {
    if (id === null) {
      set({ currentEngagement: null, currentFiles: [] });
      localStorage.removeItem("netview-current-engagement");
      return;
    }
    const engagement = get().engagements.find((e) => e.id === id) || null;
    set({ currentEngagement: engagement });
    if (engagement?.id) {
      localStorage.setItem("netview-current-engagement", String(engagement.id));
      get().loadFiles(engagement.id);
    }
  },

  deleteEngagement: async (id) => {
    try {
      await execute("DELETE FROM engagements WHERE id = ?", [id]);
      set((state) => ({
        engagements: state.engagements.filter((e) => e.id !== id),
        currentEngagement: state.currentEngagement?.id === id ? null : state.currentEngagement,
        currentFiles: state.currentEngagement?.id === id ? [] : state.currentFiles,
      }));
      if (get().currentEngagement === null) {
        localStorage.removeItem("netview-current-engagement");
      }
    } catch (e) {
      console.error("Failed to delete engagement:", e);
    }
  },

  addFile: async (engagementId, fileName, filePath, toolName) => {
    try {
      await execute(
        "INSERT INTO engagement_files (engagement_id, file_name, file_path, tool_name) VALUES (?, ?, ?, ?)",
        [engagementId, fileName, filePath, toolName]
      );
      if (get().currentEngagement?.id === engagementId) {
        get().loadFiles(engagementId);
      }
    } catch (e) {
      console.error("Failed to add file:", e);
    }
  },

  loadFiles: async (engagementId) => {
    try {
      const rows = await query<{
        id: number;
        engagement_id: number;
        file_name: string;
        file_path: string;
        tool_name: string;
        created_at: string;
      }>("SELECT * FROM engagement_files WHERE engagement_id = ? ORDER BY created_at DESC", [engagementId]);

      const files: EngagementFile[] = rows.map((r) => ({
        id: r.id,
        engagementId: r.engagement_id,
        fileName: r.file_name,
        filePath: r.file_path,
        toolName: r.tool_name,
        createdAt: r.created_at,
      }));
      set({ currentFiles: files });
    } catch (e) {
      console.error("Failed to load files:", e);
    }
  },
}));
