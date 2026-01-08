import { AVAILABLE_TOOLS } from "@/stores/presetStore";
import { FaPlus, FaSearch } from "react-icons/fa";
import { useState } from "react";

interface ToolPaletteProps {
  onAddTool: (toolName: string) => void;
}

export function ToolPalette({ onAddTool }: ToolPaletteProps) {
  const [search, setSearch] = useState("");

  // Group tools by category
  const groupedTools = AVAILABLE_TOOLS.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_TOOLS>);

  const filteredGroups = Object.entries(groupedTools).reduce(
    (acc, [category, tools]) => {
      const filtered = tools.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      );
      if (filtered.length > 0) acc[category] = filtered;
      return acc;
    },
    {} as Record<string, typeof AVAILABLE_TOOLS>
  );

  return (
    <div className="w-64 h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold mb-2">Tools</h3>
        <div className="relative">
          <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Tool List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {Object.entries(filteredGroups).map(([category, tools]) => (
          <div key={category}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">
              {category}
            </h4>
            <div className="space-y-1">
              {tools.map((tool) => (
                <button
                  key={tool.name}
                  onClick={() => onAddTool(tool.name)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors group"
                >
                  <FaPlus className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span>{tool.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Help Text */}
      <div className="p-3 border-t border-border text-xs text-muted-foreground">
        Click a tool to add it to the canvas. Drag nodes to reposition. Connect
        output → input to chain tools.
      </div>
    </div>
  );
}
