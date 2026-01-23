import { useState, useRef, useEffect } from "react";
import {
  FaTerminal,
  FaBug,
  FaGlobe,
  FaNetworkWired,
  FaDownload,
  FaStar,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { useToolsStore, useProcessStore, useEngagementStore } from "@/stores";
import {
  runNuclei,
  installNuclei,
  type ToolCallbacks,
  type ToolConfig,
} from "@/tools";

export function VulnScanning() {
  const [activeTerminalTool, setActiveTerminalTool] =
    useState<ToolConfig | null>(null);
  const [activeConfigTool, setActiveConfigTool] = useState<string | null>(null);
  const [activeTools, setActiveTools] = useState<Record<string, boolean>>({});
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const {
    installedTools,
    favourites,
    toggleFavourite,
    loadFromDb: loadTools,
    markInstalled,
  } = useToolsStore();
  const { outputs, setOutput, addOutput } = useProcessStore();
  const { currentEngagement } = useEngagementStore();

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  useEffect(() => {
    if (activeTerminalTool && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [outputs, activeTerminalTool]);

  const isFavourite = (toolName: string) => favourites.includes(toolName);

  const toolCategories = [
    {
      name: "Web Scanners",
      icon: FaGlobe,
      tools: [
        {
          name: "Nuclei",
          description: "Fast YAML-based vulnerability scanner",
        },
        {
          name: "Nikto",
          description: "Web server vulnerability scanner",
        },
        {
          name: "Wapiti",
          description: "Black-box web application vulnerability scanner",
        },
      ],
    },
    {
      name: "Network Scanners",
      icon: FaNetworkWired,
      tools: [
        {
          name: "OpenVAS",
          description: "Open-source full-featured vulnerability scanner",
        },
        {
          name: "Nessus",
          description: "Commercial vulnerability assessment platform",
        },
        {
          name: "Nmap NSE",
          description: "Nmap scripting engine for vulnerability detection",
        },
      ],
    },
    {
      name: "CMS Scanners",
      icon: FaBug,
      tools: [
        {
          name: "WPScan",
          description: "WordPress vulnerability scanner",
        },
        {
          name: "JoomScan",
          description: "Joomla vulnerability scanner",
        },
        {
          name: "Droopescan",
          description: "Drupal and Silverstripe CMS scanner",
        },
      ],
    },
    {
      name: "API Scanners",
      icon: FaGlobe,
      tools: [
        {
          name: "Arjun",
          description: "HTTP parameter discovery and analysis",
        },
        {
          name: "Kiterunner",
          description: "API endpoint and content discovery tool",
        },
      ],
    },
  ];

  const renderToolConfig = (tool: ToolConfig) => {
    const commonProps = {
      tool,
      onClose: () => setActiveConfigTool(null),
      setActiveTerminal: setActiveTerminalTool,
      setOutputs: setOutput,
      addOutput: addOutput,
      onInstallStart: () => setActiveConfigTool(null),
      onToolStart: (name: string) =>
        setActiveTools((prev) => ({ ...prev, [name]: true })),
      onToolComplete: (name: string, _success: boolean) =>
        setActiveTools((prev) => ({ ...prev, [name]: false })),
      currentEngagement,
      markInstalled,
    };

    switch (tool.name) {
      case "Nuclei":
        return (
          <NucleiToolConfig
            {...commonProps}
            runTool={runNuclei}
            installTool={installNuclei}
          />
        );
      default:
        return (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>{tool.name}</DialogTitle>
              <DialogDescription>{tool.description}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Configuration for {tool.name} will be implemented soon.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-full bg-background">
      <div className="py-6 px-6 border-b border-border bg-card">
        <h1 className="text-2xl font-bold tracking-tight">
          Vulnerability Scanning
        </h1>
        <p className="text-muted-foreground mt-1">
          Identify weak points and known CVEs in the target infrastructure.
        </p>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {toolCategories.map((category) => (
          <div key={category.name} className="space-y-3">
            <div className="flex items-center gap-2">
              <category.icon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-xl font-semibold">{category.name}</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.tools.map((tool) => {
                const isRunning = activeTools[tool.name] || false;

                return (
                  <Dialog
                    key={tool.name}
                    open={activeConfigTool === tool.name}
                    onOpenChange={(open) =>
                      setActiveConfigTool(open ? tool.name : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Card className="bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors">
                        <CardContent className="space-y-4 pt-6">
                          <div className="min-h-[60px]">
                            <h4 className="font-semibold text-base">
                              {tool.name}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {tool.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div
                              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium w-fit cursor-pointer ${
                                isRunning
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTerminalTool(tool);
                              }}
                            >
                              <FaTerminal className="h-3 w-3" />
                              <span>{isRunning ? "Running" : "Idle"}</span>
                            </div>

                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavourite(tool.name);
                                }}
                              >
                                <FaStar
                                  className={`h-4 w-4 ${
                                    isFavourite(tool.name)
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </Button>
                              <div
                                className={`h-8 w-8 flex items-center justify-center ${
                                  installedTools[tool.name]
                                    ? "text-green-500"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <FaDownload className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      {renderToolConfig(tool)}
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
            <Separator className="my-4" />
          </div>
        ))}
      </div>

      <Dialog
        open={!!activeTerminalTool}
        onOpenChange={(open) => !open && setActiveTerminalTool(null)}
      >
        <DialogContent className="sm:max-w-4xl bg-zinc-950 border-zinc-800 text-zinc-100 font-mono">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-100">
              <FaTerminal className="h-4 w-4" />
              Terminal: {activeTerminalTool?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[400px] w-full bg-zinc-900 rounded-md border border-zinc-800 p-4 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
            {activeTerminalTool && outputs[activeTerminalTool.name] ? (
              outputs[activeTerminalTool.name].map(
                (line: string, i: number) => <div key={i}>{line}</div>,
              )
            ) : (
              <p className="text-zinc-500">No output available.</p>
            )}
            <div ref={terminalEndRef} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Nuclei Configuration Component
function NucleiToolConfig({
  tool,
  onClose,
  setActiveTerminal,
  setOutputs,
  addOutput,
  onInstallStart,
  onToolStart,
  onToolComplete,
  runTool,
  installTool,
  currentEngagement,
  markInstalled,
}: any) {
  const [target, setTarget] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [sudoPassword, setSudoPassword] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Options
  const [noInteractsh, setNoInteractsh] = useState(false);
  // Could add more options like templates selection in future

  const handleRun = async () => {
    const engagementName = currentEngagement?.name || "Default";
    onToolStart?.(tool.name);
    setOutputs(tool.name, [`Starting ${tool.name}...`]);
    setActiveTerminal(tool);
    onClose();

    await runTool(
      {
        target,
        engagementName,
        noInteractsh,
      },
      {
        onOutput: (l: string) => addOutput(tool.name, l),
        onComplete: (s: boolean) => onToolComplete?.(tool.name, s),
        onError: (e: string) => addOutput(tool.name, `Error: ${e}`),
      },
    );
  };

  const handleInstall = async (password: string) => {
    setShowPasswordDialog(false);
    setIsInstalling(true);
    setStatus({ type: null, message: "" });
    setOutputs(tool.name, [`Starting ${tool.name} installation...`]);
    setActiveTerminal(tool);
    setTimeout(() => onInstallStart(), 100);

    await installTool(password, {
      onOutput: (l: string) => {
        if (!l.includes(password)) addOutput(tool.name, l);
      },
      onComplete: async (s: boolean) => {
        setIsInstalling(false);
        setSudoPassword("");
        if (s) {
          setStatus({ type: "success", message: "Installed successfully!" });
          await markInstalled(tool.name);
        } else {
          setStatus({ type: "error", message: "Installation failed." });
        }
      },
      onError: (e: string) => addOutput(tool.name, `Error: ${e}`),
    });
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex justify-between items-start">
          <div>
            <DialogTitle>{tool.name} Config</DialogTitle>
            <DialogDescription>{tool.description}</DialogDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordDialog(true)}
            disabled={isInstalling}
          >
            <FaDownload className="mr-2 h-3 w-3" />
            Install
          </Button>
        </div>
      </DialogHeader>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>WSL Authorization</DialogTitle>
            <DialogDescription>Sudo password required.</DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            value={sudoPassword}
            onChange={(e) => setSudoPassword(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleInstall(sudoPassword)}
          />
          <DialogFooter>
            <Button onClick={() => handleInstall(sudoPassword)}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {status.type && (
        <div
          className={`p-2 rounded text-sm ${status.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {status.message}
        </div>
      )}

      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Target URL</Label>
          <Input
            placeholder="http://example.com"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div className="space-y-3 border rounded p-3">
          <Label>Options</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ni"
              checked={noInteractsh}
              onCheckedChange={(c) => setNoInteractsh(!!c)}
            />
            <Label htmlFor="ni" className="text-sm font-normal">
              No Interactsh (Simpler, privacy safe)
            </Label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={handleRun} disabled={!target}>
          Run
        </Button>
      </DialogFooter>
    </div>
  );
}
