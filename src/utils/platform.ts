
/**
 * Detects if the current platform is Windows.
 * This checks the user agent which is available in the Tauri webview.
 */
export const isWindows = (): boolean => {
  return navigator.userAgent.includes('Windows');
};

/**
 * Detects if the current platform is Linux.
 */
export const isLinux = (): boolean => {
  return navigator.userAgent.includes('Linux');
};
