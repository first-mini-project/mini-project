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
    B = r'(?=[\s,.!?。、\n\'\"]|$)'

    # ── 1단계: 연속 나열 패턴 먼저 교정 ──────────────────────────────────────
    # "A가 B가" → "A과/와 B가",  "A이 B이" → "A과/와 B이"
    def _fix_consecutive(m):
        char1, space, word2, p2 = m.group(1), m.group(3), m.group(4), m.group(5)
        conj = '과' if _has_batchim(char1) else '와'
        return char1 + conj + space + word2 + p2

    text = re.sub(r'([가-힣])(가)(\s+)([가-힣]+)(가)' + B, _fix_consecutive, text)
    text = re.sub(r'([가-힣])(이)(\s+)([가-힣]+)(이)' + B, _fix_consecutive, text)

    # ── 2단계: 개별 조사 교정 (긴 패턴 → 짧은 패턴 순서) ─────────────────────

    # 이나/나
    def _fix_ina(m):
        char = m.group(1)
        return char + ('이나' if _has_batchim(char) else '나')
    text = re.sub(r'([가-힣])(이나|나)' + B, _fix_ina, text)

    # 이랑/랑
    def _fix_irang(m):
        char = m.group(1)
        return char + ('이랑' if _has_batchim(char) else '랑')
    text = re.sub(r'([가-힣])(이랑|랑)' + B, _fix_irang, text)

    # 으로/로 (ㄹ받침 또는 받침 없으면 → 로, 나머지 받침 → 으로)
    def _fix_euro(m):
        char = m.group(1)
        if not _has_batchim(char) or _has_rieul_batchim(char):
            return char + '로'
        return char + '으로'
    text = re.sub(r'([가-힣])(으로|로)' + B, _fix_euro, text)

    # 은/는
    def _fix_eun_neun(m):
        char = m.group(1)
        return char + ('은' if _has_batchim(char) else '는')
    text = re.sub(r'([가-힣])([은는])' + B, _fix_eun_neun, text)

    # 이/가
    def _fix_i_ga(m):
        char = m.group(1)
        return char + ('이' if _has_batchim(char) else '가')
    text = re.sub(r'([가-힣])([이가])' + B, _fix_i_ga, text)

    # 을/를
    def _fix_eul_reul(m):
        char = m.group(1)
        return char + ('을' if _has_batchim(char) else '를')
    text = re.sub(r'([가-힣])([을를])' + B, _fix_eul_reul, text)

    # 과/와
    def _fix_gwa_wa(m):
        char = m.group(1)
        return char + ('과' if _has_batchim(char) else '와')
    text = re.sub(r'([가-힣])([과와])' + B, _fix_gwa_wa, text)

    return text


sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import Config

# ─── 스토리 다양성 재료 ──────────────────────────────────────────────────────

_WORLDS = [
    ("🌌 우주 모험",    "별빛 행성들, 반짝이는 성운, 우주선, 외계 생물"),
    ("🌊 바닷속 왕국",  "산호초, 빛나는 심해, 인어, 거품 궁전"),
    ("🌲 마법의 숲",    "빛나는 버섯, 요정, 신비한 나무 위 마을, 말하는 동물"),
    ("☁️ 구름 위 왕국", "솜사탕 구름, 무지개 다리, 하늘 성, 바람 요정"),
    ("🍬 과자 나라",    "초콜릿 강, 사탕 집, 마시멜로 산, 쿠키 길"),
    ("🦕 공룡 세계",    "거대한 정글, 화산, 공룡 친구들, 고대 유적"),
    ("❄️ 얼음 왕국",    "오로라, 얼음 궁전, 눈의 요정, 북극곰 마을"),
    ("🌸 봄의 꽃 왕국", "꽃잎 카펫, 나비 마차, 꽃 요정, 봄비 마법"),
    ("🏴‍☠️ 해적 모험",  "보물 섬, 돛단배, 해적 지도, 숨겨진 동굴"),
    ("🏰 마법 왕국",    "탑이 높은 성, 기사, 용, 마법 도서관"),
    ("🎪 마법 서커스",  "공중 그네, 변신 마법사, 신기한 동물단, 반짝이 텐트"),
    ("🌋 화산 섬",      "용암 강, 불꽃 도마뱀, 보물 동굴, 열대 밀림"),
    ("🍄 버섯 마을",    "거대 버섯 집, 귀여운 곤충 친구들, 이슬 연못, 반딧불 축제"),
    ("🎠 놀이공원 나라", "회전목마, 마법 롤러코스터, 솜사탕 구름, 거울 미로"),
    ("🌙 달나라",       "달빛 초원, 달토끼 마을, 별똥별 미끄럼틀, 은빛 강"),
]

