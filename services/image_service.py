import os
import uuid
import requests
import base64
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import Config

# ─── 로컬 초고속 파이프라인 (SD-Turbo FP16) ────────
_pipe = None

def _get_pipe():
    global _pipe
    if _pipe is not None:
        return _pipe
    try:
        import torch
        from diffusers import AutoPipelineForText2Image, EulerAncestralDiscreteScheduler
        print("[로컬 SD] SD-Turbo (FP16) 파이프라인 로딩 중...")
        
        # SD-Turbo 파이프라인 로드 (SDXL보다 가볍고 빠름)
        _pipe = AutoPipelineForText2Image.from_pretrained(
            'stabilityai/sd-turbo',
            torch_dtype=torch.float16,
            variant='fp16'
        )
        
        # GPU 확인 및 할당
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _pipe.to(device)

        # 스케줄러 설정
        _pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(_pipe.scheduler.config)

        # VRAM 효율화
        try:
            _pipe.enable_xformers_memory_efficient_attention()
        except:
            _pipe.enable_attention_slicing()

        # TensorRT 기반 컴파일 적용 (선택 사항)
        try:
            import torch_tensorrt
            print("[로컬 SD] TensorRT 엔진 컴파일 시도...")
            _pipe.unet = torch.compile(_pipe.unet, mode="reduce-overhead", backend="tensorrt")
            print("[로컬 SD] TensorRT 컴파일 완료!")
        except Exception as compile_err:
            print(f"[로컬 SD] TensorRT 컴파일 생략: {compile_err}")

        if device == "cpu":
            print("[로컬 SD] CUDA를 찾을 수 없어 CPU 모드로 동작합니다.")

        print("[로컬 SD] SD-Turbo 로딩 완료!")

    except Exception as e:
        print(f"[로컬 SD] 로딩 실패: {e}")
        _pipe = None
    return _pipe


def generate_scene_bg(bg_text: str) -> str | None:
    """
    로컬 최적화 파이프라인으로 장면 배경 이미지를 매우 빠르게 생성합니다.
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

        # SD-Turbo 스펙: 1~4 step
        image = pipe(
            prompt=prompt,
            num_inference_steps=2,
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
    """
    if not scene_data:
        return scene_data

    indices = [i for i, s in enumerate(scene_data) if s.get('bg')]
    if not indices:
        return scene_data

    # VRAM 관리를 위해 순차 처리
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
    아이가 그림 그릴 때 보여줄 참고 이미지를 기존 HF 단일 API에서 
    로컬 최적화 파이프라인 생성을 사용하도록 변경합니다.
    Returns: base64 data URI string, or None on failure
    """
    prompt = image_prompt or (
        f"A cute, simple children's drawing reference of a {english_word}. "
        f"Colorful cartoon style, friendly and approachable, clean white background, "
        f"no text, suitable for 4 to 7 year old children. standalone object."
    )

    try:
        pipe = _get_pipe()
        if pipe is None:
            print("[밑그림] 파이프라인 로딩 오류")
            return None
        
        image = pipe(
            prompt=prompt,
            num_inference_steps=2,
            guidance_scale=0.0,
            height=512, width=512,
        ).images[0]
        
        import io
        import base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{img_str}"

    except Exception as e:
        print(f"[로컬 SD 밑그림 생성 오류] {e}")
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
