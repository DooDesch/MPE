const { dialog } = require("electron");
const path = require("path");

/**
 * Shows the About dialog for the application
 * @param {BrowserWindow} mainWindow - The main application window
 */
function showAboutDialog(mainWindow) {
  try {
    const packageJson = require("../package.json");
    const currentYear = new Date().getFullYear();

    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "About xAkiitoh Program Executor",
      message: "xAkiitoh Program Executor",
      detail: `Version: ${packageJson.version}\n\nA multi-program execution environment for Node.js and Python applications.\n\nDeveloped with Electron, Vue.js and TypeScript.\n\n© ${currentYear} xAkiitoh`,
      buttons: ["OK"],
      defaultId: 0,
      icon: null,
    });
  } catch (error) {
    console.error("Error showing about dialog:", error);

    // Fallback dialog if package.json can't be read
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "About xAkiitoh Program Executor",
      message: "xAkiitoh Program Executor",
      detail: `A multi-program execution environment for Node.js and Python applications.\n\nDeveloped with Electron, Vue.js and TypeScript.\n\n© ${new Date().getFullYear()} xAkiitoh`,
      buttons: ["OK"],
      defaultId: 0,
      icon: null,
    });
  }
}

module.exports = {
  showAboutDialog,
};
