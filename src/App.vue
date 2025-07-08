<template>
  <div class="app">
    <Header
      @refresh="refreshPrograms"
      @open-folder="openProgramsFolder"
      @restore-examples="restoreExamples"
      :loading="loading"
    />

    <div class="main-content">
      <Sidebar
        :programs="programs"
        :running-programs="runningPrograms"
        @start-program="startProgram"
        @stop-program="stopProgram"
        @select-program="selectProgram"
        :selected-program="selectedProgram"
      />

      <TerminalArea
        :selected-program="selectedProgram"
        :output="programOutput"
        @send-input="sendInput"
        @clear-terminal="clearTerminal"
      />
    </div>

    <StatusBar
      :running-count="runningPrograms.length"
      :total-count="programs.length"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Header from "./components/Header.vue";
import Sidebar from "./components/Sidebar.vue";
import TerminalArea from "./components/TerminalArea.vue";
import StatusBar from "./components/StatusBar.vue";

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
}

interface ProgramOutput {
  id: string;
  output: string;
  type: "stdout" | "stderr" | "input";
}

const programs = ref<Program[]>([]);
const runningPrograms = ref<RunningProgram[]>([]);
const selectedProgram = ref<RunningProgram | null>(null);
const programOutput = ref<string[]>([]);
const loading = ref(false);

const refreshPrograms = async () => {
  loading.value = true;
  try {
    programs.value = await window.electronAPI.scanPrograms();
    runningPrograms.value = await window.electronAPI.getRunningPrograms();
  } catch (error) {
    console.error("Fehler beim Laden der Programme:", error);
  } finally {
    loading.value = false;
  }
};

const startProgram = async (program: Program) => {
  try {
    // Create a clean object to avoid cloning issues
    const cleanProgram = {
      name: program.name,
      path: program.path,
      type: program.type,
      description: program.description,
      main: program.main,
    };

    const id = await window.electronAPI.startProgram(cleanProgram);
    await refreshPrograms();

    // Automatically select the newly started program
    const newProgram = runningPrograms.value.find(
      (p: RunningProgram) => p.id === id
    );
    if (newProgram) {
      selectProgram(newProgram);
    }
  } catch (error) {
    console.error("Fehler beim Starten des Programms:", error);
  }
};

const stopProgram = async (id: string) => {
  const programToStop = runningPrograms.value.find(
    (p: RunningProgram) => p.id === id
  );
  const programName = programToStop?.name || "Unbekanntes Programm";

  try {
    console.log(`Stopping program: ${programName} (ID: ${id})`);
    const result = await window.electronAPI.stopProgram(id);

    if (result) {
      console.log(`Program ${programName} stopped successfully`);

      // Add stop message to output if this program is selected
      if (selectedProgram.value?.id === id) {
        programOutput.value.push(
          `[INFO] Programm "${programName}" wurde beendet`
        );
      }
    } else {
      console.warn(`Failed to stop program: ${programName}`);
    }

    await refreshPrograms();

    // Clear selection if the stopped program was selected
    if (selectedProgram.value?.id === id) {
      selectedProgram.value = null;
      programOutput.value = [];
    }
  } catch (error) {
    console.error("Fehler beim Stoppen des Programms:", error);
    alert(`Fehler beim Stoppen von "${programName}": ${error}`);
  }
};

const selectProgram = async (program: RunningProgram) => {
  selectedProgram.value = program;
  try {
    programOutput.value = await window.electronAPI.getProgramOutput(program.id);
  } catch (error) {
    console.error("Fehler beim Laden der Ausgabe:", error);
  }
};

const sendInput = async (input: string) => {
  if (selectedProgram.value) {
    try {
      await window.electronAPI.sendInput(selectedProgram.value.id, input);
    } catch (error) {
      console.error("Fehler beim Senden der Eingabe:", error);
    }
  }
};

const clearTerminal = () => {
  programOutput.value = [];
};

const openProgramsFolder = async () => {
  try {
    await window.electronAPI.openProgramsFolder();
  } catch (error) {
    console.error("Fehler beim Öffnen des Ordners:", error);
  }
};

const restoreExamples = async () => {
  try {
    const success = await window.electronAPI.restoreExamples();
    if (success) {
      alert("Beispielprogramme wurden erfolgreich wiederhergestellt!");
      await refreshPrograms();
    } else {
      alert("Keine Beispielprogramme zum Wiederherstellen gefunden.");
    }
  } catch (error) {
    console.error("Fehler beim Wiederherstellen der Beispiele:", error);
    alert("Fehler beim Wiederherstellen der Beispielprogramme.");
  }
};

// Event listeners
const handleProgramOutput = (data: ProgramOutput) => {
  if (selectedProgram.value?.id === data.id) {
    // For input type, the output is already formatted by the backend
    if (data.type === "input") {
      programOutput.value.push(data.output);
    } else {
      programOutput.value.push(`[${data.type.toUpperCase()}] ${data.output}`);
    }
  }
};

const handleProgramClosed = (data: { id: string; code: number }) => {
  if (selectedProgram.value?.id === data.id) {
    programOutput.value.push(`[INFO] Programm beendet mit Code: ${data.code}`);
  }
  refreshPrograms();
};

const handleProgramError = (data: { id: string; error: string }) => {
  if (selectedProgram.value?.id === data.id) {
    programOutput.value.push(`[ERROR] ${data.error}`);
  }
};

onMounted(async () => {
  await refreshPrograms();

  // Set up event listeners
  window.electronAPI.onProgramOutput(handleProgramOutput);
  window.electronAPI.onProgramClosed(handleProgramClosed);
  window.electronAPI.onProgramError(handleProgramError);
});

onUnmounted(() => {
  // Clean up event listeners
  window.electronAPI.removeAllListeners("program-output");
  window.electronAPI.removeAllListeners("program-closed");
  window.electronAPI.removeAllListeners("program-error");
});
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3a 100%);
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
