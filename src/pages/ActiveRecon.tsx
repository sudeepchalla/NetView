import { useState, useRef, useEffect } from "react";
import {
  FaTerminal,
  FaSatelliteDish,
  FaNetworkWired,
  FaServer,
  FaDownload,
  FaStar,
  FaGlobe,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useToolsStore, useProcessStore, useEngagementStore } from "@/stores";
import { runHttpx, installHttpx, type ToolCallbacks } from "@/tools";

interface ToolConfig {
  name: string;
  description: string;
}

export function ActiveRecon() {
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
  } = useToolsStore();
  const { outputs, setOutput, addOutput } = useProcessStore();

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
      name: "Live Host Detection",
      icon: FaGlobe,
      tools: [
        {
          name: "Httpx",
          description: "Fast HTTP toolkit for probing live hosts",
        },
      ],
    },
    {
      name: "Port Scanning",
      icon: FaSatelliteDish,
      tools: [
        {
          name: "Nmap",
          description: "Network exploration and security auditing",
          hasInstall: false,
        },
        {
          name: "Masscan",
          description: "Mass IP port scanner for large-scale network scanning",
          hasInstall: false,
        },
        {
          name: "RustScan",
          description: "Modern fast port scanner that pipes to Nmap",
          hasInstall: false,
        },
      ],
    },
    {
      name: "Service Enumeration",
      icon: FaServer,
      tools: [
        {
          name: "Netcat",
          description: "Network utility for reading/writing across connections",
          hasInstall: false,
        },
        {
          name: "Enum4linux",
          description: "Windows and Samba systems enumeration tool",
          hasInstall: false,
        },
        {
          name: "SMBMap",
          description: "SMB share enumeration and access tool",
          hasInstall: false,
        },
      ],
    },
    {
      name: "Network Mapping",
      icon: FaNetworkWired,
      tools: [
        {
          name: "Traceroute",
          description: "Print the route packets trace to network host",
          hasInstall: false,
        },
        {
          name: "tshark",
          description: "Command-line packet analyzer (Wireshark CLI)",
          hasInstall: false,
        },
      ],
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <div className="py-6 px-6 border-b border-border bg-card">
        <h1 className="text-2xl font-bold tracking-tight">Active Recon</h1>
        <p className="text-muted-foreground mt-1">
          Directly interact with targets to identify open ports and services.
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
                    <DialogContent className="sm:max-w-[500px] [&>[data-slot=dialog-close]]:hidden">
                      {tool.name === "Httpx" ? (
                        <GenericToolConfig
                          tool={tool}
                          onClose={() => setActiveConfigTool(null)}
                          setActiveTerminal={setActiveTerminalTool}
                          setOutputs={setOutput}
                          addOutput={addOutput}
                          onInstallStart={() => setActiveConfigTool(null)}
                          runTool={runHttpx}
                          installTool={installHttpx}
                          optionsFields={["target"]}
                          onToolStart={(name) =>
                            setActiveTools((prev) => ({
                              ...prev,
                              [name]: true,
                            }))
                          }
                          onToolComplete={(name, _success) =>
                            setActiveTools((prev) => ({
                              ...prev,
                              [name]: false,
                            }))
                          }
                        />
                      ) : (
                        <>
                          <DialogHeader>
                            <DialogTitle>{tool.name}</DialogTitle>
                            <DialogDescription>
                              {tool.description}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <p className="text-muted-foreground">
                              Configuration for {tool.name} will be implemented
                              here.
                            </p>
                          </div>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
            <Separator className="my-4" />
          </div>
        ))}
      </div>

      {/* Live Terminal Dialog */}
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

