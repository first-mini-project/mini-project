# AI Story — 프로젝트 노트

> 최종 업데이트: 2026-03-19

---

## 👥 팀 협업 주의사항

### 페이지별 담당 영역 구분

| 페이지                    | 관련 파일                          | 주의사항                                                                           |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| 그림 그리기 (`/draw`)     | `drawing.html`, `canvas.js`        | **캔버스 로직 수정 금지** — 다른 모든 기능이 여기서 저장된 그림에 의존함           |
| 그림 선택 (`/collection`) | `collection.html`, `collection.js` | `selected` Set과 `drawing_ids` 구조 유지 필수 — 동화 생성 API 입력값               |
| 동화 생성 (API)           | `app.py`, `services/`              | `scene_data` 구조 변경 시 storybook.js도 반드시 같이 수정                          |
| 동화 뷰어 (`/story/<id>`) | `storybook.html`, `storybook.js`   | JS 전체가 `<script id="story-data">` JSON 구조에 의존. DB 스키마 변경 시 같이 수정 |
| 도서관 (`/library`)       | `library.html`                     | `story.keywords`, `story.illustration_path` 사용 — DB 컬럼명 바꾸면 템플릿도 수정  |

---

### 🚨 절대 건드리면 안 되는 것들

#### 1. `canvas.js` — 그림 그리기 캔버스

- 이 파일을 수정하면 저장되는 `image_data`(base64) 형식이 달라질 수 있음
- `image_data`는 `database.py` → DB → `storybook.js` 누끼 처리까지 연결됨
- 수정이 필요하면 팀 전체 합의 필요

#### 2. `app.py` 페이지 라우터 (`/`, `/main`, `/draw`, `/collection`, `/library`, `/story/<id>`)

- URL 경로 바꾸면 모든 페이지 내 링크(`href`, `window.location.href`) 전부 깨짐
- 추가는 괜찮지만 기존 경로 수정/삭제 금지

#### 3. `database.py` — `save_story()` / `get_story()` 반환 키 이름

- `title`, `content`, `moral`, `keywords`, `drawing_ids`, `scene_data`, `audio_path` 키 이름을 바꾸면
  `storybook.html` (Jinja2 변수), `storybook.js` (`SD.title` 등), `library.html` 전부 깨짐
- 컬럼 **추가**는 괜찮음. 기존 키 **이름 변경/삭제**는 금지

#### 4. `scene_data` JSON 구조 (`text`, `bg`, `bg_image`)

- `ai_service.py`가 생성 → `image_service.py`가 `bg_image` 추가 → DB 저장 → `storybook.js`가 읽음
- 키 이름 하나라도 바꾸면 배경 이미지, 그림 배치, 텍스트 표시가 전부 깨짐
- 필드 **추가**는 괜찮음

#### 5. `static/js/storybook.js` — `spreads` 배열 구조

- `spreads[i] = { leftHTML, rightHTML }` 구조가 고정됨
- `renderSpread()`, `goNext()`, `goPrev()` 모두 이 구조에 의존
- leftHTML / rightHTML 키 이름 변경 금지

---

### ⚡ 작업 시 자주 발생하는 충돌 패턴

#### `config.py` 머지 충돌

- 여러 브랜치에서 `config.py`에 새 변수 추가 시 충돌 발생
- 해결법: 충돌 마커(`<<<<<<`, `=======`, `>>>>>>>`) 모두 제거하고 **양쪽 변수를 모두 유지**
- 충돌 해결 후 반드시 `git add config.py` 실행

#### Flask `debug=True` + GPU 모델 로드 → segfault

- `debug=True`는 Flask가 프로세스 2개를 띄움 (reloader + worker)
- 양쪽에서 SDXL-Turbo 모델 로드 시도 → VRAM 6GB 초과 → **segfault**
- 현재 `debug=False`로 고정. 절대 `debug=True`로 바꾸지 말 것
- 코드 수정 후 서버 재시작은 직접 `Ctrl+C` → `python app.py`

#### `requirements.txt`에 `torch` 직접 설치 명령 쓰지 말 것

