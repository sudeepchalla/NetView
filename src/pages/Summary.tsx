import { useEffect, useMemo, useState } from "react";
import {
  FaServer,
  FaNetworkWired,
  FaSpinner,
  FaTerminal,
  FaBug,
  FaChevronDown,
  FaChevronRight,
  FaSearch,
  FaEnvelope,
  FaCode,
  FaLayerGroup,
} from "react-icons/fa";
import { useHistoryStore, useEngagementStore, useToolsStore } from "@/stores";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { readTextFile } from "@tauri-apps/plugin-fs";

// --- Types ---
interface SubdomainResult {
  host: string;
  ip?: string;
  source: string;
  input: string;
}

interface TechStackResult {
  target: string;
  http_status: number;
  plugins: Record<string, any>;
  title?: string;
  email?: string[];
}

// --- Components ---

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendLabel,
  className,
}: any) => (
  <Card className={cn("overflow-hidden", className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {(description || trend) && (
        <p className="text-xs text-muted-foreground mt-1">
          {trend && (
            <span
              className={cn(
                "font-medium",
                trend > 0 ? "text-green-500" : "text-red-500",
              )}
            >
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
          )}
          {trend && trendLabel && <span className="ml-1">{trendLabel}</span>}
          {!trend && description}
        </p>
      )}
    </CardContent>
  </Card>
);

const ProgressBar = ({
  value,
  max = 100,
  color = "bg-primary",
  label,
  height = "h-2",
}: any) => (
  <div className="space-y-1">
    {label && (
      <div className="flex justify-between text-xs font-medium">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {Math.round((value / max) * 100)}%
        </span>
      </div>
    )}
    <div className="w-full bg-secondary rounded-full overflow-hidden">
      <div
        className={cn(
          "transition-all duration-500 ease-out rounded-full",
          height,
          color,
        )}
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  </div>
);

const AccordionSection = ({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  count = 0,
}: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          <span className="font-semibold text-lg">{title}</span>
          {count > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {count} Items
            </span>
          )}
        </div>
        {isOpen ? (
          <FaChevronDown className="bg-muted-foreground/10 p-1 rounded-full h-6 w-6" />
        ) : (
          <FaChevronRight className="bg-muted-foreground/10 p-1 rounded-full h-6 w-6" />
        )}
      </button>
      {isOpen && (
        <div className="p-0 border-t animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

// --- Main Page ---

export function Summary() {
  const { entries, loadFromDb: loadHistory } = useHistoryStore();
  const { currentFiles, loadFromDb: loadEngagements } = useEngagementStore();
  const { loadFromDb: loadTools } = useToolsStore();
  const [loading, setLoading] = useState(true);

  // Parsed Data State
  const [subdomains, setSubdomains] = useState<SubdomainResult[]>([]);
  const [techStacks, setTechStacks] = useState<TechStackResult[]>([]);
  const [emails, setEmails] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      await Promise.all([loadHistory(), loadEngagements(), loadTools()]);
      setLoading(false);
    };
    load();
  }, [loadHistory, loadEngagements, loadTools]);

  // Parse Files Effect
  useEffect(() => {
    const parseFiles = async () => {
      if (!currentFiles.length) return;

      const newSubdomains: SubdomainResult[] = [];
      const newTechStacks: TechStackResult[] = [];
      const newEmails: Set<string> = new Set();

      for (const file of currentFiles) {
        try {
          if (file.toolName === "Subfinder" || file.toolName === "Amass") {
            const content = await readTextFile(file.filePath);
            // Verify if content is line-delimited JSON or array
            // Tools like subfinder -json output line-delimited JSON
            const lines = content.split("\n").filter(Boolean);
            lines.forEach((line) => {
              try {
                const data = JSON.parse(line);
                newSubdomains.push({
                  host: data.host || data.name,
                  ip: data.ip,
                  source: data.source || file.toolName,
                  input: data.input || data.domain,
                });
              } catch (e) {}
            });
          }

          if (file.toolName === "WhatWeb") {
            const content = await readTextFile(file.filePath);
            // WhatWeb JSON is usually an array
            try {
              const data = JSON.parse(content);
              if (Array.isArray(data)) {
                data.forEach((item: any) => {
                  newTechStacks.push(item);
                  // Extract emails if any
                  if (item.plugins?.Email) {
                    item.plugins.Email.string?.forEach((email: string) =>
                      newEmails.add(email),
                    );
                  }
                });
              }
            } catch (e) {}
          }
        } catch (err) {
          console.error("Failed to parse file:", file.fileName, err);
        }
      }

      // Deduplicate subdomains
      const uniqueSubs = Array.from(
        new Map(newSubdomains.map((item) => [item.host, item])).values(),
      );

      setSubdomains(uniqueSubs);
      setTechStacks(newTechStacks);
      setEmails(Array.from(newEmails));
    };

    parseFiles();
  }, [currentFiles]);

  const stats = useMemo(() => {
    const total = entries.length;
    const success = entries.filter((e) => e.status === "Success").length;
    const running = entries.filter((e) => e.status === "Running").length;
    const uniqueTargets = new Set(entries.map((e) => e.target));
    const cats = entries.reduce(
      (acc, e) => {
        const c = e.category || "Other";
        acc[c] = (acc[c] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total,
      success,
      running,
      uniqueTargets: uniqueTargets.size,
      topCategories: Object.entries(cats).sort(([, a], [, b]) => b - a),
      successRate: total > 0 ? Math.round((success / total) * 100) : 0,
    };
  }, [entries]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <FaSpinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between py-6 px-6 border-b bg-card">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Summary Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Live Security Assessment Report
          </p>
        </div>
      </div>

      <div className="p-6 max-w-[1600px] mx-auto space-y-8">
        {/* TOP: KPI Dashboard */}
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Operations"
              value={stats.total}
              icon={FaTerminal}
            />
            <StatCard
              title="Discovered Subdomains"
              value={subdomains.length}
              icon={FaNetworkWired}
              description={
                subdomains.length > 0 ? "From passive sources" : "No data yet"
              }
            />
            <StatCard
              title="Tech Stacks Identified"
              value={techStacks.length}
              icon={FaLayerGroup}
            />
            <StatCard
              title="Emails Found"
              value={emails.length}
              icon={FaEnvelope}
              className={
                emails.length > 0 ? "border-l-4 border-l-orange-500" : ""
              }
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.topCategories.map(([cat, count], idx) => (
                  <ProgressBar
                    key={cat}
                    label={cat}
                    value={count}
                    max={stats.total}
                    color={idx === 0 ? "bg-primary" : "bg-primary/60"}
                  />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y relative">
                  {entries.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 py-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            entry.status === "Success"
                              ? "bg-green-500"
                              : "bg-red-500",
                          )}
                        />
                        <div className="text-sm font-medium">
                          {entry.toolName}
                        </div>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {entry.target}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="flex items-center gap-4 py-4">
          <div className="h-px bg-border flex-1" />
          <span className="text-muted-foreground font-semibold tracking-widest text-sm uppercase">
            Detailed Analysis Report
          </span>
          <div className="h-px bg-border flex-1" />
        </div>

        {/* BOTTOM: Detailed Sections */}
        <div className="space-y-4">
          {/* Passive Recon Section */}
          <AccordionSection
            title="Passive Reconnaissance"
            icon={FaSearch}
            count={subdomains.length}
          >
            <div className="bg-card p-6 space-y-8">
              {/* Tech Stack Grid */}
              {techStacks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FaCode /> Technology Stack
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {techStacks.map((site, i) => (
                      <Card key={i} className="bg-muted/30">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle
                              className="text-base truncate"
                              title={site.target}
                            >
                              {site.target}
                            </CardTitle>
                            <span className="text-xs px-2 py-1 bg-black/10 rounded font-mono">
                              {site.http_status}
                            </span>
                          </div>
                          <CardDescription className="line-clamp-1">
                            {site.title}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1">
                            {Object.keys(site.plugins)
                              .slice(0, 6)
                              .map((tech) => (
                                <span
                                  key={tech}
                                  className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                                >
                                  {tech}
                                </span>
                              ))}
                            {Object.keys(site.plugins).length > 6 && (
                              <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                                +{Object.keys(site.plugins).length - 6} more
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Subdomains Table */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FaNetworkWired /> Discovered Assets ({subdomains.length})
                </h3>
                {subdomains.length === 0 ? (
                  <div className="text-center py-10 border rounded-lg bg-muted/10 border-dashed">
                    <FaSearch className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No asset data found. Run Subfinder or Amass to populate
                      this list.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <div className="max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted text-muted-foreground sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">
                              Host / Subdomain
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                              IP Address
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                              Source
                            </th>
                            <th className="px-4 py-3 text-right font-medium">
                              Input
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {subdomains.map((sub, i) => (
                            <tr
                              key={i}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <td className="px-4 py-2 font-mono text-primary">
                                {sub.host}
                              </td>
                              <td className="px-4 py-2 font-mono text-muted-foreground">
                                {sub.ip || "-"}
                              </td>
                              <td className="px-4 py-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                                  {sub.source}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right text-muted-foreground">
                                {sub.input}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Emails */}
              {emails.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FaEnvelope /> Discovered Contacts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {emails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md text-sm"
                      >
                        <FaEnvelope className="text-muted-foreground text-xs" />
                        <span>{email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionSection>

          {/* Active Recon Section (Placeholder) */}
          <AccordionSection
            title="Active Reconnaissance"
            icon={FaServer}
            count={0}
          >
            <div className="p-8 text-center text-muted-foreground">
              <FaServer className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>
                Active port scan data not available. Integrate Nmap scans to
                view detailed port and service information here.
              </p>
            </div>
          </AccordionSection>

          {/* Vuln Section (Placeholder) */}
          <AccordionSection title="Vulnerabilities" icon={FaBug} count={0}>
            <div className="p-8 text-center text-muted-foreground">
              <FaBug className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>
                No vulnerability data found. Run targeted vulnerability scans to
                populate this report.
              </p>
            </div>
          </AccordionSection>
        </div>
      </div>
    </div>
  );
}