// Generic tool config for tools that just need a target input (same as PassiveRecon)
function GenericToolConfig({
  tool,
  onClose,
  setActiveTerminal,
  setOutputs,
  addOutput,
  onInstallStart,
  runTool,
  installTool,
  optionsFields: _optionsFields,
  onToolStart,
  onToolComplete,
}: {
  tool: ToolConfig;
  onClose: () => void;
  setActiveTerminal: (tool: ToolConfig | null) => void;
  setOutputs: (toolName: string, lines: string[]) => void;
  addOutput: (toolName: string, line: string) => void;
  onInstallStart: () => void;
  runTool: (
    options: { target: string; engagementName?: string },
    callbacks: ToolCallbacks,
  ) => Promise<unknown>;
  installTool: (password: string, callbacks: ToolCallbacks) => Promise<boolean>;
  optionsFields: string[];
  onToolStart?: (toolName: string) => void;
  onToolComplete?: (toolName: string, success: boolean) => void;
}) {
  const [target, setTarget] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [sudoPassword, setSudoPassword] = useState("");
  const [installStatus, setInstallStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const { markInstalled } = useToolsStore();
  const { currentEngagement } = useEngagementStore();

  const handleRun = async () => {
    const toolName = tool.name;
    const engagementName = currentEngagement?.name || "Default";

    onToolStart?.(toolName);
    setOutputs(toolName, [`Starting ${toolName}...`]);
    setActiveTerminal(tool);
    onClose();

    await runTool(
      { target, engagementName },
      {
        onOutput: (line) => addOutput(toolName, line),
        onComplete: async (success) => {
          onToolComplete?.(toolName, success);
          if (success) {
            addOutput(toolName, `\n[${toolName} completed successfully]`);
            addOutput(
              toolName,
              `\n[Info] Results saved for engagement: ${engagementName}`,
            );
          }
        },
        onError: (error) => addOutput(toolName, `\n[Error: ${error}]`),
      },
    );
  };

  const startInstallFlow = () => {
    setShowPasswordDialog(true);
  };

  const handleInstall = async (password: string) => {
    setShowPasswordDialog(false);
    setIsInstalling(true);
    setInstallStatus({ type: null, message: "" });

    const toolName = tool.name;
    setOutputs(toolName, [`Starting ${toolName} installation...`]);
    setActiveTerminal(tool);
    setTimeout(() => onInstallStart(), 100);

    await installTool(password, {
      onOutput: (line) => {
        if (!line.includes(password)) {
          addOutput(toolName, line);
        }
      },
      onComplete: async (success) => {
        setIsInstalling(false);
        setSudoPassword("");
        if (success) {
          setInstallStatus({
            type: "success",
            message: `${toolName} installed successfully!`,
          });
          await markInstalled(toolName);
        } else {
          setInstallStatus({
            type: "error",
            message: "Installation failed. Check terminal output.",
          });
        }
      },
      onError: (error) => addOutput(toolName, `\n[Error: ${error}]`),
    });
  };

  return (
    <div className="space-y-4">
      <DialogHeader className="relative">
        <div className="flex items-start justify-between">
          <div>
            <DialogTitle>{tool.name} Configuration</DialogTitle>
            <DialogDescription>{tool.description}</DialogDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={startInstallFlow}
            disabled={isInstalling}
          >
            <FaDownload className="h-3 w-3" />
            {isInstalling ? "Installing..." : "Install"}
          </Button>
        </div>
      </DialogHeader>

      {/* Password Prompt Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>WSL Authorization Required</DialogTitle>
            <DialogDescription>
              Please enter your WSL sudo password to install {tool.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sudo-pass" className="text-right">
                Password
              </Label>
              <Input
                id="sudo-pass"
                type="password"
                value={sudoPassword}
                onChange={(e) => setSudoPassword(e.target.value)}
                className="col-span-3"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInstall(sudoPassword);
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => handleInstall(sudoPassword)}>
              Confirm Install
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Installation Status */}
      {installStatus.type && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
            installStatus.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          <span>{installStatus.type === "success" ? "✓" : "✕"}</span>
          <span>{installStatus.message}</span>
        </div>
      )}

      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Target</Label>
          <Input
            placeholder="example.com or IP address"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
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
