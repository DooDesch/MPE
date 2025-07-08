# -*- coding: utf-8 -*-
# server.py
import asyncio
import websockets
import sounddevice as sd
import numpy as np
import threading
import queue
import json

# Queue für Audio-Daten
audio_queue = queue.Queue()

# Hole alle Geräte und die Host-APIs
all_devices = sd.query_devices()
hostapis = sd.query_hostapis()

# Filtere Geräte, die Eingabekanäle haben und Windows DirectSound nutzen
input_devices = []
for i, device in enumerate(all_devices):
    if device['max_input_channels'] > 0:
        hostapi_index = device['hostapi']
        hostapi_name = hostapis[hostapi_index]['name']
        if "Windows DirectSound" in hostapi_name:
            input_devices.append((i, device))

print("Verfügbare Mikrofone (Windows DirectSound):")
for idx, (global_idx, device) in enumerate(input_devices):
    print(f"[{idx}] (Global Index {global_idx}): {device['name']}")

# Benutzerabfrage: Auswahl über den Index der gefilterten Liste
choice = input("Bitte wähle die Nummer des Mikrofons aus (oder drücke Enter für Standard): ")
if choice.strip():
    try:
        chosen_idx = int(choice)
        if 0 <= chosen_idx < len(input_devices):
            global_device_index = input_devices[chosen_idx][0]
        else:
            print("Ungültige Auswahl, Standardgerät wird verwendet.")
            global_device_index = None
    except ValueError:
        print("Ungültige Eingabe, Standardgerät wird verwendet.")
        global_device_index = None
else:
    global_device_index = None  # Standardgerät

if global_device_index is not None:
    print(f"Ausgewähltes Gerät (Global Index): {global_device_index}")
else:
    print("Kein Gerät ausgewählt, es wird das Standardgerät verwendet.")

# Audio-Callback, das den RMS (Root Mean Square) berechnet
def audio_callback(indata, frames, time, status):
    if status:
        print("Audio-Status:", status)
    # Bei Stereo: verwende nur den ersten Kanal
    rms = np.sqrt(np.mean(indata[:, 0] ** 2))
    audio_queue.put(rms)

# Starte den Audio-Stream in einem eigenen Thread
def start_audio_stream():
    try:
        with sd.InputStream(
            device=global_device_index,
            callback=audio_callback,
            channels=1,          # Mono
            samplerate=48000     # 48000 Hz, da WASAPI oft so besser läuft
        ):
            while True:
                sd.sleep(1000)
    except sd.PortAudioError as e:
        print(f"Fehler beim Öffnen des Geräts {global_device_index}: {e}")

# Asynchroner WebSocket-Handler
async def ws_handler(websocket, path=None):
    print("Client verbunden")
    try:
        last_sent = None
        while True:
            try:
                volume = audio_queue.get_nowait()
            except queue.Empty:
                volume = None
            if volume is not None:
                if last_sent is None or abs(volume - last_sent) / last_sent > 0.5:
                    data = {"volume": float(volume)}
                    await websocket.send(json.dumps(data))
                    last_sent = volume
            await asyncio.sleep(0.01)
    except websockets.exceptions.ConnectionClosed:
        print("Client getrennt.")

# Asynchroner Hauptteil, der den WebSocket-Server startet
async def main_async():
    async with websockets.serve(ws_handler, "localhost", 8765):
        print("WebSocket-Server läuft auf ws://localhost:8765")
        await asyncio.Future()  # Blockiert unendlich

# Hauptfunktion: Audio-Thread starten und asyncio.run() nutzen
def main():
    audio_thread = threading.Thread(target=start_audio_stream, daemon=True)
    audio_thread.start()
    asyncio.run(main_async())

if __name__ == '__main__':
    main()
