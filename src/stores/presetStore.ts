import { create } from "zustand";
import { query, execute } from "./db";

// Types for the workflow builder
export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    toolName: string;
    config: Record<string, string | boolean>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Preset {
  id: number;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
}

interface PresetState {
  presets: Preset[];
  currentPreset: Preset | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  loading: boolean;

  // Actions
  loadPresets: () => Promise<void>;
  createPreset: (name: string, description?: string) => Promise<Preset | null>;
  loadPreset: (id: number) => Promise<void>;
  saveCurrentPreset: () => Promise<void>;
  deletePreset: (id: number) => Promise<void>;
  
  // Node/Edge management
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (id: string, data: Partial<WorkflowNode["data"]>) => void;
  removeNode: (id: string) => void;
  clearWorkflow: () => void;
}

// Available tools for the workflow builder
export const AVAILABLE_TOOLS = [
  { name: "Subfinder", category: "Passive Recon", inputType: "domain", outputType: "subdomains" },
  { name: "Amass", category: "Passive Recon", inputType: "domain", outputType: "subdomains" },
  { name: "Asnmap", category: "Passive Recon", inputType: "domain", outputType: "asn" },
  { name: "CRT.sh", category: "Passive Recon", inputType: "domain", outputType: "subdomains" },
  { name: "Whois", category: "Passive Recon", inputType: "domain", outputType: "whois" },
  { name: "WhatWeb", category: "Passive Recon", inputType: "url", outputType: "tech" },
  { name: "DNSDumpster", category: "Passive Recon", inputType: "domain", outputType: "dns" },
  { name: "Shodan", category: "Passive Recon", inputType: "domain", outputType: "ports" },
  { name: "Nmap", category: "Active Recon", inputType: "hosts", outputType: "ports" },
  { name: "Httpx", category: "Active Recon", inputType: "hosts", outputType: "live_hosts" },
  { name: "Nuclei", category: "Vuln Scanning", inputType: "hosts", outputType: "vulns" },
];

// Default presets to seed if database is empty
const DEFAULT_PRESETS = [
  {
    name: "Quick Recon",
    description: "Fast subdomain enumeration followed by live host detection.",
    nodes: [
      {
        id: "subfinder-1",
        type: "toolNode",
        position: { x: 100, y: 100 },
        data: { toolName: "Subfinder", config: {} },
      },
      {
        id: "httpx-1",
        type: "toolNode",
        position: { x: 400, y: 100 },
        data: { toolName: "Httpx", config: {} },
      },
    ],
    edges: [
      { id: "e1", source: "subfinder-1", target: "httpx-1" },
    ],
  },
  {
    name: "Vulnerability Scan",
    description: "Full flow: Subdomains -> Live Hosts -> Vulnerability Scan.",
    nodes: [
      {
        id: "subfinder-2",
        type: "toolNode",
        position: { x: 100, y: 100 },
        data: { toolName: "Subfinder", config: {} },
      },
      {
        id: "httpx-2",
        type: "toolNode",
        position: { x: 400, y: 100 },
        data: { toolName: "Httpx", config: {} },
      },
      {
        id: "nuclei-1",
        type: "toolNode",
        position: { x: 700, y: 100 },
        data: { toolName: "Nuclei", config: {} },
      },
    ],
    edges: [
      { id: "e1", source: "subfinder-2", target: "httpx-2" },
      { id: "e2", source: "httpx-2", target: "nuclei-1" },
    ],
  },
  {
    name: "Infrastructure Scan",
    description: "Discover network infrastructure and services.",
    nodes: [
      {
        id: "subfinder-3",
        type: "toolNode",
        position: { x: 100, y: 200 },
        data: { toolName: "Subfinder", config: {} },
      },
      {
        id: "httpx-3",
        type: "toolNode",
        position: { x: 400, y: 100 },
        data: { toolName: "Httpx", config: {} },
      },
      {
        id: "shodan-1",
        type: "toolNode",
        position: { x: 400, y: 300 },
        data: { toolName: "Shodan", config: {} },
      },
      {
        id: "nmap-1",
        type: "toolNode",
        position: { x: 700, y: 100 },
        data: { toolName: "Nmap", config: {} },
      },
    ],
    edges: [
      { id: "e1", source: "subfinder-3", target: "httpx-3" },
      { id: "e2", source: "httpx-3", target: "nmap-1" },
      { id: "e3", source: "subfinder-3", target: "shodan-1" },
    ],
  },
];

