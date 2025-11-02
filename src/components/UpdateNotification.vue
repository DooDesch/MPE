<template>
  <Transition name="slide-down">
    <div v-if="show && updateInfo" class="update-notification">
      <div class="notification-content">
        <div class="notification-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
        </div>

        <div class="notification-text">
          <span class="update-title">
            {{
              isDownloading
                ? "Update wird heruntergeladen..."
                : "Update verfügbar"
            }}
          </span>
          <span class="update-details" v-if="!isDownloading">
            Version {{ updateInfo.latestVersion }} ist verfügbar
            <span class="current-version"
              >(aktuell: {{ updateInfo.currentVersion }})</span
            >
          </span>
          <div v-if="isDownloading" class="download-progress">
            <div class="progress-info">
              <span class="progress-text"
                >{{ downloadProgress.downloadedFormatted }} /
                {{ downloadProgress.totalFormatted }}</span
              >
              <span class="progress-percentage"
                >{{ downloadProgress.progress }}%</span
              >
            </div>
            <div class="progress-bar-container">
              <div
                class="progress-bar"
                :style="{ width: downloadProgress.progress + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="notification-actions">
          <button @click="dismissUpdate" class="btn btn-secondary">
            Später
          </button>
          <button
            @click="installUpdate"
            class="btn btn-primary"
            :disabled="isInstalling"
          >
            <span v-if="!isInstalling">Installieren</span>
            <span v-else class="installing-text">
              <svg class="spinner" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-dasharray="31.416"
                  stroke-dashoffset="31.416"
                >
                  <animate
                    attributeName="stroke-dasharray"
                    dur="2s"
                    values="0 31.416;15.708 15.708;0 31.416"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-dashoffset"
                    dur="2s"
                    values="0;-15.708;-31.416"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
              Wird heruntergeladen...
            </span>
          </button>
        </div>

        <button @click="dismissUpdate" class="close-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-3 h-3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  downloadUrl?: string;
  releaseNotes?: string;
}

const show = ref(false);
const updateInfo = ref<UpdateInfo | null>(null);
const isInstalling = ref(false);
const isDownloading = ref(false);
const downloadProgress = ref({
  progress: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  downloadedFormatted: "0 MB",
  totalFormatted: "0 MB",
});

onMounted(async () => {
  await checkForUpdates();

  // Listen for download progress updates
  window.electronAPI.onDownloadProgress((progress) => {
    downloadProgress.value = progress;
  });
});

async function checkForUpdates() {
  try {
    const result = await window.electronAPI.checkForUpdates();
    if (result.hasUpdate) {
      updateInfo.value = result;
      show.value = true;
    }
  } catch (error) {
    console.error("Failed to check for updates:", error);
  }
}

function dismissUpdate() {
  show.value = false;
}

async function installUpdate() {
  if (!updateInfo.value?.downloadUrl) return;

  try {
    isDownloading.value = true;
    isInstalling.value = false; // Reset installing state

    // Reset progress
    downloadProgress.value = {
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      downloadedFormatted: "0 MB",
      totalFormatted: "0 MB",
    };

    await window.electronAPI.downloadUpdate(updateInfo.value.downloadUrl);
    // App will close automatically after successful download
  } catch (error) {
    console.error("Failed to install update:", error);
    isDownloading.value = false;
    isInstalling.value = false;
  } finally {
    isInstalling.value = false;
  }
}
</script>

<style scoped>
.update-notification {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #007acc 0%, #005a9e 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  max-width: 100%;
  position: relative;
}

.notification-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  opacity: 0.9;
}

.notification-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.update-title {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
}

.update-details {
  font-size: 11px;
  opacity: 0.85;
  line-height: 1.2;
}

.current-version {
  opacity: 0.7;
}

.notification-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn {
  padding: 4px 12px;
  border: none;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  justify-content: center;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-primary {
  background: rgba(255, 255, 255, 0.9);
  color: #007acc;
  border: 1px solid transparent;
}

.btn-primary:hover:not(:disabled) {
  background: white;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.installing-text {
  display: flex;
  align-items: center;
  gap: 6px;
}

.spinner {
  width: 12px;
  height: 12px;
}

.close-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 2px;
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.close-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

/* Responsive design */
@media (max-width: 768px) {
  .notification-content {
    flex-wrap: wrap;
    gap: 8px;
  }

  .notification-text {
    order: 1;
    flex-basis: 100%;
  }

  .notification-actions {
    order: 2;
    margin-left: auto;
  }
}

/* Transition animations */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* Progress Bar Styles */
.download-progress {
  margin-top: 4px;
  width: 100%;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.progress-text {
  color: rgba(255, 255, 255, 0.8);
}

.progress-percentage {
  color: white;
  font-weight: 600;
}

.progress-bar-container {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ffffff 0%, #e0f2fe 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

/* Animated progress bar glow */
@keyframes progressGlow {
  0% {
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.6);
  }
  100% {
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  }
}

.progress-bar {
  animation: progressGlow 2s infinite;
}
</style>
