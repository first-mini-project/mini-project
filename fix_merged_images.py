import os
import sqlite3
import json
from config import Config
from services import image_service

Config.init_dirs()

def fix_merged_images():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, title, scene_data, drawing_ids FROM stories')
    rows = cursor.fetchall()
    
    print(f"[{len(rows)}개의 동화 확인 중...]")
    
    for row in rows:
        story_id = row['id']
        title = row['title']
        scene_data = json.loads(row['scene_data']) if row['scene_data'] else None
        
        if not scene_data:
            continue
            
        # merged_image가 첫 번째 씬에 없으면 누락된 것
        if not scene_data[0].get('merged_image'):
            print(f"[{story_id}] '{title}' 병합 이미지 누락. 재생성 중...")
            try:
                drawing_ids = json.loads(row['drawing_ids']) if row['drawing_ids'] else []
                # Get drawings
                if drawing_ids:
                    placeholders = ','.join(['?'] * len(drawing_ids))
                    c2 = conn.cursor()
                    c2.execute(f"SELECT * FROM drawings WHERE id IN ({placeholders})", drawing_ids)
                    drawings = [dict(d) for d in c2.fetchall()]
                else:
                    drawings = []
                
                # 병합 이미지 생성 (flatten)
                new_scene_data = image_service.flatten_scene_images(scene_data, drawings)
                
                # DB 업데이트
                # 그리고 기존 잘못된 illustration_path가 있다면 NULL 처리하여 fallback 방지!
                cursor.execute('UPDATE stories SET scene_data = ?, illustration_path = NULL WHERE id = ?', 
                               (json.dumps(new_scene_data, ensure_ascii=False), story_id))
                conn.commit()
                print(f"   -> 완료!")
            except Exception as e:
                print(f"   -> 오류: {e}")

    conn.close()
    print("모든 병합 이미지 복구 완료!")

if __name__ == '__main__':
    fix_merged_images()
