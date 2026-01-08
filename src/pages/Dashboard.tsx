import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaWifi, FaUnlock, FaMicroscope, FaGlobe } from "react-icons/fa";
import { Link } from "react-router-dom";

export function Dashboard() {
  return (
    <div className="min-h-full bg-background">
      <div className="py-6 px-6 border-b border-border bg-card">
        <h1 className="text-2xl font-bold tracking-tight">NetView Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Select a module to begin your security assessment workflow.
        </p>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {/* Web Security Testing */}
          <Link to="/web-security">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full border-l-4 border-l-primary/50">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <FaGlobe className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      Web Security Testing
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-base">
                      Comprehensive suite for web application security
                      assessment including recon, scanning, and exploitation.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Wireless Auditing */}
          <Link to="/wireless-auditing">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full border-l-4 border-l-blue-500/50">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-500/10">
                    <FaWifi className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Wireless Auditing</CardTitle>
                    <CardDescription className="mt-1.5 text-base">
                      Tools for viewing nearby devices, scanning networks, and
                      assessing wireless protocol security.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Cracking and Crypto */}
          <Link to="/cracking-crypto">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full border-l-4 border-l-orange-500/50">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-500/10">
                    <FaUnlock className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      Cracking and Crypto
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-base">
                      Advanced tools for password cracking, hash identification,
                      and cryptographic analysis.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Forensics and Analysis */}
          <Link to="/forensics-analysis">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full border-l-4 border-l-purple-500/50">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-500/10">
                    <FaMicroscope className="h-8 w-8 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      Forensics and Analysis
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-base">
                      Digital investigation suite including image metadata
                      viewers, artifact analysis, and file examination.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Automated Presets Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 tracking-tight">
            Automated Presets
          </h2>
          <p className="text-muted-foreground mb-6">
            One-click automation scripts that chain multiple tools together for
            varying depth of analysis.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:bg-accent/50 transition-colors">
              <CardHeader>
                <CardTitle>Quick Scan</CardTitle>
                <CardDescription className="mb-4">
                  Rapid content discovery and port scan.
                  <br />
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-2 inline-block">
                    nmap -F + whatweb
                  </span>
                </CardDescription>
                <Button size="sm" className="w-full">
                  Run Quick Scan
                </Button>
              </CardHeader>
            </Card>

            <Card className="hover:bg-accent/50 transition-colors">
              <CardHeader>
                <CardTitle>Full Recon</CardTitle>
                <CardDescription className="mb-4">
                  Deep dive including subdomain enumeration and full port scan.
                  <br />
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-2 inline-block">
                    nmap -A + sublist3r + nikto
                  </span>
                </CardDescription>
                <Button size="sm" className="w-full">
                  Run Full Recon
                </Button>
              </CardHeader>
            </Card>

            <Card className="hover:bg-accent/50 transition-colors">
              <CardHeader>
                <CardTitle>Vuln Assessment</CardTitle>
                <CardDescription className="mb-4">
                  Targeted vulnerability scanning for known CVEs.
                  <br />
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-2 inline-block">
                    nmap --script vuln + searchsploit
                  </span>
                </CardDescription>
                <Button size="sm" className="w-full">
                  Run Assessment
                </Button>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
