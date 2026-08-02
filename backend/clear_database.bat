@echo off
echo ============================================
echo  SevaSetu Backend - Clear & Re-initialize DB
echo ============================================
echo.

REM Navigate to backend directory
cd /d "%~dp0"

REM Check virtual environment
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

echo [1/2] Clearing database tables...
python clear_db.py

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to clear database.
    pause
    exit /b 1
)

echo.
echo [2/2] Re-initializing baseline departments and default accounts...
python init_database.py

echo.
echo ============================================
echo  ✅ Database successfully reset and seeded!
echo ============================================
pause
