import { dialog, BrowserWindow } from "electron";
import * as path from "path";

/**
 * Shows the About dialog for the application
 * @param mainWindow - The main application window
 */
export function showAboutDialog(mainWindow: BrowserWindow): void {
  try {
    const packageJson = require("../package.json");
    const currentYear = new Date().getFullYear();

    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "About xAkiitoh Program Executor",
      message: "xAkiitoh Program Executor",
      detail: `Version: ${packageJson.version}\n\nA multi-program execution environment for Node.js and Python applications.\n\nDeveloped with Electron, Vue.js and TypeScript.\n\n© ${currentYear} DooDesch`,
      buttons: ["OK"],
      defaultId: 0,
      icon: undefined,
    });
  } catch (error) {
    console.error("Error showing about dialog:", error);

    // Fallback dialog if package.json can't be read
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "About xAkiitoh Program Executor",
      message: "xAkiitoh Program Executor",
      detail: `A multi-program execution environment for Node.js and Python applications.\n\nDeveloped with Electron, Vue.js and TypeScript.\n\n© ${new Date().getFullYear()} DooDesch`,
      buttons: ["OK"],
      defaultId: 0,
      icon: undefined,
    });
  }
}
