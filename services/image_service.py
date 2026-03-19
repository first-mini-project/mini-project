import os
import uuid
import requests
import base64
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import Config


def generate_reference_image(korean_word: str, english_word: str, image_prompt: str = None) -> str | None:
    """
    아이가 그림 그릴 때 보여줄 참고 이미지를 Hugging Face Z-Image 로 생성합니다.
    Returns: base64 data URI string, or None on failure
    """
    if not Config.HUGGINGFACE_API_KEY:
        print("[참고 이미지] HUGGINGFACE_API_KEY가 설정되지 않았습니다.")
        return None

    try:
        # Hugging Face Free Inference API
        # (Tongyi-MAI/Z-Image-Turbo는 무료 API 서버리스를 미지원하여 SDXL로 임시 대체)
        API_URL = "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0"
        headers = {"Authorization": f"Bearer {Config.HUGGINGFACE_API_KEY}"}

        prompt = image_prompt or (
            f"A cute, simple children's drawing reference of a {english_word}. "
            f"Colorful cartoon style, friendly and approachable, white background, "
            f"no text, suitable for 4-7 year old children."
        )

        payload = {
            "inputs": prompt,
            "TargetContent": None,
            "StartLine": None,
            "EndLine": None,
        }

        response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            print(f"[참고 이미지 API 오류] 상태 코드: {response.status_code}, 내용: {response.text}")
            return None
            
        # Hugging Face Inference API returns image binary data directly
        img_b64 = base64.b64encode(response.content).decode('utf-8')
        return f"data:image/jpeg;base64,{img_b64}"

    except Exception as e:
        print(f"[참고 이미지 생성 오류] {e}")
        return None

def generate_story_illustration(title: str, keywords: list) -> str | None:
    """
    동화 일러스트를 DALL-E 3로 생성하고 파일로 저장합니다.
    Returns: relative static path like 'static/generated/illustrations/xxx.png', or None
    """
    if not Config.OPENAI_API_KEY:
        return None

    try:
        from openai import OpenAI
        client = OpenAI(api_key=Config.OPENAI_API_KEY)

        # 최대 3개 키워드 사용 (이미지 품질 향상)
        keywords_str = ', '.join(keywords[:3])

        prompt = (
            f"A beautiful, colorful children's book illustration for a Korean fairy tale. "
            f"The story is called '{title}' and features: {keywords_str}. "
            f"Soft watercolor style, warm colors, cute friendly characters, magical atmosphere. "
            f"Full scene illustration, no text, suitable for children ages 4-7. "
            f"Studio Ghibli inspired, dreamy and gentle."
        )

        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )

        image_url = response.data[0].url
        img_response = requests.get(image_url, timeout=30)

        filename = f"story_{uuid.uuid4().hex}.png"
        filepath = os.path.join(Config.ILLUSTRATIONS_DIR, filename)

        with open(filepath, 'wb') as f:
            f.write(img_response.content)

        return f"static/generated/illustrations/{filename}"

    except Exception as e:
        print(f"[동화 일러스트 생성 오류] {e}")
        return None
