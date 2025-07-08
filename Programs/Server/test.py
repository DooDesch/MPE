import sounddevice as sd
import numpy as np

def list_input_devices():
    devices = sd.query_devices()
    print(devices)
    # Filtere alle Geräte, die mindestens einen Input-Kanal haben
    input_devices = [(i, d) for i, d in enumerate(devices) if d['max_input_channels'] > 0]
    print("Verfügbare Eingabegeräte:")
    for idx, (global_index, device) in enumerate(input_devices):
        print(f"[{idx}] (Global Index {global_index}): {device['name']}")
    return input_devices

def select_device(input_devices):
    choice = input("Bitte wähle die Nummer des Mikrofons aus (oder drücke Enter für Standard): ")
    if choice.strip():
        try:
            chosen_idx = int(choice)
            if 0 <= chosen_idx < len(input_devices):
                return input_devices[chosen_idx][0]  # Globaler Index des Geräts
            else:
                print("Ungültige Auswahl, Standardgerät wird verwendet.")
                return None
        except ValueError:
            print("Ungültige Eingabe, Standardgerät wird verwendet.")
            return None
    else:
        return None

def audio_callback(indata, frames, time, status):
    if status:
        print("Status:", status)
    # Nutze nur den ersten Kanal, falls stereo:
    rms = np.sqrt(np.mean(indata[:, 0]**2))
    print("RMS:", rms)

def main():
    input_devices = list_input_devices()
    device_id = select_device(input_devices)
    if device_id is not None:
        print(f"Ausgewähltes Gerät (Global Index): {device_id}")
    else:
        print("Kein Gerät ausgewählt, Standardgerät wird verwendet.")
    
    try:
        with sd.InputStream(device=device_id, callback=audio_callback, channels=1, samplerate=44100):
            print("Audio-Stream läuft – sprich in das Mikrofon. Drücke Strg+C zum Beenden.")
            while True:
                sd.sleep(1000)
    except Exception as e:
        print("Fehler beim Starten des Audio-Streams:", e)

if __name__ == '__main__':
    main()
