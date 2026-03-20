import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'fairy-tale-secret-2024')
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'fairy_tale.db')
    ANTHROPIC_API_KEY    = os.getenv('ANTHROPIC_API_KEY', '')
    OPENAI_API_KEY       = os.getenv('OPENAI_API_KEY', '')
    GEMINI_API_KEY       = os.getenv('GEMINI_API_KEY', '')
    HUGGINGFACE_API_KEY  = os.getenv('HUGGINGFACE_API_KEY', '')

    BASE_DIR          = os.path.dirname(__file__)
    DRAWINGS_DIR      = os.path.join(BASE_DIR, 'static', 'generated', 'drawings')
    ILLUSTRATIONS_DIR = os.path.join(BASE_DIR, 'static', 'generated', 'illustrations')
    AUDIO_DIR         = os.path.join(BASE_DIR, 'static', 'audio')
    BGS_DIR           = os.path.join(BASE_DIR, 'static', 'generated', 'bgs')
    MERGED_DIR        = os.path.join(BASE_DIR, 'static', 'generated', 'merged')

    MAX_SELECTED = 5
    MIN_SELECTED = 1

    @classmethod
    def init_dirs(cls):
        for d in [cls.DRAWINGS_DIR, cls.ILLUSTRATIONS_DIR, cls.AUDIO_DIR, cls.BGS_DIR, cls.MERGED_DIR]:
            os.makedirs(d, exist_ok=True)
