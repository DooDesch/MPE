const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  Menu,
  dialog,
} = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Kill process tree utility for better process cleanup
function killProcessTree(pid, signal = "SIGTERM") {
  if (process.platform === "win32") {
    // On Windows, use taskkill to kill the entire process tree
    try {
      spawn("taskkill", ["/pid", pid.toString(), "/T", "/F"], {
        stdio: "ignore",
        detached: true,
      });
      return true;
    } catch (error) {
      console.error("Taskkill failed:", error.message);
      return false;
    }
  } else {
    // On Unix-like systems, kill the process group
    try {
      process.kill(-pid, signal); // Negative PID kills the process group
      return true;
    } catch (error) {
      console.error("Kill process group failed:", error.message);
      try {
        process.kill(pid, signal); // Fallback to single process
        return true;
      } catch (fallbackError) {
        console.error("Kill single process failed:", fallbackError.message);
        return false;
      }
    }
  }
}

// Suppress security warnings in development
if (process.env.NODE_ENV === "development") {
  process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
}

let mainWindow;
let programManager;

class ProgramManager {
  constructor() {
    this.runningPrograms = new Map();
    // Initialize Programs folder with smart handling
    this.initializeProgramsFolder();
  }

  initializeProgramsFolder() {
    if (app.isPackaged) {
      // In packaged app: User Programs in AppData, Examples in resources
      const userDataPath = app.getPath("userData");
      this.programsPath = path.join(userDataPath, "Programs");
      this.examplesPath = path.join(process.resourcesPath, "Programs-Examples");

      // Create user Programs folder if it doesn't exist
      if (!fs.existsSync(this.programsPath)) {
        fs.mkdirSync(this.programsPath, { recursive: true });

        // Copy examples to user folder only on first installation
        if (fs.existsSync(this.examplesPath)) {
          this.copyExamplesToUserFolder();
        }
      }
    } else {
      // In development: Use local Programs folder
      this.programsPath = path.join(__dirname, "../Programs");
    }
  }

  copyExamplesToUserFolder() {
    try {
      const examples = fs.readdirSync(this.examplesPath, {
        withFileTypes: true,
      });

      for (const example of examples) {
        if (example.isDirectory()) {
          const sourcePath = path.join(this.examplesPath, example.name);
          const destPath = path.join(this.programsPath, example.name);

          // Only copy if destination doesn't exist (preserve user programs)
          if (!fs.existsSync(destPath)) {
            this.copyDirectoryRecursive(sourcePath, destPath);
            console.log(`Copied example: ${example.name}`);
          }
        } else {
          // Copy files too (like README.md)
          const sourcePath = path.join(this.examplesPath, example.name);
          const destPath = path.join(this.programsPath, example.name);

          if (!fs.existsSync(destPath)) {
            fs.copyFileSync(sourcePath, destPath);
          }
        }
      }
    } catch (error) {
      console.error("Error copying examples:", error);
    }
  }

