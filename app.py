import os
import re
import json
import uuid
import base64
import subprocess
import sys
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    send_file,
    redirect,
    url_for,
    abort,
)


# ─── torch 자동 설치 (없을 때만) ─────────────────────────────────────────────
def _ensure_dependencies():
    # torch (CUDA 버전)
    try:
        import torch
    except ImportError:
        print("[설치] torch 설치 중 (최초 1회, 시간이 걸려요)...")
        subprocess.check_call(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "torch",
                "torchvision",
                "--index-url",
                "https://download.pytorch.org/whl/cu121",
                "--quiet",
            ]
        )
        print("[설치] torch 완료!")

    # diffusers / transformers / accelerate
    missing = []
    for pkg in ["diffusers", "transformers", "accelerate"]:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    if missing:
        print(f"[설치] {', '.join(missing)} 설치 중...")
        try:
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", "--quiet"] + missing
            )
            print("[설치] 완료!")
        except Exception as e:
            print(f"[설치 실패 - 무시하고 계속] {e}")


_ensure_dependencies()

from config import Config
import database as db
from services import ai_service, image_service, tts_service

# ─── 초기화 ──────────────────────────────────────────────────────────────────
Config.init_dirs()
db.init_db()

app = Flask(__name__)
app.config["SECRET_KEY"] = Config.SECRET_KEY
app.config["JSON_AS_ASCII"] = False
app.config["TEMPLATES_AUTO_RELOAD"] = True


# ─── 페이지 라우트 ────────────────────────────────────────────────────────────


@app.route("/")
def landing():
    return render_template("landing.html")


@app.route("/main")
def main():
    return render_template("main.html")


@app.route("/draw")
def draw():
    """랜덤 단어로 그림 그리기 페이지"""
    word = db.get_random_word()
    if not word:
        return redirect(url_for("main"))
    # 이미 그린 그림이 있는 단어는 제외하여 다양성 확보 (선택적)
    return render_template("drawing.html", word=word)


@app.route("/draw/<int:word_id>")
def draw_word(word_id):
    """특정 단어로 그림 그리기 페이지"""
    word = db.get_word(word_id)
    if not word:
        abort(404)
    existing_drawing = db.get_drawing_by_word_id(word_id)
    return render_template("drawing.html", word=word, existing_drawing=existing_drawing)


@app.route("/collection")
def collection():
    """그림 모음장 - 그린 그림 선택해서 동화 만들기"""
    drawings = db.get_all_drawings()
    return render_template("collection.html", drawings=drawings)


@app.route("/library")
def library():
    """내 동화 도서관"""
    stories = db.get_all_stories()
    # 각 스토리의 그림 데이터도 함께 주입 (도서관 뷰어에서 누끼 그림 표시용)
    # 뱃지 시스템용 데이터 추가
    total_books = db.get_story_count()
    badge = "🌱 새싹 작가"
    if total_books >= 31:
        badge = "👑 전설 작가"
    elif total_books >= 21:
        badge = "✨ 마법 작가"
    elif total_books >= 11:
        badge = "🌳 꿈나무 작가"

    for story in stories:
        try:
            drawing_ids = story.get("drawing_ids", [])
            drawings = db.get_drawings_by_ids(drawing_ids) if drawing_ids else []
            # file_path, korean, emoji 만 포함 (image_data는 용량이 커서 제외)
            story["drawings"] = [
                {
                    "id": d["id"],
                    "korean": d["korean"],
                    "emoji": d.get("emoji", ""),
                    "file_path": d.get("file_path", ""),
                }
                for d in drawings
                if d
            ]
        except Exception:
            story["drawings"] = []

    return render_template(
        "library.html", stories=stories, total_books=total_books, badge=badge
    )


@app.route("/story/<int:story_id>")
def storybook(story_id):
    """동화책 보기"""
    story = db.get_story(story_id)
    if not story:
        abort(404)
    drawings = db.get_drawings_by_ids(story["drawing_ids"])
    return render_template("storybook.html", story=story, drawings=drawings)


# ─── API 엔드포인트 ───────────────────────────────────────────────────────────


