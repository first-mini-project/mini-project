import os
import sqlite3
import urllib.parse
import uuid
import requests
import json
import time

from config import Config
from services import image_service
from services.image_service import _get_pipe

Config.init_dirs()

def fix_missing_covers():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, title, keywords FROM stories WHERE illustration_path IS NULL')
    rows = cursor.fetchall()
    
    print(f"[{len(rows)}개의 표지 없는 동화 발견. LOCAL SD/Pollinations 듀얼 복구 시작...]")
    
    pipe = _get_pipe()
    
    for row in rows:
        story_id = row['id']
        title = row['title']
        keywords = json.loads(row['keywords']) if row['keywords'] else []
        kws = ', '.join(keywords[:3]) if keywords else "cute characters"
        
        prompt = (
            f"A beautiful, colorful children's book illustration for a fairy tale. "
            f"The story revolves around: {kws}. "
            f"3D Render, Pixar-inspired, vibrant colors, magical atmosphere. "
            f"Centralized character, wide background, NO emojis on the cover. "
            f"Studio Ghibli quality."
        )
        
        filename = f"story_{uuid.uuid4().hex[:16]}.jpg"
        filepath = os.path.join(Config.ILLUSTRATIONS_DIR, filename)
        db_path = f"static/generated/illustrations/{filename}"
        
        success = False
        print(f"[{story_id}] '{title}' 표지 생성 중...")
        
        if pipe is not None:
            try:
                print("   -> 로컬 SD로 생성 시도...")
                image = pipe(
                    prompt=prompt,
                    num_inference_steps=2,
                    guidance_scale=0.0,
                    height=512, width=512,
                ).images[0]
                image.save(filepath, format='JPEG', quality=90)
                success = True
                print("   -> 로컬 SD 생성 성공!")
            except Exception as e:
                print(f"   -> 로컬 SD 실패: {e}")
        
        if not success:
            encoded = urllib.parse.quote(prompt)
            seed = abs(hash(title)) % 100000
            url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&seed={seed}&nologo=true&model=flux"
            
            for attempt in range(3):
                try:
                    resp = requests.get(url, timeout=45)
                    if resp.status_code == 200:
                        with open(filepath, 'wb') as f:
                            f.write(resp.content)
                        success = True
                        print("   -> Pollinations 생성 성공!")
                        break
                    else:
                        print(f"   -> [재시도 {attempt+1}] Pollinations API 오류: {resp.status_code}")
                        time.sleep(3)
                except Exception as e:
                    print(f"   -> Pollinations 오류: {e}")
                    time.sleep(3)
        
        if success:
            cursor.execute('UPDATE stories SET illustration_path = ? WHERE id = ?', (db_path, story_id))
            conn.commit()
            print(f"   -> DB 반영 완료 (영구 링크): {db_path}")
        else:
            print(f"   -> 최종 실패: {story_id}")
        
        time.sleep(1)

    conn.close()
    print("모든 영구 이미지 생성 및 복구 완료!")

if __name__ == '__main__':
    fix_missing_covers()
