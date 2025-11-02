import { app, BrowserWindow, ipcMain, shell } from "electron";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as http from "http";
import * as url from "url";
import { UpdateService } from "./updateService";

// Simple MIME type lookup
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    ".html": "text/html",
    ".htm": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
  };
  return mimeTypes[ext] || "text/plain";
}

// Get configured port for HTML project
function getConfiguredPort(projectPath: string, projectName: string): number {
  // Try to read server.json first
  const serverJsonPath = path.join(projectPath, "server.json");
  if (fs.existsSync(serverJsonPath)) {
    try {
      const serverConfig = JSON.parse(fs.readFileSync(serverJsonPath, "utf8"));
      if (serverConfig.port && typeof serverConfig.port === "number") {
        console.log(
          `Found port ${serverConfig.port} in server.json for ${projectName}`
        );
        return serverConfig.port;
      }
    } catch (error) {
      console.warn(`Error reading server.json for ${projectName}:`, error);
    }
  }

  // Try to read package.json
  const packageJsonPath = path.join(projectPath, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      if (
        packageJson.server?.port &&
        typeof packageJson.server.port === "number"
      ) {
        console.log(
          `Found port ${packageJson.server.port} in package.json for ${projectName}`
        );
        return packageJson.server.port;
      }
    } catch (error) {
      console.warn(`Error reading package.json for ${projectName}:`, error);
    }
  }

  // Generate consistent port based on project name hash (8000-8999 range)
  let hash = 0;
  for (let i = 0; i < projectName.length; i++) {
    const char = projectName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const port = 8000 + (Math.abs(hash) % 1000);
  console.log(`Generated consistent port ${port} for ${projectName}`);
  return port;
}

// Simple HTTP server for static HTML files
function createStaticServer(
  rootPath: string,
  port: number = 0
): Promise<{ server: http.Server; port: number; url: string }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let pathname = url.parse(req.url || "").pathname || "/";

      // Default to index.html for root requests
      if (pathname === "/") {
        pathname = "/index.html";
      }

      const filePath = path.join(rootPath, pathname);

      // Security check - prevent directory traversal
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(path.normalize(rootPath))) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      // Check if file exists
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not Found");
          return;
        }

        const mimeType = getMimeType(filePath);
        res.writeHead(200, { "Content-Type": mimeType });
        res.end(data);
      });
    });

    server.listen(port, "localhost", (err?: any) => {
      if (err) {
        reject(err);
      } else {
        const actualPort = (server.address() as any)?.port || port;
        resolve({
          server,
          port: actualPort,
          url: `http://localhost:${actualPort}`,
        });
      }
    });
  });
}

interface Program {
  name: string;
  path: string;
  type: "nodejs" | "python" | "html";
  description?: string;
  main?: string;
  port?: number;
}

interface RunningProgram {
  id: string;
  name: string;
  process?: ChildProcess;
  terminal: string[];
  type?: "nodejs" | "python" | "html";
  server?: any;
  url?: string;
}

class ProgramManager {
  private runningPrograms: Map<string, RunningProgram> = new Map();
  private programsPath: string;

  constructor() {
    // In production, use userData directory; in development, use local Programs folder
    if (app.isPackaged) {
      this.programsPath = path.join(app.getPath("userData"), "Programs");
    } else {
      this.programsPath = path.join(__dirname, "../../Programs");
    }

    // Ensure Programs directory exists
    this.ensureProgramsDirectory();
  }

  private ensureProgramsDirectory() {
    try {
      if (!fs.existsSync(this.programsPath)) {
        fs.mkdirSync(this.programsPath, { recursive: true });
        console.log(`Created Programs directory at: ${this.programsPath}`);

        // Copy example programs from app resources if they exist
        this.copyExamplePrograms();
      }
    } catch (error) {
      console.error("Error creating Programs directory:", error);
    }
  }