@app.route("/api/drawing/save", methods=["POST"])
def api_save_drawing():
    """아이가 그린 그림을 저장합니다."""
    data = request.get_json()
    word_id = data.get("word_id")
    image_data = data.get("image_data")  # base64 data URI

    if not word_id or not image_data:
        return jsonify({"success": False, "error": "데이터가 없어요"}), 400

    if not image_data.startswith("data:image/"):
        return jsonify({"success": False, "error": "이미지 형식이 잘못됐어요"}), 400

    replace_drawing_id = data.get("replace_drawing_id")

    try:
        header, encoded = image_data.split(",", 1)
        img_bytes = base64.b64decode(encoded)

        filename = f"drawing_{uuid.uuid4().hex}.png"
        filepath = os.path.join(Config.DRAWINGS_DIR, filename)

        with open(filepath, "wb") as f:
            f.write(img_bytes)

        relative_path = f"static/generated/drawings/{filename}"

        # 수정 모드: 기존 그림 삭제 후 새로 저장
        if replace_drawing_id:
            old = db.get_drawing_with_data(replace_drawing_id)
            if old and old.get("file_path"):
                old_file = os.path.join(os.path.dirname(__file__), old["file_path"])
                if os.path.exists(old_file):
                    os.remove(old_file)
            db.delete_drawing(replace_drawing_id)

        drawing_id = db.save_drawing(word_id, image_data, relative_path)

        return jsonify({"success": True, "drawing_id": drawing_id})

    except Exception as e:
        print(f"[그림 저장 오류] {e}")
        return jsonify({"success": False, "error": "저장 중 오류가 발생했어요"}), 500


@app.route("/api/drawing/help", methods=["POST"])
def api_drawing_help():
    """도와주세요! - DALL-E로 참고 이미지를 생성합니다."""
    data = request.get_json()
    korean = data.get("korean", "")
    english = data.get("english", "")
    # Claude로 최적화된 이미지 프롬프트 생성
    image_prompt = ai_service.generate_image_prompt(korean, english)

    # DALL-E로 이미지 생성
    image_data = image_service.generate_reference_image(korean, english, image_prompt)

    if image_data:
        return jsonify({"success": True, "image": image_data})
    else:
        return jsonify(
            {
                "success": False,
                "error": "오류가 발생했습니다 (모델 로딩 중이거나 첫 실행이라 준비 중일 수 있습니다)",
            }
        )


