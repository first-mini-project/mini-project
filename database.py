import sqlite3
import json
from contextlib import contextmanager
from config import Config

WORDS_SEED = [
    # 동물
    {"korean": "사자", "english": "lion", "emoji": "🦁", "category": "동물"},
    {"korean": "토끼", "english": "rabbit", "emoji": "🐰", "category": "동물"},
    {"korean": "코끼리", "english": "elephant", "emoji": "🐘", "category": "동물"},
    {"korean": "고양이", "english": "cat", "emoji": "🐱", "category": "동물"},
    {"korean": "강아지", "english": "dog", "emoji": "🐶", "category": "동물"},
    {"korean": "곰", "english": "bear", "emoji": "🐻", "category": "동물"},
    {"korean": "나비", "english": "butterfly", "emoji": "🦋", "category": "동물"},
    {"korean": "물고기", "english": "fish", "emoji": "🐟", "category": "동물"},
    {"korean": "펭귄", "english": "penguin", "emoji": "🐧", "category": "동물"},
    {"korean": "원숭이", "english": "monkey", "emoji": "🐒", "category": "동물"},
    # 자연
    {"korean": "나무", "english": "tree", "emoji": "🌳", "category": "자연"},
    {"korean": "꽃", "english": "flower", "emoji": "🌸", "category": "자연"},
    {"korean": "무지개", "english": "rainbow", "emoji": "🌈", "category": "자연"},
    {"korean": "별", "english": "star", "emoji": "⭐", "category": "자연"},
    {"korean": "달", "english": "moon", "emoji": "🌙", "category": "자연"},
    {"korean": "태양", "english": "sun", "emoji": "☀️", "category": "자연"},
    {"korean": "구름", "english": "cloud", "emoji": "☁️", "category": "자연"},
    {"korean": "산", "english": "mountain", "emoji": "⛰️", "category": "자연"},
    {"korean": "바다", "english": "ocean", "emoji": "🌊", "category": "자연"},
    # 사물/판타지
    {"korean": "집", "english": "house", "emoji": "🏠", "category": "사물"},
    {"korean": "성", "english": "castle", "emoji": "🏰", "category": "사물"},
    {"korean": "자동차", "english": "car", "emoji": "🚗", "category": "사물"},
    {"korean": "기차", "english": "train", "emoji": "🚂", "category": "사물"},
    {"korean": "풍선", "english": "balloon", "emoji": "🎈", "category": "사물"},
    {"korean": "케이크", "english": "cake", "emoji": "🎂", "category": "사물"},
    {"korean": "왕관", "english": "crown", "emoji": "👑", "category": "사물"},
    {"korean": "마법지팡이", "english": "magic wand", "emoji": "🪄", "category": "사물"},
    # 음식
    {"korean": "사과", "english": "apple", "emoji": "🍎", "category": "음식"},
    {"korean": "딸기", "english": "strawberry", "emoji": "🍓", "category": "음식"},
    {"korean": "수박", "english": "watermelon", "emoji": "🍉", "category": "음식"},
    {"korean": "바나나", "english": "banana", "emoji": "🍌", "category": "음식"},
    {"korean": "포도", "english": "grapes", "emoji": "🍇", "category": "음식"},
    {"korean": "당근", "english": "carrot", "emoji": "🥕", "category": "음식"},
    {"korean": "아이스크림", "english": "ice cream", "emoji": "🍦", "category": "음식"},
]


