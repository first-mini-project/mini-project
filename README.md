# AI 동화 만들기

아이가 직접 그린 그림으로 AI가 동화를 만들어주는 웹 앱입니다.

## 팀원 및 역할

| 이름   | 담당 역할                         |
| ------ | --------------------------------- |
| 홍찬영 | AI 스토리 생성 + 배경 이미지 생성 |
| 방혁   | 그림 그리기 캔버스 기능           |
| 김봉환 | 그린 그림 저장 및 관리            |
| 이예진 | 스토리 저장 기능                  |
| 홍수진 | 스토리 저장 기능                  |

---

## 서비스 흐름

```
① 단어를 보고 캔버스에 그림 그리기
② 그린 그림 1~5개 선택 + 주인공 지정 (선택)
③ AI가 동화 스토리 + 배경 이미지 + 음성 자동 생성
④ 완성된 동화책 감상 및 도서관에 저장
```

---

## 기술 스택

| 분류              | 기술                                                        |
| ----------------- | ----------------------------------------------------------- |
| 백엔드            | Python + Flask                                              |
| AI 동화 생성      | Gemini 2.5 Flash Lite (우선) / Claude Sonnet 4.6 (폴백)    |
| AI 배경 이미지    | SD-Turbo (로컬 GPU) / Pollinations.ai (폴백)               |
| AI 참고 이미지    | SD-Turbo (로컬 GPU, 컬러링북 스타일)                        |
| TTS 음성          | CLOVA Voice - Premium (우선) / gTTS (폴백)                  |
| DB                | SQLite                                                      |
| 포트              | 5000                                                        |

---

## 환경 변수 설정

`.env` 파일을 생성하고 아래 키를 입력하세요.

| 변수                   | 필수 | 설명                              |
| ---------------------- | ---- | --------------------------------- |
| `GEMINI_API_KEY`       | 권장 | 동화 생성 (Google AI Studio)      |
| `ANTHROPIC_API_KEY`    | 선택 | Gemini 실패 시 폴백 (Claude)      |
| `OPENAI_API_KEY`       | 선택 | DALL-E 표지 이미지 생성           |
| `CLOVA_CLIENT_ID`      | 권장 | CLOVA Voice TTS (NCP 콘솔)        |
| `CLOVA_CLIENT_SECRET`  | 권장 | CLOVA Voice TTS (NCP 콘솔)        |
| `NGROK_AUTH_TOKEN`     | 선택 | 외부 공개용 ngrok 터널            |
| `SECRET_KEY`           | 선택 | Flask 세션 키 (기본값 있음)       |

---

## 실행 방법

```bash
# 의존성 설치
pip install -r requirements.txt

# 서버 실행 (로컬)
python app.py

# 외부 공개 (ngrok)
python run_ngrok.py --token YOUR_NGROK_TOKEN

# 브라우저 접속
http://localhost:5000
```

---

## 주요 기능

### 그림 그리기

- 랜덤 단어 제시 → 캔버스에 자유롭게 그리기
- **2열 레이아웃**: 왼쪽 패널(단어 카드 / 예시 그림 / 밑그림 버튼) + 오른쪽 캔버스
- AI 참고 이미지 생성 기능 (SD-Turbo, 컬러링북 스타일 — 4~7세 따라 그리기용)
- 그린 그림은 그림 모음장에 저장

### AI 동화 생성

- 그림 키워드 기반으로 Gemini AI가 4장면 동화 작성
- **주인공 지정**: 선택한 그림 중 하나를 주인공으로 지정 가능 (항상 맨 앞에 배치)
- 각 장면에 어울리는 배경 이미지 자동 생성 (병렬 처리)
- 아이 그림 객체가 배경에 중복 등장하지 않도록 제외 처리
- CLOVA Voice로 동화 전체 음성 낭독 생성 (gTTS 폴백)
- 교훈 페이지 콜라주 이미지 자동 생성

### 동화책 뷰어

- 배경 + 아이 그림 + 텍스트 + 음성이 합쳐진 동화책 형태
- 스토리 문맥에 따라 그림 크기 자동 조절 (SIZE_BIG / PROMINENT / DIST_FAR / SIZE_SMALL)
- 그림 최대 5개 동시 배치: primary / secondary / tertiary / quaternary / quinary
- 하늘 / 땅 자동 분류 배치 (ALWAYS_GROUND_KW로 나무·꽃·집 등 강제 땅 고정)
- 땅 그림 레이아웃: 1개(단독) → pair(2) → trio(3) → quad(4) → quint(5)
- AI가 present 누락 시 텍스트 언급으로 자동 보완

### 도서관 & 뱃지 시스템

- 만든 동화 모아보기
- 책 수에 따라 뱃지 획득: 🌱 새싹 → 🌳 꿈나무 → ✨ 마법 → 👑 전설 작가

---

## 전체 아키텍처

```mermaid
flowchart TD
    subgraph FE[프론트엔드]
        landing[landing.html]
        main[main.html]
        draw[drawing.html + canvas.js]
        collection[collection.html + collection.js]
        library[library.html]
        storybook[storybook.html + storybook.js]
    end
    subgraph BE[Flask 백엔드 app.py]
        api1[POST /api/drawing/save]
        api2[POST /api/story/generate]
        api3[DELETE /api/story/:id]
        api4[POST /api/drawing/help]
    end
    subgraph SVC[서비스 레이어]
        ai[ai_service.py Gemini 3 Flash Preview / Claude Sonnet 4.6]
        img[image_service.py SD-Turbo / Pollinations / DALL-E 3]
        tts[tts_service.py CLOVA Voice / gTTS]
    end
    subgraph DB[SQLite DB]
        d[(그림)]
        s[(스토리)]
    end
    landing --> main
    main --> draw & collection & library
    draw -->|저장| api1 --> d
    collection -->|그림 선택 + 주인공 지정| api2
    api2 --> ai & img & tts
    api2 --> s
    library --> s
    storybook --> s
    api4 --> ai & img
```

