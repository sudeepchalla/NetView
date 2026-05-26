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
import { Checkbox } from "@/components/ui/checkbox";

import { useToolsStore, useProcessStore } from "@/stores";
import { 
  runHttpx, 
  installHttpx, 
  runNmap,
  installNmap,
  runMasscan,
  installMasscan,
  runRustScan,
  installRustScan, 
} from "@/tools";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
                      {renderToolConfig(tool, {
                          onClose: () => setActiveConfigTool(null),
                          setActiveTerminal: setActiveTerminalTool,
                          setOutputs: setOutput,
                          addOutput: addOutput,
                          onInstallStart: () => setActiveConfigTool(null),
                          onToolStart: (name: string) =>
                            setActiveTools((prev) => ({
                              ...prev,
                              [name]: true,
                            })),
                          onToolComplete: (name: string, _success: boolean) =>
                            setActiveTools((prev) => ({
                              ...prev,
                              [name]: false,
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

// Httpx specific configuration component

function renderToolConfig(
  tool: ToolConfig,
  props: {
    onClose: () => void;
    setActiveTerminal: (tool: ToolConfig | null) => void;
    setOutputs: (toolName: string, lines: string[]) => void;
    addOutput: (toolName: string, line: string) => void;
    onInstallStart: () => void;
    onToolStart: (toolName: string) => void;
    onToolComplete: (toolName: string, success: boolean) => void;
  },
) {
  const commonProps = {
    tool,
    onClose: props.onClose,
    setActiveTerminal: props.setActiveTerminal,
    setOutputs: props.setOutputs,
    addOutput: props.addOutput,
    onInstallStart: props.onInstallStart,
    onToolStart: props.onToolStart,
    onToolComplete: props.onToolComplete,
  };

  switch (tool.name) {
    case "Httpx":
      return (
        <HttpxToolConfig
          {...commonProps}
          runTool={runHttpx}
          installTool={installHttpx}
        />
      );
    case "Nmap":
      return <NmapToolConfig {...commonProps} />;
    case "Masscan":
      return <MasscanToolConfig {...commonProps} />;
    case "RustScan":
      return <RustScanToolConfig {...commonProps} />;
    default:
      return (
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>{tool.name}</DialogTitle>
            <DialogDescription>{tool.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Configuration for {tool.name} is not yet implemented.
            </p>
          </div>
        </div>
      );
  }
}

function HttpxToolConfig({
  tool,
  onClose,
  setActiveTerminal,
  setOutputs,
  addOutput,
  onInstallStart,
  runTool,
  installTool,
  onToolStart,
  onToolComplete,
}: any) {
  const [target, setTarget] = useState("");
  const [options, setOptions] = useState({
    statusCode: true,
    title: true,
    tech: true,
    followRedirects: true,
    ip: false,
    cname: false,
    asn: false,
    cdn: false,
    location: false,
  });

  return (
    <GenericConfigTemplate
      tool={tool}
      target={target}
      setTarget={setTarget}
      onClose={onClose}
      onRun={async () => {
        const engagementName = "Default";
        onToolStart?.(tool.name);
        setOutputs(tool.name, [`Starting ${tool.name}...`]);
        setActiveTerminal(tool);
        onClose();

        await runTool(
          { target, engagementName, ...options },
          {
            onOutput: (l: string) => addOutput(tool.name, l),
            onComplete: (s: boolean) => onToolComplete?.(tool.name, s),
            onError: (e: string) => addOutput(tool.name, `Error: ${e}`),
          },
        );
      }}
      installTool={installTool}
      setActiveTerminal={setActiveTerminal}
      setOutputs={setOutputs}
      addOutput={addOutput}
      onInstallStart={onInstallStart}
    >
      <div className="space-y-3 border rounded-md p-3">
        <Label className="text-sm font-medium mb-2 block">
          Detection Options
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <OptionCheckbox
            label="Status Code"
            checked={options.statusCode}
            onChange={() =>
              setOptions((p) => ({ ...p, statusCode: !p.statusCode }))
            }
          />
          <OptionCheckbox
            label="Page Title"
            checked={options.title}
            onChange={() => setOptions((p) => ({ ...p, title: !p.title }))}
          />
          <OptionCheckbox
            label="Tech Detect"
            checked={options.tech}
            onChange={() => setOptions((p) => ({ ...p, tech: !p.tech }))}
          />
          <OptionCheckbox
            label="Follow Redirects"
            checked={options.followRedirects}
            onChange={() =>
              setOptions((p) => ({ ...p, followRedirects: !p.followRedirects }))
            }
          />
          <OptionCheckbox
            label="Resolves IP"
            checked={options.ip}
            onChange={() => setOptions((p) => ({ ...p, ip: !p.ip }))}
          />
          <OptionCheckbox
            label="CNAME"
            checked={options.cname}
            onChange={() => setOptions((p) => ({ ...p, cname: !p.cname }))}
          />
          <OptionCheckbox
            label="ASN Info"
            checked={options.asn}
            onChange={() => setOptions((p) => ({ ...p, asn: !p.asn }))}
          />
          <OptionCheckbox
            label="CDN Info"
            checked={options.cdn}
            onChange={() => setOptions((p) => ({ ...p, cdn: !p.cdn }))}
          />
          <OptionCheckbox
            label="Location"
            checked={options.location}
            onChange={() =>
              setOptions((p) => ({ ...p, location: !p.location }))
            }
          />
        </div>
      </div>
    </GenericConfigTemplate>
  );
}

function NmapToolConfig({
  tool,
  onClose,
  setActiveTerminal,
  setOutputs,
  addOutput,
  onInstallStart,
  onToolStart,
  onToolComplete,
}: any) {
  const [target, setTarget] = useState("");
  const [options, setOptions] = useState({
    serviceVersion: true,
    defaultScripts: true,
    allPorts: false,
    osDetection: false,
    fastMode: false,
    timingTemplate: "4",
  });

  return (
    <GenericConfigTemplate
      tool={tool}
      target={target}
      setTarget={setTarget}
      onClose={onClose}
      onRun={async () => {
        const engagementName = "Default";
        onToolStart(tool.name);
        setOutputs(tool.name, [`Starting ${tool.name}...`]);
        setActiveTerminal(tool);
        onClose();
        await runNmap(
          {
            target,
            engagementName,
            ...options,
            timingTemplate: parseInt(options.timingTemplate),
          },
          {
            onOutput: (l: string) => addOutput(tool.name, l),
            onComplete: (s: boolean) => onToolComplete(tool.name, s),
            onError: (e: string) => addOutput(tool.name, `Error: ${e}`),
          },
        );
      }}
      installTool={installNmap}
      setActiveTerminal={setActiveTerminal}
      setOutputs={setOutputs}
      addOutput={addOutput}
      onInstallStart={onInstallStart}
    >
      <div className="space-y-3 border rounded-md p-3">
        <Label>Scan Options</Label>
        <div className="grid grid-cols-2 gap-3">
          <OptionCheckbox
            label="Service Version (-sV)"
            checked={options.serviceVersion}
            onChange={() =>
              setOptions((p) => ({ ...p, serviceVersion: !p.serviceVersion }))
            }
          />
          <OptionCheckbox
            label="Default Scripts (-sC)"
            checked={options.defaultScripts}
            onChange={() =>
              setOptions((p) => ({ ...p, defaultScripts: !p.defaultScripts }))
            }
          />
          <OptionCheckbox
            label="All Ports (-p-)"
            checked={options.allPorts}
            onChange={() =>
              setOptions((p) => ({ ...p, allPorts: !p.allPorts }))
            }
          />
          <OptionCheckbox
            label="OS Detection (-O)"
            checked={options.osDetection}
            onChange={() =>
              setOptions((p) => ({ ...p, osDetection: !p.osDetection }))
            }
          />
          <OptionCheckbox
            label="Fast Mode (-F)"
            checked={options.fastMode}
            onChange={() =>
              setOptions((p) => ({ ...p, fastMode: !p.fastMode }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Timing Template (-T)</Label>
          <Select
            value={options.timingTemplate}
            onValueChange={(v) =>
              setOptions((p) => ({ ...p, timingTemplate: v }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 - Paranoid</SelectItem>
              <SelectItem value="1">1 - Sneaky</SelectItem>
              <SelectItem value="2">2 - Polite</SelectItem>
              <SelectItem value="3">3 - Normal</SelectItem>
              <SelectItem value="4">4 - Aggressive</SelectItem>
              <SelectItem value="5">5 - Insane</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </GenericConfigTemplate>
  );
}

function MasscanToolConfig({
  tool,
  onClose,
  setActiveTerminal,
  setOutputs,
  addOutput,
  onInstallStart,
  onToolStart,
  onToolComplete,
}: any) {
  const [target, setTarget] = useState("");
  const [ports, setPorts] = useState("80,443,8080");
  const [rate, setRate] = useState("1000");

  return (
    <GenericConfigTemplate
      tool={tool}
      target={target}
      setTarget={setTarget}
      onClose={onClose}
      onRun={async () => {
        const engagementName = "Default";
        onToolStart(tool.name);
        setOutputs(tool.name, [`Starting ${tool.name}...`]);
        setActiveTerminal(tool);
        onClose();
        await runMasscan(
          {
            target,
            engagementName,
            ports,
            rate: parseInt(rate),
          },
          {
            onOutput: (l: string) => addOutput(tool.name, l),
            onComplete: (s: boolean) => onToolComplete(tool.name, s),
            onError: (e: string) => addOutput(tool.name, `Error: ${e}`),
          },
        );
      }}
      installTool={installMasscan}
      setActiveTerminal={setActiveTerminal}
      setOutputs={setOutputs}
      addOutput={addOutput}
      onInstallStart={onInstallStart}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Ports</Label>
          <Input
            value={ports}
            onChange={(e) => setPorts(e.target.value)}
            placeholder="80,443 or 0-65535"
          />
        </div>
        <div className="space-y-1">
          <Label>Rate (packets/sec)</Label>
          <Input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
      </div>
    </GenericConfigTemplate>
  );
}

function RustScanToolConfig({
  tool,
  onClose,
  setActiveTerminal,
  setOutputs,
  addOutput,
  onInstallStart,
  onToolStart,
  onToolComplete,
}: any) {
  const [target, setTarget] = useState("");
  const [ports, setPorts] = useState("");
  const [range, setRange] = useState("");

  return (
    <GenericConfigTemplate
      tool={tool}
      target={target}
      setTarget={setTarget}
      onClose={onClose}
      onRun={async () => {
        const engagementName = "Default";
        onToolStart(tool.name);
        setOutputs(tool.name, [`Starting ${tool.name}...`]);
        setActiveTerminal(tool);
        onClose();
        await runRustScan(
          {
            target, // acts as address
            engagementName,
            ports,
            range,
          },
          {
            onOutput: (l: string) => addOutput(tool.name, l),
            onComplete: (s: boolean) => onToolComplete(tool.name, s),
            onError: (e: string) => addOutput(tool.name, `Error: ${e}`),
          },
        );
      }}
      installTool={installRustScan}
      setActiveTerminal={setActiveTerminal}
      setOutputs={setOutputs}
      addOutput={addOutput}
      onInstallStart={onInstallStart}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Ports (Optional)</Label>
          <Input
            value={ports}
            onChange={(e) => setPorts(e.target.value)}
            placeholder="80,443"
          />
        </div>
        <div className="space-y-1">
          <Label>Range (Optional)</Label>
          <Input
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="1-65535"
          />
        </div>
      </div>
    </GenericConfigTemplate>
  );
}

function GenericConfigTemplate({
  tool,
  target,
  setTarget,
  onRun,
  installTool,
  setActiveTerminal,
  setOutputs,
  addOutput,
  onInstallStart,
  children,
}: any) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [sudoPassword, setSudoPassword] = useState("");
  const { markInstalled } = useToolsStore();
  const [installStatus, setInstallStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const startInstallFlow = () => setShowPasswordDialog(true);

  const handleInstall = async (password: string) => {
    setShowPasswordDialog(false);
    setIsInstalling(true);
    setInstallStatus({ type: null, message: "" });
    setOutputs(tool.name, [`Starting ${tool.name} installation...`]);
    setActiveTerminal(tool);
    setTimeout(() => onInstallStart(), 100);

    await installTool(password, {
      onOutput: (line: string) => {
        if (!line.includes(password)) addOutput(tool.name, line);
      },
      onComplete: async (success: boolean) => {
        setIsInstalling(false);
        setSudoPassword("");
        if (success) {
          setInstallStatus({
            type: "success",
            message: "Installed successfully!",
          });
          await markInstalled(tool.name);
        } else {
          setInstallStatus({ type: "error", message: "Installation failed." });
        }
      },
      onError: (e: string) => addOutput(tool.name, `\n[Error: ${e}]`),
    });
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-start justify-between">
          <div>
            <DialogTitle>{tool.name} Configuration</DialogTitle>
            <DialogDescription>{tool.description}</DialogDescription>
          </div>
          {installTool && (
            <Button
              variant="outline"
              size="sm"
              onClick={startInstallFlow}
              disabled={isInstalling}
            >
              <FaDownload className="mr-2 h-3 w-3" />
              Install
            </Button>
          )}
        </div>
      </DialogHeader>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>WSL Authorization</DialogTitle>
            <DialogDescription>Sudo password required.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              value={sudoPassword}
              onChange={(e) => setSudoPassword(e.target.value)}
              autoFocus
              onKeyDown={(e) =>
                e.key === "Enter" && handleInstall(sudoPassword)
              }
            />
          </div>
          <DialogFooter>
            <Button onClick={() => handleInstall(sudoPassword)}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {installStatus.type && (
        <div
          className={`p-2 rounded text-sm ${installStatus.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {installStatus.message}
        </div>
      )}

      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Target</Label>
          <Input
            placeholder="IP or Host"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        {children}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={onRun} disabled={!target}>
          Run
        </Button>
      </DialogFooter>
    </div>
  );
}

function OptionCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`opt-${label}`}
        checked={checked}
        onCheckedChange={onChange}
      />
      <Label
        htmlFor={`opt-${label}`}
        className="text-sm font-normal cursor-pointer"
      >
        {label}
      </Label>
    </div>
  );
}