export const usePresetStore = create<PresetState>((set, get) => ({
  presets: [],
  currentPreset: null,
  nodes: [],
  edges: [],
  loading: true,

  loadPresets: async () => {
    try {
      let rows = await query<{
        id: number;
        name: string;
        description: string;
        nodes_json: string;
        edges_json: string;
        created_at: string;
      }>("SELECT * FROM presets ORDER BY created_at DESC");

      // Seed default presets if empty
      if (rows.length === 0) {
        for (const preset of DEFAULT_PRESETS) {
          await execute(
            "INSERT INTO presets (name, description, nodes_json, edges_json) VALUES (?, ?, ?, ?)",
            [
              preset.name,
              preset.description,
              JSON.stringify(preset.nodes),
              JSON.stringify(preset.edges),
            ]
          );
        }
        // Reload after seeding
        rows = await query<{
          id: number;
          name: string;
          description: string;
          nodes_json: string;
          edges_json: string;
          created_at: string;
        }>("SELECT * FROM presets ORDER BY created_at DESC");
      }

      const presets: Preset[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        nodes: JSON.parse(r.nodes_json || "[]"),
        edges: JSON.parse(r.edges_json || "[]"),
        createdAt: r.created_at,
      }));

      set({ presets, loading: false });
    } catch (e) {
      console.error("Failed to load presets:", e);
      set({ loading: false });
    }
  },

  createPreset: async (name, description) => {
    try {
      const { nodes, edges } = get();
      await execute(
        "INSERT INTO presets (name, description, nodes_json, edges_json) VALUES (?, ?, ?, ?)",
        [name, description || null, JSON.stringify(nodes), JSON.stringify(edges)]
      );

      const rows = await query<{ id: number; created_at: string }>(
        "SELECT id, created_at FROM presets WHERE name = ?",
        [name]
      );

      if (rows.length > 0) {
        const newPreset: Preset = {
          id: rows[0].id,
          name,
          description,
          nodes,
          edges,
          createdAt: rows[0].created_at,
        };
        set((state) => ({
          presets: [newPreset, ...state.presets],
          currentPreset: newPreset,
        }));
        return newPreset;
      }
      return null;
    } catch (e) {
      console.error("Failed to create preset:", e);
      return null;
    }
  },

  loadPreset: async (id) => {
    const preset = get().presets.find((p) => p.id === id);
    if (preset) {
      set({
        currentPreset: preset,
        nodes: preset.nodes,
        edges: preset.edges,
      });
    }
  },

  saveCurrentPreset: async () => {
    const { currentPreset, nodes, edges } = get();
    if (!currentPreset) return;

    try {
      await execute(
        "UPDATE presets SET nodes_json = ?, edges_json = ? WHERE id = ?",
        [JSON.stringify(nodes), JSON.stringify(edges), currentPreset.id]
      );

      set((state) => ({
        presets: state.presets.map((p) =>
          p.id === currentPreset.id ? { ...p, nodes, edges } : p
        ),
        currentPreset: { ...currentPreset, nodes, edges },
      }));
    } catch (e) {
      console.error("Failed to save preset:", e);
    }
  },

  deletePreset: async (id) => {
    try {
      await execute("DELETE FROM presets WHERE id = ?", [id]);
      set((state) => ({
        presets: state.presets.filter((p) => p.id !== id),
        currentPreset: state.currentPreset?.id === id ? null : state.currentPreset,
      }));
    } catch (e) {
      console.error("Failed to delete preset:", e);
    }
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
    })),

  clearWorkflow: () => set({ nodes: [], edges: [], currentPreset: null }),
}));
