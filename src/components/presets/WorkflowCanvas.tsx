import { useCallback, useState, useEffect } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "reactflow";
import type { Connection, Edge } from "reactflow";
import "reactflow/dist/style.css";
import ToolNode from "./ToolNode";
import { ToolPalette } from "./ToolPalette";
import { usePresetStore } from "@/stores/presetStore";
import type { WorkflowNode, WorkflowEdge } from "@/stores/presetStore";
import { FaSave, FaPlay, FaTrash } from "react-icons/fa";

const nodeTypes = {
  toolNode: ToolNode,
};

interface WorkflowCanvasProps {
  onSave?: () => void;
  onRun?: () => void;
}

export function WorkflowCanvas({ onSave, onRun }: WorkflowCanvasProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");

  const {
    nodes: storeNodes,
    edges: storeEdges,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    addNode,
    removeNode,
    currentPreset,
    createPreset,
    saveCurrentPreset,
    clearWorkflow,
  } = usePresetStore();

  // Convert store nodes/edges to ReactFlow format
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Handle node deletion (both store and local)
  const handleDeleteNode = useCallback(
    (id: string) => {
      removeNode(id);
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    },
    [removeNode, setNodes, setEdges]
  );

  // Hydrate from store on mount
  useEffect(() => {
    setNodes(
      storeNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onDelete: handleDeleteNode,
          onConfigure: (id: string) => console.log("Configure", id),
        },
      }))
    );
    setEdges(storeEdges as Edge[]);
  }, []); // Run once on mount to load initial state

  // Sync changes back to store
  const syncToStore = useCallback(() => {
    setStoreNodes(nodes as WorkflowNode[]);
    setStoreEdges(edges as WorkflowEdge[]);
  }, [nodes, edges, setStoreNodes, setStoreEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Add new tool node
  const handleAddTool = useCallback(
    (toolName: string) => {
      const newNode: WorkflowNode = {
        id: `${toolName}-${Date.now()}`,
        type: "toolNode",
        position: {
          x: Math.random() * 300 + 100,
          y: Math.random() * 200 + 100,
        },
        data: {
          toolName,
          config: {},
        },
      };

      addNode(newNode);
      setNodes((nds) => [
        ...nds,
        {
          ...newNode,
          data: {
            ...newNode.data,
            onDelete: handleDeleteNode,
            onConfigure: (id: string) => console.log("Configure", id),
          },
        },
      ]);
    },
    [addNode, handleDeleteNode, setNodes]
  );

  const handleSave = useCallback(async () => {
    syncToStore();
    if (currentPreset) {
      await saveCurrentPreset();
      onSave?.();
    } else {
      setShowSaveDialog(true);
    }
  }, [currentPreset, saveCurrentPreset, syncToStore, onSave]);

  const handleCreatePreset = useCallback(async () => {
    if (!presetName.trim()) return;
    syncToStore();
    await createPreset(presetName.trim());
    setShowSaveDialog(false);
    setPresetName("");
  }, [presetName, createPreset, syncToStore]);

  const handleClear = useCallback(() => {
    clearWorkflow();
    setNodes([]);
    setEdges([]);
  }, [clearWorkflow, setNodes, setEdges]);

  return (
    <div className="flex h-full">
      {/* Tool Palette */}
      <ToolPalette onAddTool={handleAddTool} />

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium">
              {currentPreset ? currentPreset.name : "New Workflow"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {nodes.length} nodes, {edges.length} connections
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <FaTrash className="w-3 h-3" />
              Clear
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <FaSave className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={onRun}
              disabled={nodes.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPlay className="w-3 h-3" />
              Run
            </button>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            proOptions={{ hideAttribution: true }}
            className="bg-background"
          >
            <Background
              color="var(--muted-foreground)"
              variant={BackgroundVariant.Dots}
              gap={12}
              size={2}
              className="opacity-25"
            />
            <Controls className="!bg-card !border-border !rounded-lg !shadow-lg" />
          </ReactFlow>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Save Preset</h3>
            <input
              type="text"
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-sm hover:bg-muted rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function WorkflowCanvasWrapper(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas {...props} />
    </ReactFlowProvider>
  );
}
