import os
import json
import uuid
import base64
import subprocess
import sys
from flask import (Flask, render_template, request, jsonify,
                   send_file, redirect, url_for, abort)

# ─── torch 자동 설치 (없을 때만) ─────────────────────────────────────────────
def _ensure_dependencies():
    # torch (CUDA 버전)
    try:
        import torch
    except ImportError:
        print("[설치] torch 설치 중 (최초 1회, 시간이 걸려요)...")
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install',
            'torch', 'torchvision',
            '--index-url', 'https://download.pytorch.org/whl/cu121',
            '--quiet'
        ])
        print("[설치] torch 완료!")

    # diffusers / transformers / accelerate
    missing = []
    for pkg in ['diffusers', 'transformers', 'accelerate']:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    if missing:
        print(f"[설치] {', '.join(missing)} 설치 중...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--quiet'] + missing)
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
app.config['SECRET_KEY'] = Config.SECRET_KEY
app.config['JSON_AS_ASCII'] = False
app.config['TEMPLATES_AUTO_RELOAD'] = True


# ─── 페이지 라우트 ────────────────────────────────────────────────────────────

@app.route('/')
def landing():
    return render_template('landing.html')


@app.route('/main')
def main():
    return render_template('main.html')


@app.route('/draw')
def draw():
    """랜덤 단어로 그림 그리기 페이지"""
    word = db.get_random_word()
    if not word:
        return redirect(url_for('main'))
    # 이미 그린 그림이 있는 단어는 제외하여 다양성 확보 (선택적)
    return render_template('drawing.html', word=word)


@app.route('/draw/<int:word_id>')
def draw_word(word_id):
    """특정 단어로 그림 그리기 페이지"""
    word = db.get_word(word_id)
    if not word:
        abort(404)
    existing_drawing = db.get_drawing_by_word_id(word_id)
    return render_template('drawing.html', word=word, existing_drawing=existing_drawing)


@app.route('/collection')
def collection():
    """그림 모음장 - 그린 그림 선택해서 동화 만들기"""
    drawings = db.get_all_drawings()
    return render_template('collection.html', drawings=drawings)


@app.route('/library')
def library():
    """내 동화 도서관"""
    stories = db.get_all_stories()
    return render_template('library.html', stories=stories)


@app.route('/story/<int:story_id>')
def storybook(story_id):
    """동화책 보기"""
    story = db.get_story(story_id)
    if not story:
        abort(404)
    drawings = db.get_drawings_by_ids(story['drawing_ids'])
    return render_template('storybook.html', story=story, drawings=drawings)


# ─── API 엔드포인트 ───────────────────────────────────────────────────────────

@app.route('/api/drawing/save', methods=['POST'])
def api_save_drawing():
    """아이가 그린 그림을 저장합니다."""
    data = request.get_json()
    word_id = data.get('word_id')
    image_data = data.get('image_data')  # base64 data URI

    if not word_id or not image_data:
        return jsonify({'success': False, 'error': '데이터가 없어요'}), 400

    if not image_data.startswith('data:image/'):
        return jsonify({'success': False, 'error': '이미지 형식이 잘못됐어요'}), 400

    replace_drawing_id = data.get('replace_drawing_id')

    try:
        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)

        filename = f"drawing_{uuid.uuid4().hex}.png"
        filepath = os.path.join(Config.DRAWINGS_DIR, filename)

        with open(filepath, 'wb') as f:
            f.write(img_bytes)

        relative_path = f"static/generated/drawings/{filename}"

        # 수정 모드: 기존 그림 삭제 후 새로 저장
        if replace_drawing_id:
            old = db.get_drawing_with_data(replace_drawing_id)
            if old and old.get('file_path'):
                old_file = os.path.join(os.path.dirname(__file__), old['file_path'])
                if os.path.exists(old_file):
                    os.remove(old_file)
            db.delete_drawing(replace_drawing_id)

        drawing_id = db.save_drawing(word_id, image_data, relative_path)

        return jsonify({'success': True, 'drawing_id': drawing_id})

    except Exception as e:
        print(f"[그림 저장 오류] {e}")
        return jsonify({'success': False, 'error': '저장 중 오류가 발생했어요'}), 500


