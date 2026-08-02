@echo off
echo ===================================================
echo  Starting InnoVista (Frontend + MySQL Backend)
echo ===================================================
echo.

REM Start Flask Backend in new terminal window
start "InnoVista Flask Backend" cmd /k "cd /d "%~dp0backend" && ..\.venv\Scripts\python.exe app.py"

REM Start Vite Frontend in current window
cd /d "%~dp0"
npm run dev
