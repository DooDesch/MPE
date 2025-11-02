import { shell } from "electron";
import { app } from "electron";

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

  async checkForUpdates(): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion?: string;
    downloadUrl?: string;
    releaseNotes?: string;
  }> {
    try {
      const currentVersion = app.getVersion();
      console.log(`[UpdateService] 🔍 Checking for updates...`);
      console.log(`[UpdateService] 📦 Current app version: ${currentVersion}`);
      console.log(`[UpdateService] 🌐 GitHub API URL: ${this.GITHUB_API_URL}`);

      // Debug-Modus: Mock ein Update für Testing
      if (this.DEBUG_MODE) {
        console.log(
          `[UpdateService] 🧪 DEBUG MODE: Simulating update available`
        );
        return {
          hasUpdate: true,
          currentVersion,
          latestVersion: "1.2.0",
          downloadUrl:
            "https://github.com/DooDesch/MPE/releases/download/v1.2.0/setup.exe",
          releaseNotes: "🧪 Debug Test Update - neue Features und Bugfixes",
        };
      }

      const response = await fetch(this.GITHUB_API_URL);
      console.log(
        `[UpdateService] 📡 API Response status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        console.error(
          `[UpdateService] ❌ Failed to fetch latest release: ${response.status} ${response.statusText}`
        );
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
      return { hasUpdate: false, currentVersion: app.getVersion() };
    }
  }

  async downloadAndInstall(downloadUrl: string): Promise<void> {
    try {
      console.log(`[UpdateService] 📥 Starting download from: ${downloadUrl}`);

      // Open the download URL in the default browser
      await shell.openExternal(downloadUrl);

      console.log(`[UpdateService] ✅ Update download started in browser`);
      console.log(`[UpdateService] 🌐 Browser should open: ${downloadUrl}`);

      // Optional: Show a dialog asking if user wants to close the app
      // after download to install the update

      // For automatic installation, you could implement:
      // 1. Download to temp folder using fetch/https
      // 2. Launch the installer with shell.openPath()
      // 3. Close the current app with app.quit()
    } catch (error) {
      console.error(`[UpdateService] 💥 Error downloading update:`, error);
      throw error;
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
