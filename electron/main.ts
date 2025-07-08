import { app, BrowserWindow, ipcMain, shell } from "electron";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";

interface Program {
  name: string;
  path: string;
  type: "nodejs" | "python";
  description?: string;
  main?: string;
}

interface RunningProgram {
  id: string;
  name: string;
  process: ChildProcess;
  terminal: string[];
}

class ProgramManager {
  private runningPrograms: Map<string, RunningProgram> = new Map();
  private programsPath: string;

  constructor() {
    this.programsPath = path.join(__dirname, "../../Programs");
  }

  async scanPrograms(): Promise<Program[]> {
    const programs: Program[] = [];

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

  private async analyzeProgram(
    name: string,
    programPath: string
  ): Promise<Program | null> {
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

  async startProgram(program: Program): Promise<string> {
    const id = `${program.name}_${Date.now()}`;

    let command: string;
    let args: string[];
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
      command = "python";
      args = [program.main || "main.py"];
    }

    const childProcess = spawn(command, args, {
      cwd,
      stdio: "pipe",
      shell: true,
    });

    const runningProgram: RunningProgram = {
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

  stopProgram(id: string): boolean {
    const program = this.runningPrograms.get(id);
    if (program) {
      program.process.kill();
      this.runningPrograms.delete(id);
      return true;
    }
    return false;
  }

  sendInput(id: string, input: string): boolean {
    const program = this.runningPrograms.get(id);
    if (program && program.process.stdin) {
      program.process.stdin.write(input + "\n");
      program.terminal.push(`[INPUT] ${input}`);
      return true;
    }
    return false;
  }

  getRunningPrograms(): { id: string; name: string }[] {
    return Array.from(this.runningPrograms.values()).map((p) => ({
      id: p.id,
      name: p.name,
    }));
  }

  getProgramOutput(id: string): string[] {
    const program = this.runningPrograms.get(id);
    return program ? program.terminal : [];
  }

  private sendToRenderer(channel: string, data: any) {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(channel, data);
    });
  }
}

let mainWindow: BrowserWindow;
let programManager: ProgramManager;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    titleBarStyle: "default",
    icon: path.join(__dirname, "../../assets/icon.png"),
    show: false,
  });

  // Load the app
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    app.quit();
  });
}

app.whenReady().then(() => {
  programManager = new ProgramManager();
  createWindow();

  // IPC Handlers
  ipcMain.handle("scan-programs", () => programManager.scanPrograms());

  ipcMain.handle("start-program", async (_, program: Program) => {
    return await programManager.startProgram(program);
  });

  ipcMain.handle("stop-program", (_, id: string) => {
    return programManager.stopProgram(id);
  });

  ipcMain.handle("send-input", (_, id: string, input: string) => {
    return programManager.sendInput(id, input);
  });

  ipcMain.handle("get-running-programs", () => {
    return programManager.getRunningPrograms();
  });

  ipcMain.handle("get-program-output", (_, id: string) => {
    return programManager.getProgramOutput(id);
  });

  ipcMain.handle("open-programs-folder", () => {
    shell.openPath(path.join(__dirname, "../../Programs"));
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
