<template>
  <aside class="sidebar">
    <div class="section">
      <h2 class="section-title">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        Verfügbare Programme
      </h2>

      <div class="programs-list">
        <div
          v-for="program in programs"
          :key="program.name"
          class="program-card"
        >
          <div class="program-info">
            <div class="program-header">
              <h3 class="program-name">{{ program.name }}</h3>
              <span class="program-type" :class="program.type">
                {{ program.type === "nodejs" ? "Node.js" : "Python" }}
              </span>
            </div>
            <p v-if="program.description" class="program-description">
              {{ program.description }}
            </p>
            <p v-if="program.main" class="program-main">
              Datei: {{ program.main }}
            </p>
          </div>

          <button
            @click="$emit('start-program', program)"
            class="btn btn-start"
            :disabled="isProgramRunning(program.name)"
          >
            <svg
              v-if="!isProgramRunning(program.name)"
              class="icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a2 2 0 012-2h6a2 2 0 012 2v2M7 14h10v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4z"
              />
            </svg>
            <svg v-else class="icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ isProgramRunning(program.name) ? "Läuft" : "Starten" }}
          </button>
        </div>

        <div v-if="programs.length === 0" class="empty-state">
          <svg
            class="empty-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>Keine Programme gefunden</p>
          <p class="text-small">Füge Programme im Programs-Ordner hinzu</p>
        </div>
      </div>
    </div>

    <div class="section" v-if="runningPrograms.length > 0">
      <h2 class="section-title">
        <svg class="icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Laufende Programme
      </h2>

      <div class="running-programs-list">
        <div
          v-for="program in runningPrograms"
          :key="program.id"
          class="running-program-card"
          :class="{ selected: selectedProgram?.id === program.id }"
          @click="$emit('select-program', program)"
        >
          <div class="running-program-info">
            <h3 class="running-program-name">{{ program.name }}</h3>
            <div class="status-indicator">
              <div class="status-dot"></div>
              <span>Aktiv</span>
            </div>
          </div>

          <button
            @click.stop="$emit('stop-program', program.id)"
            class="btn btn-stop"
            title="Programm stoppen"
          >
            <svg
              class="icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
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

const props = defineProps<{
  programs: Program[];
  runningPrograms: RunningProgram[];
  selectedProgram: RunningProgram | null;
}>();

defineEmits<{
  "start-program": [program: Program];
  "stop-program": [id: string];
  "select-program": [program: RunningProgram];
}>();

const isProgramRunning = (programName: string) => {
  return props.runningPrograms.some(
    (p: RunningProgram) => p.name === programName
  );
};
</script>

<style scoped>
.sidebar {
  width: 400px;
  min-width: 350px;
  background: rgba(255, 255, 255, 0.03);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.section {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.section:last-child {
  border-bottom: none;
  flex: 1;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1rem;
}

.section-title .icon {
  width: 1.25rem;
  height: 1.25rem;
}

.programs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.program-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.2s ease-in-out;
}

.program-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-1px);
}

.program-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.program-name {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.program-type {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.program-type.nodejs {
  background: rgba(104, 200, 85, 0.2);
  color: #68c855;
}

.program-type.python {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.program-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0.5rem 0;
  line-height: 1.4;
}

.program-main {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: "Consolas", "Monaco", monospace;
  margin: 0.5rem 0;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  margin-top: 0.75rem;
  width: 100%;
  justify-content: center;
}

.btn-start {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-start:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.btn-start:disabled {
  background: rgba(16, 185, 129, 0.3);
  cursor: not-allowed;
}

.btn-stop {
  background: rgba(239, 68, 68, 0.8);
  color: white;
  width: auto;
  margin: 0;
  padding: 0.375rem;
  min-width: auto;
}

.btn-stop:hover {
  background: rgba(239, 68, 68, 1);
  transform: scale(1.05);
}

.icon {
  width: 1rem;
  height: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  color: rgba(255, 255, 255, 0.3);
}

.text-small {
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.running-programs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.running-program-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.running-program-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.running-program-card.selected {
  border-color: rgba(139, 92, 246, 0.5);
  background: rgba(139, 92, 246, 0.1);
}

.running-program-info {
  flex: 1;
}

.running-program-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.25rem 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: rgba(16, 185, 129, 0.8);
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
