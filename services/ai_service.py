import json
import re
import sys
import os
import random

# ─── 한국어 조사 교정 유틸리티 ─────────────────────────────────────────────────


def _has_batchim(char: str) -> bool:
    """한글 글자에 받침이 있는지 확인합니다. (유니코드 공식 사용)"""
    if not char:
        return False
    code = ord(char)
    if 0xAC00 <= code <= 0xD7A3:
        return (code - 0xAC00) % 28 != 0
    return False


def _has_rieul_batchim(char: str) -> bool:
    """한글 글자의 받침이 ㄹ인지 확인합니다. (으로/로 구분용)"""
    if not char:
        return False
    code = ord(char)
    if 0xAC00 <= code <= 0xD7A3:
        return (code - 0xAC00) % 28 == 8  # ㄹ은 받침 인덱스 8
    return False


def _fix_korean_particles(text: str) -> str:
    """한국어 조사를 올바르게 교정합니다.

    교정 항목:
    - 은/는, 이/가, 을/를, 과/와, 으로/로, 이나/나, 이랑/랑
    - 연속 나열 패턴: "A가 B가" → "A과/와 B가"
    """
    # 조사 뒤에 공백·문장부호·줄바꿈·문자열 끝이 오는 경우만 교정 (복합어 오탐 방지)
    B = r"(?=[\s,.!?。、\n\'\"]|$)"

    # ── 1단계: 연속 나열 패턴 먼저 교정 ──────────────────────────────────────
    # "A가 B가" → "A과/와 B가",  "A이 B이" → "A과/와 B이"
    def _fix_consecutive(m):
        char1, space, word2, p2 = m.group(1), m.group(3), m.group(4), m.group(5)
        conj = "과" if _has_batchim(char1) else "와"
        return char1 + conj + space + word2 + p2

    text = re.sub(r"([가-힣])(가)(\s+)([가-힣]+)(가)" + B, _fix_consecutive, text)
    text = re.sub(r"([가-힣])(이)(\s+)([가-힣]+)(이)" + B, _fix_consecutive, text)

    # ── 2단계: 개별 조사 교정 (긴 패턴 → 짧은 패턴 순서) ─────────────────────

    # 이나/나
    def _fix_ina(m):
        char = m.group(1)
        return char + ("이나" if _has_batchim(char) else "나")

    text = re.sub(r"([가-힣])(이나|나)" + B, _fix_ina, text)

    # 이랑/랑
    def _fix_irang(m):
        char = m.group(1)
        return char + ("이랑" if _has_batchim(char) else "랑")

    text = re.sub(r"([가-힣])(이랑|랑)" + B, _fix_irang, text)

    # 으로/로 (ㄹ받침 또는 받침 없으면 → 로, 나머지 받침 → 으로)
    def _fix_euro(m):
        char = m.group(1)
        if not _has_batchim(char) or _has_rieul_batchim(char):
            return char + "로"
        return char + "으로"

    text = re.sub(r"([가-힣])(으로|로)" + B, _fix_euro, text)

    # 은/는 — 단, 동사/형용사 관형형 어미 '는' 은 교정하지 않음
    # (있는, 없는, 맞는, 먹는, 가는 등 → 조사 아님)
    _VERB_BEFORE_NEUN = {
        "있",
        "없",
        "맞",
        "낫",
        "겠",
        "했",
        "갔",
        "왔",
        "봤",
        "됐",
        "먹",
        "가",
        "오",
        "보",
        "자",
        "나",
        "사",
        "타",
        "쓰",
        "크",
    }

    def _fix_eun_neun(m):
        char, josa = m.group(1), m.group(2)
        if josa == "는" and char in _VERB_BEFORE_NEUN:
            return char + "는"  # 관형형 어미 보호
        return char + ("은" if _has_batchim(char) else "는")

    text = re.sub(r"([가-힣])([은는])" + B, _fix_eun_neun, text)

    # 이/가
    def _fix_i_ga(m):
        char = m.group(1)
        return char + ("이" if _has_batchim(char) else "가")

    text = re.sub(r"([가-힣])([이가])" + B, _fix_i_ga, text)

    # 을/를
    def _fix_eul_reul(m):
        char = m.group(1)
        return char + ("을" if _has_batchim(char) else "를")

    text = re.sub(r"([가-힣])([을를])" + B, _fix_eul_reul, text)

    # 과/와
    def _fix_gwa_wa(m):
        char = m.group(1)
        return char + ("과" if _has_batchim(char) else "와")

    text = re.sub(r"([가-힣])([과와])" + B, _fix_gwa_wa, text)

    return text


sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import Config

# ─── 스토리 다양성 재료 ──────────────────────────────────────────────────────

_WORLDS = [
    ("🌌 우주 모험", "별빛 행성들, 반짝이는 성운, 우주선, 외계 생물"),
    ("🌊 바닷속 왕국", "산호초, 빛나는 심해, 인어, 거품 궁전"),
    ("🌲 마법의 숲", "빛나는 버섯, 요정, 신비한 나무 위 마을, 말하는 동물"),
    ("☁️ 구름 위 왕국", "솜사탕 구름, 무지개 다리, 하늘 성, 바람 요정"),
    ("🍬 과자 나라", "초콜릿 강, 사탕 집, 마시멜로 산, 쿠키 길"),
    ("🦕 공룡 세계", "거대한 정글, 화산, 공룡 친구들, 고대 유적"),
    ("❄️ 얼음 왕국", "오로라, 얼음 궁전, 눈의 요정, 북극곰 마을"),
    ("🌸 봄의 꽃 왕국", "꽃잎 카펫, 나비 마차, 꽃 요정, 봄비 마법"),
    ("🏴‍☠️ 해적 모험", "보물 섬, 돛단배, 해적 지도, 숨겨진 동굴"),
    ("🏰 마법 왕국", "탑이 높은 성, 기사, 용, 마법 도서관"),
    ("🎪 마법 서커스", "공중 그네, 변신 마법사, 신기한 동물단, 반짝이 텐트"),
    ("🌋 화산 섬", "용암 강, 불꽃 도마뱀, 보물 동굴, 열대 밀림"),
    ("🍄 버섯 마을", "거대 버섯 집, 귀여운 곤충 친구들, 이슬 연못, 반딧불 축제"),
    ("🎠 놀이공원 나라", "회전목마, 마법 롤러코스터, 솜사탕 구름, 거울 미로"),
    ("🌙 달나라", "달빛 초원, 달토끼 마을, 별똥별 미끄럼틀, 은빛 강"),
]

_GENRES = [
    ("모험", "주인공이 위험한 모험을 떠나 보물이나 비밀을 발견한다"),
    ("우정", "처음에 서로 다른 두 존재가 친구가 되어 함께 문제를 해결한다"),
    ("성장", "겁쟁이 주인공이 용기를 내어 중요한 일을 해낸다"),
    ("구조", "위험에 처한 누군가를 구하기 위해 주인공이 활약한다"),
    ("미스터리", "이상한 사건의 비밀을 파헤치다 예상치 못한 결말을 맞는다"),
    ("소원", "소원을 이루려다 뜻밖의 일이 생기고 진짜 행복을 깨닫는다"),
    ("변신", "마법으로 변신한 주인공이 자신의 진짜 모습을 찾아간다"),
    ("경쟁", "라이벌과 겨루다 진정한 협력의 의미를 발견한다"),
    ("여행", "집을 잃어버린 주인공이 새 친구들과 집을 찾아 돌아온다"),
    ("축제", "마을 축제를 위해 모두가 힘을 합치며 일어나는 유쾌한 소동"),
]


# ─── 사물/장소 분류 (의인화 방지) ─────────────────────────────────────────────
_INANIMATE_WORDS = {
    "집",
    "나무",
    "산",
    "성",
    "다리",
    "마을",
    "탑",
    "건물",
    "동굴",
    "기차",
    "자동차",
    "배",
    "버스",
    "트럭",
    "사과",
    "수박",
    "딸기",
    "당근",
    "바나나",
    "케이크",
    "아이스크림",
    "포도",
    "구름",
    "별",
    "달",
    "태양",
    "무지개",
    "풍선",
    "연",
    "왕관",
    "마법지팡이",
    "꽃",
    "바다",  # 자연 배경 요소 (의인화 금지)
}


def _kw_role(i: int, kw: str, protagonist_kw: str = None) -> str:
    if protagonist_kw:
        if kw == protagonist_kw:
            return f"  - [{i+1}] {kw}: 주인공 캐릭터 (사용자 지정) → 서사의 중심 주체로 의인화하여 등장"
        return f"  - [{i+1}] {kw}: 조연 캐릭터 → 주인공과 상호작용하는 캐릭터로 등장"
    # 주인공 미지정: 첫 번째 키워드가 주인공, 나머지 조연
    label = "주인공 캐릭터" if i == 0 else "조연 캐릭터"
    return f"  - [{i+1}] {kw}: {label}"


