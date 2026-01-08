//tool configuration types

export interface ToolConfig {
  name: string;
  description: string;
}

export interface BaseToolOptions {
  target: string;
  engagementName?: string;
}

export interface SubfinderOptions extends BaseToolOptions {
  source?: string;
  apiKey?: string;
  all?: boolean;
  recursive?: boolean;
  silent?: boolean;
}

export interface WslCommandResult {
  code: number;
  output: string[];
}

export interface ToolCallbacks {
  onOutput?: (line: string) => void;
  onComplete?: (success: boolean, exitCode: number) => void;
  onError?: (error: string) => void;
}
