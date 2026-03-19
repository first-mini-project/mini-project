import os
import uuid
import requests
import base64
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import Config

# ─── 로컬 SDXL-Turbo 파이프라인 (앱 시작 시 1회 로드) ────────────────────────
_pipe = None

def _get_pipe():
    global _pipe
    if _pipe is not None:
        return _pipe
    try:
        import torch
        from diffusers import AutoPipelineForText2Image
        print("[로컬 SD] 모델 로딩 중 (최초 1회)...")
        _pipe = AutoPipelineForText2Image.from_pretrained(
            'stabilityai/sdxl-turbo',
            torch_dtype=torch.float16,
            variant='fp16',
        ).to('cuda')
        print("[로컬 SD] 모델 로딩 완료!")
    except Exception as e:
        print(f"[로컬 SD] 로딩 실패: {e}")
        _pipe = None
    return _pipe


def generate_scene_bg(bg_text: str) -> str | None:
    """
    로컬 SDXL-Turbo로 장면 배경 이미지를 생성하고 저장합니다.
    Returns: 'static/generated/bgs/bg_xxx.jpg' or None
    """
    if not bg_text:
        return None

    prompt = (
        bg_text
        + ", children's storybook illustration, watercolor art style,"
        + " soft pastel colors, magical whimsical background scenery,"
        + " detailed environment, no characters, no people, no animals, no text, 2D illustration"
    )

    try:
        pipe = _get_pipe()
        if pipe is None:
            return None

        import torch
        image = pipe(
            prompt=prompt,
            num_inference_steps=1,
            guidance_scale=0.0,
            height=512, width=512,
        ).images[0]

        filename = f"bg_{uuid.uuid4().hex[:16]}.jpg"
        filepath = os.path.join(Config.BGS_DIR, filename)
        image.save(filepath, format='JPEG', quality=90)
        print(f"[로컬 SD BG] 생성 완료: {filename}")
        return f"static/generated/bgs/{filename}"

    except Exception as e:
        print(f"[로컬 SD BG 오류] {e}")
    return None


def generate_scene_bgs_parallel(scene_data: list) -> list:
    """
    scene_data의 각 장면에 대해 배경 이미지를 순차 생성합니다.
    (GPU 메모리 충돌 방지를 위해 순차 처리)
    """
    if not scene_data:
        return scene_data

    indices = [i for i, s in enumerate(scene_data) if s.get('bg')]
    if not indices:
        return scene_data

    # GPU는 순차 처리 (병렬 시 VRAM 초과 위험)
    for i in indices:
        try:
            path = generate_scene_bg(scene_data[i]['bg'])
            if path:
                scene_data[i]['bg_image'] = path
                print(f"[BG scene {i}] {path}")
        except Exception as e:
            print(f"[BG scene {i} 실패] {e}")

    return scene_data


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
