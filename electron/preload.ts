import { contextBridge, ipcRenderer } from "electron";

export interface Program {
  name: string;
  path: string;
  type: "nodejs" | "python" | "html";
  description?: string;
  main?: string;
  port?: number;
}

export interface RunningProgram {
  id: string;
  name: string;
}

export interface ProgramOutput {
  id: string;
  output: string;
  type: "stdout" | "stderr";
}

const electronAPI = {
  // Program management
  scanPrograms: (): Promise<Program[]> => ipcRenderer.invoke("scan-programs"),
  startProgram: (program: Program): Promise<string> =>
    ipcRenderer.invoke("start-program", program),
  stopProgram: (id: string): Promise<boolean> =>
    ipcRenderer.invoke("stop-program", id),
  sendInput: (id: string, input: string): Promise<boolean> =>
    ipcRenderer.invoke("send-input", id, input),
  getRunningPrograms: (): Promise<RunningProgram[]> =>
    ipcRenderer.invoke("get-running-programs"),
  getProgramOutput: (id: string): Promise<string[]> =>
    ipcRenderer.invoke("get-program-output", id),

  // System
  openProgramsFolder: (): Promise<void> =>
    ipcRenderer.invoke("open-programs-folder"),

  // Event listeners
  onProgramOutput: (callback: (data: ProgramOutput) => void) => {
    ipcRenderer.on("program-output", (_, data) => callback(data));
  },
  onProgramClosed: (callback: (data: { id: string; code: number }) => void) => {
    ipcRenderer.on("program-closed", (_, data) => callback(data));
  },
  onProgramError: (callback: (data: { id: string; error: string }) => void) => {
    ipcRenderer.on("program-error", (_, data) => callback(data));
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

export type ElectronAPI = typeof electronAPI;
