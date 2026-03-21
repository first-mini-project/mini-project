import sqlite3
import json

conn = sqlite3.connect('fairy_tale.db')
conn.row_factory = sqlite3.Row
cursor = conn.execute('SELECT id, title, illustration_path, scene_data FROM stories ORDER BY id DESC LIMIT 3')
for r in cursor:
    print(f"ID: {r['id']} | Title: {r['title']}")
    print(f"  illustration_path: {r['illustration_path']}")
    sd = json.loads(r['scene_data']) if r['scene_data'] else []
    print(f"  merged_image(first): {sd[0].get('merged_image') if sd else 'None'}")
    print("-" * 40)
conn.close()
