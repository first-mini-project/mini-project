@echo off
chcp 65001 >nul
echo ==========================================
echo   우리 AI 동화 만들기 앱 시작!
echo ==========================================
echo.
echo 브라우저에서 http://localhost:5000 을 열어주세요!
echo 종료하려면 Ctrl+C 를 누르세요.
echo.
cd /d "%~dp0"
python app.py
pause
