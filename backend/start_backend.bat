@echo off
echo ============================================
echo  SevaSetu Backend - DB Check ^& Server Start
echo ============================================
echo.

REM Navigate to backend directory
cd /d "%~dp0"

REM Check if python is available
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found. Please install Python 3.9+
    pause
    exit /b 1
)

REM Check if venv exists
if exist "venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo [WARN] No virtual environment found. Using system Python.
)

REM Install dependencies if needed
echo.
echo [1/3] Checking Python dependencies...
pip install -r requirements.txt -q
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed.

REM Run DB connectivity check
echo.
echo [2/3] Running database connectivity check...
python db_check.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Database check failed. See errors above.
    pause
    exit /b 1
)

REM Start Flask server
echo.
echo [3/3] Starting Flask backend on http://127.0.0.1:5000
echo      Press CTRL+C to stop the server
echo.
python app.py
