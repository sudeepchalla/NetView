import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePresetStore, type Preset } from "@/stores/presetStore";
import { useEngagementStore } from "@/stores/engagementStore";
import { runPreset } from "@/tools";
import {
  FaLayerGroup,
  FaPlus,
  FaTrash,
  FaEdit,
  FaPlay,
  FaTerminal,
  FaStop,
} from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Presets() {
  const { presets, loadPresets, loadPreset, deletePreset, loading } =
    usePresetStore();
  const { currentEngagement } = useEngagementStore();
  const navigate = useNavigate();

  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [targetDomain, setTargetDomain] = useState("");

  // Execution state
  const [executionDialogOpen, setExecutionDialogOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runningPresetId, setRunningPresetId] = useState<number | null>(null);
  const [executionOutput, setExecutionOutput] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  // Auto-scroll terminal output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [executionOutput]);

  const handleEdit = (presetId: number) => {
    loadPreset(presetId);
    navigate("/createPreset");
  };

  const handleCreate = () => {
    navigate("/createPreset");
  };

  const handleRunClick = (preset: Preset) => {
    setSelectedPreset(preset);
    setTargetDomain("");
    setRunDialogOpen(true);
  };

  const handleRunPreset = async () => {
    if (!selectedPreset || !targetDomain.trim()) return;

    // Close run dialog, open execution dialog
    setRunDialogOpen(false);
    setExecutionDialogOpen(true);
    setIsRunning(true);
    setRunningPresetId(selectedPreset.id);
    setExecutionOutput([]);
    setCurrentStep(0);

    const engagementName = currentEngagement?.name || "Default";

    await runPreset(selectedPreset, targetDomain.trim(), engagementName, {
      onStepStart: (stepIndex, toolName) => {
        setCurrentStep(stepIndex);
        setExecutionOutput((prev) => [
          ...prev,
          `\n[Step ${stepIndex + 1}] Starting ${toolName}...`,
        ]);
      },
      onStepOutput: (_stepIndex, line) => {
        setExecutionOutput((prev) => [...prev, line]);
      },
      onStepComplete: (stepIndex, success, outputPath) => {
        if (success && outputPath) {
          setExecutionOutput((prev) => [
            ...prev,
            `[Step ${stepIndex + 1}] Output saved to: ${outputPath}`,
          ]);
        }
      },
      onPresetComplete: (success, _results) => {
        setIsRunning(false);
        setRunningPresetId(null);
        if (success) {
          setExecutionOutput((prev) => [
            ...prev,
            "\n✓ All steps completed successfully!",
          ]);
        } else {
          setExecutionOutput((prev) => [
            ...prev,
            "\n✕ Preset execution failed.",
          ]);
        }
      },
      onError: (error) => {
        setExecutionOutput((prev) => [...prev, `\nError: ${error}`]);
        setIsRunning(false);
      },
    });
  };

  const handleCloseExecution = () => {
    setExecutionDialogOpen(false);
    // Only clear state if not running
    if (!isRunning) {
      setSelectedPreset(null);
      setTargetDomain("");
    }
  };

  const handleReopenExecution = (preset: Preset) => {
    setSelectedPreset(preset);
    setExecutionDialogOpen(true);
  };

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="py-6 flex items-center justify-between px-6 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <FaLayerGroup className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Presets</h1>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            Create Preset
          </button>
        </div>
      </div>

      {/* Presets Grid */}
      <div className="p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            Loading presets...
          </div>
        ) : presets.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <FaLayerGroup className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No presets yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first workflow to chain tools together
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              Create Preset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{preset.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {preset.nodes.length} tools • {preset.edges.length}{" "}
                      connections
                    </p>
                  </div>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/20 rounded transition-all"
                    title="Delete preset"
                  >
                    <FaTrash className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>

                {/* Tool Preview */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {preset.nodes.slice(0, 4).map((node) => (
                    <span
                      key={node.id}
                      className="px-2 py-0.5 text-xs bg-muted rounded-full"
                    >
                      {node.data.toolName}
                    </span>
                  ))}
                  {preset.nodes.length > 4 && (
                    <span className="px-2 py-0.5 text-xs text-muted-foreground">
                      +{preset.nodes.length - 4} more
                    </span>
                  )}
                </div>

                {/* Running Status Badge */}
                {runningPresetId === preset.id && (
                  <button
                    onClick={() => handleReopenExecution(preset)}
                    className="mb-3 flex items-center gap-2 px-3 py-1.5 text-xs bg-green-600 text-white rounded-full animate-pulse cursor-pointer hover:bg-green-700 transition-colors"
                  >
                    <FaTerminal className="w-3 h-3" />
                    Running Step {currentStep + 1} • Click to view
                  </button>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(preset.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                  >
                    <FaEdit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleRunClick(preset)}
                    disabled={runningPresetId === preset.id}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                      runningPresetId === preset.id
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    <FaPlay className="w-3 h-3" />
                    {runningPresetId === preset.id ? "Running..." : "Run"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Run Preset Dialog */}
      <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run {selectedPreset?.name}</DialogTitle>
            <DialogDescription>
              Enter the target domain to start the workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target-domain">Target Domain</Label>
              <Input
                id="target-domain"
                placeholder="example.com"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && targetDomain.trim()) {
                    handleRunPreset();
                  }
                }}
              />
            </div>
            {selectedPreset && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Workflow:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedPreset.nodes.map((node, index) => (
                    <span key={node.id} className="flex items-center gap-1">
                      <span className="px-2 py-0.5 bg-muted rounded text-xs">
                        {node.data.toolName}
                      </span>
                      {index < selectedPreset.nodes.length - 1 && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRunPreset}
              disabled={!targetDomain.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <FaPlay className="w-3 h-3 mr-2" />
              Run Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execution Viewer Dialog */}
      <Dialog open={executionDialogOpen} onOpenChange={handleCloseExecution}>
        <DialogContent className="sm:max-w-4xl bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-100">
              <FaTerminal className="h-4 w-4" />
              Executing: {selectedPreset?.name}
              {isRunning && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-green-600 rounded-full animate-pulse">
                  Running Step {currentStep + 1}
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Target: {targetDomain}
            </DialogDescription>
          </DialogHeader>

          <div
            ref={outputRef}
            className="h-[400px] w-full bg-zinc-900 rounded-md border border-zinc-800 p-4 font-mono text-sm overflow-y-auto"
          >
            {executionOutput.length === 0 ? (
              <p className="text-zinc-500">Initializing...</p>
            ) : (
              executionOutput.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line.includes("✓") ? (
                    <span className="text-green-400">{line}</span>
                  ) : line.includes("✕") || line.includes("Error") ? (
                    <span className="text-red-400">{line}</span>
                  ) : line.includes("Step") && line.includes("Starting") ? (
                    <span className="text-blue-400">{line}</span>
                  ) : line.includes("===") ? (
                    <span className="text-zinc-500">{line}</span>
                  ) : (
                    <span className="text-zinc-300">{line}</span>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            {isRunning ? (
              <Button variant="destructive" disabled>
                <FaStop className="w-3 h-3 mr-2" />
                Running...
              </Button>
            ) : (
              <Button onClick={handleCloseExecution}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