- `torch`는 CUDA 버전을 특수 URL로 설치해야 함
- `pip install torch`만 쓰면 CPU 버전 설치됨 → GPU 이미지 생성 안 됨
- 앱 실행 시 `_ensure_dependencies()`가 자동으로 올바른 버전 설치함

---

### 📦 브랜치 작업 전 체크리스트

```
□ git pull 후 작업 시작
□ .env 파일 직접 만들기 (git에 없음 — .env.example 참고)
□ python app.py 첫 실행 시 torch 자동 설치 대기 (약 5~10분)
□ SDXL 모델 첫 다운로드 대기 (~7GB, 첫 동화 생성 시)
□ 수정 후 /collection → 동화 만들기 → /story 흐름 전체 테스트
```

---

### 🔗 페이지 간 데이터 흐름 (수정 시 영향 범위)

```
[drawing.html + canvas.js]
  └─ POST /api/drawing/save
        └─ DB drawings 테이블 (image_data, file_path)
              └─ [collection.html] drawing 카드 표시
                    └─ POST /api/story/generate (drawing_ids)
                          └─ [ai_service.py] keywords 추출
                          └─ [image_service.py] bg_image 생성
                          └─ DB stories 테이블 (scene_data 포함)
                                └─ [storybook.js] 누끼 + 배경 + 배치
```

**한 곳을 바꾸면 화살표 아래 모든 것에 영향이 간다.**

---

## ⚠️ 작업 규칙 (AI 참고용)

> 작업 시 이 파일을 먼저 읽고, **아래 영역만** 수정한다.

### 건드려도 되는 영역

| 영역               | 관련 파일                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------ |
| 그림 가져오는 과정 | `database.py`, `templates/collection.html`, `static/js/collection.js`                      |
| 스토리 생성 과정   | `app.py`, `services/ai_service.py`, `services/image_service.py`, `services/tts_service.py` |
| 스토리 뷰어        | `templates/library.html`, `templates/storybook.html`, `static/js/storybook.js`             |

### 건드리면 안 되는 영역

- Landing / Main 페이지 (`templates/landing.html`, `templates/main.html`)
- 그림 그리기 캔버스 (`templates/drawing.html`, `static/js/canvas.js`)
- Flask 라우팅 구조 (`app.py` 페이지 라우터)
- CSS 전체 레이아웃 (`static/css/style.css`)

---

## 프로젝트 개요

Python Flask 기반 아이들을 위한 AI 동화책 생성 앱.

1. 아이가 단어 카드를 보고 그림을 그린다
2. 그린 그림들을 선택하면 **Gemini AI**가 동화를 생성한다
3. 각 장면의 배경을 **로컬 SDXL-Turbo**(GPU)로 AI 이미지 생성한다
4. **gTTS**로 동화를 MP3로 읽어준다
5. **3D 책 넘기기** 애니메이션으로 그림동화처럼 보여준다

---

## 기술 스택

| 구분             | 기술                                                  |
| ---------------- | ----------------------------------------------------- |
| 백엔드           | Python + Flask                                        |
| 템플릿           | Jinja2 (서버사이드 렌더링)                            |
| 프론트           | Vanilla JS (프레임워크 없음)                          |
| AI - 동화 생성   | Google Gemini (`gemini-2.5-flash-lite`) → Claude 폴백 |
| AI - 배경 이미지 | 로컬 `stabilityai/sdxl-turbo` (diffusers, GPU 필요)   |
| AI - 참고 이미지 | OpenAI DALL-E 3 (키 없으면 스킵)                      |
| TTS              | gTTS (MP3) + Web Speech API 폴백                      |
| DB               | SQLite (`fairy_tale.db`)                              |
| 포트             | 5000                                                  |

---

## 실행 방법

```bash
cd "AI Story/AI Story"
pip install -r requirements.txt
# torch는 첫 실행 시 자동 설치됨 (app.py _ensure_dependencies 참고)
cp .env.example .env   # API 키 입력
python app.py
# → http://localhost:5000
```

환경변수 (`.env`):

