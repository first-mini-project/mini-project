import sqlite3

conn = sqlite3.connect('fairy_tale.db')
cursor = conn.cursor()

# 테이블 목록
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in cursor.fetchall()]

print("테이블:", tables)
print()

for table_name in tables:
    cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
    count = cursor.fetchone()[0]
    print(f"[{table_name}] - {count}개 행")
    
    # 컬럼 정보
    cursor.execute(f"PRAGMA table_info({table_name});")
    cols = cursor.fetchall()
    for col in cols:
        print(f"  └ {col[1]} ({col[2]})")

conn.close()
