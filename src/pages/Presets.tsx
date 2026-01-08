import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePresetStore } from "@/stores/presetStore";
import { FaLayerGroup, FaPlus, FaTrash, FaEdit, FaPlay } from "react-icons/fa";

export function Presets() {
  const { presets, loadPresets, loadPreset, deletePreset, loading } =
    usePresetStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const handleEdit = (presetId: number) => {
    loadPreset(presetId);
    navigate("/createPreset");
  };

  const handleCreate = () => {
    navigate("/createPreset");
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

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(preset.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                  >
                    <FaEdit className="w-3 h-3" />
                    Edit
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                    <FaPlay className="w-3 h-3" />
                    Run
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
