import os
import uuid
import sys
import requests
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import Config

# 동화책 분위기에 어울리는 CLOVA Voice 화자
# nhajun: 밝고 명랑한 남자아이 / njiyun: 따뜻한 여자아이
CLOVA_SPEAKER = 'nmeow'   # 원하면 'nhajun'으로 변경

# CLOVA Voice API 요청 한도: 5000 bytes (한국어 약 1600자)
CLOVA_MAX_BYTES = 4800


def _split_text(text: str) -> list[str]:
    """CLOVA API 한도에 맞게 텍스트를 문장 단위로 나눕니다."""
    chunks = []
    current = ''
    for sentence in text.replace('\n', ' ').split('. '):
        sentence = sentence.strip()
        if not sentence:
            continue
        candidate = (current + '. ' + sentence).strip() if current else sentence
        if len(candidate.encode('utf-8')) > CLOVA_MAX_BYTES:
            if current:
                chunks.append(current)
            current = sentence
        else:
            current = candidate
    if current:
        chunks.append(current)
    return chunks or [text[:800]]


def _generate_clova(text: str, filepath: str) -> bool:
    """CLOVA Voice로 MP3를 생성합니다. 성공 시 True 반환."""
    if not Config.CLOVA_CLIENT_ID or not Config.CLOVA_CLIENT_SECRET:
        return False

    url = 'https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts'
    headers = {
        'X-NCP-APIGW-API-KEY-ID': Config.CLOVA_CLIENT_ID,
        'X-NCP-APIGW-API-KEY':    Config.CLOVA_CLIENT_SECRET,
        'Content-Type':            'application/x-www-form-urlencoded',
    }

    chunks = _split_text(text)

    # 청크가 1개면 단일 요청
    if len(chunks) == 1:
        data = {
            'speaker': CLOVA_SPEAKER,
            'volume': '0',
            'speed': '-1',   # 약간 느리게 (어린이 대상)
            'pitch': '0',
            'format': 'mp3',
            'text': chunks[0],
        }
        resp = requests.post(url, headers=headers, data=data, timeout=15)
        if resp.status_code != 200:
            print(f"[CLOVA TTS 오류] 상태코드: {resp.status_code} / {resp.text[:100]}")
            return False
        with open(filepath, 'wb') as f:
            f.write(resp.content)
        return True

    # 청크가 여러 개면 각각 생성 후 이어붙이기
    import tempfile
    parts = []
    try:
        for i, chunk in enumerate(chunks):
            data = {
                'speaker': CLOVA_SPEAKER,
                'volume': '0',
                'speed': '-1',
                'pitch': '0',
                'format': 'mp3',
                'text': chunk,
            }
            resp = requests.post(url, headers=headers, data=data, timeout=15)
            if resp.status_code != 200:
                print(f"[CLOVA TTS 청크{i} 오류] {resp.status_code}")
                return False
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
            tmp.write(resp.content)
            tmp.close()
            parts.append(tmp.name)

        # 바이너리 이어붙이기 (MP3 프레임 단위 concat)
        with open(filepath, 'wb') as out:
            for part in parts:
                with open(part, 'rb') as f:
                    out.write(f.read())
        return True

    finally:
        for part in parts:
            try:
                os.remove(part)
            except Exception:
                pass


def generate_tts(text: str, slow: bool = False) -> str | None:
    """
    한국어 TTS MP3 파일을 생성합니다.
    CLOVA Voice 우선 → gTTS 폴백
    Returns: relative static path like 'static/audio/xxx.mp3', or None
    """
    filename = f"story_{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(Config.AUDIO_DIR, filename)

    # 1. CLOVA Voice 시도
    if Config.CLOVA_CLIENT_ID and Config.CLOVA_CLIENT_SECRET:
        try:
            if _generate_clova(text, filepath):
                print(f"[CLOVA TTS] 생성 완료: {filename} / 화자: {CLOVA_SPEAKER}")
                return f"static/audio/{filename}"
        except Exception as e:
            print(f"[CLOVA TTS 예외] {e} → gTTS 폴백")

    # 2. gTTS 폴백
    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang='ko', slow=slow)
        tts.save(filepath)
        print(f"[gTTS] 생성 완료: {filename}")
        return f"static/audio/{filename}"
    except Exception as e:
        print(f"[TTS 생성 오류] {e}")
        return None