@app.route("/api/story/generate", methods=["POST"])
def api_generate_story():
    """선택한 그림들로 동화를 만듭니다."""
    data = request.get_json()
    drawing_ids = list(
        dict.fromkeys(data.get("drawing_ids", []))
    )  # 중복 제거, 순서 유지

    # 유효성 검사
    if not (Config.MIN_SELECTED <= len(drawing_ids) <= Config.MAX_SELECTED):
        return (
            jsonify(
                {
                    "success": False,
                    "error": f"그림을 {Config.MIN_SELECTED}개~{Config.MAX_SELECTED}개 선택해주세요",
                }
            ),
            400,
        )

    # 그림 정보 조회
    drawings = db.get_drawings_by_ids(drawing_ids)
    if not drawings:
        return jsonify({"success": False, "error": "그림을 찾을 수 없어요"}), 404

    # korean 없는 그림 제외 (word 미연결 자유 낙서 등)
    drawings = [d for d in drawings if d.get("korean")]

    # 주인공 그림 ID (선택 사항)
    protagonist_id = data.get("protagonist_id")
    protagonist_kw = None
    if protagonist_id:
        protagonist_id = int(protagonist_id)
        prot_drawing = next((d for d in drawings if d["id"] == protagonist_id), None)
        if prot_drawing:
            protagonist_kw = prot_drawing.get("korean")
    print(f"[주인공] protagonist_id={protagonist_id}, protagonist_kw={protagonist_kw}")

    # 키워드 추출 (중복 제거, 순서 유지)
    keywords = list(
        dict.fromkeys(
            [protagonist_kw] + [d["korean"] for d in drawings]
            if protagonist_kw
            else [d["korean"] for d in drawings]
        )
    )

    try:
        # 1. Gemini로 동화 생성
        story_data = ai_service.generate_fairy_tale(
            keywords, drawings, protagonist_kw=protagonist_kw
        )

        # 2~5. 배경이미지 / 일러스트 / TTS / 콜라주 병렬 생성
        from concurrent.futures import ThreadPoolExecutor, as_completed

        full_text = f"{story_data['title']}. {story_data['content']} {story_data.get('moral', '')}"

        # 배경 이미지 준비 (exclude_en 세팅)
        if story_data.get("scene_data"):
            kw_to_en = {
                d["korean"]: d.get("english", "") for d in drawings if d.get("english")
            }
            all_exclude_en = [v for v in kw_to_en.values() if v]
            for scene in story_data["scene_data"]:
                scene["exclude_en"] = all_exclude_en

        def task_bg():
            if not story_data.get("scene_data"):
                return None
            scene_data = image_service.generate_scene_bgs_parallel(story_data["scene_data"])
            return image_service.flatten_scene_images(scene_data, drawings)

        def task_tts():
            return tts_service.generate_tts(full_text, slow=False)

        def task_collage():
            return image_service.generate_moral_collage(story_data.get("moral", ""), drawings)

        audio_path = None
        merged_moral_path = None

        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = {
                executor.submit(task_bg): "bg",
                executor.submit(task_tts): "tts",
                executor.submit(task_collage): "collage",
            }
            for future in as_completed(futures):
                key = futures[future]
                try:
                    result = future.result()
                    if key == "bg" and result is not None:
                        story_data["scene_data"] = result
                    elif key == "tts":
                        audio_path = result
                    elif key == "collage":
                        merged_moral_path = result
                except Exception as e:
                    print(f"[병렬 생성 오류 - {key}] {e}")

        # 6. layout_data 생성 (정확한 스프레드 배치 저장)
        scenes = story_data.get("scene_data", [])
        num_content = len(scenes) if scenes else len(drawings)

        # 각 장면에 배치된 그림들 결정 (동사/오매칭 패턴 제외)
        BAD_PATTERNS = {
            "달": ["달리", "달래", "달랑", "달갑", "달콤", "달성"],
            "집": ["집합", "집중", "집단", "집결", "집착"],
            "배": ["배우", "배추", "배반"],
            "별": ["별로", "별명", "별나", "별말"],
            "산": ["산책", "산만", "산뜻"],
            "꽃": ["꽃잎", "꽃봉", "꽃길", "꽃망울", "꽃가루"],
            "나무": ["나무라"],
        }

        def contains_word(text, keyword):
            """오매칭 패턴 제거 후 키워드 포함 여부 확인"""
            if not keyword or keyword not in text:
                return False
            t = text
            for bad in BAD_PATTERNS.get(keyword, []):
                t = t.replace(bad, "▪" * len(bad))
            return keyword in t

        # 캐릭터 이름 → 원래 키워드 역매핑 (AI가 이름 붙인 경우 이름으로도 검색)
        name_map = story_data.get("name_map") or {}  # {"토끼": "콩이", ...}
        # {캐릭터이름: drawing_id} 역방향 맵
        char_name_to_id = {}
        for d in drawings:
            kw = d.get("korean", "")
            char_name = name_map.get(kw, "")
            if char_name:
                char_name_to_id[char_name] = d["id"]
        if name_map:
            print(f"[캐릭터 이름 맵] {name_map}")

        def find_mentioned_drawings(scene_text, all_drawings):
            text = scene_text or ""
            result = []
            seen = set()
            for d in all_drawings:
                did = d["id"]
                if did in seen:
                    continue
                kw = d.get("korean", "")
                char_name = name_map.get(kw, "")
                # 원래 키워드 또는 캐릭터 이름 중 하나라도 등장하면 매칭
                if (kw and contains_word(text, kw)) or (
                    char_name and char_name in text
                ):
                    result.append(did)
                    seen.add(did)
            return result

        layout_spreads = []

        id_to_kw = {d["id"]: d["korean"] for d in drawings}
        print(f"\n{'='*50}")
        print(f"[그림 배치] 선택된 그림: {[d['korean'] for d in drawings]}")
        print(f"{'='*50}")

        # 표지
        cover_drawing_id = drawings[0]["id"] if drawings else None
        cover_merged_image = scenes[0].get("merged_image") if scenes else None

        layout_spreads.append(
            {
                "type": "cover",
                "drawingId": cover_drawing_id,
                "mergedImage": cover_merged_image,
                "sceneIdx": 0,
            }
        )

        # 키워드 → drawing id 맵
        kw_to_id = {d["korean"]: d["id"] for d in drawings}

        # 동화 내용 스프레드 (빈 장면 스킵)
        for i in range(num_content):
            scene = scenes[i] if scenes and i < len(scenes) else None
            if not scene or not (scene.get("text") or "").strip():
                continue  # 텍스트 없는 장면은 페이지 생성 안 함

            # AI가 반환한 present 리스트 우선 사용, 없으면 텍스트 매칭 폴백
            present_kws = scene.get("present") or []
            if present_kws:
                mentioned_ids = []
                seen_ids = set()
                for kw in present_kws:
                    # 1) 정확 매칭 (원래 키워드 또는 캐릭터 이름)
                    did = kw_to_id.get(kw) or char_name_to_id.get(kw)
                    # 2) 조사 제거 후 재시도 ("냥이가" → "냥이", "뭉게구름은" → "뭉게구름")
                    stripped = re.sub(
                        r"(이가|가|이는|는|이를|를|을|이와|이과|와|과|에서|에게|에|의|도|이랑|랑|으로|로|이나|나|이다|다)$",
                        "",
                        kw,
                    )
                    if not did and stripped != kw:
                        did = kw_to_id.get(stripped) or char_name_to_id.get(stripped)
                    # 3) 부분 매칭: AI가 단축형 반환 시 ("뭉게" → "뭉게구름")
                    if not did:
                        base = stripped
                        for full_kw, kid in kw_to_id.items():
                            if base in full_kw or full_kw in base:
                                did = kid
                                break
                        if not did:
                            for char_name, kid in char_name_to_id.items():
                                if base in char_name or char_name in base:
                                    did = kid
                                    break
                    if did and did not in seen_ids:
                        mentioned_ids.append(did)
                        seen_ids.add(did)

                # present 처리 후, 텍스트에 등장하지만 누락된 그림 보완
                # (AI가 present에서 빠뜨린 경우 — 예: "우주선을 만들었어요"에서 우주선 누락)
                scene_text = scene.get("text", "")
                remaining = [d for d in drawings if d["id"] not in seen_ids]
                for did in find_mentioned_drawings(scene_text, remaining):
                    if did not in seen_ids:
                        mentioned_ids.append(did)
                        seen_ids.add(did)
            else:
                mentioned_ids = find_mentioned_drawings(scene.get("text", ""), drawings)

            # 4개 이상일 때 주인공 그림을 맨 앞으로 보장
            if protagonist_id and protagonist_id in mentioned_ids:
                idx = mentioned_ids.index(protagonist_id)
                if idx > 0:
                    mentioned_ids.insert(0, mentioned_ids.pop(idx))

            primary_id    = mentioned_ids[0] if len(mentioned_ids) > 0 else None
            secondary_id  = mentioned_ids[1] if len(mentioned_ids) > 1 else None
            tertiary_id   = mentioned_ids[2] if len(mentioned_ids) > 2 else None
            quaternary_id = mentioned_ids[3] if len(mentioned_ids) > 3 else None
            quinary_id    = mentioned_ids[4] if len(mentioned_ids) > 4 else None

            print(f"[장면 {i+1}] 텍스트: {(scene.get('text') or '')[:40]}...")
            print(
                f"         present={present_kws} → {[id_to_kw.get(mid) for mid in mentioned_ids]}"
            )
            print(
                f"         → {[id_to_kw.get(x) for x in [primary_id, secondary_id, tertiary_id, quaternary_id, quinary_id] if x]}"
            )

            # layout_hints: 키워드→id로 변환 (JS에서 drawingId 기반으로 사용)
            raw_hints = scene.get("layout_hints") or {}
            layout_hints_by_id = {}
            for kw, hint in raw_hints.items():
                did = kw_to_id.get(kw) or char_name_to_id.get(kw)
                if not did:
                    stripped = re.sub(r"(이가|가|이는|는|을|를|과|와|으로|로)$", "", kw)
                    did = kw_to_id.get(stripped) or char_name_to_id.get(stripped)
                if did:
                    layout_hints_by_id[str(did)] = hint

            layout_spreads.append(
                {
                    "type": "content",
                    "sceneIdx": i,
                    "primaryDrawingId":    primary_id,
                    "secondaryDrawingId":  secondary_id,
                    "tertiaryDrawingId":   tertiary_id,
                    "quaternaryDrawingId": quaternary_id,
                    "quinaryDrawingId":    quinary_id,
                    "mergedImage": scene.get("merged_image") if scene else None,
                    "textPageNum": i + 1,
                    "layoutHints": layout_hints_by_id,
                }
            )

        print(f"{'='*50}\n")

        # 교훈 페이지 (콜라주 이미지 포함)
        layout_spreads.append({"type": "moral", "mergedMoralImage": merged_moral_path})

        # 종료 페이지
        layout_spreads.append({"type": "end"})

        layout_data = {"spreads": layout_spreads}

        # 6. DB 저장
        story_id = db.save_story(
            title=story_data["title"],
            content=story_data["content"],
            moral=story_data.get("moral", ""),
            keywords=keywords,
            drawing_ids=[d["id"] for d in drawings],
            illustration_path=None,
            audio_path=audio_path,
            scene_data=story_data.get("scene_data"),
            layout_data=layout_data,
        )

        # 7. 레벨업 확인
        new_count = db.get_story_count()
        level_up_info = None
        if new_count in [1, 11, 21, 31]:
            badges = {
                1: ("🌱 새싹 작가", "기본 도구들을 사용할 수 있어요!"),
                11: ("🌳 꿈나무 작가", "무지개 펜(Rainbow Pen) 🌈 이 열렸어요!"),
                21: ("✨ 마법 작가", "반짝이 브러시(Sparkle Brush) ✨ 가 열렸어요!"),
                31: ("👑 전설 작가", "황금 스탬프(Golden Stamp) 👑 가 열렸어요!"),
            }
            level_up_info = {
                "badge": badges[new_count][0],
                "unlocked": badges[new_count][1],
            }

        return jsonify(
            {"success": True, "story_id": story_id, "level_up": level_up_info}
        )

    except Exception as e:
        print(f"[동화 생성 오류] {e}")
        return (
            jsonify({"success": False, "error": "동화 만들기 중 오류가 발생했어요"}),
            500,
        )