```
GEMINI_API_KEY=your_key        # 동화 생성 (필수)
ANTHROPIC_API_KEY=your_key     # Claude 폴백 (선택)
OPENAI_API_KEY=your_key        # DALL-E 참고 이미지 (선택)
FLASK_SECRET_KEY=any_secret
HUGGINGFACE_TOKEN=hf_xxx       # 현재 미사용 (로컬 GPU로 대체됨)
```

> **로컬 이미지 생성**: 첫 실행 시 SDXL-Turbo 모델이 `~/.cache/huggingface/`에 자동 다운로드됨 (~7GB). GPU(VRAM 6GB+) 필요.

---

## 파일 구조 및 역할

```
AI Story/AI Story/
├── app.py                  ← Flask 진입점. 라우터 + API 엔드포인트
├── config.py               ← 환경변수 로드, 경로 상수 정의
├── database.py             ← SQLite CRUD 함수 모음
├── requirements.txt        ← 패키지 목록 (torch는 자동 설치)
├── fairy_tale.db           ← SQLite DB (자동 생성, .gitignore)
├── .env                    ← API 키 (절대 git에 올리지 않음)
│
├── services/
│   ├── ai_service.py       ← Gemini/Claude로 동화 텍스트 생성
│   ├── image_service.py    ← 로컬 SDXL-Turbo로 배경 이미지 생성
│   └── tts_service.py      ← gTTS로 MP3 생성
│
├── templates/
│   ├── base.html           ← 공통 레이아웃 (네비, 폰트 등)
│   ├── landing.html        ← 시작 화면
│   ├── main.html           ← 메인 메뉴
│   ├── drawing.html        ← 캔버스 그림 그리기 화면
│   ├── collection.html     ← 그린 그림 목록 + 선택 UI
│   ├── library.html        ← 만들어진 동화 목록
│   └── storybook.html      ← 3D 책 뷰어 (CSS + JS)
│
└── static/
    ├── css/style.css       ← 전체 스타일
    ├── js/
    │   ├── canvas.js       ← 그림 그리기 캔버스 (손대지 말 것)
    │   ├── collection.js   ← 그림 선택 + 동화 생성 요청
    │   └── storybook.js    ← 3D 책 넘기기, 누끼, 배경, 그림 배치
    └── generated/
        ├── drawings/       ← 아이가 그린 그림 PNG (.gitignore)
        ├── illustrations/  ← DALL-E 표지 이미지 (.gitignore)
        └── bgs/            ← SDXL-Turbo 장면 배경 이미지 (.gitignore)
    └── audio/              ← gTTS MP3 파일 (.gitignore)
```

---

## 파일 간 연결 관계

```
브라우저 요청
  GET /collection  →  app.py → database.get_all_drawings()
                   →  collection.html + collection.js

  POST /api/story/generate
    app.py
      ├─ database.get_drawings_by_ids(drawing_ids)
      ├─ ai_service.generate_fairy_tale(keywords, drawings)
      │     └─ Gemini API → JSON {title, scenes[], moral}
      ├─ image_service.generate_scene_bgs_parallel(scene_data)
      │     └─ 로컬 SDXL-Turbo → bg_xxx.jpg × 4장
      ├─ image_service.generate_story_illustration(title, keywords)
      │     └─ DALL-E 3 → story_xxx.png (키 없으면 None)
      ├─ tts_service.generate_tts(full_text)
      │     └─ gTTS → story_xxx.mp3
      └─ database.save_story(...)
              └─ stories 테이블에 저장

  GET /story/<id>  →  app.py → database.get_story(id)
                   →  storybook.html + storybook.js
                        ├─ 누끼 처리 (Canvas API)
                        ├─ 배경 이미지 표시 (scene.bg_image → /static/generated/bgs/)
                        ├─ 그림 배치 (텍스트 키워드 매칭)
                        └─ 3D 책 넘기기 애니메이션
```

---

## DB 스키마