_GENRES = [
    ("모험",  "주인공이 위험한 모험을 떠나 보물이나 비밀을 발견한다"),
    ("우정",  "처음에 서로 다른 두 존재가 친구가 되어 함께 문제를 해결한다"),
    ("성장",  "겁쟁이 주인공이 용기를 내어 중요한 일을 해낸다"),
    ("구조",  "위험에 처한 누군가를 구하기 위해 주인공이 활약한다"),
    ("미스터리", "이상한 사건의 비밀을 파헤치다 예상치 못한 결말을 맞는다"),
    ("소원",  "소원을 이루려다 뜻밖의 일이 생기고 진짜 행복을 깨닫는다"),
    ("변신",  "마법으로 변신한 주인공이 자신의 진짜 모습을 찾아간다"),
    ("경쟁",  "라이벌과 겨루다 진정한 협력의 의미를 발견한다"),
    ("여행",  "집을 잃어버린 주인공이 새 친구들과 집을 찾아 돌아온다"),
    ("축제",  "마을 축제를 위해 모두가 힘을 합치며 일어나는 유쾌한 소동"),
]


def _build_prompt(keywords: list) -> str:
    """단어 목록으로 동화 생성 프롬프트를 만듭니다. 세계관·장르를 랜덤 선택해 다양성을 확보합니다."""
    world_name, world_desc = random.choice(_WORLDS)
    genre_name, genre_desc = random.choice(_GENRES)

    role_hints = '\n'.join(
        f'  - [{i+1}] {kw}: {"주인공" if i == 0 else "핵심 등장 요소"}'
        for i, kw in enumerate(keywords)
    )

    return f"""당신은 4~7세 한국 어린이를 위한 창의적인 동화 작가입니다.

━━ 이번 이야기 설정 (반드시 따르세요) ━━
🌍 세계관: {world_name}
   배경 분위기: {world_desc}
📖 장르/플롯: {genre_name} — {genre_desc}

━━ 등장 단어 (아이가 직접 그린 그림) ━━
{role_hints}

★ 핵심 규칙
- 위 세계관과 장르를 정확히 따라야 합니다 (자의적으로 바꾸지 마세요)
- 각 단어는 단순 언급이 아닌, 줄거리를 이끄는 주인공/핵심 역할을 해야 합니다
- 단어들이 서로 만나고, 상호작용하며 이야기가 전개되어야 합니다

작성 규칙:
1. 4개 단락 (각 2~3문장, 전체 250~350자)
2. 각 단락의 배경 장면을 영어로 한 줄 설명 (이미지 생성용)
3. 4~7세 어린이 말투, 해피엔딩
4. 교훈 한 줄

반드시 아래 JSON 형식으로만 응답 (추가 설명 없이):
{{
  "title": "동화 제목 (10자 이내)",
  "scenes": [
    {{"text": "단락1 (2~3문장)", "bg": "pure environment background only in English (NO characters, NO creatures, NO animals, NO people — only landscape/sky/scenery like 'cotton candy clouds floating in pastel sky', 'rainbow bridge over sparkling river', 'magical glowing mushroom forest')"}},
    {{"text": "단락2", "bg": "pure environment background only in English"}},
    {{"text": "단락3", "bg": "pure environment background only in English"}},
    {{"text": "단락4", "bg": "pure environment background only in English"}}
  ],
  "moral": "이 이야기의 교훈: ..."
}}"""


def _parse_result(response_text: str) -> dict:
    """LLM 응답 텍스트에서 JSON을 추출하고 scene_data/content를 정리합니다."""
    text = response_text.strip()
    if '```json' in text:
        text = text.split('```json')[1].split('```')[0].strip()
    elif '```' in text:
        text = text.split('```')[1].split('```')[0].strip()

    result = json.loads(text)
    if 'scenes' in result and isinstance(result['scenes'], list):
        result['scene_data'] = result.pop('scenes')
        result['content'] = '\n\n'.join(s['text'] for s in result['scene_data'] if s.get('text'))
    else:
        result['scene_data'] = None

    # 조사 맞춤법 교정
    if result.get('title'):
        result['title'] = _fix_korean_particles(result['title'])
    if result.get('scene_data'):
        for scene in result['scene_data']:
            if scene.get('text'):
                scene['text'] = _fix_korean_particles(scene['text'])
        result['content'] = '\n\n'.join(s['text'] for s in result['scene_data'] if s.get('text'))
    elif result.get('content'):
        result['content'] = _fix_korean_particles(result['content'])
    if result.get('moral'):
        result['moral'] = _fix_korean_particles(result['moral'])

    return result


