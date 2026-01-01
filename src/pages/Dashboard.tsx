import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FaEye,
  FaSatelliteDish,
  FaWifi,
  FaBug,
  FaBomb,
  FaUnlock,
  FaFlag,
  FaMicroscope,
  FaFileAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">NetView Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Select a module to begin your security assessment workflow.
        </p>
      </div>

      <div className="space-y-8">
        {/* Web Security Testing Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 tracking-tight">
            Web Security Testing
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/passive-recon">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <FaEye className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Passive Recon</CardTitle>
                  <CardDescription>
                    OSINT gathering and non-intrusive analysis
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link to="/active-recon">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <FaSatelliteDish className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Active Recon</CardTitle>
                  <CardDescription>
                    Port scanning, service enumeration, and mapping
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link to="/vuln-scanning">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <FaBug className="h-8 w-8 text-destructive mb-2" />
                  <CardTitle>Vuln Scanning</CardTitle>
                  <CardDescription>
                    Identify security weaknesses and CVEs
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link to="/exploitation">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <FaBomb className="h-8 w-8 text-destructive mb-2" />
                  <CardTitle>Exploitation</CardTitle>
                  <CardDescription>
                    Deploy payloads and exploit discovered flaws
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link to="/post-exploitation">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <FaFlag className="h-8 w-8 text-chart-2 mb-2" />
                  <CardTitle>Post-Exploitation</CardTitle>
                  <CardDescription>
                    Persistence, looting, and lateral movement
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link to="/reporting">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <FaFileAlt className="h-8 w-8 text-chart-2 mb-2" />
                  <CardTitle>Reporting</CardTitle>
                  <CardDescription>
                    Generate professional assessment reports
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Wireless Auditing Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 tracking-tight">
            Wireless Auditing
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/wireless-auditing">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <FaWifi className="h-8 w-8 text-blue-500 mb-2" />
                  <CardTitle>Wireless Auditing</CardTitle>
                  <CardDescription>
                    Analyze wireless devices connected, scan for networks, and
                    assess protocol security.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Cracking and Crypto Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 tracking-tight">
            Cracking and Crypto
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/cracking-crypto">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <FaUnlock className="h-8 w-8 text-orange-500 mb-2" />
                  <CardTitle>Cracking and Crypto</CardTitle>
                  <CardDescription>
                    Password cracking, hash identification, and cryptographic
                    analysis.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Forensics and Analysis Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 tracking-tight">
            Forensics and Analysis
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/forensics-analysis">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <FaMicroscope className="h-8 w-8 text-purple-500 mb-2" />
                  <CardTitle>Forensics and Analysis</CardTitle>
                  <CardDescription>
                    Accessing file metadata, analyzing artifacts, and digital
                    investigation.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