def _build_prompt(
    keywords: list, eng_keywords: list = None, protagonist_kw: str = None
) -> str:
    """단어 목록으로 동화 생성 프롬프트를 만듭니다. 세계관·장르를 랜덤 선택해 다양성을 확보합니다."""
    world_name, world_desc = random.choice(_WORLDS)
    genre_name, genre_desc = random.choice(_GENRES)

    role_hints = "\n".join(
        _kw_role(i, kw, protagonist_kw) for i, kw in enumerate(keywords)
    )
    kw_list = ", ".join(keywords)

    # 사용자가 주인공을 직접 지정한 경우 강조 블록 삽입
    other_kws = [kw for kw in keywords if kw != protagonist_kw]
    if protagonist_kw:
        other_note = (
            (
                f"\nAll Keywords Required: 나머지 단어 [{', '.join(other_kws)}]도 반드시 이야기 안에 등장해야 한다."
                f" 사물은 소품·배경 요소로, 조연 캐릭터는 이야기 속에서 **'{protagonist_kw}'**와 상호작용하는 역할로 활용하라."
            )
            if other_kws
            else ""
        )
        protagonist_block = f"""
━━ 🌟 주인공 지정 (사용자가 선택) ━━
Primary Protagonist: 이 동화의 유일한 주인공은 **'{protagonist_kw}'**이다.
Narrative Anchor: 모든 이야기의 전개, 갈등 해결, 결말은 반드시 **'{protagonist_kw}'**를 중심으로 이루어져야 한다.
Character Identity: **'{protagonist_kw}'**가 생물이든 무생물이든 관념이든 상관없이 의인화하거나 서사의 주체로 설정하여 주인공의 지위를 부여하라.
No Sidekick Takeover: 다른 조연 캐릭터가 등장하더라도 결코 **'{protagonist_kw}'**보다 비중이 커지거나 주인공 역할을 대신해서는 안 된다.
Cover Illustration: 표지 배경 이미지는 반드시 주인공 **'{protagonist_kw}'**가 가장 크고 명확하게 보이는 장면으로 묘사하라.{other_note}"""
    else:
        protagonist_block = ""

    # bg 필드에서 제외해야 할 영어 키워드 (아이가 그린 그림 → 배경에 나오면 안 됨)
    if eng_keywords:
        excl_note = (
            f"\n   ⛔ NEVER include these objects in bg (child drew them, will be placed on top): "
            f"{', '.join(eng_keywords)}"
        )
    else:
        excl_note = ""

    bg_rule = (
        f"pure environment scenery only in English"
        f" (NO characters, NO animals, NO creatures, NO people{excl_note}"
        f" — ONLY describe landscape/sky/weather/atmosphere like"
        f" 'cotton candy clouds floating in pastel sky',"
        f" 'rainbow bridge over sparkling river',"
        f" 'magical glowing mushroom forest')"
    )

    return f"""당신은 4~7세 한국 어린이를 위한 창의적인 동화 작가입니다.
{protagonist_block}
━━ 이번 이야기 설정 (반드시 따르세요) ━━
🌍 세계관: {world_name}
   배경 분위기: {world_desc}
📖 장르/플롯: {genre_name} — {genre_desc}

━━ 등장 단어 (아이가 직접 그린 그림) ━━
{role_hints}

★ 핵심 규칙
- 위 세계관과 장르를 정확히 따라야 합니다 (자의적으로 바꾸지 마세요)
- ⚠️ 위 단어 [{kw_list}] 은 모두 반드시 장면(text) 안에 직접 등장해야 합니다
  단어를 빠뜨리면 안 됩니다. 4개 단락에 골고루 분산하세요
- 캐릭터에게 이름을 붙일 경우, 반드시 매 장면(text)마다 원래 단어를 최소 1회 포함하세요
  예) "콩이 토끼는...", "토끼 콩이가..." — 이름만 단독으로 쓰면 안 됩니다
- 단어들이 서로 만나고, 상호작용하며 이야기가 전개되어야 합니다

작성 규칙:
1. 4개 단락 (각 2~3문장, 전체 250~350자)
2. 각 단락의 배경 장면을 영어로 한 줄 설명 (이미지 생성용)
3. 4~7세 어린이 말투, 해피엔딩
4. 교훈 한 줄

반드시 아래 JSON 형식으로만 응답 (추가 설명 없이):
{{
  "title": "동화 제목 (10자 이내)",
  "name_map": {{"원래단어": "캐릭터이름"}},
  "scenes": [
    {{"text": "단락1 (2~3문장)", "bg": "{bg_rule}", "present": ["이 장면에 실제 등장하는 원래 단어 목록"]}},
    {{"text": "단락2", "bg": "{bg_rule}", "present": []}},
    {{"text": "단락3", "bg": "{bg_rule}", "present": []}},
    {{"text": "단락4", "bg": "{bg_rule}", "present": []}}
  ],
  "moral": "이 이야기의 교훈: ..."
}}
⚠️ name_map과 present는 반드시 출력해야 하는 필수 필드입니다.
※ name_map: 캐릭터에게 이름을 붙인 경우 반드시 기입. 예) {{"나무": "고목 할아버지", "토끼": "콩이"}}. 이름 없으면 빈 객체 {{}}
※ present: 각 장면마다 반드시 작성. 해당 장면에 직접 등장해 행동·상호작용하는 경우만 포함. **장면당 최대 2개**.
  - 원래 단어 또는 name_map의 캐릭터 이름 중 하나를 일관되게 사용 (섞어 쓰지 말 것)
  - 유사 단어 사용 금지 (예: 왕관→왕국 금지)
  - 3개 이상의 캐릭터가 같은 장면에 등장하지 않도록 이야기를 구성하세요
  - 예) "고목 할아버지가 손을 흔들었어요" → present에 "고목 할아버지" 또는 "나무" 포함
  - 예) "나무가 알려준 지도를 꺼냈어요" → present에 나무 미포함 (직접 등장 아님)"""


