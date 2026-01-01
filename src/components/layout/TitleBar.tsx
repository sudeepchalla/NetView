import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  VscChromeMinimize,
  VscChromeMaximize,
  VscChromeClose,
  VscChromeRestore,
} from "react-icons/vsc";

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    // Check initial state
    appWindow.isMaximized().then(setIsMaximized);

    // Listen for resize events to update state
    const unlisten = appWindow.listen("tauri://resize", async () => {
      setIsMaximized(await appWindow.isMaximized());
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <div
      data-tauri-drag-region
      className="h-8 flex items-center justify-between bg-background border-b select-none z-50 fixed top-0 left-0 right-0"
    >
      <div className="px-4 text-xs font-medium text-muted-foreground pointer-events-none">
        NetView
      </div>
      <div className="flex h-full">
        <div
          className="inline-flex items-center justify-center w-12 h-full hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
          onClick={() => appWindow.minimize()}
        >
          <VscChromeMinimize className="h-4 w-4" />
        </div>
        <div
          className="inline-flex items-center justify-center w-12 h-full hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
          onClick={() => appWindow.toggleMaximize()}
        >
          {isMaximized ? (
            <VscChromeRestore className="h-4 w-4" />
          ) : (
            <VscChromeMaximize className="h-4 w-4" />
          )}
        </div>
        <div
          className="inline-flex items-center justify-center w-12 h-full hover:bg-destructive hover:text-destructive-foreground cursor-pointer transition-colors"
          onClick={() => appWindow.close()}
        >
          <VscChromeClose className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
