import { shell } from 'electron';
import { app } from 'electron';

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
  private readonly REPO_OWNER = 'DooDesch';
  private readonly REPO_NAME = 'MPE';
  private readonly GITHUB_API_URL = `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/releases/latest`;

  async checkForUpdates(): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion?: string;
    downloadUrl?: string;
    releaseNotes?: string;
  }> {
    try {
      const currentVersion = app.getVersion();
      console.log(`Current app version: ${currentVersion}`);

      const response = await fetch(this.GITHUB_API_URL);
      if (!response.ok) {
        console.error('Failed to fetch latest release:', response.statusText);
        return { hasUpdate: false, currentVersion };
      }

      const release: GitHubRelease = await response.json();
      const latestVersion = release.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present

      console.log(`Latest version: ${latestVersion}`);

      const hasUpdate = this.compareVersions(currentVersion, latestVersion) < 0;

      if (hasUpdate) {
        // Find Windows installer asset
        const windowsAsset = release.assets.find(asset => 
          asset.name.toLowerCase().includes('.exe') && 
          asset.name.toLowerCase().includes('setup')
        );

        return {
          hasUpdate: true,
          currentVersion,
          latestVersion,
          downloadUrl: windowsAsset?.browser_download_url,
          releaseNotes: release.name
        };
      }

      return { hasUpdate: false, currentVersion };

    } catch (error) {
      console.error('Error checking for updates:', error);
      return { hasUpdate: false, currentVersion: app.getVersion() };
    }
  }

  async downloadAndInstall(downloadUrl: string): Promise<void> {
    try {
      // Open the download URL in the default browser
      await shell.openExternal(downloadUrl);
      
      // Optional: Show a message that the download has started
      console.log('Update download started in browser');
      
      // You could also implement direct download to temp folder here
      // and then launch the installer automatically
      
    } catch (error) {
      console.error('Error downloading update:', error);
      throw error;
    }
  }

  private compareVersions(version1: string, version2: string): number {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
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