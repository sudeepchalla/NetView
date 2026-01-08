import { memo } from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import { FaPlay, FaCog, FaTrash } from "react-icons/fa";

interface ToolNodeData {
  toolName: string;
  config: Record<string, string | boolean>;
  onConfigure?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ToolNode = memo(({ id, data, selected }: NodeProps<ToolNodeData>) => {
  const { toolName, config, onConfigure, onDelete } = data;

  return (
    <div
      className={`
        min-w-[180px] bg-card border-2 rounded-lg shadow-lg
        ${selected ? "border-primary" : "border-border"}
        transition-all duration-200
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-t-lg border-b border-border">
        <div className="flex items-center gap-2">
          <FaPlay className="w-3 h-3 text-primary" />
          <span className="font-medium text-sm">{toolName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onConfigure?.(id)}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="Configure"
          >
            <FaCog className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            onClick={() => onDelete?.(id)}
            className="p-1 hover:bg-destructive/20 rounded transition-colors"
            title="Delete"
          >
            <FaTrash className="w-3 h-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>

      {/* Config Preview */}
      <div className="px-3 py-2 text-xs text-muted-foreground">
        {Object.keys(config).length > 0 ? (
          <ul className="space-y-0.5">
            {Object.entries(config)
              .slice(0, 3)
              .map(([key, value]) => (
                <li key={key} className="truncate">
                  <span className="text-primary/70">{key}:</span>{" "}
                  {String(value)}
                </li>
              ))}
            {Object.keys(config).length > 3 && (
              <li className="text-muted-foreground/50">
                +{Object.keys(config).length - 3} more...
              </li>
            )}
          </ul>
        ) : (
          <span className="italic">No configuration</span>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </div>
  );
});

ToolNode.displayName = "ToolNode";

export default ToolNode;
