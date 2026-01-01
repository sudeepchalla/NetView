import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/pages/Dashboard";
import { ReconPage } from "@/pages/ReconPage";
import { PassiveRecon } from "@/pages/PassiveRecon";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="passive-recon" element={<PassiveRecon />} />
            <Route path="active-recon" element={<ReconPage />} />
            <Route path="vuln-scanning" element={<ReconPage />} />
            <Route path="exploitation" element={<ReconPage />} />
            <Route path="post-exploitation" element={<ReconPage />} />
            <Route path="wireless-auditing" element={<ReconPage />} />
            <Route path="cracking-crypto" element={<ReconPage />} />
            <Route path="forensics-analysis" element={<ReconPage />} />
            <Route path="reporting" element={<ReconPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
