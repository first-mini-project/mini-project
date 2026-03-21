import os
import uuid
import requests
import base64
import sys
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image, ImageOps
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import Config

# ─── 누끼 — Python PIL 버전 (흰 배경 제거) ──────────────────────────────────
def make_nukki(img):
    """그림의 흰색 배경을 투명하게 만듭니다."""
    img = img.convert("RGBA")
    datas = img.getdata()
    newData = []
    for item in datas:
        # item: (r, g, b, a)
        brightness = item[0] * 0.299 + item[1] * 0.587 + item[2] * 0.114
        if brightness > 248:
            newData.append((255, 255, 255, 0))
        elif brightness > 215:
            alpha = int((248 - brightness) / 33 * 220)
            newData.append((item[0], item[1], item[2], alpha))
        else:
            newData.append(item)
    img.putdata(newData)
    return img

_SKY_KW = {'별', '달', '구름', '무지개', '태양', '나비', '풍선'}
def is_sky(korean):
    return korean in _SKY_KW

def flatten_scene_images(scene_data, all_drawings):
    """
    장면 배경과 사용자 그림을 병합하여 단일 이미지로 만듭니다.
    - scene_data: [{'text': ..., 'bg_image': ...}, ...]
    - all_drawings: [{'id': ..., 'korean': ..., 'file_path': ...}, ...]
    """
    if not scene_data or not all_drawings:
        return scene_data

    for idx, scene in enumerate(scene_data):
        bg_path = scene.get('bg_image')
        try:
            # 배경 로딩 (없으면 하늘색/연두색 그라데이션 빈 배경 생성)
            bg_full_path = os.path.join(Config.BASE_DIR, bg_path.replace('/', os.sep)) if bg_path else None
            if bg_full_path and os.path.exists(bg_full_path):
                bg_img = Image.open(bg_full_path).convert("RGBA")
            else:
                # 배경 파일 누락 시 폴백 배경 생성
                bg_img = Image.new('RGBA', (512, 512), (135, 206, 235, 255)) # Sky Blue
            
            # 비율에 맞춰 리사이즈
            bg_img = bg_img.resize((512, 768), Image.LANCZOS)
            bg_w, bg_h = bg_img.size

            # 장면 텍스트와 매칭되는 그림 찾기
            text = scene.get('text', '')
            matched = [d for d in all_drawings if d.get('korean') and d['korean'] in text]
            if not matched:
                matched = [all_drawings[idx % len(all_drawings)]]

            # 최대 2개 그림 배치
            drawings_to_add = matched[:2]
            
            for i, d in enumerate(drawings_to_add):
                d_path = d.get('file_path')
                if not d_path: continue
                d_full_path = os.path.join(Config.BASE_DIR, d_path.replace('/', os.sep))
                if not os.path.exists(d_full_path): continue

                d_img = Image.open(d_full_path)
                d_img = make_nukki(d_img)
                
                # 그림 리사이즈 (배경 대비 적절한 크기)
                max_draw_size = 200
                d_img.thumbnail((max_draw_size, max_draw_size), Image.LANCZOS)
                dw, dh = d_img.size

                # 하늘 키워드면 상단, 아니면 하단 배치
                sky = is_sky(d.get('korean', ''))
                if sky:
                    px = (bg_w - dw) // 2
                    py = 40
                else:
                    px = (bg_w - dw) // 2
                    py = bg_h - dh - 40

                # 2개인 경우 약간 오프셋 (겹침 방지)
                if len(drawings_to_add) == 2:
                    if i == 0:
                        px = max(0, px - 40)
                    else:
                        px = min(bg_w - dw, px + 40)

                # 좌표가 유효한 범위인지 확인
                px = max(0, min(px, bg_w - dw))
                py = max(0, min(py, bg_h - dh))

                bg_img.alpha_composite(d_img, (px, py))

            # 최종 저장
            merged_filename = f"scene_{idx}_{uuid.uuid4().hex[:8]}.jpg"
            merged_filepath = os.path.join(Config.MERGED_DIR, merged_filename)
            bg_img.convert("RGB").save(merged_filepath, "JPEG", quality=90)
            
            scene['merged_image'] = f"static/generated/merged/{merged_filename}"

        except Exception as e:
            print(f"[Flattening Error] {e}")

    return scene_data