@app.route('/api/drawing/help', methods=['POST'])
def api_drawing_help():
    """도와주세요! - DALL-E로 참고 이미지를 생성합니다."""
    data = request.get_json()
    korean = data.get('korean', '')
    english = data.get('english', '')

    # Claude로 최적화된 이미지 프롬프트 생성
    image_prompt = ai_service.generate_image_prompt(korean, english)

    # DALL-E로 이미지 생성
    image_data = image_service.generate_reference_image(korean, english, image_prompt)

    if image_data:
        return jsonify({'success': True, 'image': image_data})
    else:
        return jsonify({
            'success': False,
            'error': 'AI 그림 생성을 위해 HUGGINGFACE_API_KEY가 필요하거나 요청에 실패했어요'
        })


@app.route('/api/story/generate', methods=['POST'])
def api_generate_story():
    """선택한 그림들로 동화를 만듭니다."""
    data = request.get_json()
    drawing_ids = data.get('drawing_ids', [])

    # 유효성 검사
    if not (Config.MIN_SELECTED <= len(drawing_ids) <= Config.MAX_SELECTED):
        return jsonify({
            'success': False,
            'error': f'그림을 {Config.MIN_SELECTED}개~{Config.MAX_SELECTED}개 선택해주세요'
        }), 400

    # 그림 정보 조회
    drawings = db.get_drawings_by_ids(drawing_ids)
    if not drawings:
        return jsonify({'success': False, 'error': '그림을 찾을 수 없어요'}), 404

    # 키워드 추출 (중복 제거, 순서 유지)
    keywords = list(dict.fromkeys([d['korean'] for d in drawings]))

    try:
        # 1. Gemini로 동화 생성
        story_data = ai_service.generate_fairy_tale(keywords, drawings)

        # 2. HuggingFace SDXL로 장면 배경 이미지 병렬 생성
        if story_data.get('scene_data'):
            story_data['scene_data'] = image_service.generate_scene_bgs_parallel(
                story_data['scene_data']
            )

        # 3. DALL-E로 일러스트 생성 (OpenAI 키 없으면 skip)
        illustration_path = image_service.generate_story_illustration(
            story_data['title'], keywords
        )

        # 4. gTTS로 음성 생성
        full_text = f"{story_data['title']}. {story_data['content']} {story_data.get('moral', '')}"
        audio_path = tts_service.generate_tts(full_text, slow=False)

        # 5. DB 저장
        story_id = db.save_story(
            title=story_data['title'],
            content=story_data['content'],
            moral=story_data.get('moral', ''),
            keywords=keywords,
            drawing_ids=[d['id'] for d in drawings],
            illustration_path=illustration_path,
            audio_path=audio_path,
            scene_data=story_data.get('scene_data')
        )

        return jsonify({'success': True, 'story_id': story_id})

    except Exception as e:
        print(f"[동화 생성 오류] {e}")
        return jsonify({'success': False, 'error': '동화 만들기 중 오류가 발생했어요'}), 500


@app.route('/api/story/<int:story_id>', methods=['DELETE'])
def api_delete_story(story_id):
    """동화를 삭제합니다."""
    try:
        db.delete_story(story_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/story/<int:story_id>/read', methods=['POST'])
def api_mark_story_read(story_id):
    """동화를 읽음 처리합니다."""
    try:
        db.mark_story_read(story_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/words')
def api_words():
    return jsonify(db.get_all_words())


@app.route('/api/drawings')
def api_drawings():
    drawings = db.get_all_drawings()
    return jsonify(drawings)


@app.route('/api/drawings/<int:drawing_id>', methods=['DELETE'])
def api_delete_drawing(drawing_id):
    try:
        db.delete_drawing(drawing_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

    print("=" * 50)
    print("AI Fairy Tale App Starting!")
    print("=" * 50)
    print(f"Gemini API:    {'SET ✓' if Config.GEMINI_API_KEY    else 'NOT SET - check .env'}")
    print(f"Anthropic API: {'SET ✓' if Config.ANTHROPIC_API_KEY else 'NOT SET (fallback)'}")
    print(f"OpenAI API:    {'SET ✓' if Config.OPENAI_API_KEY    else 'NOT SET - no image gen'}")
    print("URL: http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000, host='0.0.0.0')
