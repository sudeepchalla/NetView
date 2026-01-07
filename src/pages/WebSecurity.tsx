import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FaEye,
  FaSatelliteDish,
  FaBug,
  FaBomb,
  FaFlag,
  FaFileAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";

export function WebSecurity() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Web Security Testing
        </h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive suite for web application security assessment including
          recon, scanning, and exploitation.
        </p>
      </div>

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
  );
}
