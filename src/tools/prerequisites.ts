import { runWslCommand } from "./wsl";
import type { ToolCallbacks } from "./types";

//check if go is installed
export async function checkGoInstalled(): Promise<boolean> {
  const result = await runWslCommand("go version > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some((line) => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}

//check if python/pip is installed
export async function checkPythonInstalled(): Promise<boolean> {
  const result = await runWslCommand("python3 --version > /dev/null 2>&1 && pip3 --version > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some((line) => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}

//install go
export async function installGo(
  password: string,
  callbacks: ToolCallbacks
): Promise<boolean> {
  const escapedPassword = password.replace(/'/g, "'\\''");
  callbacks.onOutput?.("Installing Go...");
  
  const script = `echo '${escapedPassword}' | sudo -S apt-get update && echo '${escapedPassword}' | sudo -S apt-get install -y golang-go && echo 'GO_INSTALL_SUCCESS'`;
  
  const result = await runWslCommand(script, {
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
  
  const result = await runWslCommand(script, {
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
  
  const result = await runWslCommand(script, {
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
  const result = await runWslCommand("ruby --version > /dev/null 2>&1 && echo 'FOUND' || echo 'NOT_FOUND'");
  return result.output.some((line) => line.includes("FOUND") && !line.includes("NOT_FOUND"));
}
