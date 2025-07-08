<template>
  <div class="terminal-area">
    <div class="terminal-header">
      <div class="terminal-title">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <span v-if="selectedProgram"
          >{{ selectedProgram.name }} - Terminal</span
        >
        <span v-else>Terminal</span>
      </div>

      <div class="terminal-controls" v-if="selectedProgram">
        <button
          @click="clearTerminal"
          class="btn btn-clear"
          title="Terminal leeren"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="terminal-content" ref="terminalContent">
      <div v-if="!selectedProgram" class="empty-terminal">
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
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <h3>Kein Programm ausgewählt</h3>
        <p>
          Wähle ein laufendes Programm aus der Seitenleiste aus, um dessen
          Terminal-Ausgabe zu sehen.
        </p>
      </div>

      <div v-else class="terminal-output">
        <div
          v-for="(line, index) in displayOutput"
          :key="index"
          class="terminal-line"
          :class="getLineClass(line)"
        >
          <span class="line-prefix">{{ getLinePrefix(line) }}</span>
          <span class="line-content">{{ getLineContent(line) }}</span>
        </div>
      </div>
    </div>

    <div v-if="selectedProgram" class="terminal-input">
      <div class="input-container">
        <span class="input-prompt">{{ selectedProgram.name }}></span>
        <input
          ref="inputField"
          v-model="currentInput"
          @keydown.enter="sendInput"
          @keydown.up="navigateHistory(-1)"
          @keydown.down="navigateHistory(1)"
          type="text"
          placeholder="Eingabe hier..."
          class="input-field"
        />
        <button
          @click="sendInput"
          class="btn btn-send"
          :disabled="!currentInput.trim()"
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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";

interface RunningProgram {
  id: string;
  name: string;
}

const props = defineProps<{
  selectedProgram: RunningProgram | null;
  output: string[];
}>();

const emit = defineEmits<{
  "send-input": [input: string];
}>();

const currentInput = ref("");
const inputHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const terminalContent = ref<HTMLElement>();
const inputField = ref<HTMLInputElement>();

const displayOutput = computed(() => {
  return props.output || [];
});

const getLineClass = (line: string) => {
  if (line.startsWith("[ERROR]") || line.startsWith("[ERR]")) {
    return "error";
  } else if (line.startsWith("[INFO]")) {
    return "info";
  } else if (line.startsWith("[INPUT]")) {
    return "input";
  } else if (line.startsWith("[OUT]")) {
    return "output";
  }
  return "default";
};

const getLinePrefix = (line: string) => {
  const match = line.match(/^\[([^\]]+)\]/);
  return match ? match[1] : ">";
};

const getLineContent = (line: string) => {
  return line.replace(/^\[[^\]]+\]\s*/, "");
};

const sendInput = () => {
  const input = currentInput.value.trim();
  if (input) {
    emit("send-input", input);
    inputHistory.value.unshift(input);
    if (inputHistory.value.length > 50) {
      inputHistory.value = inputHistory.value.slice(0, 50);
    }
    currentInput.value = "";
    historyIndex.value = -1;
  }
};

const navigateHistory = (direction: number) => {
  const newIndex = historyIndex.value + direction;
  if (newIndex >= -1 && newIndex < inputHistory.value.length) {
    historyIndex.value = newIndex;
    if (newIndex === -1) {
      currentInput.value = "";
    } else {
      currentInput.value = inputHistory.value[newIndex];
    }
  }
};

const clearTerminal = () => {
  // This would need to be handled by the parent component
  // For now, we just clear the local display
};

// Auto-scroll to bottom when new output arrives
watch(
  () => props.output,
  async () => {
    await nextTick();
    if (terminalContent.value) {
      terminalContent.value.scrollTop = terminalContent.value.scrollHeight;
    }
  },
  { deep: true }
);

// Focus input when program is selected
watch(
  () => props.selectedProgram,
  async () => {
    await nextTick();
    if (props.selectedProgram && inputField.value) {
      inputField.value.focus();
    }
  }
);
</script>

<style scoped>
.terminal-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  overflow: hidden;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.terminal-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #00ff00;
  font-family: "Consolas", "Monaco", monospace;
}

.terminal-title .icon {
  width: 1.25rem;
  height: 1.25rem;
}

.terminal-controls {
  display: flex;
  gap: 0.5rem;
}

.btn-clear {
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.btn-clear:hover {
  background: rgba(239, 68, 68, 0.3);
  transform: scale(1.05);
}

.terminal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  background: #0a0a0a;
}

.empty-terminal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.3);
}

.empty-terminal h3 {
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
}

.terminal-output {
  min-height: 100%;
}

.terminal-line {
  display: flex;
  margin-bottom: 0.25rem;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.line-prefix {
  color: rgba(255, 255, 255, 0.6);
  margin-right: 0.5rem;
  font-weight: 600;
  min-width: 4rem;
  flex-shrink: 0;
}

.line-content {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-all;
}

.terminal-line.error .line-prefix {
  color: #ef4444;
}

.terminal-line.error .line-content {
  color: #fca5a5;
}

.terminal-line.info .line-prefix {
  color: #3b82f6;
}

.terminal-line.info .line-content {
  color: #93c5fd;
}

.terminal-line.input .line-prefix {
  color: #10b981;
}

.terminal-line.input .line-content {
  color: #6ee7b7;
}

.terminal-line.output .line-content {
  color: #e5e7eb;
}

.terminal-line.default .line-content {
  color: #d1d5db;
}

.terminal-input {
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.input-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.input-prompt {
  color: #00ff00;
  font-family: "Consolas", "Monaco", monospace;
  font-weight: 600;
  white-space: nowrap;
}

.input-field {
  flex: 1;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 0.875rem;
}

.input-field:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.btn-send {
  padding: 0.75rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  border: none;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.btn-send:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn .icon {
  width: 1rem;
  height: 1rem;
}
</style>
