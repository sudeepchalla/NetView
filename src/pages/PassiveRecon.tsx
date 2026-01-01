import { useState } from "react";
import {
  FaSearch,
  FaDownload,
  FaDocker,
  FaTerminal,
  FaPlay,
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

export function PassiveRecon() {
  const [ipAddress, setIpAddress] = useState("");
  const [url, setUrl] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Passive Recon</h1>
        <p className="text-muted-foreground">
          Gather information about targets without directly interacting with
          them.
        </p>
      </div>

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
          <h2 className="text-2xl font-bold tracking-tight">Available Tools</h2>
        </div>

        {toolCategories.map((category) => (
          <div key={category.name} className="space-y-3">
            <h3 className="text-xl font-semibold">{category.name}</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.tools.map((tool) => (
                <Card key={tool.name} className="bg-muted/50">
                  <CardContent className="space-y-4">
                    <div className="min-h-[60px]">
                      <h4 className="font-semibold text-base">{tool.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2 text-xs"
                      >
                        <FaDownload className="h-3 w-3" /> Native
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2 text-xs"
                      >
                        <FaDocker className="h-3 w-3" /> Docker
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Separator className="my-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
