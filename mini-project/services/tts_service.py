import os
import uuid
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import Config


def generate_tts(text: str, slow: bool = False) -> str | None:
    """
    한국어 TTS MP3 파일을 생성합니다.
    slow=True 이면 더 천천히 읽어줌 (어린이용 권장)
    Returns: relative static path like 'static/audio/xxx.mp3', or None
    """
    try:
        from gtts import gTTS

        filename = f"story_{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(Config.AUDIO_DIR, filename)

        tts = gTTS(text=text, lang='ko', slow=slow)
        tts.save(filepath)

        return f"static/audio/{filename}"

    except Exception as e:
        print(f"[TTS 생성 오류] {e}")
        return None
