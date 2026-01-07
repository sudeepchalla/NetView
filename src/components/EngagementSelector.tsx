import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FaChevronDown,
  FaFile,
  FaPlus,
  FaTrash,
  FaFolderOpen,
} from "react-icons/fa";
import { useEngagementStore } from "@/stores";
import { open } from "@tauri-apps/plugin-shell";

//engagement selector items to be rendered inside the FloatingToolsWidget
export function EngagementSelectorItems() {
  const {
    engagements,
    currentEngagement,
    currentFiles,
    loading,
    loadFromDb,
    createEngagement,
    selectEngagement,
    deleteEngagement,
  } = useEngagementStore();

  const [engagementDialogOpen, setEngagementDialogOpen] = useState(false);
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await createEngagement(newName.trim());
    setNewName("");
    setCreating(false);
  };

  const handleSelect = async (id: number) => {
    await selectEngagement(id);
    setEngagementDialogOpen(false);
  };

  const handleOpenFile = async (filePath: string) => {
    try {
      await open(filePath);
    } catch (e) {
      console.error("Failed to open file:", e);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <>
      {/* Engagement Selector */}
      <Dialog
        open={engagementDialogOpen}
        onOpenChange={setEngagementDialogOpen}
      >
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-full gap-2 px-3"
          >
            <span className="text-sm truncate max-w-[120px]">
              {loading ? "..." : currentEngagement?.name || "No Engagement"}
            </span>
            <FaChevronDown className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Engagement</DialogTitle>
            <DialogDescription>
              Choose an existing engagement or create a new one
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mt-4">
            <Input
              placeholder="New engagement name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
            >
              <FaPlus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </div>

          <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2">
            {engagements.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No engagements yet. Create one above.
              </div>
            ) : (
              engagements.map((eng) => (
                <div
                  key={eng.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentEngagement?.id === eng.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleSelect(eng.id!)}
                >
                  <div>
                    <p className="font-medium">{eng.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(eng.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEngagement(eng.id!);
                    }}
                  >
                    <FaTrash className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-px h-6 bg-border" />

      {/* Files */}
      <Dialog open={filesDialogOpen} onOpenChange={setFilesDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full relative"
            disabled={!currentEngagement}
          >
            <FaFile className="h-4 w-4" />
            {currentFiles.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {currentFiles.length > 99 ? "99+" : currentFiles.length}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaFile className="h-4 w-4" />
              Engagement Files
            </DialogTitle>
            <DialogDescription>
              Files generated in "{currentEngagement?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[400px] overflow-y-auto space-y-2">
            {currentFiles.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No files generated yet. Run a scan to see files here.
              </div>
            ) : (
              currentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {file.filePath}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {file.toolName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(file.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-2"
                    onClick={() => handleOpenFile(file.filePath)}
                  >
                    <FaFolderOpen className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-px h-6 bg-border" />
    </>
  );
}