---

## 동화 생성 흐름

```mermaid
sequenceDiagram
    actor 사용자
    participant FE as collection.js
    participant BE as app.py
    participant AI as ai_service
    participant IMG as image_service
    participant TTS as tts_service
    participant DB as database

    사용자->>FE: 그림 1~5개 선택 + 주인공 지정 후 동화 만들기
    FE->>BE: POST /api/story/generate {drawing_ids, protagonist_id}
    BE->>AI: generate_fairy_tale(keywords, drawings, protagonist_kw)
    AI->>AI: Gemini 2.5 Flash Lite (Vision)
    Note right of AI: 폴백: Claude Sonnet 4.6
    AI-->>BE: title, scenes[4], moral, name_map
    BE->>BE: present 처리 (정확→조사제거→부분매칭→텍스트보완)
    BE->>BE: layout_spreads 계산 (5슬롯: primary~quinary)
    BE->>IMG: generate_scene_bgs_parallel(scene_data)
    Note right of IMG: exclude_en로 아이 그림 배경 제외
    IMG-->>BE: bg_image 4장 병렬
    BE->>IMG: generate_moral_collage
    IMG-->>BE: 교훈 콜라주 이미지
    BE->>TTS: generate_tts
    TTS-->>BE: audio_path MP3
    BE->>DB: save_story
    DB-->>BE: story_id
    BE-->>FE: success, story_id, level_up
    FE->>사용자: /story/:id 이동
```

---

## 동화책 뷰어 렌더링 흐름

```mermaid
flowchart TD
    start([페이지 로드]) --> parse[story-data JSON 파싱]
    parse --> spreads[layout_data.spreads 순회]
    spreads --> cover{type?}
    cover -->|cover| cov[makeCoverLeftHTML 배경+제목 오버레이]
    cover -->|content| cont[makeDrawingPageHTML 배경+그림 배치]
    cover -->|moral| moral[교훈 페이지 콜라주]
    cover -->|end| end_page[종료 페이지]
    cont --> scale[getDrawingScale 스토리 문맥 크기 조절]
    scale -->|SIZE_BIG| s1[1.5x]
    scale -->|PROMINENT| s2[1.3x]
    scale -->|DIST_NEAR| s3[1.2x]
    scale -->|기본| s4[1.0x]
    scale -->|DIST_FAR| s5[0.6x]
    scale -->|SIZE_SMALL| s6[0.75x]
    cont --> classify[하늘/땅 분류\nALWAYS_GROUND_KW 우선 적용]
    classify --> ground[땅 레이아웃\npair→trio→quad→quint]
    classify --> sky[하늘 레이아웃\nsky / sky-right]
    ground --> force[미배정 그림 강제 분배\nsecondary→tertiary→quaternary→quinary→primary]
    sky --> force
    force --> render[HTML 렌더링]
    render --> nav[페이징 이전/다음]
    nav --> ttsplay[TTS 재생]
```

---

## 그림 배치 상세

### 슬롯 구조 (최대 5개)

| 슬롯        | 우선순위 | 비고                      |
| ----------- | -------- | ------------------------- |
| primary     | 1        | 주인공 or 첫 번째 그림    |
| secondary   | 2        |                           |
| tertiary    | 3        |                           |
| quaternary  | 4        |                           |
| quinary     | 5        |                           |

### 땅 레이아웃 CSS 클래스

| 그림 수 | CSS 클래스                                               |
| ------- | -------------------------------------------------------- |
| 1       | (기본 위치)                                              |
| 2       | `ground-pair-l` / `ground-pair-r`                        |
| 3       | `ground-trio-l` / `ground-trio-c` / `ground-trio-r`      |
| 4       | `ground-quad-1` ~ `ground-quad-4`                        |
| 5       | `ground-quint-1` ~ `ground-quint-5`                      |

### ALWAYS_GROUND_KW (항상 땅에 배치)

나무, 꽃, 집, 산, 성, 탑, 다리, 마을, 동굴, 버섯, 풀, 바위, 강, 연못, 나뭇잎, 씨앗

---

## AI 서비스 상세 (`services/ai_service.py`)

### 모델

- **기본**: `gemini-2.5-flash-lite` (Google AI Studio, 무료)
- **폴백**: `claude-sonnet-4-6` (Anthropic)

### 한국어 조사 교정

- `_fix_korean_particles(text, protect_words)`: 복합어 오분석 방지
- 키워드를 `\x00KW0\x00` 플레이스홀더로 보호 후 조사 교정, 복원
- 잘못된 조사만 교정 (`이/가`, `은/는`, `을/를`, `과/와`, `으로/로` 등)

### AI 반환 구조

```json
{
  "title": "동화 제목",
  "scenes": [
    {
      "text": "장면 텍스트",
      "background": "배경 설명 (영어)",
      "present": ["키워드1", "키워드2"]
    }
  ],
  "moral": "교훈 문장",
  "name_map": { "원래키워드": "AI가_붙인_이름" }
}
```

### present 처리 순서 (`app.py`)

1. 정확 매칭 (`kw_to_id`, `char_name_to_id`)
2. 조사 제거 후 재시도 (`"냥이가"` → `"냥이"`)
3. 부분 매칭 (`"뭉게"` → `"뭉게구름"`)
4. 텍스트 언급 보완 (AI present 누락분 자동 추가)
