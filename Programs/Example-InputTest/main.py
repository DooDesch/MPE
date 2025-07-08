#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Example-InputTest - Ein einfaches Testprogramm für Terminal-Eingaben
"""

import time
import sys
import os

# Set UTF-8 encoding for Windows
if os.name == 'nt':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

def main():
    print("🎮 Input-Test Programm gestartet!")
    print("=" * 50)
    
    # Benutzername abfragen
    print("\n📝 Wie ist dein Name?")
    print("Gib deinen Namen ein:")
    name = input()
    print(f"Hallo {name}! 👋")
    
    time.sleep(1)
    
    # Mikrofon-Auswahl simulieren
    print("\n🎤 Mikrofon-Auswahl:")
    print("Verfügbare Mikrofone:")
    print("1. Hauptmikrofon")
    print("2. Headset-Mikrofon")
    print("3. USB-Mikrofon")
    print("4. Kein Mikrofon")
    print("\nGib die Nummer deines Mikrofons ein (1-4):")
    
    while True:
        try:
            mic_choice = input()
            mic_num = int(mic_choice)
            if 1 <= mic_num <= 4:
                mics = ["Hauptmikrofon", "Headset-Mikrofon", "USB-Mikrofon", "Kein Mikrofon"]
                print(f"✅ {mics[mic_num-1]} ausgewählt!")
                break
            else:
                print("❌ Ungültige Eingabe! Bitte gib eine Zahl zwischen 1 und 4 ein:")
        except ValueError:
            print("❌ Ungültige Eingabe! Bitte gib eine Zahl ein:")
    
    time.sleep(1)
    
    # Streaming-Einstellungen
    print("\n🎥 Streaming-Einstellungen:")
    print("Möchtest du die Streaming-Funktion aktivieren? (ja/nein)")
    
    while True:
        streaming = input().lower().strip()
        if streaming in ['ja', 'j', 'yes', 'y']:
            print("✅ Streaming aktiviert!")
            
            print("\nWelche Auflösung möchtest du verwenden?")
            print("1. 720p (1280x720)")
            print("2. 1080p (1920x1080)")
            print("3. 1440p (2560x1440)")
            print("Gib die Nummer ein (1-3):")
            
            while True:
                try:
                    res_choice = input()
                    res_num = int(res_choice)
                    if 1 <= res_num <= 3:
                        resolutions = ["720p (1280x720)", "1080p (1920x1080)", "1440p (2560x1440)"]
                        print(f"✅ Auflösung {resolutions[res_num-1]} gewählt!")
                        break
                    else:
                        print("❌ Ungültige Eingabe! Bitte gib eine Zahl zwischen 1 und 3 ein:")
                except ValueError:
                    print("❌ Ungültige Eingabe! Bitte gib eine Zahl ein:")
            break
        elif streaming in ['nein', 'n', 'no']:
            print("❌ Streaming deaktiviert!")
            break
        else:
            print("❌ Ungültige Eingabe! Bitte gib 'ja' oder 'nein' ein:")
    
    time.sleep(1)
    
    # Finale Nachricht
    print("\n🎉 Konfiguration abgeschlossen!")
    print(f"💫 Hallo {name}, alles ist bereit!")
    print("Das Programm läuft jetzt...")
    
    # Endlos-Schleife mit periodischen Nachrichten
    counter = 0
    try:
        while True:
            counter += 1
            print(f"📊 Status-Update #{counter} - Programm läuft normal...")
            time.sleep(5)
            
            if counter % 3 == 0:
                print("💡 Tipp: Du kannst jederzeit weitere Eingaben machen!")
                print("Gib 'stop' ein um das Programm zu beenden, oder 'status' für Informationen:")
                
                # Warte auf Eingabe (mit Timeout-Simulation)
                try:
                    user_input = input()
                    if user_input.lower() == 'stop':
                        print("🛑 Programm wird beendet...")
                        break
                    elif user_input.lower() == 'status':
                        print(f"📈 Programm läuft seit {counter * 5} Sekunden")
                        print(f"👤 Benutzer: {name}")
                        print("✅ Alles funktioniert normal!")
                    else:
                        print(f"📝 Du hast eingegeben: {user_input}")
                except:
                    pass  # Ignoriere Eingabe-Fehler
                    
    except KeyboardInterrupt:
        print("\n🛑 Programm durch Benutzer beendet!")
    
    print("👋 Auf Wiedersehen!")

if __name__ == "__main__":
    main()
