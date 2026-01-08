import { WorkflowCanvasWrapper } from "@/components/presets/WorkflowCanvas";
import { usePresetStore } from "@/stores/presetStore";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function CreatePreset() {
  const { clearWorkflow, currentPreset } = usePresetStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Start fresh when creating a new preset
    clearWorkflow();
  }, [clearWorkflow]);

  const handleSave = () => {
    // Navigate back to presets list after saving
    navigate("/presets");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="py-6 flex items-center gap-4 px-4 border-b border-border bg-card shrink-0">
        <button
          onClick={() => navigate("/presets")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <FaArrowLeft className="w-3 h-3" />
          Back
        </button>
        <div className="h-6 w-px bg-border" />
        <h1 className="text-base font-semibold">
          {currentPreset ? `Edit: ${currentPreset.name}` : "Create New Preset"}
        </h1>
      </div>

      {/* Workflow Canvas */}
      <div className="flex-1 overflow-hidden bg-background">
        <WorkflowCanvasWrapper onSave={handleSave} />
      </div>
    </div>
  );
}
