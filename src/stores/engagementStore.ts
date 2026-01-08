import { create } from "zustand";
import { query, execute } from "./db";
import { join, documentDir } from "@tauri-apps/api/path";
import { readDir } from "@tauri-apps/plugin-fs";
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
  loadFiles: (engagementName: string) => Promise<void>;
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

      // Seed "Default" engagement if empty
      if (engagements.length === 0) {
        try {
          await execute(
            "INSERT INTO engagements (name, description) VALUES (?, ?)",
            ["Default", "Default engagement for general recon"]
          );
          // Reload to get the new ID
          const newRows = await query<{ id: number; name: string; description: string; created_at: string }>(
            "SELECT * FROM engagements ORDER BY created_at DESC"
          );
          const newEngagements = newRows.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            createdAt: r.created_at,
          }));
          
          set({ engagements: newEngagements, currentEngagement: newEngagements[0], loading: false });
          localStorage.setItem("netview-current-engagement", String(newEngagements[0].id));
          return;
        } catch (seedError) {
          console.error("Failed to seed default engagement:", seedError);
        }
      }

      set({ engagements, currentEngagement, loading: false });

      if (currentEngagement?.name) {
        get().loadFiles(currentEngagement.name);
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
    if (engagement?.name) {
      localStorage.setItem("netview-current-engagement", String(engagement.id));
      get().loadFiles(engagement.name);
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

  // Scan filesystem for files belonging to engagement by name prefix in filename
  loadFiles: async (engagementName) => {
    try {
      // Build path using Tauri's path API for proper cross-platform handling
      const docDir = await documentDir();
      const resultsDir = await join(docDir, "NetView", "results");
      
      console.log("[loadFiles] Results directory:", resultsDir);

      // Sanitize engagement name same way as tools do
      const engagementPrefix = engagementName.replace(/[^a-zA-Z0-9_-]/g, "_");
      console.log("[loadFiles] Looking for prefix:", `${engagementPrefix}_`);

      // Read directory entries
      const entries = await readDir(resultsDir);
      console.log("[loadFiles] Directory entries:", entries.map(e => e.name));

      // Filter files that start with engagement prefix
      const matchingFiles = entries.filter((entry) => 
        entry.name?.startsWith(`${engagementPrefix}_`)
      );
      console.log("[loadFiles] Matching files:", matchingFiles.map(e => e.name));

      // Map to EngagementFile format
      const files: EngagementFile[] = matchingFiles.map((entry, index) => {
        // Filename format: {engagement}_{tool}_{target}_{timestamp}.{ext}
        const parts = entry.name?.split("_") || [];
        const toolName = parts[1] || "Unknown";

        return {
          id: index,
          engagementId: 0,
          fileName: entry.name || "",
          filePath: `${resultsDir}\\${entry.name}`,
          toolName: toolName.charAt(0).toUpperCase() + toolName.slice(1),
          createdAt: new Date().toISOString(),
        };
      });

      // Sort by filename descending (newest first since timestamp is in name)
      files.sort((a, b) => b.fileName.localeCompare(a.fileName));

      console.log("[loadFiles] Final file count:", files.length);
      set({ currentFiles: files });
    } catch (e) {
      console.error("[loadFiles] Error:", e);
      set({ currentFiles: [] });
    }
  },
}));
