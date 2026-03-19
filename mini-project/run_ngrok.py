"""
run_ngrok.py - ngrok 터널을 열고 Flask 앱을 실행합니다.

사용법:
  python run_ngrok.py                      # authtoken 없이 임시 URL
  python run_ngrok.py --token YOUR_TOKEN   # authtoken 등록 후 실행

무료 authtoken 발급: https://dashboard.ngrok.com/authtokens
"""
import sys
import os
import io
import argparse
from dotenv import load_dotenv

load_dotenv()  # .env 파일 로드

# Windows 콘솔 UTF-8 출력
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ─── 인자 파싱
parser = argparse.ArgumentParser()
parser.add_argument('--token', default=os.getenv('NGROK_AUTHTOKEN', ''),
                    help='ngrok authtoken')
parser.add_argument('--port', type=int, default=5000)
args = parser.parse_args()

PORT = args.port

# ─── ngrok 터널 생성
from pyngrok import ngrok, conf

if args.token:
    conf.get_default().auth_token = args.token

print(f"[ngrok] 터널 생성 중... (포트 {PORT})")

try:
    tunnel = ngrok.connect(PORT, "http")
    public_url = tunnel.public_url

    print()
    print("=" * 55)
    print("  ngrok 터널 오픈!")
    print(f"  외부 URL : {public_url}")
    print(f"  로컬 URL : http://localhost:{PORT}")
    print("=" * 55)
    print()
    print("  스마트폰 / 태블릿에서 외부 URL로 접속하세요!")
    print("  종료: Ctrl+C")
    print()

except Exception as e:
    print(f"[ngrok 오류] {e}")
    print()
    print("  authtoken 없이는 연결이 제한될 수 있어요.")
    print("  무료 토큰 발급: https://dashboard.ngrok.com/authtokens")
    print("  발급 후: python run_ngrok.py --token YOUR_TOKEN")
    print()

# ─── Flask 앱 실행 (ngrok 터널이 유지되는 동안 실행)
from config import Config
Config.init_dirs()

import database as db
db.init_db()

from app import app
app.run(port=PORT, host='0.0.0.0', debug=False)
