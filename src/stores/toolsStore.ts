import { create } from "zustand";
import { query, execute } from "./db";
import type { InstalledTool } from "./types";
import {
  checkSubfinderInstalled,
  checkAmassInstalled,
  checkAsnmapInstalled,
  checkShodanInstalled,
  checkWhoisInstalled,
  checkWhatWebInstalled,
  checkCrtshInstalled,
  checkDnsDumpsterInstalled,
} from "@/tools";

interface ToolsState {
  installedTools: Record<string, InstalledTool>;
  favourites: string[];
  loading: boolean;

  // Actions
  loadFromDb: () => Promise<void>;
  checkToolInstallation: (toolName: string) => Promise<boolean>;
  checkAllTools: () => Promise<void>;
  markInstalled: (toolName: string, info?: Partial<InstalledTool>) => Promise<void>;
  markUninstalled: (toolName: string) => Promise<void>;
  toggleFavourite: (toolName: string) => Promise<void>;
}

// Map tool names to their check functions
const toolCheckFunctions: Record<string, () => Promise<boolean>> = {
  "Subfinder": checkSubfinderInstalled,
  "Amass": checkAmassInstalled,
  "Asnmap": checkAsnmapInstalled,
  "Shodan": checkShodanInstalled,
  "Whois": checkWhoisInstalled,
  "WhatWeb": checkWhatWebInstalled,
  "CRT.sh": checkCrtshInstalled,
  "DNSDumpster": checkDnsDumpsterInstalled,
};

export const useToolsStore = create<ToolsState>((set, get) => ({
  installedTools: {},
  favourites: [],
  loading: true,

  loadFromDb: async () => {
    try {
      // Load installed tools
      const tools = await query<{ name: string; version: string; path: string; installed_at: string }>(
        "SELECT * FROM tools"
      );
      const installedTools: Record<string, InstalledTool> = {};
      for (const t of tools) {
        installedTools[t.name] = {
          name: t.name,
          version: t.version,
          path: t.path,
          installedAt: t.installed_at,
        };
      }

      // Load favourites
      const favs = await query<{ tool_name: string }>("SELECT tool_name FROM favourites");
      const favourites = favs.map((f) => f.tool_name);

      set({ installedTools, favourites, loading: false });

      // After loading from DB, check actual installation status for all tools
      get().checkAllTools();
    } catch (e) {
      console.error("Failed to load tools from DB:", e);
      set({ loading: false });
    }
  },

  checkAllTools: async () => {
    const toolNames = Object.keys(toolCheckFunctions);
    for (const toolName of toolNames) {
      get().checkToolInstallation(toolName);
    }
  },

  checkToolInstallation: async (toolName: string) => {
    try {
      const checkFn = toolCheckFunctions[toolName];
      if (!checkFn) {
        console.warn(`No check function for tool: ${toolName}`);
        return false;
      }
      
      const isInstalled = await checkFn();
      
      if (isInstalled) {
        // If installed but not in our DB, add it
        if (!(toolName in get().installedTools)) {
          await get().markInstalled(toolName);
        }
      } else {
        // If not installed but in our DB, remove it
        if (toolName in get().installedTools) {
          await get().markUninstalled(toolName);
        }
      }
      
      return isInstalled;
    } catch (e) {
      console.error(`Failed to check ${toolName} installation:`, e);
      return false;
    }
  },


  markInstalled: async (toolName, info = {}) => {
    const now = new Date().toISOString();
    await execute(
      "INSERT OR REPLACE INTO tools (name, version, path, installed_at) VALUES (?, ?, ?, ?)",
      [toolName, info.version || null, info.path || null, now]
    );
    set((state) => ({
      installedTools: {
        ...state.installedTools,
        [toolName]: { name: toolName, installedAt: now, ...info },
      },
    }));
  },

  markUninstalled: async (toolName) => {
    await execute("DELETE FROM tools WHERE name = ?", [toolName]);
    set((state) => {
      const { [toolName]: _, ...rest } = state.installedTools;
      return { installedTools: rest };
    });
  },

  toggleFavourite: async (toolName) => {
    try {
      const isFav = get().favourites.includes(toolName);
      if (isFav) {
        await execute("DELETE FROM favourites WHERE tool_name = ?", [toolName]);
        set((state) => ({
          favourites: state.favourites.filter((f) => f !== toolName),
        }));
      } else {
        await execute("INSERT INTO favourites (tool_name) VALUES (?)", [toolName]);
        set((state) => ({
          favourites: [...state.favourites, toolName],
        }));
      }
    } catch (e) {
      console.error("Failed to toggle favourite:", e);
    }
  },
}));
