import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/pages/Dashboard";
import { PassiveRecon } from "@/pages/PassiveRecon";
import { WebSecurity } from "@/pages/WebSecurity";
import { ActiveRecon } from "@/pages/ActiveRecon";
import { VulnScanning } from "@/pages/VulnScanning";
import { Exploitation } from "@/pages/Exploitation";
import { PostExploitation } from "@/pages/PostExploitation";
import { WirelessAuditing } from "@/pages/WirelessAuditing";
import { CrackingCrypto } from "@/pages/CrackingCrypto";
import { ForensicsAnalysis } from "@/pages/ForensicsAnalysis";
import { Reporting } from "@/pages/Reporting";
import { Presets } from "@/pages/Presets";
import { CreatePreset } from "@/pages/CreatePreset";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="web-security" element={<WebSecurity />} />
            <Route path="passive-recon" element={<PassiveRecon />} />
            <Route path="active-recon" element={<ActiveRecon />} />
            <Route path="vuln-scanning" element={<VulnScanning />} />
            <Route path="exploitation" element={<Exploitation />} />
            <Route path="post-exploitation" element={<PostExploitation />} />
            <Route path="wireless-auditing" element={<WirelessAuditing />} />
            <Route path="cracking-crypto" element={<CrackingCrypto />} />
            <Route path="forensics-analysis" element={<ForensicsAnalysis />} />
            <Route path="presets" element={<Presets />} />
            <Route path="createPreset" element={<CreatePreset />} />
            <Route path="reporting" element={<Reporting />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
