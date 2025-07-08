<template>
  <header class="header">
    <div class="header-left">
      <div class="logo">
        <h1 class="title">
          <span class="gradient-text">xAkiitoh</span>
          <span class="subtitle">Program Executor</span>
        </h1>
      </div>
    </div>

    <div class="header-right">
      <button
        @click="$emit('refresh')"
        class="btn btn-secondary"
        :disabled="loading"
        :class="{ pulse: loading }"
        title="Programme neu laden"
      >
        <svg
          v-if="!loading"
          class="icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <svg
          v-else
          class="icon spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>Aktualisieren</span>
      </button>

      <button
        @click="$emit('open-folder')"
        class="btn btn-primary"
        title="Programme-Ordner öffnen"
      >
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <span>Programme Ordner</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean;
}>();

defineEmits<{
  refresh: [];
  "open-folder": [];
}>();
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
}

.title {
  display: flex;
  flex-direction: column;
  line-height: 1;
  margin: 0;
}

.gradient-text {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
  margin-top: -2px;
}

.header-right {
  display: flex;
  gap: 0.75rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  backdrop-filter: blur(10px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