def generate_moral_collage(moral_text, all_drawings):
    """
    마지막 교훈 페이지용 콜라주 이미지를 생성합니다.
    """
    try:
        sketchbook_path = os.path.join(Config.BASE_DIR, "static", "images", "sketchbook.png")
        if os.path.exists(sketchbook_path):
            bg_img = Image.open(sketchbook_path).convert("RGBA")
        else:
            bg_img = Image.new('RGBA', (512, 768), (255, 253, 231, 255))
        
        bg_img = bg_img.resize((512, 768), Image.LANCZOS)
        bg_w, bg_h = bg_img.size
        
        import random
        # 모든 그림을 콜라주로 배치
        for d in all_drawings:
            d_path = d.get('file_path')
            if not d_path: continue
            d_full_path = os.path.join(Config.BASE_DIR, d_path.replace('/', os.sep))
            if not os.path.exists(d_full_path): continue
            
            d_img = Image.open(d_full_path).convert("RGBA")
            d_img = make_nukki(d_img)
            
            # 작게 리사이즈 및 회전
            size = random.randint(150, 220)
            d_img.thumbnail((size, size), Image.LANCZOS)
            d_img = d_img.rotate(random.randint(-15, 15), expand=True, resample=Image.BICUBIC)
            
            # 상단 영역에 랜덤 배치 (하단 40%는 텍스트용)
            px = random.randint(20, bg_w - d_img.width - 20)
            py = random.randint(40, int(bg_h * 0.55) - d_img.height)
            
            bg_img.alpha_composite(d_img, (px, py))
            
        # 저장
        merged_filename = f"moral_{uuid.uuid4().hex[:8]}.jpg"
        merged_filepath = os.path.join(Config.MERGED_DIR, merged_filename)
        bg_img.convert("RGB").save(merged_filepath, "JPEG", quality=90)
        
        return f"static/generated/merged/{merged_filename}"

    except Exception as e:
        print(f"[Moral Collage Error] {e}")
        return None

# ─── 로컬 SD-Turbo 파이프라인 (앱 시작 시 1회 로드) ────────────────────────
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

        from diffusers import AutoPipelineForText2Image, EulerAncestralDiscreteScheduler
        print("[로컬 SD] SD-Turbo (FP16) 파이프라인 로딩 중...")
        
        # SD-Turbo 파이프라인 로드 (SDXL보다 가볍고 빠름)
        _pipe = AutoPipelineForText2Image.from_pretrained(
            'stabilityai/sd-turbo',
            torch_dtype=torch.float16,
            variant='fp16'
        ).to("cuda")
        
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

        print("[로컬 SD] SD-Turbo 로딩 완료!")

    except Exception as e:
        print(f"[로컬 SD] 로딩 실패: {e} → Pollinations.ai 폴백 모드로 전환")
        _pipe_load_failed = True
        _pipe = None
    return _pipe


def _build_bg_prompt(bg_text: str, exclude_en: list = None) -> tuple:
    """배경 프롬프트 생성. (positive_prompt, negative_prompt) 튜플 반환."""
    # bg_text에서 제외 키워드 단어가 포함돼 있으면 해당 구절을 'scenery' 로 대체 (Gemini 실수 방어)
    cleaned = bg_text or ''
    if exclude_en:
        for kw in exclude_en:
            if kw and kw.lower() in cleaned.lower():
                import re as _re
                cleaned = _re.sub(r'\b' + _re.escape(kw) + r'\b', 'scenery', cleaned, flags=_re.IGNORECASE)

    positive = (
        "pure scenery background only, "
        + cleaned
        + ", children's storybook illustration, watercolor art style,"
        + " soft pastel colors, magical whimsical background, 2D flat illustration,"
        + " empty landscape with no characters"
    )

    # 네거티브 프롬프트: 아이가 그린 그림의 키워드 + 공통 제외 항목
    negative_parts = [
        "characters", "people", "animals", "creatures", "figures",
        "text", "letters", "watermark", "signature", "logo",
    ]
    if exclude_en:
        negative_parts = list(exclude_en) + negative_parts

    negative = ', '.join(negative_parts)
    return positive, negative


