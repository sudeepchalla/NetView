import { useState, useRef, useEffect } from "react";
import {
  FaSearch,
  FaTerminal,
  FaPlay,
  FaDownload,
  FaKey,
  FaStar,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Stores
import {
  useToolsStore,
  useProcessStore,
  useHistoryStore,
  useEngagementStore,
} from "@/stores";

// Tool functions
import {
  runSubfinder,
  installSubfinder,
  runAmass,
  installAmass,
  runAsnmap,
  installAsnmap,
  runShodan,
  installShodan,
  runWhois,
  installWhois,
  runWhatWeb,
  installWhatWeb,
  runCrtsh,
  runDnsDumpster,
  type ToolConfig,
  type SubfinderOptions,
} from "@/tools";

export function PassiveRecon() {
  const [ipAddress, setIpAddress] = useState("");
  const [url, setUrl] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [activeTerminalTool, setActiveTerminalTool] =
    useState<ToolConfig | null>(null);
  const [activeConfigTool, setActiveConfigTool] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Stores - subscribe to state directly for reactivity
  const {
    installedTools,
    favourites,
    toggleFavourite,
    loadFromDb: loadTools,
  } = useToolsStore();
  const { outputs, setOutput, addOutput } = useProcessStore();
  const { addEntry, updateEntry, loadFromDb: loadHistory } = useHistoryStore();
  const { currentEngagement } = useEngagementStore();

  // Helper function for favourites check
  const isFavourite = (toolName: string) => favourites.includes(toolName);

  // Track running state locally (could also be in processStore)
  const [activeTools, setActiveTools] = useState<Record<string, boolean>>({});

  // Initialize stores on mount
  useEffect(() => {
    loadTools();
    loadHistory();
  }, [loadTools, loadHistory]);

  // Auto-scroll terminal
  useEffect(() => {
    if (activeTerminalTool && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [outputs, activeTerminalTool]);

  const executeTool = async (toolName: string, options: SubfinderOptions) => {
    setActiveTools((prev) => ({ ...prev, [toolName]: true }));
    setOutput(toolName, [`Starting ${toolName}...`]);

    // Add engagement name to options for filename prefix
    const engagementName = currentEngagement?.name || "Default";
    const optionsWithEngagement = { ...options, engagementName };

    // Add to history
    const historyId = await addEntry({
      toolName,
      action: "Subdomain Enumeration",
      target: options.target,
      category: "Passive Recon",
      status: "Running",
    });

    try {
      if (toolName === "Subfinder") {
        await runSubfinder(optionsWithEngagement, {
          onOutput: (line) => addOutput(toolName, line),
          onComplete: async (success, _exitCode) => {
            setActiveTools((prev) => ({ ...prev, [toolName]: false }));
            await updateEntry(historyId, {
              status: success ? "Success" : "Failed",
            });

            if (success) {
              addOutput(
                toolName,
                `\n[Info] Results saved for engagement: ${engagementName}`
              );
            }
          },
          onError: (error) => {
            addOutput(toolName, `\n[Error: ${error}]`);
          },
        });
      }
    } catch (e) {
      console.error("Failed to execute tool:", e);
      setActiveTools((prev) => ({ ...prev, [toolName]: false }));
      addOutput(toolName, `\n[System Error: ${e}]`);
      await updateEntry(historyId, { status: "Failed" });
    }
  };

  const toolCategories = [
    {
      name: "Subdomains",
      tools: [
        {
          name: "Subfinder",
          description: "Fast passive subdomain enumeration tool",
        },
        { name: "CRT.sh", description: "Certificate Transparency logs search" },
        {
          name: "Amass",
          description: "In-depth attack surface mapping and asset discovery",
        },
      ],
    },
    {
      name: "IP Blocks & Cloud",
      tools: [
        {
          name: "Asnmap",
          description: "Map ASN to IP ranges for target organization",
        },
        {
          name: "Shodan",
          description: "Search engine for Internet-connected devices",
        },
      ],
    },
    {
      name: "DNS & Tech",
      tools: [
        {
          name: "DNSDumpster",
          description: "DNS reconnaissance and visualization",
        },
        {
          name: "Whois",
          description: "Domain registration and ownership information",
        },
        {
          name: "WhatWeb",
          description: "Next generation web scanner (tech identification)",
        },
      ],
    },
  ];

  const allTools = toolCategories.flatMap((c) => c.tools);

  const handleToolToggle = (toolName: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolName)
        ? prev.filter((t) => t !== toolName)
        : [...prev, toolName]
    );
  };

  const handleRunSelected = () => {
    console.log("Running selected tools:", selectedTools);
    // Add logic to run selected tools
  };

  const handleRunAll = () => {
    console.log(
      "Running all tools:",
      allTools.map((t) => t.name)
    );
    // Add logic to run all tools
  };

  // Helper to render tool-specific config dialogs
  const renderToolConfig = (
    tool: ToolConfig,
    props: {
      onClose: () => void;
      onRun: (options: SubfinderOptions) => void;
      setActiveTerminal: (tool: ToolConfig | null) => void;
      setOutputs: (toolName: string, lines: string[]) => void;
      addOutput: (toolName: string, line: string) => void;
      onInstallStart: () => void;
      onToolStart: (toolName: string) => void;
      onToolComplete: (toolName: string, success: boolean) => void;
    }
  ) => {
    switch (tool.name) {
      case "Subfinder":
        return (
          <SubfinderConfig
            onClose={props.onClose}
            onRun={props.onRun}
            setActiveTerminal={props.setActiveTerminal}
            setOutputs={props.setOutputs}
            addOutput={props.addOutput}
            onInstallStart={props.onInstallStart}
            tool={tool}
          />
        );
      case "Amass":
        return (
          <GenericToolConfig
            tool={tool}
            onClose={props.onClose}
            setActiveTerminal={props.setActiveTerminal}
            setOutputs={props.setOutputs}
            addOutput={props.addOutput}
            onInstallStart={props.onInstallStart}
            runTool={runAmass}
            installTool={installAmass}
            optionsFields={["target"]}
            onToolStart={props.onToolStart}
            onToolComplete={props.onToolComplete}
          />
        );
      case "Asnmap":
        return (
          <GenericToolConfig
            tool={tool}
            onClose={props.onClose}
            setActiveTerminal={props.setActiveTerminal}
            setOutputs={props.setOutputs}
            addOutput={props.addOutput}
            onInstallStart={props.onInstallStart}
            runTool={runAsnmap}
            installTool={installAsnmap}
            optionsFields={["target"]}
            onToolStart={props.onToolStart}
            onToolComplete={props.onToolComplete}
          />
        );
      case "Shodan":
        return (
          <ShodanConfig
            tool={tool}
            onClose={props.onClose}
            setActiveTerminal={props.setActiveTerminal}
            setOutputs={props.setOutputs}
            addOutput={props.addOutput}
            onInstallStart={props.onInstallStart}
          />
        );
      case "Whois":
        return (
          <GenericToolConfig
            tool={tool}
            onClose={props.onClose}
            setActiveTerminal={props.setActiveTerminal}
            setOutputs={props.setOutputs}
            addOutput={props.addOutput}
            onInstallStart={props.onInstallStart}
            runTool={runWhois}
            installTool={installWhois}
            optionsFields={["target"]}
            onToolStart={props.onToolStart}
            onToolComplete={props.onToolComplete}
          />
        );
      case "WhatWeb":
        return (
          <GenericToolConfig
            tool={tool}
            onClose={props.onClose}
            setActiveTerminal={props.setActiveTerminal}
            setOutputs={props.setOutputs}
            addOutput={props.addOutput}
            onInstallStart={props.onInstallStart}
            runTool={runWhatWeb}
            installTool={installWhatWeb}
            optionsFields={["target"]}
            onToolStart={props.onToolStart}
            onToolComplete={props.onToolComplete}
          />
        );
      case "CRT.sh":
        return (
          <ApiToolConfig
            tool={tool}
            onClose={props.onClose}
            setActiveTerminal={props.setActiveTerminal}
            setOutputs={props.setOutputs}
            addOutput={props.addOutput}
            runTool={runCrtsh}
          />
        );
      case "DNSDumpster":
        return (
          <ApiToolConfig
            tool={tool}
            onClose={props.onClose}
            setActiveTerminal={props.setActiveTerminal}
            setOutputs={props.setOutputs}
            addOutput={props.addOutput}
            runTool={runDnsDumpster}
          />
        );
      default:
        return (
          <DialogHeader>
            <DialogTitle>{tool.name}</DialogTitle>
            <DialogDescription>{tool.description}</DialogDescription>
          </DialogHeader>
        );
    }
  };

  return (
    <div className="min-h-full bg-background">
      <div className="py-6 px-6 border-b border-border bg-card">
        <h1 className="text-2xl font-bold tracking-tight">Passive Recon</h1>
        <p className="text-muted-foreground mt-1">
          Gather information about targets without directly interacting with
          them.
        </p>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Section 1: Target Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaSearch className="h-5 w-5" />
              Target Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Search by IP Address
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. 192.168.1.1"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Search by URL</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-start">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <FaPlay /> Perform Automated Scan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl max-h-[86vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Automated Recon Scan</DialogTitle>
                    <DialogDescription>
                      Select the tools you want to run against the target.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {toolCategories.map((category) => (
                      <div key={category.name} className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                          {category.name}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {category.tools.map((tool) => (
                            <div
                              key={tool.name}
                              className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handleToolToggle(tool.name)}
                            >
                              <Checkbox
                                id={`tool-${tool.name}`}
                                checked={selectedTools.includes(tool.name)}
                                className="pointer-events-none"
                              />
                              <div className="space-y-1 leading-none">
                                <Label
                                  htmlFor={`tool-${tool.name}`}
                                  className="font-medium cursor-pointer pointer-events-none"
                                >
                                  {tool.name}
                                </Label>
                                <Label className="text-sm text-muted-foreground cursor-pointer pointer-events-none">
                                  {tool.description}
                                </Label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button onClick={handleRunSelected}>Run Selected</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button onClick={handleRunAll} variant="secondary">
                        Run All
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Tool Management */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FaTerminal className="h-5 w-5" />
            <h2 className="text-2xl font-bold tracking-tight">
              Available Tools
            </h2>
          </div>

          {toolCategories.map((category) => (
            <div key={category.name} className="space-y-3">
              <h3 className="text-xl font-semibold">{category.name}</h3>
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
                          <CardContent className="space-y-4 pt-2">
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
                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium w-fit transition-all cursor-pointer ${
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
                      {/* Tool Configuration Dialog */}
                      <DialogContent className="sm:max-w-[500px] [&>[data-slot=dialog-close]]:hidden">
                        {renderToolConfig(tool, {
                          onClose: () => setActiveConfigTool(null),
                          onRun: (options: SubfinderOptions) =>
                            executeTool(tool.name, options),
                          setActiveTerminal: setActiveTerminalTool,
                          setOutputs: setOutput,
                          addOutput: addOutput,
                          onInstallStart: () => setActiveConfigTool(null),
                          onToolStart: (toolName: string) =>
                            setActiveTools((prev) => ({
                              ...prev,
                              [toolName]: true,
                            })),
                          onToolComplete: (
                            toolName: string,
                            _success: boolean
                          ) =>
                            setActiveTools((prev) => ({
                              ...prev,
                              [toolName]: false,
                            })),
                        })}
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
              <Separator className="my-4" />
            </div>
          ))}
        </div>
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
              Terminal: {activeTerminalTool?.name || "Unknown Tool"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Live output stream
            </DialogDescription>
          </DialogHeader>
          <div className="h-[400px] w-full bg-zinc-900 rounded-md border border-zinc-800 p-4 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
            {activeTerminalTool && outputs[activeTerminalTool.name] ? (
              outputs[activeTerminalTool.name].map(
                (line: string, i: number) => <div key={i}>{line}</div>
              )
            ) : (
              <div className="text-zinc-500 italic">
                No output available for{" "}
                {activeTerminalTool?.name || "Unknown Tool"}.
                <br />
                Debug: Keys available: {Object.keys(outputs).join(", ")}
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SubfinderLocalOptions {
  target: string;
  source: string;
  apiKey: string;
  all: boolean;
  recursive: boolean;
  silent: boolean;
}

function SubfinderConfig({
  onClose,
  onRun,
  setActiveTerminal,
  setOutputs,
  addOutput,
  onInstallStart,
  tool,
}: {
  onClose: () => void;
  onRun: (opts: SubfinderLocalOptions) => void;
  setActiveTerminal: (tool: ToolConfig | null) => void;
  setOutputs: (toolName: string, lines: string[]) => void;
  addOutput: (toolName: string, line: string) => void;
  onInstallStart: () => void;
  tool: ToolConfig;
}) {
  const [target, setTarget] = useState("");
  const [source, setSource] = useState("all");
  const [apiKey, setApiKey] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [sudoPassword, setSudoPassword] = useState("");
  const [installStatus, setInstallStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Access tools store to mark installed
  const { markInstalled } = useToolsStore();

  const handleRun = () => {
    onRun({
      target,
      source,
      apiKey,
      all: false,
      recursive: false,
      silent: false,
    });
  };

  const startInstallFlow = () => {
    setShowPasswordDialog(true);
  };

  const handleInstall = async (password: string) => {
    setShowPasswordDialog(false);
    setIsInstalling(true);
    setInstallStatus({ type: null, message: "" });

    const toolName = tool.name || "Subfinder";

    // Set up terminal with initial output
    setOutputs(toolName, [
      "Starting installation process...",
      "Step 1: Installing Go and dependencies (requires sudo)...",
    ]);

    // Open terminal dialog
    setActiveTerminal(tool);

    // Close config dialog after a short delay to ensure terminal opens
    setTimeout(() => onInstallStart(), 100);

    // Use imported installSubfinder function
    await installSubfinder(password, {
      onOutput: (line) => {
        // Filter password from output
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
            message: "Subfinder installed successfully!",
          });
          // Mark as installed in store
          await markInstalled(toolName);
        } else {
          setInstallStatus({
            type: "error",
            message: "Installation failed. Check terminal output.",
          });
        }
      },
      onError: (error) => {
        addOutput(toolName, `\n[Error: ${error}]`);
      },
    });
  };

  return (
    <div className="space-y-4">
      <DialogHeader className="relative">
        <div className="flex items-start justify-between">
          <div>
            <DialogTitle>Subfinder Configuration</DialogTitle>
            <DialogDescription>
              Fast passive subdomain enumeration tool.
            </DialogDescription>
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
              Please enter your WSL sudo password to install Go and Subfinder.
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

      {/* Installation Status Notification */}
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
          <Label>Target Domain</Label>
          <Input
            placeholder="example.com"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sources</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue placeholder="Select sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="recursive">Recursive Only</SelectItem>
                <SelectItem value="fast">Fast Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FaKey className="h-4 w-4 text-muted-foreground" />
              API Key (Optional)
            </Label>
            <Input
              type="password"
              placeholder="Enter API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button onClick={handleRun} disabled={!target}>
            Run Scan
          </Button>
        </DialogClose>
      </DialogFooter>
    </div>
  );
}

// Generic tool config for tools that just need a target input
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
    callbacks: ToolCallbacks
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
    onClose(); // Close config dialog so terminal is visible

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
              `\n[Info] Results saved for engagement: ${engagementName}`
            );
          }
        },
        onError: (error) => addOutput(toolName, `\n[Error: ${error}]`),
      }
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

// Shodan config with API key field
function ShodanConfig({
  tool,
  onClose: _onClose,
  setActiveTerminal,
  setOutputs,
  addOutput,
  onInstallStart,
}: {
  tool: ToolConfig;
  onClose: () => void;
  setActiveTerminal: (tool: ToolConfig | null) => void;
  setOutputs: (toolName: string, lines: string[]) => void;
  addOutput: (toolName: string, line: string) => void;
  onInstallStart: () => void;
}) {
  const [target, setTarget] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [searchType, setSearchType] = useState<"host" | "search" | "domain">(
    "host"
  );
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [sudoPassword, setSudoPassword] = useState("");
  const [installStatus, setInstallStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const { markInstalled } = useToolsStore();

  const handleRun = async () => {
    const toolName = tool.name;
    setOutputs(toolName, [`Starting ${toolName}...`]);
    setActiveTerminal(tool);
    // Don't call onClose() - let terminal open first

    await runShodan(
      { target, apiKey, searchType },
      {
        onOutput: (line) => addOutput(toolName, line),
        onComplete: (success) => {
          if (success) {
            addOutput(toolName, `\n[${toolName} completed successfully]`);
          }
        },
        onError: (error) => addOutput(toolName, `\n[Error: ${error}]`),
      }
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

    await installShodan(password, {
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
            placeholder="IP address, hostname, or search query"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Search Type</Label>
            <Select
              value={searchType}
              onValueChange={(v) => setSearchType(v as typeof searchType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="host">Host Lookup</SelectItem>
                <SelectItem value="search">Search Query</SelectItem>
                <SelectItem value="domain">Domain Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FaKey className="h-4 w-4 text-muted-foreground" />
              API Key (Required)
            </Label>
            <Input
              type="password"
              placeholder="Your Shodan API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={handleRun} disabled={!target || !apiKey}>
          Run
        </Button>
      </DialogFooter>
    </div>
  );
}

// API-based tool config (no installation needed)
function ApiToolConfig({
  tool,
  onClose: _onClose,
  setActiveTerminal,
  setOutputs,
  addOutput,
  runTool,
}: {
  tool: ToolConfig;
  onClose: () => void;
  setActiveTerminal: (tool: ToolConfig | null) => void;
  setOutputs: (toolName: string, lines: string[]) => void;
  addOutput: (toolName: string, line: string) => void;
  runTool: (
    options: { target: string },
    callbacks: ToolCallbacks
  ) => Promise<unknown>;
}) {
  const [target, setTarget] = useState("");

  const handleRun = async () => {
    const toolName = tool.name;
    setOutputs(toolName, [`Starting ${toolName}...`]);
    setActiveTerminal(tool);
    // Don't call onClose() - let terminal open first

    await runTool(
      { target },
      {
        onOutput: (line) => addOutput(toolName, line),
        onComplete: (success) => {
          if (success) {
            addOutput(toolName, `\n[${toolName} completed successfully]`);
          }
        },
        onError: (error) => addOutput(toolName, `\n[Error: ${error}]`),
      }
    );
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{tool.name}</DialogTitle>
        <DialogDescription>
          {tool.description}
          <span className="block mt-2 text-xs text-green-600 dark:text-green-400">
            ✓ No installation required - uses web API
          </span>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Target Domain</Label>
          <Input
            placeholder="example.com"
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

// Type for tool callbacks
interface ToolCallbacks {
  onOutput?: (line: string) => void;
  onComplete?: (success: boolean, code?: number) => void;
  onError?: (error: string) => void;
}
