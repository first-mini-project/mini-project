import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import Config


def generate_fairy_tale(keywords: list) -> dict:
    """
    Claude claude-sonnet-4-6 을 사용하여 한국어 동화를 생성합니다.
    keywords: 한국어 단어 리스트
    Returns: {'title': str, 'content': str, 'moral': str}
    """
    if not Config.ANTHROPIC_API_KEY:
        return _fallback_story(keywords)

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)

        keywords_str = ', '.join(keywords)

        prompt = f"""당신은 4~7세 한국 어린이를 위한 따뜻하고 재미있는 동화 작가입니다.

다음 단어들이 모두 자연스럽게 등장하는 교훈적인 동화를 한국어로 만들어주세요.
단어: {keywords_str}

작성 규칙:
1. 이야기 길이: 250~350자 분량 (4~7세가 집중할 수 있는 길이)
2. 교훈: 권선징악, 나눔과 배려, 용기, 우정, 인과응보 중 하나를 자연스럽게 담아주세요
3. 어휘: 4~7세 어린이가 이해할 수 있는 쉽고 친근한 말투 사용
4. 결말: 반드시 행복하고 따뜻하게 끝나야 해요
5. 단어들이 이야기 속에 자연스럽게 녹아들어야 해요
6. 주인공은 아이들이 좋아하는 귀여운 동물이나 캐릭터로 해주세요

반드시 아래 JSON 형식으로만 응답해주세요 (추가 설명 없이):
{{
  "title": "동화 제목 (10자 이내)",
  "content": "동화 내용 전체 (250~350자)",
  "moral": "이 이야기의 교훈: ..."
}}"""

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = message.content[0].text.strip()

        # JSON 블록 추출
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()

        result = json.loads(response_text)
        return result

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
    kw = keywords[0] if keywords else "친구"
    kw2 = keywords[1] if len(keywords) > 1 else "숲"
    return {
        "title": f"{kw}의 모험",
        "content": (
            f"옛날 옛날에 {kw}가 {kw2}에 살았어요. "
            f"{kw}는 항상 친구들에게 친절하고 다정했어요. "
            f"어느 날 작은 새 한 마리가 날개를 다쳐 떨어졌어요. "
            f"{kw}는 새를 집으로 데려와 정성껏 돌봐주었어요. "
            f"며칠 후 새는 다시 건강해졌어요. "
            f"새는 고마운 마음에 아름다운 노래를 불러주었어요. "
            f"그 소리를 듣고 마을의 모든 친구들이 모여 함께 춤을 추었어요. "
            f"{kw}는 친구들과 함께라면 매일매일이 행복하다는 것을 알았어요."
        ),
        "moral": "이 이야기의 교훈: 남을 도울 때 우리도 더 행복해질 수 있어요. 친절한 마음은 세상을 따뜻하게 만든답니다."
    }
