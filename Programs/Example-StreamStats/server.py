# Beispiel Stream Stats Analyzer für xAkiitoh
# Python Programm für Stream-Statistiken
# -*- coding: utf-8 -*-

__version__ = "1.2.0"

import time
import random
import sys
import os
from datetime import datetime

# UTF-8 Kodierung für Windows-Konsole sicherstellen
if sys.platform == 'win32':
    try:
        # Windows-Konsole auf UTF-8 setzen
        os.system('chcp 65001 >nul 2>&1')
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except:
        pass

class StreamStatsAnalyzer:
    def __init__(self):
        self.streamer = "xAkiitoh"
        self.start_time = datetime.now()
        self.viewer_count = 0
        self.chat_messages = 0
        self.followers = 0
        
    def start_monitoring(self):
        print(f"🎮 Stream Stats Analyzer für {self.streamer} gestartet!")
        print(f"📊 Version: {__version__}")
        print(f"🕐 Gestartet um: {self.start_time.strftime('%H:%M:%S')}")
        print("-" * 50)
        sys.stdout.flush()  # Force initial output
        
        try:
            while True:
                self.update_stats()
                self.display_stats()
                time.sleep(5)
        except KeyboardInterrupt:
            print("\n👋 Stream Stats Analyzer wird beendet...")
            self.show_summary()
    
    def update_stats(self):
        # Simuliere echte Stream-Daten
        self.viewer_count = random.randint(50, 200)
        self.chat_messages += random.randint(1, 10)
        self.followers += random.randint(0, 2)
    
    def display_stats(self):
        current_time = datetime.now().strftime('%H:%M:%S')
        uptime = datetime.now() - self.start_time
        
        print(f"[{current_time}] 📺 Viewer: {self.viewer_count} | 💬 Chat: {self.chat_messages} | 👥 Follower: {self.followers}")
        print(f"⏱️ Uptime: {str(uptime).split('.')[0]}")
        sys.stdout.flush()  # Force output to be displayed immediately
    
    def show_summary(self):
        total_time = datetime.now() - self.start_time
        print(f"\n📊 Stream Zusammenfassung für {self.streamer}:")
        print(f"⏱️ Gesamtzeit: {str(total_time).split('.')[0]}")
        print(f"💬 Chat Nachrichten: {self.chat_messages}")
        print(f"👥 Neue Follower: {self.followers}")
        print("✅ Statistiken gespeichert!")

if __name__ == "__main__":
    analyzer = StreamStatsAnalyzer()
    analyzer.start_monitoring()
