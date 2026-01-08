import { useState } from "react";
import {
  FaSearch,
  FaTerminal,
  FaPlay,
  FaMicroscope,
  FaMemory,
  FaFileCode,
  FaDownload,
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

export function ForensicsAnalysis() {
  const [caseName, setCaseName] = useState("");
  const [evidenceFile, setEvidenceFile] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [activeTerminalTool, setActiveTerminalTool] = useState<{
    name: string;
    description: string;
  } | null>(null);

  const toolCategories = [
    {
      name: "Disk Forensics",
      icon: FaMicroscope,
      tools: [
        {
          name: "Autopsy",
          description:
            "Digital forensics platform and graphical interface to Sleuth Kit",
        },
        {
          name: "Binwalk",
          description: "Firmware analysis tool",
        },
      ],
    },
    {
      name: "Memory Forensics",
      icon: FaMemory,
      tools: [
        {
          name: "Volatility",
          description: "Advanced memory forensics framework",
        },
      ],
    },
    {
      name: "Metadata & Analysis",
      icon: FaFileCode,
      tools: [
        {
          name: "ExifTool",
          description: "Read, write and edit meta information",
        },
        {
          name: "Strings",
          description: "Find printable strings in object files",
        },
      ],
    },
  ];

  const handleToolToggle = (toolName: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolName)
        ? prev.filter((t) => t !== toolName)
        : [...prev, toolName]
    );
  };

  const handleRunSelected = () => {
    console.log("Running selected tools:", selectedTools);
  };

  const handleRunAll = () => {
    console.log("Running all tools");
  };

  return (
    <div className="min-h-full bg-background">
      <div className="py-6 px-6 border-b border-border bg-card">
        <h1 className="text-2xl font-bold tracking-tight">
          Forensics & Analysis
        </h1>
        <p className="text-muted-foreground mt-1">
          Analyze evidence, recover data, and investigate incidents.
        </p>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Target Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaSearch className="h-5 w-5" />
              Case Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Case Name / ID</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Case-2023-001"
                    value={caseName}
                    onChange={(e) => setCaseName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Evidence File Path
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. /evidence/disk_image.dd"
                    value={evidenceFile}
                    onChange={(e) => setEvidenceFile(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-start">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <FaPlay /> Start Analysis
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl max-h-[86vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Start Forensic Analysis</DialogTitle>
                    <DialogDescription>
                      Select modules to examine the evidence.
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

        {/* Tool Management */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FaTerminal className="h-5 w-5" />
            <h2 className="text-2xl font-bold tracking-tight">
              Analysis Tools
            </h2>
          </div>

          {toolCategories.map((category) => (
            <div key={category.name} className="space-y-3">
              <div className="flex items-center gap-2">
                <category.icon className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-xl font-semibold">{category.name}</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {category.tools.map((tool) => (
                  <Dialog key={tool.name}>
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
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium w-fit bg-muted text-muted-foreground">
                              <FaTerminal className="h-3 w-3" />
                              <span>Idle</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("Download tool:", tool.name);
                              }}
                            >
                              <FaDownload className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{tool.name}</DialogTitle>
                        <DialogDescription>
                          {tool.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <p>
                          Configuration for {tool.name} will be implemented
                          here.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
              <Separator className="my-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Live Terminal Dialog Placeholder */}
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
          <div className="h-[400px] w-full bg-zinc-900 rounded-md border border-zinc-800 p-4 font-mono text-sm">
            <p className="text-zinc-500">Terminal simulation...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
