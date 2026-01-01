import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FaHome,
  FaSatelliteDish,
  FaEye,
  FaFileAlt,
  FaGithub,
  FaChevronLeft,
  FaChevronRight,
  FaSun,
  FaMoon,
  FaBug,
  FaBomb,
  FaFlag,
  FaWifi,
  FaUnlock,
  FaMicroscope,
} from "react-icons/fa";
import { useTheme } from "@/components/theme-provider";

import { open } from "@tauri-apps/plugin-shell";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const { setTheme, theme } = useTheme();

  const mainItems = [{ icon: FaHome, label: "Home", to: "/" }];

  const workflowItems = [
    { icon: FaEye, label: "Passive Recon", to: "/passive-recon" },
    { icon: FaSatelliteDish, label: "Active Recon", to: "/active-recon" },
    { icon: FaBug, label: "Vulnerability Scanning", to: "/vuln-scanning" },
    { icon: FaBomb, label: "Exploitation", to: "/exploitation" },
    { icon: FaFlag, label: "Post-Exploitation", to: "/post-exploitation" },
    { icon: FaFileAlt, label: "Reporting", to: "/reporting" },
  ];

  const advancedItems = [
    { icon: FaWifi, label: "Wireless Auditing", to: "/wireless-auditing" },
    { icon: FaUnlock, label: "Cracking and Crypto", to: "/cracking-crypto" },
    {
      icon: FaMicroscope,
      label: "Forensics and Analysis",
      to: "/forensics-analysis",
    },
  ];

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 border-b">
        {!collapsed && (
          <span className="font-bold text-lg truncate">NetView</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("ml-auto", collapsed && "mx-auto")}
        >
          {collapsed ? (
            <FaChevronRight className="h-4 w-4" />
          ) : (
            <FaChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-2 p-2 relative overflow-y-auto">
        {mainItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
                collapsed && "justify-center px-2"
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}

        <div className="my-2 px-2">
          <div className="h-[1px] bg-border/50" />
        </div>

        {workflowItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
                collapsed && "justify-center px-2"
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}

        <div className="my-2 px-2">
          <div className="h-[1px] bg-border/50" />
        </div>

        {advancedItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
                collapsed && "justify-center px-2"
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t space-y-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleThemeToggle}
          className={cn(
            "w-full justify-start px-3 py-2 hover:cursor-pointer",
            collapsed && "justify-center"
          )}
          title="Toggle Theme"
        >
          {theme === "dark" ? (
            <FaSun className="h-5 w-5 transition-all" />
          ) : (
            <FaMoon className="h-5 w-5 transition-all" />
          )}

          {!collapsed && <span className="ml-2 truncate">Theme</span>}
        </Button>

        <Button
          variant="ghost"
          onClick={() => open("https://github.com")}
          className={cn(
            "w-full justify-start gap-3 px-3 py-2 text-muted-foreground hover:text-accent-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <FaGithub className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">GitHub</span>}
        </Button>
      </div>
    </div>
  );
}
