import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FaTerminal, FaBell, FaHistory, FaStar, FaTrash } from "react-icons/fa";
import {
  useToolsStore,
  useProcessStore,
  useHistoryStore,
  useNotificationStore,
} from "@/stores";
import { EngagementSelectorItems } from "./EngagementSelector";

// Tool definitions for display (used to get descriptions for favourites)
const TOOL_DEFINITIONS: Record<
  string,
  { category: string; description: string }
> = {
  Subfinder: {
    category: "Passive Recon",
    description: "Fast passive subdomain enumeration tool",
  },
  "CRT.sh": {
    category: "Passive Recon",
    description: "Certificate Transparency logs search",
  },
  Amass: {
    category: "Passive Recon",
    description: "In-depth attack surface mapping",
  },
  Nmap: {
    category: "Network Scanning",
    description: "Network exploration tool and security scanner",
  },
  "Burp Suite": {
    category: "Web Security",
    description: "Web application security testing",
  },
  Metasploit: {
    category: "Exploitation",
    description: "Penetration testing framework",
  },
  Wireshark: {
    category: "Forensics",
    description: "Network protocol analyzer",
  },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function FloatingToolsWidget() {
  const { processes } = useProcessStore();
  const { entries: historyEntries, loadFromDb: loadHistory } =
    useHistoryStore();
  const { favourites, loadFromDb: loadTools } = useToolsStore();
  const { notifications, removeNotification, clearAll } =
    useNotificationStore();

  // Load data on mount
  useEffect(() => {
    loadTools();
    loadHistory();
  }, [loadTools, loadHistory]);

  // Convert processes object to array
  const activeProcesses = Object.values(processes);

  // Group history by category
  const historyByCategory = historyEntries.reduce((acc, entry) => {
    const category = entry.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(entry);
    return acc;
  }, {} as Record<string, typeof historyEntries>);

  // Get favourite tools with their details
  const favouriteTools = favourites.map((name) => ({
    name,
    ...(TOOL_DEFINITIONS[name] || {
      category: "Unknown",
      description: "No description available",
    }),
  }));

  return (
    <div className="fixed top-12 right-6 z-40 bg-card border shadow-lg rounded-full px-2 py-1 flex items-center gap-1">
      {/* Engagement Selector Items */}
      <EngagementSelectorItems />

      {/* Active Processes */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full relative"
          >
            <FaTerminal className="h-4 w-4" />
            {activeProcesses.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {activeProcesses.length}
              </span>
            )}
            <span className="sr-only">Active Processes</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl bg-black text-green-400 border-green-800 font-mono">
          <DialogHeader>
            <DialogTitle className="text-green-500 flex items-center gap-2">
              <FaTerminal className="h-4 w-4" />
              Active Processes
            </DialogTitle>
            <DialogDescription className="text-green-700">
              Monitoring active security tools and system tasks
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 border border-green-900 rounded-md bg-black/50">
            {activeProcesses.length === 0 ? (
              <div className="p-8 text-center text-green-700">
                No active processes running
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-green-900 bg-green-950/20">
                    <tr>
                      <th className="p-3 font-medium">PID</th>
                      <th className="p-3 font-medium">PROCESS</th>
                      <th className="p-3 font-medium">STATUS</th>
                      <th className="p-3 font-medium">STARTED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProcesses.map((proc) => (
                      <tr
                        key={proc.pid}
                        className="border-b border-green-900/50 hover:bg-green-900/20 transition-colors"
                      >
                        <td className="p-3">{proc.pid}</td>
                        <td className="p-3 font-bold">{proc.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-xs border border-green-600 bg-green-900/40 text-green-400">
                            {proc.status}
                          </span>
                        </td>
                        <td className="p-3">{formatTimeAgo(proc.startTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-px h-6 bg-border" />

      {/* History */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full relative"
          >
            <FaHistory className="h-4 w-4" />
            {historyEntries.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {historyEntries.length > 99 ? "99+" : historyEntries.length}
              </span>
            )}
            <span className="sr-only">History</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaHistory className="h-5 w-5" />
              Global Activity History
            </DialogTitle>
            <DialogDescription>
              Recent actions and scans across all modules
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {Object.keys(historyByCategory).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No history yet. Run a scan to see it here.
              </div>
            ) : (
              Object.entries(historyByCategory).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <div className="h-px bg-border flex-1" />
                    {category}
                    <div className="h-px bg-border flex-1" />
                  </h3>
                  <div className="grid gap-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/40 hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              item.status === "Success"
                                ? "bg-green-500"
                                : item.status === "Failed"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                            }`}
                          />
                          <div>
                            <p className="font-medium text-sm">{item.action}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {item.target}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(item.startedAt)}
                          </div>
                          <div className="text-[10px] uppercase font-bold text-muted-foreground/70">
                            {item.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-px h-6 bg-border" />

      {/* Favourites */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <FaStar className="h-4 w-4 text-yellow-500" />
            <span className="sr-only">Favourites</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaStar className="h-5 w-5 text-yellow-500" />
              Favourite Tools
            </DialogTitle>
            <DialogDescription>
              Quick access to your most used tools
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {favouriteTools.length === 0 ? (
              <div className="col-span-2 text-center text-muted-foreground py-8">
                No favourites yet. Click the star icon on any tool to add it
                here.
              </div>
            ) : (
              favouriteTools.map((tool, idx) => (
                <div
                  key={idx}
                  className="flex flex-col p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{tool.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {tool.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-px h-6 bg-border" />

      {/* Notifications */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full relative"
          >
            <FaBell className="h-4 w-4" />
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FaBell className="h-5 w-5" />
                Notifications
              </span>
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear all
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    notification.read ? "bg-muted/20" : "bg-muted/60"
                  }`}
                >
                  <div
                    className={`w-2 h-2 mt-2 rounded-full ${
                      notification.type === "success"
                        ? "bg-green-500"
                        : notification.type === "error"
                        ? "bg-red-500"
                        : notification.type === "warning"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeNotification(notification.id!)}
                  >
                    <FaTrash className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