def generate_fairy_tale(keywords: list, drawings: list = None) -> dict:
    """
    Gemini (우선) 또는 Claude를 사용하여 한국어 동화를 생성합니다.
    keywords: 한국어 단어 리스트
    drawings: 아이가 그린 그림 리스트 (image_data 포함) — Vision API로 그림 분석
    Returns: {'title': str, 'content': str, 'moral': str, 'scene_data': list}
    """
    # Gemini 우선
    if Config.GEMINI_API_KEY:
        return _generate_with_gemini(keywords, drawings)
    # Claude 폴백
    if Config.ANTHROPIC_API_KEY:
        return _generate_with_claude(keywords, drawings)
    return _fallback_story(keywords)


def _generate_with_gemini(keywords: list, drawings: list = None) -> dict:
    """Gemini로 동화를 생성합니다."""
    try:
        import base64
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=Config.GEMINI_API_KEY)
        prompt  = _build_prompt(keywords)
        parts   = []

        # 그림이 있으면 Vision 포함
        has_images = drawings and any(d.get('image_data') for d in drawings)
        if has_images:
            for drawing in drawings:
                img_data = drawing.get('image_data', '')
                if not img_data or not img_data.startswith('data:image/'):
                    continue
                header, encoded = img_data.split(',', 1)
                mime_type = header.split(':')[1].split(';')[0]
                parts.append(types.Part.from_bytes(
                    data=base64.b64decode(encoded),
                    mime_type=mime_type,
                ))
            parts.append(types.Part.from_text(
                text="위 그림들은 아이가 직접 그린 그림이에요. 그림의 느낌과 분위기를 이야기에 반영해주세요.\n\n" + prompt
            ))
        else:
            parts.append(types.Part.from_text(text=prompt))

        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
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
            return _generate_with_claude(keywords, drawings)
        return _fallback_story(keywords)


def _generate_with_claude(keywords: list, drawings: list = None) -> dict:
    """Claude로 동화를 생성합니다 (폴백)."""
    try:
        import anthropic
        client    = anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)
        prompt    = _build_prompt(keywords)
        has_images = drawings and any(d.get('image_data') for d in drawings)
        content   = []

        if has_images:
            for drawing in drawings:
                img_data = drawing.get('image_data', '')
                if not img_data or not img_data.startswith('data:image/'):
                    continue
                header, encoded = img_data.split(',', 1)
                media_type = header.split(':')[1].split(';')[0]
                content.append({
                    "type": "image",
                    "source": {"type": "base64", "media_type": media_type, "data": encoded},
                })
            content.append({"type": "text",
                             "text": "위 그림들은 아이가 직접 그린 그림이에요. 그림의 느낌과 분위기를 반영해주세요.\n\n" + prompt})
        else:
            content.append({"type": "text", "text": prompt})

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": content}]
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
            messages=[{
                "role": "user",
                "content": (
                    f"Create a DALL-E image prompt (max 60 words) for a children's drawing reference "
                    f"of '{korean_word}' ({english_word}). "
                    f"Style: cute, simple, colorful cartoon on white background, no text, "
                    f"suitable for 4-7 year olds to use as drawing reference. "
                    f"Give only the prompt text, nothing else."
                )
            }]
        )
        return message.content[0].text.strip()

    except Exception as e:
        print(f"[이미지 프롬프트 생성 오류] {e}")
        return f"A cute, simple children's drawing of a {english_word}, colorful cartoon style, white background, no text"


def _fallback_story(keywords: list) -> dict:
    """API 없을 때 기본 동화를 반환합니다."""
    kw  = keywords[0] if keywords else "친구"
    kw2 = keywords[1] if len(keywords) > 1 else "숲"
    scenes = [
        {"text": f"옛날 옛날에 {kw}가 {kw2}에 살았어요. {kw}는 항상 친구들에게 친절하고 다정했어요.",
         "bg": f"magical {kw2} with warm sunlight filtering through trees"},
        {"text": f"어느 날 작은 새 한 마리가 날개를 다쳐 떨어졌어요. {kw}는 새를 집으로 데려와 정성껏 돌봐주었어요.",
         "bg": "cozy little house in the forest with warm golden light"},
        {"text": f"며칠 후 새는 다시 건강해졌어요. 새는 고마운 마음에 아름다운 노래를 불러주었어요.",
         "bg": "sunny meadow with blooming flowers and blue sky"},
        {"text": f"그 소리를 듣고 마을의 모든 친구들이 모여 함께 춤을 추었어요. {kw}는 친구들과 함께라면 매일매일이 행복하다는 것을 알았어요.",
         "bg": "cheerful village square with animals celebrating together"},
    ]
    for scene in scenes:
        scene['text'] = _fix_korean_particles(scene['text'])

    return {
        "title": _fix_korean_particles(f"{kw}의 모험"),
        "content": '\n\n'.join(s['text'] for s in scenes),
        "scene_data": scenes,
        "moral": _fix_korean_particles("이 이야기의 교훈: 남을 도울 때 우리도 더 행복해질 수 있어요. 친절한 마음은 세상을 따뜻하게 만든답니다.")
    }