@app.route("/api/story/<int:story_id>", methods=["DELETE"])
def api_delete_story(story_id):
    """동화를 삭제합니다."""
    try:
        db.delete_story(story_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/story/<int:story_id>/read", methods=["POST"])
def api_mark_story_read(story_id):
    """동화를 읽음 처리합니다."""
    try:
        db.mark_story_read(story_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/words")
def api_words():
    return jsonify(db.get_all_words())


@app.route("/api/drawings")
def api_drawings():
    drawings = db.get_all_drawings()
    return jsonify(drawings)


@app.route("/api/user/stats")
def api_user_stats():
    """사용자의 전체 책 개수와 현재 뱃지 정보를 반환합니다."""
    count = db.get_story_count()

    badge = "🌱 새싹 작가"
    if count >= 31:
        badge = "👑 전설 작가"
    elif count >= 21:
        badge = "✨ 마법 작가"
    elif count >= 11:
        badge = "🌳 꿈나무 작가"

    return jsonify({"total_books": count, "badge": badge})


@app.route("/api/drawings/<int:drawing_id>", methods=["DELETE"])
def api_delete_drawing(drawing_id):
    try:
        db.delete_drawing(drawing_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    import sys
    import io

    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

    print("=" * 50)
    print("AI Fairy Tale App Starting!")
    print("=" * 50)
    print(
        f"Gemini API:    {'SET ✓' if Config.GEMINI_API_KEY    else 'NOT SET - check .env'}"
    )
    print(
        f"Anthropic API: {'SET ✓' if Config.ANTHROPIC_API_KEY else 'NOT SET (fallback)'}"
    )
    print(
        f"OpenAI API:    {'SET ✓' if Config.OPENAI_API_KEY    else 'NOT SET - no image gen'}"
    )
    print(
        f"CLOVA TTS:     {'SET ✓' if Config.CLOVA_CLIENT_ID  else 'NOT SET - gTTS 폴백 사용'}"
    )
    print("URL: http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, use_reloader=False, port=5000, host="0.0.0.0")