  copyDirectoryRecursive(source, destination) {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    const files = fs.readdirSync(source, { withFileTypes: true });

    for (const file of files) {
      const sourcePath = path.join(source, file.name);
      const destPath = path.join(destination, file.name);

      if (file.isDirectory()) {
        this.copyDirectoryRecursive(sourcePath, destPath);
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }

  restoreExamples() {
    if (app.isPackaged && fs.existsSync(this.examplesPath)) {
      this.copyExamplesToUserFolder();
      return true;
    }
    return false;
  }

  async scanPrograms() {
    const programs = [];

    try {
      const items = fs.readdirSync(this.programsPath, { withFileTypes: true });

      for (const item of items) {
        if (item.isDirectory()) {
          const programPath = path.join(this.programsPath, item.name);
          const program = await this.analyzeProgram(item.name, programPath);
          if (program) {
            programs.push(program);
          }
        }
      }
    } catch (error) {
      console.error("Fehler beim Scannen der Programme:", error);
    }

    return programs;
  }

  async analyzeProgram(name, programPath) {
    try {
      // Check for package.json (Node.js)
      const packageJsonPath = path.join(programPath, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf8")
        );
        return {
          name,
          path: programPath,
          type: "nodejs",
          description: packageJson.description,
          main: packageJson.main,
        };
      }

      // Check for Python files
      const pythonFiles = ["server.py", "main.py", "app.py", "run.py"];
      for (const fileName of pythonFiles) {
        if (fs.existsSync(path.join(programPath, fileName))) {
          return {
            name,
            path: programPath,
            type: "python",
            main: fileName,
          };
        }
      }
    } catch (error) {
      console.error(`Fehler beim Analysieren von ${name}:`, error);
    }

    return null;
  }

  async findPythonExecutable() {
    const pythonCommands = ["python3", "python", "py"];

    for (const cmd of pythonCommands) {
      try {
        // Test if the command exists and check version
        const testProcess = spawn(cmd, ["--version"], {
          stdio: "pipe",
          shell: true,
          timeout: 5000,
        });

        await new Promise((resolve, reject) => {
          let output = "";
          testProcess.stdout?.on("data", (data) => {
            output += data.toString();
          });
          testProcess.stderr?.on("data", (data) => {
            output += data.toString();
          });
          testProcess.on("close", (code) => {
            if (code === 0 && output.includes("Python")) {
              console.log(`Found Python: ${cmd} - ${output.trim()}`);
              resolve(cmd);
            } else {
              reject(new Error(`${cmd} not found or invalid`));
            }
          });
          testProcess.on("error", reject);
        });

        return cmd; // Return the first working python command
      } catch (error) {
        console.log(`${cmd} not available: ${error.message}`);
        continue;
      }
    }

    // Fallback to 'python' if none worked
    console.log("No Python found, using fallback: python");
    return "python";
  }

  async startProgram(program) {
    const id = `${program.name}_${Date.now()}`;

    let command;
    let args;
    let cwd = program.path;

    if (program.type === "nodejs") {
      // Check if npm start or npm run dev is available
      const packageJsonPath = path.join(program.path, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      if (packageJson.scripts?.dev) {
        command = "npm";
        args = ["run", "dev"];
      } else if (packageJson.scripts?.start) {
        command = "npm";
        args = ["run", "start"];
      } else {
        command = "node";
        args = [program.main || "index.js"];
      }
    } else {
      // Try to find the best Python executable
      command = await this.findPythonExecutable();
      args = ["-u", program.main || "main.py"]; // -u flag for unbuffered output
    }

    // Set up environment variables for proper UTF-8 handling
    const env = { ...process.env };
    if (program.type === "python") {
      env.PYTHONIOENCODING = "utf-8";
      env.PYTHONLEGACYWINDOWSIOENCODING = "0";
      env.PYTHONUNBUFFERED = "1"; // Force unbuffered output
    }

    const childProcess = spawn(command, args, {
      cwd,
      stdio: "pipe",
      shell: true,
      env,
      // Create a new process group for better process management
      detached: process.platform !== "win32", // On Unix, detached creates new process group
    });

    const runningProgram = {
      id,
      name: program.name,
      process: childProcess,
      terminal: [],
    };

    // Handle output
    childProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      runningProgram.terminal.push(`[OUT] ${output}`);
      this.sendToRenderer("program-output", { id, output, type: "stdout" });
    });

    childProcess.stderr?.on("data", (data) => {
      const output = data.toString();
      runningProgram.terminal.push(`[ERR] ${output}`);
      this.sendToRenderer("program-output", { id, output, type: "stderr" });
    });

    childProcess.on("close", (code) => {
      runningProgram.terminal.push(`[INFO] Programm beendet mit Code: ${code}`);
      this.sendToRenderer("program-closed", { id, code });
      this.runningPrograms.delete(id);
    });

    childProcess.on("error", (error) => {
      runningProgram.terminal.push(`[ERROR] ${error.message}`);
      this.sendToRenderer("program-error", { id, error: error.message });
    });

    this.runningPrograms.set(id, runningProgram);
    return id;
  }

  stopProgram(id) {
    const program = this.runningPrograms.get(id);
    if (program) {
      console.log(
        `Stopping program: ${program.name} (ID: ${id}, PID: ${program.process.pid})`
      );

      try {
        // Use our improved kill function
        const success = killProcessTree(program.process.pid, "SIGTERM");

        if (!success) {
          // Fallback to force kill
          console.log(`Graceful stop failed, force killing: ${program.name}`);
          setTimeout(() => {
            killProcessTree(program.process.pid, "SIGKILL");
          }, 2000);
        }

        console.log(`Program ${program.name} stop signal sent`);
      } catch (error) {
        console.error(`Error stopping program ${program.name}:`, error.message);
      }

      // Clean up from our tracking immediately
      this.runningPrograms.delete(id);

      // Notify renderer
      this.sendToRenderer("program-closed", { id, code: -1 });

      return true;
    }
    return false;
  }

