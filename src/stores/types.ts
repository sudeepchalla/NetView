// Shared types for stores

export interface InstalledTool {
  name: string;
  version?: string;
  path?: string;
  installedAt: string;
}

export interface HistoryEntry {
  id?: number;
  toolName: string;
  action: string;
  target: string;
  category?: string;
  status: "Running" | "Success" | "Failed";
  startedAt: string;
  completedAt?: string;
}

export interface Notification {
  id?: number;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  read: boolean;
  createdAt: string;
}

export interface ActiveProcess {
  pid: number;
  name: string;
  status: string;
  cpu?: string;
  memory?: string;
  startTime: string;
}

export interface Engagement {
  id?: number;
  name: string;
  description?: string;
  createdAt: string;
}

export interface EngagementFile {
  id?: number;
  engagementId: number;
  fileName: string;
  filePath: string;
  toolName: string;
  createdAt: string;
}

