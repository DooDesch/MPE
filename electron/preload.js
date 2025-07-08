const { contextBridge, ipcRenderer } = require('electron')

const electronAPI = {
  // Program management
  scanPrograms: () => ipcRenderer.invoke('scan-programs'),
  startProgram: (program) => ipcRenderer.invoke('start-program', program),
  stopProgram: (id) => ipcRenderer.invoke('stop-program', id),
  sendInput: (id, input) => ipcRenderer.invoke('send-input', id, input),
  getRunningPrograms: () => ipcRenderer.invoke('get-running-programs'),
  getProgramOutput: (id) => ipcRenderer.invoke('get-program-output', id),
  
  // System
  openProgramsFolder: () => ipcRenderer.invoke('open-programs-folder'),
  
  // Event listeners
  onProgramOutput: (callback) => {
    ipcRenderer.on('program-output', (_, data) => callback(data))
  },
  onProgramClosed: (callback) => {
    ipcRenderer.on('program-closed', (_, data) => callback(data))
  },
  onProgramError: (callback) => {
    ipcRenderer.on('program-error', (_, data) => callback(data))
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