@contextmanager
def get_db():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS words (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                korean TEXT NOT NULL,
                english TEXT NOT NULL,
                emoji TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS drawings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word_id INTEGER NOT NULL REFERENCES words(id),
                image_data TEXT NOT NULL,
                file_path TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS stories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                moral TEXT,
                keywords TEXT NOT NULL,
                drawing_ids TEXT NOT NULL,
                illustration_path TEXT,
                audio_path TEXT,
                scene_data TEXT,
                layout_data TEXT,
                is_read INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        count = conn.execute('SELECT COUNT(*) FROM words').fetchone()[0]
        if count == 0:
            for word in WORDS_SEED:
                conn.execute(
                    'INSERT INTO words (korean, english, emoji, category) VALUES (?, ?, ?, ?)',
                    (word['korean'], word['english'], word['emoji'], word['category'])
                )
    # 기존 DB 마이그레이션: scene_data 및 is_read 컬럼 추가
    try:
        with get_db() as conn:
            conn.execute("ALTER TABLE stories ADD COLUMN scene_data TEXT")
    except Exception:
        pass  # 이미 존재하면 무시

    try:
        with get_db() as conn:
            conn.execute("ALTER TABLE stories ADD COLUMN is_read INTEGER DEFAULT 0")
    except Exception:
        pass  # 이미 존재하면 무시

    # 새로운 마이그레이션: layout_data 컬럼 추가
    try:
        with get_db() as conn:
            conn.execute("ALTER TABLE stories ADD COLUMN layout_data TEXT")
    except Exception:
        pass  # 이미 존재하면 무시


# ─── CRUD Helpers ────────────────────────────────────────────────────────────

def get_random_word():
    with get_db() as conn:
        row = conn.execute('SELECT * FROM words ORDER BY RANDOM() LIMIT 1').fetchone()
        return dict(row) if row else None


def get_word(word_id):
    with get_db() as conn:
        row = conn.execute('SELECT * FROM words WHERE id=?', (word_id,)).fetchone()
        return dict(row) if row else None


def get_all_words():
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM words ORDER BY category, korean').fetchall()
        return [dict(r) for r in rows]


def get_words_with_latest_drawing():
    """모든 단어 + 각 단어의 최신 그림(없으면 None)을 반환합니다."""
    with get_db() as conn:
        rows = conn.execute('''
            SELECT w.id, w.korean, w.english, w.emoji, w.category,
                   d.id   AS drawing_id,
                   d.file_path AS drawing_path,
                   d.created_at AS drawn_at
            FROM words w
            LEFT JOIN drawings d
              ON d.word_id = w.id
              AND d.created_at = (
                  SELECT MAX(d2.created_at) FROM drawings d2 WHERE d2.word_id = w.id
              )
            ORDER BY w.category, w.korean
        ''').fetchall()
        return [dict(r) for r in rows]


def get_words_by_ids(word_ids):
    """word_id 목록으로 단어 정보를 반환합니다 (순서 보존)."""
    if not word_ids:
        return []
    placeholders = ','.join('?' * len(word_ids))
    with get_db() as conn:
        rows = conn.execute(
            f'SELECT * FROM words WHERE id IN ({placeholders})', word_ids
        ).fetchall()
        rows_map = {row['id']: dict(row) for row in rows}
        return [rows_map[i] for i in word_ids if i in rows_map]


def get_latest_drawings_for_words(word_ids):
    """word_id 목록에서 각 단어의 최신 그림을 반환합니다 (그림 없는 단어는 제외)."""
    if not word_ids:
        return []
    placeholders = ','.join('?' * len(word_ids))
    with get_db() as conn:
        rows = conn.execute(f'''
            SELECT d.id, d.word_id, d.image_data, d.file_path, d.created_at,
                   w.korean, w.english, w.emoji
            FROM drawings d JOIN words w ON d.word_id = w.id
            WHERE d.word_id IN ({placeholders})
              AND d.created_at = (
                  SELECT MAX(d2.created_at) FROM drawings d2 WHERE d2.word_id = d.word_id
              )
        ''', word_ids).fetchall()
        rows_map = {row['word_id']: dict(row) for row in rows}
        # word_ids 순서를 유지하되 그림 없는 단어는 None으로
        return [rows_map.get(wid) for wid in word_ids]


def save_drawing(word_id, image_data, file_path=None):
    with get_db() as conn:
        cursor = conn.execute(
            'INSERT INTO drawings (word_id, image_data, file_path) VALUES (?, ?, ?)',
            (word_id, image_data, file_path)
        )
        return cursor.lastrowid


def get_all_drawings():
    with get_db() as conn:
        rows = conn.execute('''
            SELECT d.id, d.word_id, d.file_path, d.created_at,
                   w.korean, w.english, w.emoji, w.category
            FROM drawings d JOIN words w ON d.word_id = w.id
            ORDER BY w.korean ASC
        ''').fetchall()
        return [dict(r) for r in rows]


def delete_drawing(drawing_id):
    with get_db() as conn:
        conn.execute('DELETE FROM drawings WHERE id=?', (drawing_id,))


def get_drawing_by_word_id(word_id):
    with get_db() as conn:
        row = conn.execute(
            'SELECT * FROM drawings WHERE word_id=? ORDER BY created_at DESC LIMIT 1',
            (word_id,)
        ).fetchone()
        return dict(row) if row else None


def get_drawing_with_data(drawing_id):
    with get_db() as conn:
        row = conn.execute('''
            SELECT d.*, w.korean, w.english, w.emoji
            FROM drawings d JOIN words w ON d.word_id = w.id
            WHERE d.id=?
        ''', (drawing_id,)).fetchone()
        return dict(row) if row else None


def get_drawings_by_ids(drawing_ids):
    if not drawing_ids:
        return []
    placeholders = ','.join('?' * len(drawing_ids))
    with get_db() as conn:
        rows = conn.execute(f'''
            SELECT d.id, d.word_id, d.image_data, d.file_path, d.created_at,
                   w.korean, w.english, w.emoji
            FROM drawings d LEFT JOIN words w ON d.word_id = w.id
            WHERE d.id IN ({placeholders})
        ''', drawing_ids).fetchall()
        # 선택 순서(drawing_ids 순서)를 유지하여 반환
        rows_map = {row['id']: dict(row) for row in rows}
        return [rows_map[i] for i in drawing_ids if i in rows_map]


def save_story(title, content, moral, keywords, drawing_ids,
               illustration_path=None, audio_path=None, scene_data=None, layout_data=None):
    with get_db() as conn:
        cursor = conn.execute(
            '''INSERT INTO stories
               (title, content, moral, keywords, drawing_ids, illustration_path, audio_path, scene_data, layout_data)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (title, content, moral,
             json.dumps(keywords, ensure_ascii=False),
             json.dumps(drawing_ids),
             illustration_path, audio_path,
             json.dumps(scene_data, ensure_ascii=False) if scene_data else None,
             json.dumps(layout_data, ensure_ascii=False) if layout_data else None)
        )
        return cursor.lastrowid


def get_story(story_id):
    with get_db() as conn:
        row = conn.execute('SELECT * FROM stories WHERE id=?', (story_id,)).fetchone()
        if not row:
            return None
        story = dict(row)
        story['keywords'] = json.loads(story['keywords'])
        story['drawing_ids'] = json.loads(story['drawing_ids'])
        story['scene_data'] = json.loads(story['scene_data']) if story.get('scene_data') else None
        story['layout_data'] = json.loads(story['layout_data']) if story.get('layout_data') else None
        return story


def get_all_stories():
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM stories ORDER BY created_at DESC').fetchall()
        result = []
        for row in rows:
            s = dict(row)
            s['keywords'] = json.loads(s['keywords'])
            s['drawing_ids'] = json.loads(s['drawing_ids'])
            s['scene_data'] = json.loads(s['scene_data']) if s.get('scene_data') else None
            result.append(s)
        return result


def delete_story(story_id):
    with get_db() as conn:
        conn.execute('DELETE FROM stories WHERE id=?', (story_id,))


def mark_story_read(story_id):
    with get_db() as conn:
        conn.execute('UPDATE stories SET is_read = 1 WHERE id=?', (story_id,))