def _strip_markdown(text: str) -> str:
    """Gemini가 반환하는 **굵은글씨** 마크다운을 제거합니다."""
    if not text:
        return text
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    return text


def _parse_result(response_text: str) -> dict:
    """LLM 응답 텍스트에서 JSON을 추출하고 scene_data/content를 정리합니다."""
    text = response_text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    result = json.loads(text)
    if "scenes" in result and isinstance(result["scenes"], list):
        result["scene_data"] = result.pop("scenes")
        result["content"] = "\n\n".join(
            s["text"] for s in result["scene_data"] if s.get("text")
        )
    else:
        result["scene_data"] = None

    # 마크다운 제거 후 조사 맞춤법 교정
    if result.get("title"):
        result["title"] = _fix_korean_particles(_strip_markdown(result["title"]))
    if result.get("scene_data"):
        for scene in result["scene_data"]:
            if scene.get("text"):
                scene["text"] = _fix_korean_particles(_strip_markdown(scene["text"]))
        result["content"] = "\n\n".join(
            s["text"] for s in result["scene_data"] if s.get("text")
        )
    elif result.get("content"):
        result["content"] = _fix_korean_particles(_strip_markdown(result["content"]))
    if result.get("moral"):
        result["moral"] = _fix_korean_particles(_strip_markdown(result["moral"]))

    return result


def generate_fairy_tale(
    keywords: list, drawings: list = None, protagonist_kw: str = None
) -> dict:
    """
    Gemini (우선) 또는 Claude를 사용하여 한국어 동화를 생성합니다.
    keywords: 한국어 단어 리스트
    drawings: 아이가 그린 그림 리스트 (image_data 포함) — Vision API로 그림 분석
    protagonist_kw: 사용자가 선택한 주인공 키워드 (없으면 None)
    Returns: {'title': str, 'content': str, 'moral': str, 'scene_data': list}
    """
    # Gemini 우선
    if Config.GEMINI_API_KEY:
        return _generate_with_gemini(keywords, drawings, protagonist_kw)
    # Claude 폴백
    if Config.ANTHROPIC_API_KEY:
        return _generate_with_claude(keywords, drawings, protagonist_kw)
    return _fallback_story(keywords)