```sql
-- 단어 목록 (시드 35개)
CREATE TABLE words (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  korean     TEXT NOT NULL,      -- "사자"
  english    TEXT NOT NULL,      -- "lion"
  emoji      TEXT NOT NULL,      -- "🦁"
  category   TEXT DEFAULT 'general'
);

-- 아이가 그린 그림
CREATE TABLE drawings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id    INTEGER REFERENCES words(id),
  image_data TEXT NOT NULL,   -- base64 data URI (원본)
  file_path  TEXT,            -- "static/generated/drawings/xxx.png"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 생성된 동화
CREATE TABLE stories (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  title             TEXT NOT NULL,
  content           TEXT NOT NULL,          -- 전체 텍스트 (4단락 합친 것)
  moral             TEXT,                   -- 교훈 문장
  keywords          TEXT NOT NULL,          -- JSON: ["사자", "토끼"]
  drawing_ids       TEXT NOT NULL,          -- JSON: [1, 3, 2]
  illustration_path TEXT,                   -- "static/generated/illustrations/xxx.png"
  audio_path        TEXT,                   -- "static/audio/xxx.mp3"
  scene_data        TEXT,                   -- JSON: [{text, bg, bg_image}, ...]
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### scene_data 구조 (핵심)

```json
[
  {
    "text": "단락1 텍스트 (2~3문장)",
    "bg": "cotton candy clouds floating in pastel sky",
    "bg_image": "static/generated/bgs/bg_abc123.jpg"
  },
  ...
]
```

- `text`: Gemini가 생성한 단락 텍스트
- `bg`: 영어로 된 배경 묘사 (SDXL 프롬프트로 사용)
- `bg_image`: SDXL-Turbo가 생성한 배경 이미지 경로 (없으면 CSS 그라데이션 폴백)

---

## 핵심 변수 / 함수 설명

### `config.py` — 전역 설정

| 변수                       | 설명                                        |
| -------------------------- | ------------------------------------------- |
| `Config.GEMINI_API_KEY`    | Gemini 동화 생성용 API 키                   |
| `Config.ANTHROPIC_API_KEY` | Claude 폴백용 API 키                        |
| `Config.OPENAI_API_KEY`    | DALL-E 참고 이미지용 (없으면 스킵)          |
| `Config.HUGGINGFACE_TOKEN` | 현재 미사용 (로컬 GPU로 대체)               |
| `Config.DRAWINGS_DIR`      | `static/generated/drawings/` 절대 경로      |
| `Config.BGS_DIR`           | `static/generated/bgs/` 절대 경로           |
| `Config.ILLUSTRATIONS_DIR` | `static/generated/illustrations/` 절대 경로 |
| `Config.AUDIO_DIR`         | `static/audio/` 절대 경로                   |
| `Config.MIN_SELECTED`      | 동화 생성 최소 그림 수 (1)                  |
| `Config.MAX_SELECTED`      | 동화 생성 최대 그림 수 (5)                  |

---

### `services/ai_service.py` — 동화 텍스트 생성

| 변수/함수                                   | 설명                                                            |
| ------------------------------------------- | --------------------------------------------------------------- |
| `_WORLDS`                                   | 15개 세계관 리스트. `(이름, 배경_묘사)` 튜플. 랜덤 선택         |
| `_GENRES`                                   | 10개 장르 리스트. `(이름, 플롯_설명)` 튜플. 랜덤 선택           |
| `_build_prompt(keywords)`                   | \_WORLDS + \_GENRES 랜덤 조합 + keywords로 Gemini 프롬프트 생성 |
| `_parse_result(text)`                       | Gemini 응답 JSON 파싱. `scenes` → `scene_data` 키로 변환        |
| `generate_fairy_tale(keywords, drawings)`   | 진입점. Gemini 우선 → Claude 폴백 → 기본 템플릿                 |
| `_generate_with_gemini(keywords, drawings)` | Gemini `gemini-2.5-flash-lite` 호출. Vision 포함 가능           |
| `_generate_with_claude(keywords, drawings)` | Claude `claude-sonnet-4-6` 폴백                                 |
| `_fallback_story(keywords)`                 | API 없을 때 하드코딩 기본 스토리 반환                           |

**반환 구조**:

```python
{
  "title": "동화 제목",
  "content": "단락1\n\n단락2\n\n단락3\n\n단락4",
  "moral": "이 이야기의 교훈: ...",
  "scene_data": [
    {"text": "단락1", "bg": "english bg description"},
    ...
  ]
}
```

---

### `services/image_service.py` — 배경 이미지 생성

| 변수/함수                                           | 설명                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `_pipe`                                             | 글로벌 SDXL-Turbo 파이프라인 인스턴스. 최초 1회만 로드                             |
| `_get_pipe()`                                       | `_pipe` 없으면 `stabilityai/sdxl-turbo` 로드 후 반환. CUDA 사용                    |
| `generate_scene_bg(bg_text)`                        | bg_text로 512×512 JPEG 생성 → `BGS_DIR` 저장 → 경로 반환                           |
| `generate_scene_bgs_parallel(scene_data)`           | scene_data 리스트 순회하며 각 `bg` 필드로 이미지 생성. 결과를 `bg_image` 키에 저장 |
| `generate_story_illustration(title, keywords)`      | DALL-E 3로 표지 이미지 생성 (OpenAI 키 없으면 None)                                |
| `generate_reference_image(korean, english, prompt)` | 그림 그리기 화면의 참고 이미지. DALL-E 3 사용                                      |

**SDXL-Turbo 특징**:

- `num_inference_steps=1` (단 1스텝으로 빠른 생성)
- `guidance_scale=0.0` (CFG 없음)
- 모델 로드 후 장면당 약 0.1초

---

### `services/tts_service.py` — 음성 생성

| 함수                       | 설명                                                  |
| -------------------------- | ----------------------------------------------------- |
| `generate_tts(text, slow)` | gTTS로 한국어 MP3 생성 → `AUDIO_DIR` 저장 → 경로 반환 |

---

### `static/js/storybook.js` — 3D 동화책 뷰어

| 변수/함수                                        | 설명                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `SCENE_THEMES`                                   | 15개 테마 배열. `{re, type, sky, ground}`. bg 텍스트로 CSS 그라데이션 선택        |
| `DECO_HTML`                                      | 테마별 장식 HTML (별, 구름, 거품 등)                                              |
| `KW_THEME`                                       | 한국어 키워드 → 테마 타입 매핑 (bg 판별 실패 시 폴백)                             |
| `SKY_KW`                                         | 하늘에 배치할 키워드 Set: `{'별','달','구름','무지개','태양','나비','풍선'}`      |
| `makeNukkiDataURL(img)`                          | Canvas로 흰 배경 제거. 밝기 > 248 → 투명, 215~248 → 반투명                        |
| `loadNukki(drawing)`                             | 그림 하나를 Promise로 누끼 처리. `drawing.nukkiUrl` 추가                          |
| `bgImgTag(scene)`                                | `scene.bg_image`(로컬) 우선, 없으면 Pollinations.ai URL로 fallback                |
| `mentioned(sceneText, allDrawings)`              | 장면 텍스트에 키워드가 포함된 그림만 필터링                                       |
| `mapToScenes(allDrawings, scenes, count)`        | 장면별 `{primary, secondary}` 결정. **텍스트 언급된 그림만 표시** (미언급 → null) |
| `makeDrawingPageHTML(primary, secondary, scene)` | 장면 페이지(좌) HTML 빌더. 배경 + 그림 배치                                       |
| `makeTextPageHTML(text, pageNum)`                | 텍스트 페이지(우) HTML 빌더                                                       |
| `spreads`                                        | `[{leftHTML, rightHTML}]` 배열. 표지(0) + 장면들(1~N) + 교훈(마지막)              |
| `current`                                        | 현재 펼쳐진 spread 인덱스                                                         |
| `goNext(targetIdx)`                              | 다음 페이지. 오른쪽 flipCard를 rotateY(-180deg)                                   |
| `goPrev(targetIdx)`                              | 이전 페이지. 왼쪽 flipCard를 rotateY(+180deg)                                     |

**3D 책 DOM 구조**:

```
#book-spread-container
  ├── #b-static-left    ← 왼쪽 고정 페이지 (z-index:2)
  ├── #b-under-right    ← 오른쪽 아래 페이지 (z-index:1, 플립 시 드러남)
  └── #b-flip-card      ← 3D 플립 카드 (z-index:10)
        ├── #b-flip-front   ← 앞면 (현재 오른쪽)
        └── #b-flip-back    ← 뒷면 (다음 왼쪽), rotateY(180deg)
