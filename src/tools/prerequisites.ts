import { runCommand } from "./execution";
import type { ToolCallbacks } from "./types";

//check if go is installed
export async function checkGoInstalled(): Promise<boolean> {
  const result = await runCommand("go version > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some((line) => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}

//check if python/pip is installed
export async function checkPythonInstalled(): Promise<boolean> {
  const result = await runCommand("python3 --version > /dev/null 2>&1 && pip3 --version > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some((line) => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}
export async function getGoVersion(): Promise<string | null> {
const result = await runCommand("go version");

const line = Array.isArray(result.output)
  ? result.output.join(" ")
  : String(result.output);

  const match = line.match(/go([0-9]+\.[0-9]+(?:\.[0-9]+)?)/);

  return match ? match[1] : null;
}
export async function getLatestGoVersion(): Promise<string | null> {

  try {

    const result = await runCommand(
      "curl -s https://go.dev/VERSION?m=text"
    );

    const line = result.output.join(" ").trim();

    const match = line.match(
      /go([0-9]+\.[0-9]+(?:\.[0-9]+)?)/
    );

    return match ? match[1] : null;

  } catch {
    return null;
  }
}
export function compareVersions(
  current: string,
  latest: string
): boolean {

  const currentParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {

    const c = currentParts[i] || 0;
    const l = latestParts[i] || 0;

    if (c < l) return true;
    if (c > l) return false;
  }

  return false;
}

export async function ensureGoInstalledAndUpdated(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {

  const installed = await checkGoInstalled();

  if (!installed) {
    callbacks.onOutput?.("Go not installed.");
    return await installGo(password, callbacks);
  }

  const current = await getGoVersion();
  const latest = await getLatestGoVersion();

  if (!current || !latest) {
    callbacks.onOutput?.("Unable to determine Go version.");
    return true;
  }

  callbacks.onOutput?.(`Installed Go version: ${current}`);
  callbacks.onOutput?.(`Latest Go version: ${latest}`);

  const needsUpdate = compareVersions(current, latest);

  if (needsUpdate) {

    callbacks.onOutput?.("Updating Go...");

    return await installGo(password, callbacks);
  }

  callbacks.onOutput?.("Go is already up to date.");

  return true;
}

//install go
export async function installGo(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  const escapedPassword = password.replace(/'/g, "'\\''");
  callbacks.onOutput?.("Installing Go...");
  
  const script = `echo '${escapedPassword}' | sudo -S apt-get update && echo '${escapedPassword}' | sudo -S apt-get install -y golang-go && echo 'GO_INSTALL_SUCCESS'`;
  
  const result = await runCommand(script, {
    onOutput: (line) => {
      if (!line.includes(password)) callbacks.onOutput?.(line);
    },
  });
  
  const success = result.output.some((line) => line.includes("GO_INSTALL_SUCCESS"));
  callbacks.onOutput?.(success ? "✓ Go installed successfully!" : "✕ Go installation failed");
  return success;
}

//install python3 and pip
export async function installPython(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  const escapedPassword = password.replace(/'/g, "'\\''");
  callbacks.onOutput?.("Installing Python3 and pip...");
  
  const script = `echo '${escapedPassword}' | sudo -S apt-get update && echo '${escapedPassword}' | sudo -S apt-get install -y python3 python3-pip && echo 'PYTHON_INSTALL_SUCCESS'`;
  
  const result = await runCommand(script, {
    onOutput: (line) => {
      if (!line.includes(password)) callbacks.onOutput?.(line);
    },
  });
  
  const success = result.output.some((line) => line.includes("PYTHON_INSTALL_SUCCESS"));
  callbacks.onOutput?.(success ? "✓ Python3 and pip installed successfully!" : "✕ Python installation failed");
  return success;
}

//install ruby
export async function installRuby(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  const escapedPassword = password.replace(/'/g, "'\\''");
  callbacks.onOutput?.("Installing Ruby...");
  
  const script = `echo '${escapedPassword}' | sudo -S apt-get update && echo '${escapedPassword}' | sudo -S apt-get install -y ruby && echo 'RUBY_INSTALL_SUCCESS'`;
  
  const result = await runCommand(script, {
    onOutput: (line) => {
      if (!line.includes(password)) callbacks.onOutput?.(line);
    },
  });
  
  const success = result.output.some((line) => line.includes("RUBY_INSTALL_SUCCESS"));
  callbacks.onOutput?.(success ? "✓ Ruby installed successfully!" : "✕ Ruby installation failed");
  return success;
}

//check if ruby is installed
export async function checkRubyInstalled(): Promise<boolean> {
  const result = await runCommand("ruby --version > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some((line) => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}