def _generate_with_gemini(
    keywords: list, drawings: list = None, protagonist_kw: str = None
) -> dict:
    """Gemini로 동화를 생성합니다."""
    try:
        import base64
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=Config.GEMINI_API_KEY)
        eng_keywords = [
            d.get("english", "") for d in (drawings or []) if d.get("english")
        ]
        prompt = _build_prompt(keywords, eng_keywords, protagonist_kw)
        parts = []

        # 그림이 있으면 Vision 포함
        has_images = drawings and any(d.get("image_data") for d in drawings)
        if has_images:
            for drawing in drawings:
                img_data = drawing.get("image_data", "")
                if not img_data or not img_data.startswith("data:image/"):
                    continue
                header, encoded = img_data.split(",", 1)
                mime_type = header.split(":")[1].split(";")[0]
                parts.append(
                    types.Part.from_bytes(
                        data=base64.b64decode(encoded),
                        mime_type=mime_type,
                    )
                )
            parts.append(
                types.Part.from_text(
                    text="위 그림들은 아이가 직접 그린 그림이에요. 그림의 느낌과 분위기를 이야기에 반영해주세요.\n\n"
                    + prompt
                )
            )
        else:
            parts.append(types.Part.from_text(text=prompt))

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=parts,
            config=types.GenerateContentConfig(
                temperature=0.9,
                max_output_tokens=1024,
            ),
        )
        return _parse_result(response.text)

    except Exception as e:
        print(f"[Gemini API 오류] {e}")
        # Claude로 재시도
        if Config.ANTHROPIC_API_KEY:
            return _generate_with_claude(keywords, drawings, protagonist_kw)
        return _fallback_story(keywords)


def _generate_with_claude(
    keywords: list, drawings: list = None, protagonist_kw: str = None
) -> dict:
    """Claude로 동화를 생성합니다 (폴백)."""
    try:
        import anthropic

        client = anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)
        eng_keywords = [
            d.get("english", "") for d in (drawings or []) if d.get("english")
        ]
        prompt = _build_prompt(keywords, eng_keywords, protagonist_kw)
        has_images = drawings and any(d.get("image_data") for d in drawings)
        content = []

        if has_images:
            for drawing in drawings:
                img_data = drawing.get("image_data", "")
                if not img_data or not img_data.startswith("data:image/"):
                    continue
                header, encoded = img_data.split(",", 1)
                media_type = header.split(":")[1].split(";")[0]
                content.append(
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": encoded,
                        },
                    }
                )
            content.append(
                {
                    "type": "text",
                    "text": "위 그림들은 아이가 직접 그린 그림이에요. 그림의 느낌과 분위기를 반영해주세요.\n\n"
                    + prompt,
                }
            )
        else:
            content.append({"type": "text", "text": prompt})

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": content}],
        )
        return _parse_result(message.content[0].text)

    except Exception as e:
        print(f"[Claude API 오류] {e}")
        return _fallback_story(keywords)


def generate_image_prompt(korean_word: str, english_word: str) -> str:
    """
    Claude를 사용해 DALL-E 이미지 생성용 프롬프트를 최적화합니다.
    """
    if not Config.ANTHROPIC_API_KEY:
        return f"A cute, simple children's drawing of a {english_word}, colorful cartoon style, white background, no text"

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=120,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Create a DALL-E image prompt (max 60 words) for a children's drawing reference "
                        f"of '{korean_word}' ({english_word}). "
                        f"Style: cute, simple, colorful cartoon on white background, no text, "
                        f"suitable for 4-7 year olds to use as drawing reference. "
                        f"Give only the prompt text, nothing else."
                    ),
                }
            ],
        )
        return message.content[0].text.strip()

    except Exception as e:
        print(f"[이미지 프롬프트 생성 오류] {e}")
        return f"A cute, simple children's drawing of a {english_word}, colorful cartoon style, white background, no text"


