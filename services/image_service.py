import os
import uuid
import requests
import base64
import sys
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import Config

# ─── 로컬 SDXL-Turbo 파이프라인 (앱 시작 시 1회 로드) ────────────────────────
_pipe = None
_pipe_load_failed = False   # 한번 실패하면 재시도 안 함 (앱 재시작까지)

def _get_pipe():
    global _pipe, _pipe_load_failed
    if _pipe is not None:
        return _pipe
    if _pipe_load_failed:
        return None
    try:
        import torch
        if not torch.cuda.is_available():
            print("[로컬 SD] CUDA(GPU) 사용 불가 → Pollinations.ai 폴백 모드로 전환")
            _pipe_load_failed = True
            return None

        # VRAM 여유 확인 (1.5GB 이상 필요 — sd-turbo는 약 2GB)
        free_vram = torch.cuda.mem_get_info()[0] / (1024**3)  # GB 단위
        if free_vram < 1.5:
            print(f"[로컬 SD] VRAM 여유 부족 ({free_vram:.1f}GB) → Pollinations.ai 폴백 모드로 전환")
            _pipe_load_failed = True
            return None

        from diffusers import AutoPipelineForText2Image
        print("[로컬 SD] sd-turbo 모델 로딩 중 (최초 1회, 약 2GB)...")
        _pipe = AutoPipelineForText2Image.from_pretrained(
            'stabilityai/sd-turbo',   # sdxl-turbo(6GB) → sd-turbo(2GB)
            torch_dtype=torch.float16,
        ).to('cuda')
        _pipe.enable_attention_slicing()  # VRAM 추가 절약
        print("[로컬 SD] sd-turbo 로딩 완료!")
    except Exception as e:
        print(f"[로컬 SD] 로딩 실패: {e} → Pollinations.ai 폴백 모드로 전환")
        _pipe_load_failed = True
        _pipe = None
    return _pipe


def _generate_bg_pollinations(bg_text: str) -> str | None:
    """
    GPU 없을 때 Pollinations.ai로 배경 이미지를 생성합니다. (무료, GPU 불필요)
    Returns: 'static/generated/bgs/bg_xxx.jpg' or None
    """
    try:
        prompt = (
            bg_text
            + ", children's storybook illustration, watercolor art style,"
            + " soft pastel colors, magical whimsical background scenery,"
            + " detailed environment, no characters, no people, no animals, no text, 2D illustration"
        )
        encoded = urllib.parse.quote(prompt)
        seed = abs(hash(bg_text)) % 100000
        url = f"https://image.pollinations.ai/prompt/{encoded}?width=512&height=512&seed={seed}&nologo=true&model=flux"

        resp = requests.get(url, timeout=25)  # 타임아웃 단축
        if resp.status_code != 200:
            print(f"[Pollinations] 응답 오류: {resp.status_code}")
            return None

        filename = f"bg_{uuid.uuid4().hex[:16]}.jpg"
        filepath = os.path.join(Config.BGS_DIR, filename)
        with open(filepath, 'wb') as f:
            f.write(resp.content)
        print(f"[Pollinations BG] 생성 완료: {filename}")
        return f"static/generated/bgs/{filename}"

    except Exception as e:
        print(f"[Pollinations BG 오류] {e}")
        return None



def generate_scene_bg(bg_text: str) -> str | None:
    """
    장면 배경 이미지를 생성합니다.
    - GPU(CUDA) + VRAM 4GB 이상: 로컬 SDXL-Turbo 사용
    - GPU 없거나 VRAM 부족: Pollinations.ai 자동 폴백
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

    # 1. 로컬 GPU 시도
    pipe = _get_pipe()
    if pipe is not None:
        try:
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
            print(f"[로컬 SD BG 오류] {e} → Pollinations.ai로 폴백")

    # 2. Pollinations.ai 폴백
    return _generate_bg_pollinations(bg_text)



def generate_scene_bgs_parallel(scene_data: list) -> list:
    """
    scene_data의 각 장면에 대해 배경 이미지를 생성합니다.
    - GPU 있음: 순차 처리 (VRAM 충돌 방지)
    - GPU 없음(Pollinations 폴백): ThreadPoolExecutor로 병렬 처리 (속도 향상)
    """
    if not scene_data:
        return scene_data

    indices = [i for i, s in enumerate(scene_data) if s.get('bg')]
    if not indices:
        return scene_data

    # GPU 여부 판단
    use_gpu = (_pipe is not None) or (not _pipe_load_failed and _check_cuda_available())

    if use_gpu:
        # GPU는 순차 처리 (VRAM 초과 방지)
        for i in indices:
            try:
                path = generate_scene_bg(scene_data[i]['bg'])
                if path:
                    scene_data[i]['bg_image'] = path
                    print(f"[BG scene {i}] {path}")
            except Exception as e:
                print(f"[BG scene {i} 실패] {e}")
    else:
        # Pollinations 폴백: 장면들을 동시에 처리
        print(f"[BG] Pollinations 병렬 모드 — {len(indices)}개 장면 동시 처리")
        def _gen(i):
            path = _generate_bg_pollinations(scene_data[i]['bg'])
            return i, path

        with ThreadPoolExecutor(max_workers=4) as ex:
            futures = {ex.submit(_gen, i): i for i in indices}
            for f in as_completed(futures):
                try:
                    i, path = f.result()
                    if path:
                        scene_data[i]['bg_image'] = path
                        print(f"[BG scene {i}] {path}")
                except Exception as e:
                    print(f"[BG scene 실패] {e}")

    return scene_data


def _check_cuda_available():
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False



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
