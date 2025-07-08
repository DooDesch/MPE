<template>
  <footer class="status-bar">
    <div class="status-left">
      <div class="status-item">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <span>{{ totalCount }} Programme verfügbar</span>
      </div>

      <div class="status-separator"></div>

      <div class="status-item" :class="{ active: runningCount > 0 }">
        <svg class="icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>{{ runningCount }} aktiv</span>
        <div v-if="runningCount > 0" class="status-dot"></div>
      </div>
    </div>

    <div class="status-right">
      <div class="status-item">
        <span class="status-time">{{ currentTime }}</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

defineProps<{
  runningCount: number;
  totalCount: number;
}>();

const currentTime = ref("");
let timeInterval: NodeJS.Timeout | null = null;

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-right {
  display: flex;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.status-item.active {
  color: #10b981;
}

.status-separator {
  width: 1px;
  height: 1rem;
  background: rgba(255, 255, 255, 0.2);
}

.icon {
  width: 1rem;
  height: 1rem;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
  margin-left: 0.25rem;
}

.status-time {
  font-family: "Consolas", "Monaco", monospace;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
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