def _fallback_story(keywords: list) -> dict:
    """API 없을 때 모든 키워드를 사용하는 기본 동화를 반환합니다."""
    kws = keywords if keywords else ["친구"]

    # 비사물 키워드 중 첫 번째를 주인공으로 선택 (사물 의인화 방지)
    hero = next((kw for kw in kws if kw not in _INANIMATE_WORDS), None)
    if hero is None:
        hero = "토끼"  # 모든 키워드가 사물이면 기본 주인공 사용

    others = [kw for kw in kws if kw != hero]
    k1 = others[0] if len(others) > 0 else ""
    k2 = others[1] if len(others) > 1 else ""
    k3 = others[2] if len(others) > 2 else ""

    _PLACE_WORDS = {"집", "성", "동굴", "마을", "탑", "건물"}
    _CELESTIAL_WORDS = {"달", "별", "태양", "무지개", "구름"}
    _PORTABLE_OBJECTS = {
        "왕관",
        "마법지팡이",
        "케이크",
        "아이스크림",
        "사과",
        "딸기",
        "수박",
        "바나나",
        "포도",
        "당근",
        "풍선",
    }

    _LIGHT_CELESTIAL = {"달", "별", "태양"}  # 빛을 내는 천체

    def intro_with_k1():
        if not k1:
            return f"{hero}는"
        if k1 in _PLACE_WORDS:
            return f"포근한 {k1} 안에 사는 {hero}는"
        if k1 in _LIGHT_CELESTIAL:
            return f"{k1}빛 아래 사는 {hero}는"
        if k1 in _CELESTIAL_WORDS:  # 구름, 무지개 등
            return f"{k1} 아래 사는 {hero}는"
        if k1 in _PORTABLE_OBJECTS:
            return f"{k1}를 소중히 여기는 {hero}는"
        if k1 in _INANIMATE_WORDS:
            return f"{k1} 곁에 사는 {hero}는"
        return f"{k1}와 사이좋게 지내는 {hero}는"

    def find_k2():
        if not k2:
            return "신기한 것을 발견했어요."
        if k2 in _PLACE_WORDS:
            return f"아름다운 {k2}을 발견했어요."
        if k2 in _PORTABLE_OBJECTS:
            return f"반짝이는 {k2}을 발견했어요."
        if k2 in _CELESTIAL_WORDS:
            return f"빛나는 {k2}을 발견했어요."
        if k2 in _INANIMATE_WORDS:
            return f"신기한 {k2}을 발견했어요."
        return f"새로운 친구 {k2}을 만났어요."

    def help_with_k2():
        if not k2:
            return ""
        if k2 in _PORTABLE_OBJECTS:
            return f" {k2}를 이용해"
        if k2 in _INANIMATE_WORDS:
            return f" {k2}의 도움으로"
        return f" {k2}와 힘을 합쳐"

    def scene3_end():
        if not k3:
            return "모두가 기뻐하며 환호했답니다."
        if k3 in _INANIMATE_WORDS:
            return f"{k3}이 환하게 빛났어요. 모두가 기뻐했답니다."
        return f"{k3}도 함께 도와 모두가 기뻐했답니다."

    def return_home():
        if not k1:
            return f"{hero}는 집으로 돌아왔어요."
        if k1 in _PLACE_WORDS:
            return f"{hero}는 {k1}으로 돌아왔어요."
        if k1 in _PORTABLE_OBJECTS:
            return f"{hero}는 {k1}을 가슴에 안고 집으로 돌아왔어요."
        if k1 in _CELESTIAL_WORDS:
            return f"{hero}는 {k1}을 바라보며 집으로 돌아왔어요."
        if k1 in _INANIMATE_WORDS:
            return f"{hero}는 집으로 돌아왔어요. {k1}이 환하게 빛났어요."
        return f"{hero}는 {k1}과 함께 집으로 돌아왔어요."

    scenes = [
        {
            "text": _fix_korean_particles(
                f"옛날 옛날에 {intro_with_k1()} 오늘 멋진 모험을 떠나기로 했답니다."
            ),
            "bg": "magical sunlit meadow with soft clouds and colorful wildflowers",
        },
        {
            "text": _fix_korean_particles(f"{hero}는 길을 걷다가 {find_k2()}"),
            "bg": "winding forest path with dappled sunlight and sparkling stream",
        },
        {
            "text": _fix_korean_particles(
                f"{hero}는{help_with_k2()} 용기를 내어 친구들을 도와주었어요. {scene3_end()}"
            ),
            "bg": "cheerful open field with rainbow in the sky and happy animals",
        },
        {
            "text": _fix_korean_particles(
                f"해가 질 무렵 {return_home()} 오늘 하루가 정말 행복했답니다."
            ),
            "bg": "warm sunset over a cozy village with glowing windows",
        },
    ]

    return {
        "title": _fix_korean_particles(f"{hero}의 멋진 하루"),
        "content": "\n\n".join(s["text"] for s in scenes),
        "scene_data": scenes,
        "moral": _fix_korean_particles(
            "이 이야기의 교훈: 용기를 내면 멋진 일이 생긴답니다. 친구와 함께라면 더욱 신나요!"
        ),
    }