```

---

### `static/js/collection.js` — 그림 선택

| 변수/함수         | 설명                                                          |
| ----------------- | ------------------------------------------------------------- |
| `selected`        | `Set<string>` — 선택된 drawing.id 집합 (문자열)               |
| `MAX_SELECT`      | 최대 선택 수 (5)                                              |
| `updateUI()`      | 선택 상태 시각화. 배지 번호, 버튼 활성화, 미선택 카드 dimming |
| `generateStory()` | `POST /api/story/generate` 호출. 로딩 오버레이 표시           |

---

## API 엔드포인트

| Method | Path                  | 설명                               |
| ------ | --------------------- | ---------------------------------- |
| GET    | `/api/words`          | 전체 단어 목록                     |
| GET    | `/api/drawings`       | 전체 그림 목록                     |
| POST   | `/api/drawing/save`   | 그림 저장 (base64 → PNG 파일 + DB) |
| POST   | `/api/drawing/help`   | DALL-E 참고 이미지 생성            |
| POST   | `/api/story/generate` | 동화 생성 전체 흐름                |
| DELETE | `/api/story/<id>`     | 동화 삭제                          |

---

## 동화 생성 전체 흐름 (`POST /api/story/generate`)

```
1. drawing_ids 받음 (1~5개)
   ↓