  sendInput(id, input) {
    const program = this.runningPrograms.get(id);
    if (program && program.process.stdin) {
      // Add input to terminal log first
      const inputLine = `[INPUT] ${program.name}> ${input}`;
      program.terminal.push(inputLine);

      // Send input to process
      program.process.stdin.write(input + "\n");

      // Notify renderer about the input
      this.sendToRenderer("program-output", {
        id,
        output: inputLine,
        type: "input",
      });

      return true;
    }
    return false;
  }

  getRunningPrograms() {
    return Array.from(this.runningPrograms.values()).map((p) => ({
      id: p.id,
      name: p.name,
    }));
  }

  getProgramOutput(id) {
    const program = this.runningPrograms.get(id);
    return program ? program.terminal : [];
  }

  sendToRenderer(channel, data) {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(channel, data);
    });
  }

  cleanup() {
    console.log("Cleaning up running programs...");
    const runningIds = Array.from(this.runningPrograms.keys());

    for (const id of runningIds) {
      this.stopProgram(id);
    }

    console.log(`Stopped ${runningIds.length} running programs`);
  }
}

function createApplicationMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Open Programs Folder",
          click: () => {
            if (programManager) {
              shell.openPath(programManager.programsPath);
            }
          },
        },
        {
          label: "Restore Examples",
          click: () => {
            if (programManager) {
              const success = programManager.restoreExamples();
              if (success) {
                dialog.showMessageBox(mainWindow, {
                  type: "info",
                  title: "Examples Restored",
                  message:
                    "Example programs have been restored to your Programs folder.",
                });
              }
            }
          },
        },
        { type: "separator" },
        {
          role: "quit",
          label: "Exit",
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectall" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About xAkiitoh Program Executor",
          click: () => {
            showAboutDialog();
          },
        },
        {
          label: "Open Programs Folder",
          click: () => {
            if (programManager) {
              shell.openPath(programManager.programsPath);
            }
          },
        },
      ],
    },
  ];

  // macOS specific menu adjustments
  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });

    // Edit menu
    template[2].submenu.push(
      { type: "separator" },
      {
        label: "Speech",
        submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
      }
    );

    // Window menu
    template[4].submenu = [
      { role: "close" },
      { role: "minimize" },
      { role: "zoom" },
      { type: "separator" },
      { role: "front" },
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function showAboutDialog() {
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
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: process.env.NODE_ENV !== "development",
      allowRunningInsecureContent: process.env.NODE_ENV === "development",
      preload: path.join(__dirname, "preload.js"),
    },
    titleBarStyle: "default",
    show: false,
  });

  // Load the app
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5176");
    mainWindow.webContents.openDevTools();
  } else {
    // In production, the files are in dist/renderer
    const isDev = !app.isPackaged;
    if (isDev) {
      mainWindow.loadFile(path.join(__dirname, "../dist/renderer/index.html"));
    } else {
      mainWindow.loadFile(path.join(__dirname, "../dist/renderer/index.html"));
    }
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    // Clean up all running programs before quitting
    if (programManager) {
      programManager.cleanup();
    }
    app.quit();
  });
}

app.whenReady().then(() => {
  programManager = new ProgramManager();
  createWindow();
  createApplicationMenu();

  // IPC Handlers
  ipcMain.handle("scan-programs", () => programManager.scanPrograms());

  ipcMain.handle("start-program", async (_, program) => {
    return await programManager.startProgram(program);
  });

  ipcMain.handle("stop-program", (_, id) => {
    return programManager.stopProgram(id);
  });

  ipcMain.handle("send-input", (_, id, input) => {
    return programManager.sendInput(id, input);
  });

  ipcMain.handle("get-running-programs", () => {
    return programManager.getRunningPrograms();
  });

  ipcMain.handle("get-program-output", (_, id) => {
    return programManager.getProgramOutput(id);
  });

  ipcMain.handle("open-programs-folder", () => {
    shell.openPath(programManager.programsPath);
  });

  ipcMain.handle("restore-examples", () => {
    return programManager.restoreExamples();
  });
});

app.on("window-all-closed", () => {
  // Clean up all running programs before quitting
  if (programManager) {
    programManager.cleanup();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  // Ensure cleanup happens before app quits
  if (programManager) {
    programManager.cleanup();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
