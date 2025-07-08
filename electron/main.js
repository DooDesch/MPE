const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

let mainWindow
let programManager

class ProgramManager {
  constructor() {
    this.runningPrograms = new Map()
    this.programsPath = path.join(__dirname, '../Programs')
  }

  async scanPrograms() {
    const programs = []
    
    try {
      const items = fs.readdirSync(this.programsPath, { withFileTypes: true })
      
      for (const item of items) {
        if (item.isDirectory()) {
          const programPath = path.join(this.programsPath, item.name)
          const program = await this.analyzeProgram(item.name, programPath)
          if (program) {
            programs.push(program)
          }
        }
      }
    } catch (error) {
      console.error('Fehler beim Scannen der Programme:', error)
    }
    
    return programs
  }

  async analyzeProgram(name, programPath) {
    try {
      // Check for package.json (Node.js)
      const packageJsonPath = path.join(programPath, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
        return {
          name,
          path: programPath,
          type: 'nodejs',
          description: packageJson.description,
          main: packageJson.main
        }
      }

      // Check for Python files
      const pythonFiles = ['server.py', 'main.py', 'app.py', 'run.py']
      for (const fileName of pythonFiles) {
        if (fs.existsSync(path.join(programPath, fileName))) {
          return {
            name,
            path: programPath,
            type: 'python',
            main: fileName
          }
        }
      }
    } catch (error) {
      console.error(`Fehler beim Analysieren von ${name}:`, error)
    }
    
    return null
  }

  async startProgram(program) {
    const id = `${program.name}_${Date.now()}`
    
    let command
    let args
    let cwd = program.path

    if (program.type === 'nodejs') {
      // Check if npm start or npm run dev is available
      const packageJsonPath = path.join(program.path, 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      
      if (packageJson.scripts?.dev) {
        command = 'npm'
        args = ['run', 'dev']
      } else if (packageJson.scripts?.start) {
        command = 'npm'
        args = ['run', 'start']
      } else {
        command = 'node'
        args = [program.main || 'index.js']
      }
    } else {
      command = 'python'
      args = [program.main || 'main.py']
    }

    // Set up environment variables for proper UTF-8 handling
    const env = { ...process.env }
    if (program.type === 'python') {
      env.PYTHONIOENCODING = 'utf-8'
      env.PYTHONLEGACYWINDOWSIOENCODING = '0'
    }

    const childProcess = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true,
      env
    })

    const runningProgram = {
      id,
      name: program.name,
      process: childProcess,
      terminal: []
    }

    // Handle output
    childProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      runningProgram.terminal.push(`[OUT] ${output}`)
      this.sendToRenderer('program-output', { id, output, type: 'stdout' })
    })

    childProcess.stderr?.on('data', (data) => {
      const output = data.toString()
      runningProgram.terminal.push(`[ERR] ${output}`)
      this.sendToRenderer('program-output', { id, output, type: 'stderr' })
    })

    childProcess.on('close', (code) => {
      runningProgram.terminal.push(`[INFO] Programm beendet mit Code: ${code}`)
      this.sendToRenderer('program-closed', { id, code })
      this.runningPrograms.delete(id)
    })

    childProcess.on('error', (error) => {
      runningProgram.terminal.push(`[ERROR] ${error.message}`)
      this.sendToRenderer('program-error', { id, error: error.message })
    })

    this.runningPrograms.set(id, runningProgram)
    return id
  }

  stopProgram(id) {
    const program = this.runningPrograms.get(id)
    if (program) {
      program.process.kill()
      this.runningPrograms.delete(id)
      return true
    }
    return false
  }

  sendInput(id, input) {
    const program = this.runningPrograms.get(id)
    if (program && program.process.stdin) {
      // Add input to terminal log first
      const inputLine = `[INPUT] ${program.name}> ${input}`
      program.terminal.push(inputLine)
      
      // Send input to process
      program.process.stdin.write(input + '\n')
      
      // Notify renderer about the input
      this.sendToRenderer('program-output', { id, output: inputLine, type: 'input' })
      
      return true
    }
    return false
  }

  getRunningPrograms() {
    return Array.from(this.runningPrograms.values()).map(p => ({
      id: p.id,
      name: p.name
    }))
  }

  getProgramOutput(id) {
    const program = this.runningPrograms.get(id)
    return program ? program.terminal : []
  }

  sendToRenderer(channel, data) {
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send(channel, data)
    })
  }
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
      webSecurity: process.env.NODE_ENV !== 'development',
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5176')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    app.quit()
  })
}

app.whenReady().then(() => {
  programManager = new ProgramManager()
  createWindow()

  // IPC Handlers
  ipcMain.handle('scan-programs', () => programManager.scanPrograms())
  
  ipcMain.handle('start-program', async (_, program) => {
    return await programManager.startProgram(program)
  })
  
  ipcMain.handle('stop-program', (_, id) => {
    return programManager.stopProgram(id)
  })
  
  ipcMain.handle('send-input', (_, id, input) => {
    return programManager.sendInput(id, input)
  })
  
  ipcMain.handle('get-running-programs', () => {
    return programManager.getRunningPrograms()
  })
  
  ipcMain.handle('get-program-output', (_, id) => {
    return programManager.getProgramOutput(id)
  })

  ipcMain.handle('open-programs-folder', () => {
    shell.openPath(path.join(__dirname, '../Programs'))
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
