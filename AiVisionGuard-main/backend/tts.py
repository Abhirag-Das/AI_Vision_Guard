# backend/tts.py

import pyttsx3
import tempfile

def generate_tts_audio(label: str, reason: str = "generic") -> str:
    if label == "AI":
        text = "This looks AI-generated because the details are too perfect—real photos have natural imperfections."
    else:
        text = "This seems real because I see authentic texture, lighting, and small human-like flaws."
    
    engine = pyttsx3.init()
    engine.setProperty('rate', 150)
    engine.setProperty('volume', 0.9)

    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as f:
        tmp = f.name
    engine.save_to_file(text, tmp)
    engine.runAndWait()
    return tmp