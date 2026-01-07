import { useState } from "react";
import {
  FaTerminal,
  FaWifi,
  FaBluetooth,
  FaSignal,
  FaDownload,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function WirelessAuditing() {
  const [activeTerminalTool, setActiveTerminalTool] = useState<{
    name: string;
    description: string;
  } | null>(null);

  const toolCategories = [
    {
      name: "WiFi Security",
      icon: FaWifi,
      tools: [
        {
          name: "Aircrack-ng",
          description: "Complete suite to assess WiFi network security",
        },
        {
          name: "Kismet",
          description:
            "Wireless network detector, sniffer, and intrusion detection system",
        },
        {
          name: "Wifite",
          description: "Automated wireless attack tool",
        },
      ],
    },
    {
      name: "Bluetooth & RF",
      icon: FaBluetooth,
      tools: [
        {
          name: "Bettercap",
          description:
            "The Swiss Army knife for WiFi, Bluetooth, Low Energy, and Ethernet networks reconnaissance and MITM attacks",
        },
        {
          name: "BlueHydra",
          description: "Bluetooth device discovery service",
        },
      ],
    },
    {
      name: "SDR & Radio",
      icon: FaSignal,
      tools: [
        {
          name: "GQRX",
          description: "Software defined radio receiver",
        },
        {
          name: "RTL-433",
          description: "Generic data receiver to decode radio transmissions",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wireless Auditing</h1>
        <p className="text-muted-foreground">
          Assess security of wireless interfaces including WiFi, Bluetooth, and
          SDR.
        </p>
      </div>

      <div className="space-y-6">
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
                      <DialogDescription>{tool.description}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p>
                        Configuration for {tool.name} will be implemented here.
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
