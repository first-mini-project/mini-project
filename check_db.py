import sqlite3

conn = sqlite3.connect('fairy_tale.db')
cursor = conn.cursor()

# 테이블 목록
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("=" * 50)
print("📊 테이블 목록:")
print("=" * 50)
for table in tables:
    print(f"  • {table[0]}")

# 각 테이블의 데이터 확인
for table_name in [row[0] for row in tables]:
    print(f"\n{'=' * 50}")
    print(f"📄 [{table_name}] 테이블 구조:")
    print("=" * 50)
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
    
    # 데이터 샘플
    cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
    count = cursor.fetchone()[0]
    print(f"\n총 데이터 수: {count}개")
    
    if count > 0:
        print(f"\n📌 샘플 데이터 (처음 3개):")
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 3;")
        for row in cursor.fetchall():
            print(f"  {row}")

conn.close()
print("\n" + "=" * 50)