  private copyExamplePrograms() {
    try {
      // In packaged app, example programs are in resources/Programs-Examples
      const examplesPath = app.isPackaged
        ? path.join(process.resourcesPath, "Programs-Examples")
        : path.join(__dirname, "../../Programs");

      if (fs.existsSync(examplesPath)) {
        const items = fs.readdirSync(examplesPath, { withFileTypes: true });

        for (const item of items) {
          if (item.isDirectory() && !item.name.startsWith(".")) {
            const sourcePath = path.join(examplesPath, item.name);
            const targetPath = path.join(this.programsPath, item.name);

            if (!fs.existsSync(targetPath)) {
              this.copyDirectory(sourcePath, targetPath);
              console.log(`Copied example program: ${item.name}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error copying example programs:", error);
    }
  }

  private copyDirectory(src: string, dest: string) {
    try {
      fs.mkdirSync(dest, { recursive: true });
      const items = fs.readdirSync(src, { withFileTypes: true });

      for (const item of items) {
        const srcPath = path.join(src, item.name);
        const destPath = path.join(dest, item.name);

        if (item.isDirectory()) {
          this.copyDirectory(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    } catch (error) {
      console.error(`Error copying directory ${src} to ${dest}:`, error);
    }
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
    console.log(`Analyzing program: ${name} at ${programPath}`);
    try {
      // Check for package.json (Node.js)
      const packageJsonPath = path.join(programPath, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        console.log(`Found Node.js project: ${name}`);
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
          console.log(`Found Python project: ${name}`);
          return {
            name,
            path: programPath,
            type: "python",
            main: fileName,
          };
        }
      }

      // Check for HTML files
      console.log(`Checking for HTML files in: ${name}`);
      const htmlFiles = ["index.html", "index.htm"];
      for (const fileName of htmlFiles) {
        const htmlFilePath = path.join(programPath, fileName);
        console.log(`Checking: ${htmlFilePath}`);
        if (fs.existsSync(htmlFilePath)) {
          console.log(`Found HTML project: ${name} with file ${fileName}`);
          const port = getConfiguredPort(programPath, name);
          return {
            name,
            path: programPath,
            type: "html",
            main: fileName,
            port: port,
          };
        }
      }

      console.log(`No recognized project type found for: ${name}`);
    } catch (error) {
      console.error(`Fehler beim Analysieren von ${name}:`, error);
    }

    return null;
  }

  async startProgram(program: Program): Promise<string> {
    const id = `${program.name}_${Date.now()}`;

    // Handle HTML projects differently - they need a static server
    if (program.type === "html") {
      try {
        const port =
          program.port || getConfiguredPort(program.path, program.name);
        const serverInfo = await createStaticServer(program.path, port);

        const runningProgram: RunningProgram = {
          id,
          name: program.name,
          server: serverInfo.server,
          url: serverInfo.url,
          terminal: [
            `[INFO] Static server started at ${serverInfo.url} (configured port: ${port})`,
          ],
          type: "html",
        };

        // Automatically open in browser
        shell.openExternal(serverInfo.url);

        this.sendToRenderer("program-output", {
          id,
          output: `Static server started at ${serverInfo.url} (port: ${port})\nOpening in browser...\n`,
          type: "stdout",
        });

        this.runningPrograms.set(id, runningProgram);
        return id;
      } catch (error: any) {
        this.sendToRenderer("program-error", {
          id,
          error: `Failed to start server: ${error.message}`,
        });
        throw error;
      }
    }

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
      // Handle HTML server differently
      if (program.type === "html" && program.server) {
        program.server.close();
        this.sendToRenderer("program-output", {
          id,
          output: `[INFO] Static server stopped\n`,
          type: "stdout",
        });
      } else if (program.process) {
        program.process.kill();
      }
      this.runningPrograms.delete(id);
      return true;
    }
    return false;
  }

  sendInput(id: string, input: string): boolean {
    const program = this.runningPrograms.get(id);

    // HTML servers don't accept input
    if (program && program.type === "html") {
      this.sendToRenderer("program-output", {
        id,
        output: `[INFO] HTML server does not accept input. Server is running at ${program.url}\n`,
        type: "info",
      });
      return false;
    }

    if (program && program.process && program.process.stdin) {
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

  getProgramsPath(): string {
    return this.programsPath;
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
    mainWindow.loadURL("http://localhost:5176");
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

  // Initialize update service
  const updateService = new UpdateService();

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
    shell.openPath(programManager.getProgramsPath());
  });

  // Update Handlers
  ipcMain.handle("check-for-updates", async () => {
    return await updateService.checkForUpdates();
  });

  ipcMain.handle("download-update", async (_, downloadUrl: string) => {
    return await updateService.downloadAndInstall(downloadUrl);
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
