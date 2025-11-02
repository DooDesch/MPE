import { shell, app, BrowserWindow } from "electron";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as https from "https";

interface GitHubRelease {
  tag_name: string;
  name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
  published_at: string;
}

export class UpdateService {
  private readonly REPO_OWNER = "DooDesch";
  private readonly REPO_NAME = "MPE";
  private readonly GITHUB_API_URL = `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/releases/latest`;
  private readonly DEBUG_MODE = process.env.NODE_ENV === "development"; // Mock-Updates im Dev-Modus

  // Kein Token nötig für public Repository

  async checkForUpdates(): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion?: string;
    downloadUrl?: string;
    releaseNotes?: string;
  }> {
    try {
      // Für Testing: Simuliere immer alte Version, damit Updates verfügbar sind
      const currentVersion = this.DEBUG_MODE ? "1.0.0" : app.getVersion();
      console.log(`[UpdateService] 🔍 Checking for updates...`);
      console.log(
        `[UpdateService] 📦 Current app version: ${currentVersion}${
          this.DEBUG_MODE ? " (DEBUG: Simulated old version)" : ""
        }`
      );
      console.log(`[UpdateService] 🌐 GitHub API URL: ${this.GITHUB_API_URL}`);

      // Prepare headers for public repository
      const headers: Record<string, string> = {
        "User-Agent": "xAkiitoh-Program-Executor",
        Accept: "application/vnd.github.v3+json",
      };

      const response = await fetch(this.GITHUB_API_URL, { headers });
      console.log(
        `[UpdateService] 📡 API Response status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        console.error(
          `[UpdateService] ❌ Failed to fetch latest release: ${response.status} ${response.statusText}`
        );

        // Debug-Fallback bei API-Fehler
        if (this.DEBUG_MODE) {
          console.log(
            `[UpdateService] 🧪 DEBUG FALLBACK: API error (${response.status}), simulating update for testing`
          );
          return {
            hasUpdate: true,
            currentVersion,
            latestVersion: "1.2.2",
            downloadUrl: "https://github.com/DooDesch/MPE/releases/latest",
            releaseNotes:
              "🧪 Debug Fallback Update - Test nach API-Fehler (404)",
          };
        }

        return { hasUpdate: false, currentVersion };
      }

      const release = (await response.json()) as GitHubRelease;
      const latestVersion = release.tag_name.replace(/^v/, ""); // Remove 'v' prefix if present

      console.log(`[UpdateService] 🆕 Latest version found: ${latestVersion}`);
      console.log(`[UpdateService] 🔄 Release name: ${release.name}`);
      console.log(`[UpdateService] 📅 Published at: ${release.published_at}`);

      const versionComparison = this.compareVersions(
        currentVersion,
        latestVersion
      );
      const hasUpdate = versionComparison < 0;

      console.log(
        `[UpdateService] 🔢 Version comparison result: ${versionComparison} (${currentVersion} vs ${latestVersion})`
      );
      console.log(
        `[UpdateService] ${
          hasUpdate ? "✅ UPDATE AVAILABLE!" : "❌ No update needed"
        }`
      );

      if (hasUpdate) {
        console.log(
          `[UpdateService] 🔍 Looking for Windows installer asset...`
        );
        console.log(
          `[UpdateService] 📄 Available assets: ${release.assets
            .map((a) => a.name)
            .join(", ")}`
        );

        // Find Windows installer asset
        const windowsAsset = release.assets.find(
          (asset) =>
            asset.name.toLowerCase().includes(".exe") &&
            asset.name.toLowerCase().includes("setup")
        );

        if (windowsAsset) {
          console.log(
            `[UpdateService] 💾 Found installer: ${windowsAsset.name}`
          );
          console.log(
            `[UpdateService] 🔗 Download URL: ${windowsAsset.browser_download_url}`
          );
        } else {
          console.warn(
            `[UpdateService] ⚠️ No Windows installer found in assets!`
          );
        }

        const result = {
          hasUpdate: true,
          currentVersion,
          latestVersion,
          downloadUrl: windowsAsset?.browser_download_url,
          releaseNotes: release.name,
        };

        console.log(`[UpdateService] 📤 Returning update info:`, result);
        return result;
      }

      console.log(`[UpdateService] 📤 No update needed, returning false`);
      return { hasUpdate: false, currentVersion };
    } catch (error) {
      console.error(`[UpdateService] 💥 Error checking for updates:`, error);
      const currentVersion = this.DEBUG_MODE ? "1.0.0" : app.getVersion();
      return { hasUpdate: false, currentVersion };
    }
  }

  async downloadAndInstall(downloadUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(
          `[UpdateService] 📥 Starting direct download from: ${downloadUrl}`
        );

        // Create temp directory for download
        const tempDir = path.join(os.tmpdir(), "xakiitoh-updates");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generate proper filename
        const fileName = this.generateFileName(downloadUrl);
        const filePath = path.join(tempDir, fileName);

        console.log(`[UpdateService] 💾 Downloading to: ${filePath}`);

        // Start download
        const file = fs.createWriteStream(filePath);
        let downloadedBytes = 0;
        let totalBytes = 0;

        const request = https.get(downloadUrl, (response) => {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            console.log(
              `[UpdateService] 🔄 Following redirect to: ${response.headers.location}`
            );
            return this.downloadAndInstall(response.headers.location as string)
              .then(resolve)
              .catch(reject);
          }

          if (response.statusCode !== 200) {
            reject(
              new Error(
                `Download failed: ${response.statusCode} ${response.statusMessage}`
              )
            );
            return;
          }

          totalBytes = parseInt(response.headers["content-length"] || "0", 10);
          console.log(
            `[UpdateService] 📊 Total file size: ${this.formatBytes(
              totalBytes
            )}`
          );

          response.on("data", (chunk) => {
            downloadedBytes += chunk.length;
            const progress =
              totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;

            // Send progress update to renderer
            this.sendProgressUpdate(progress, downloadedBytes, totalBytes);
          });

          response.on("end", async () => {
            console.log(`[UpdateService] ✅ Download completed: ${filePath}`);

            try {
              // Launch installer
              console.log(`[UpdateService] 🚀 Launching installer...`);
              await shell.openPath(filePath);

              // Close app after short delay to allow installer to start
              setTimeout(() => {
                console.log(
                  `[UpdateService] 👋 Closing app for update installation...`
                );
                app.quit();
              }, 1000);

              resolve();
            } catch (error) {
              console.error(
                `[UpdateService] 💥 Error launching installer:`,
                error
              );
              reject(error);
            }
          });

          response.pipe(file);
        });

        request.on("error", (error) => {
          console.error(`[UpdateService] 💥 Download error:`, error);
          fs.unlink(filePath, () => {}); // Clean up partial file
          reject(error);
        });

        file.on("error", (error) => {
          console.error(`[UpdateService] 💥 File write error:`, error);
          fs.unlink(filePath, () => {}); // Clean up partial file
          reject(error);
        });
      } catch (error) {
        console.error(`[UpdateService] 💥 Error in downloadAndInstall:`, error);
        reject(error);
      }
    });
  }

  private generateFileName(url: string): string {
    try {
      // Try to extract filename from URL first
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const urlFileName = pathname.split("/").pop();

      // If we get a proper .exe filename from URL, use it
      if (
        urlFileName &&
        urlFileName.endsWith(".exe") &&
        urlFileName.length > 4
      ) {
        console.log(`[UpdateService] 📝 Using URL filename: ${urlFileName}`);
        return urlFileName;
      }

      // Otherwise generate a proper filename with version and timestamp
      const currentVersion = app.getVersion();
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const fileName = `xAkiitoh-Program-Executor-Update-${currentVersion}-${timestamp}.exe`;

      console.log(`[UpdateService] 📝 Generated filename: ${fileName}`);
      return fileName;
    } catch {
      // Fallback filename
      const fallbackName = `xAkiitoh-Program-Executor-Update-${Date.now()}.exe`;
      console.log(
        `[UpdateService] 📝 Using fallback filename: ${fallbackName}`
      );
      return fallbackName;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  private sendProgressUpdate(
    progress: number,
    downloadedBytes: number,
    totalBytes: number
  ): void {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send("download-progress", {
        progress: Math.round(progress),
        downloadedBytes,
        totalBytes,
        downloadedFormatted: this.formatBytes(downloadedBytes),
        totalFormatted: this.formatBytes(totalBytes),
      });
    }
  }

  private compareVersions(version1: string, version2: string): number {
    const v1parts = version1.split(".").map(Number);
    const v2parts = version2.split(".").map(Number);

    const maxLength = Math.max(v1parts.length, v2parts.length);

    for (let i = 0; i < maxLength; i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;

      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }

    return 0;
  }
}