2. DB에서 그림 정보 조회
   drawings = get_drawings_by_ids(drawing_ids)
   keywords = [d['korean'] for d in drawings]  # 중복 제거
   ↓
3. [Gemini] 동화 텍스트 생성
   _build_prompt(keywords) → 랜덤 세계관 + 장르 조합
   gemini-2.5-flash-lite 호출
   → {title, scene_data: [{text, bg}, ...], moral}
   ↓
4. [로컬 GPU] 장면 배경 이미지 생성
   generate_scene_bgs_parallel(scene_data)
   SDXL-Turbo로 bg 텍스트 → 512×512 JPEG
   → scene_data[i]['bg_image'] = "static/generated/bgs/bg_xxx.jpg"
   ↓
5. [DALL-E] 표지 이미지 생성 (OpenAI 키 없으면 None)
   generate_story_illustration(title, keywords)
   ↓
6. [gTTS] 음성 생성
   generate_tts(title + content + moral)
   → "static/audio/story_xxx.mp3"
   ↓
7. DB 저장
   save_story(title, content, moral, keywords, drawing_ids,
              illustration_path, audio_path, scene_data)
   → story_id
   ↓
8. { success: true, story_id } 반환
   → 브라우저 /story/<story_id> 이동
```

---

## 스토리북 렌더링 흐름 (`GET /story/<id>`)

```
1. DB에서 story + drawings 조회
   ↓
2. storybook.html 렌더링
   <script id="story-data"> 에 JSON 삽입
   ↓
3. storybook.js 실행
   SD = JSON.parse(story-data)
   drawings = SD.drawings
   scenes = SD.scene_data
   ↓
4. 누끼 처리 (비동기)
   Promise.all(drawings.map(loadNukki))
   → drawing.nukkiUrl (흰배경 제거된 PNG)
   ↓
5. 장면별 그림 매핑
   mapToScenes(pDrawings, scenes, numContent)
   → [{primary, secondary}, ...] (텍스트 키워드 매칭)
   ↓
6. spreads 배열 구성
   [0] 표지 (제목 + TTS 버튼)
   [1~N] 장면 (배경이미지 + 누끼그림 | 텍스트)
   [N+1] 교훈 + 종료
   ↓
7. 렌더링 + 3D 페이지 넘기기 이벤트 등록
```

---

## 네비게이션 흐름

```
/ (landing)
  └─→ /main
        ├─→ /draw  →  그림 저장  →  /collection
        ├─→ /collection  →  동화 생성  →  /story/<id>
        └─→ /library  →  /story/<id>
```