def _generate_bg_pollinations(bg_text: str, exclude_en: list = None) -> str | None:
    """
    GPU 없을 때 Pollinations.ai로 배경 이미지를 생성합니다. (무료, GPU 불필요)
    Returns: 'static/generated/bgs/bg_xxx.jpg' or None
    """
    try:
        positive, negative = _build_bg_prompt(bg_text, exclude_en)
        encoded = urllib.parse.quote(positive)
        neg_encoded = urllib.parse.quote(negative)
        seed = abs(hash(bg_text)) % 100000
        url = (f"https://image.pollinations.ai/prompt/{encoded}"
               f"?negative={neg_encoded}&width=512&height=512"
               f"&seed={seed}&nologo=true&model=flux")

        resp = requests.get(url, timeout=25)
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



def generate_scene_bg(bg_text: str, exclude_en: list = None) -> str | None:
    """
    장면 배경 이미지를 생성합니다.
    exclude_en: 배경에 그리지 않을 오브젝트 영어 키워드 (아이가 그린 그림 키워드)
    - GPU(CUDA) + VRAM 충분: 로컬 SD-Turbo (FP16) 초고속 생성
    - GPU 없거나 VRAM 부족: Pollinations.ai 자동 폴백
    Returns: 'static/generated/bgs/bg_xxx.jpg' or None
    """
    if not bg_text:
        return None

    positive, negative = _build_bg_prompt(bg_text, exclude_en)

    # 1. 로컬 GPU 시도 (sd-turbo: guidance_scale=0이라 negative_prompt 효과 없음 → positive만 사용)
    pipe = _get_pipe()
    if pipe is not None:
        try:
            # SD-Turbo 스펙: 1~4 step
            image = pipe(
                prompt=positive,
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

    # 2. Pollinations.ai 폴백 (negative 파라미터 지원)
    return _generate_bg_pollinations(bg_text, exclude_en)


def _check_cuda_available():
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False

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
                excl = scene_data[i].get('exclude_en') or []
                path = generate_scene_bg(scene_data[i]['bg'], excl)
                if path:
                    scene_data[i]['bg_image'] = path
                    print(f"[BG scene {i}] {path}")
            except Exception as e:
                print(f"[BG scene {i} 실패] {e}")
    else:
        # Pollinations 폴백: 스레딩 병렬 처리 (통신 I/O 바운드 최적화)
        print(f"[BG] Pollinations 병렬 모드 — {len(indices)}개 장면 동시 처리")
        def _gen(i):
            excl = scene_data[i].get('exclude_en') or []
            path = _generate_bg_pollinations(scene_data[i]['bg'], excl)
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
        
        # SD-Turbo 2 step 생성
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
    try:
        keywords_str = ', '.join(keywords[:3])
        prompt = (
            f"A beautiful, colorful children's book illustration for a Korean fairy tale. "
            f"The story is called '{title}' and features: {keywords_str}. "
            f"Soft watercolor style, warm colors, cute friendly characters, magical atmosphere. "
            f"Full scene illustration, no text, suitable for children ages 4-7. "
            f"Studio Ghibli inspired, dreamy and gentle."
        )

        filename = f"story_{uuid.uuid4().hex[:16]}.jpg"
        filepath = os.path.join(Config.ILLUSTRATIONS_DIR, filename)

        if Config.OPENAI_API_KEY:
            from openai import OpenAI
            client = OpenAI(api_key=Config.OPENAI_API_KEY)
            response = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            image_url = response.data[0].url
            img_response = requests.get(image_url, timeout=30)
            with open(filepath, 'wb') as f:
                f.write(img_response.content)
            return f"static/generated/illustrations/{filename}"
        else:
            # Pollinations 폴백 생성 (무료 API)
            print("[DALL-E 키 없음] Pollinations로 표지 일러스트 생성 중...")
            encoded = urllib.parse.quote(prompt)
            seed = abs(hash(title)) % 100000
            url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&seed={seed}&nologo=true&model=flux"
            resp = requests.get(url, timeout=35)
            if resp.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(resp.content)
                print(f"[Pollinations 일러스트] 생성 완료: {filename}")
                return f"static/generated/illustrations/{filename}"
            else:
                print(f"[Pollinations 일러스트 오류] 상태 코드: {resp.status_code}")
                return None

    except Exception as e:
        print(f"[동화 일러스트 생성 오류] {e}")
        return None
