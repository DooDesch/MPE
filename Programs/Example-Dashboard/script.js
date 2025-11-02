// Simple JavaScript for dynamic content updates
document.addEventListener("DOMContentLoaded", function () {
  console.log("Stream Dashboard loaded! 🎮");

  // Simulate live data updates
  function updateViewers() {
    const viewersElement = document.getElementById("viewers");
    const currentViewers = parseInt(
      viewersElement.textContent.replace(",", "")
    );
    const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
    const newViewers = Math.max(0, currentViewers + change);
    viewersElement.textContent = newViewers.toLocaleString();
  }

  function updateUptime() {
    const uptimeElement = document.getElementById("uptime");
    const timeMatch = uptimeElement.textContent.match(/(\d+):(\d+):(\d+)/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      let minutes = parseInt(timeMatch[2]);
      let seconds = parseInt(timeMatch[3]);

      seconds++;
      if (seconds >= 60) {
        seconds = 0;
        minutes++;
        if (minutes >= 60) {
          minutes = 0;
          hours++;
        }
      }

      const formatTime = (num) => num.toString().padStart(2, "0");
      uptimeElement.textContent = `${formatTime(hours)}:${formatTime(
        minutes
      )}:${formatTime(seconds)}`;
    }
  }

  function addRandomFollower() {
    const followersList = document.getElementById("followersList");
    const randomNames = [
      "StreamFan2025",
      "GamerPro123",
      "TwitchLover",
      "CodeNinja",
      "PixelArtist",
      "RetroGamer",
      "StreamSniper",
      "ChatMaster",
      "ViewerVIP",
      "FollowBot2000",
      "LiveStreamFan",
      "DigitalNomad",
    ];

    const randomName =
      randomNames[Math.floor(Math.random() * randomNames.length)];
    const newFollower = document.createElement("li");
    newFollower.textContent = randomName;
    newFollower.style.opacity = "0";
    newFollower.style.transform = "translateX(-20px)";

    // Remove oldest if more than 5
    if (followersList.children.length >= 5) {
      followersList.removeChild(followersList.lastChild);
    }

    // Add new follower at the top
    followersList.insertBefore(newFollower, followersList.firstChild);

    // Animate in
    setTimeout(() => {
      newFollower.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      newFollower.style.opacity = "1";
      newFollower.style.transform = "translateX(0)";
    }, 100);
  }

  function simulateProgress() {
    const progressBars = document.querySelectorAll(".progress");
    progressBars.forEach((bar) => {
      const currentWidth = parseFloat(bar.style.width);
      const change = Math.random() * 2 - 1; // -1 to +1
      const newWidth = Math.max(0, Math.min(100, currentWidth + change));
      bar.style.width = newWidth + "%";
    });

    // Update goal progress text
    const goalProgressElements = document.querySelectorAll(".goal-progress");
    goalProgressElements.forEach((element, index) => {
      if (index === 0) {
        // Follower goal
        const progress = parseFloat(progressBars[2].style.width);
        const current = Math.floor((progress / 100) * 1000);
        element.textContent = `${current} / 1000`;
      } else if (index === 1) {
        // Donation goal
        const progress = parseFloat(progressBars[3].style.width);
        const current = Math.floor((progress / 100) * 100);
        element.textContent = `$${current} / $100`;
      }
    });
  }

  // Update intervals
  setInterval(updateViewers, 5000); // Update viewers every 5 seconds
  setInterval(updateUptime, 1000); // Update uptime every second
  setInterval(addRandomFollower, 15000); // New follower every 15 seconds
  setInterval(simulateProgress, 10000); // Update progress every 10 seconds

  // Add some interactive effects
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-10px) scale(1.02)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0) scale(1)";
    });
  });

  // Display welcome message
  setTimeout(() => {
    console.log("🚀 Dashboard is now live and updating!");
    console.log("📊 Viewers, uptime, and goals will update automatically");
    console.log("💫 This is powered by xAkiitoh Program Executor HTTP Server");
  }, 1000);
});

// Add some console styling
console.log(
  "%c🎮 Stream Dashboard",
  "color: #00ccff; font-size: 20px; font-weight: bold;"
);
console.log(
  "%cBuilt with ❤️ for streamers",
  "color: #ff6b6b; font-style: italic;"
);
