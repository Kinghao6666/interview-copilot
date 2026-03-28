@echo off
setlocal EnableExtensions

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "BACKEND_DIR=%ROOT_DIR%\backend"
set "FRONTEND_DIR=%ROOT_DIR%\frontend"
set "DRY_RUN=0"

if /I "%~1"=="--dry-run" set "DRY_RUN=1"
if /I "%~1"=="-n" set "DRY_RUN=1"

if not exist "%BACKEND_DIR%\run.py" (
  echo [ERROR] Backend entry not found: "%BACKEND_DIR%\run.py"
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Frontend entry not found: "%FRONTEND_DIR%\package.json"
  exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python not found in PATH. Please install Python 3.11+ first.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm not found in PATH. Please install Node.js 18+ first.
  exit /b 1
)

if not exist "%BACKEND_DIR%\.env" (
  if exist "%BACKEND_DIR%\.env.example" (
    copy /Y "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
    echo [INFO] Created backend\.env from .env.example
  ) else (
    echo [WARN] backend\.env missing and .env.example not found
  )
)

if not exist "%FRONTEND_DIR%\.env.local" (
  if exist "%FRONTEND_DIR%\.env.example" (
    copy /Y "%FRONTEND_DIR%\.env.example" "%FRONTEND_DIR%\.env.local" >nul
    echo [INFO] Created frontend\.env.local from .env.example
  ) else (
    echo [WARN] frontend\.env.local missing and .env.example not found
  )
)

python -c "import uvicorn" >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Backend dependency missing: uvicorn
  echo [FIX] Run these commands first:
  echo        cd /d "%BACKEND_DIR%"
  echo        python -m pip install -r requirements.txt
  echo.
  echo [TIP] After install, run start-dev.bat again.
  exit /b 1
)

if not exist "%FRONTEND_DIR%\node_modules" (
  echo [WARN] frontend\node_modules not found.
  echo [FIX] Run these commands first:
  echo        cd /d "%FRONTEND_DIR%"
  echo        npm install
  echo.
  echo [TIP] Then run start-dev.bat again.
  exit /b 1
)

set "BACKEND_START=chcp 65001 >nul && cd /d ""%BACKEND_DIR%"" && python run.py"
set "FRONTEND_START=chcp 65001 >nul && cd /d ""%FRONTEND_DIR%"" && npm run dev"

if "%DRY_RUN%"=="1" (
  echo [DRY-RUN] Backend command:
  echo cmd /k "%BACKEND_START%"
  echo.
  echo [DRY-RUN] Frontend command:
  echo cmd /k "%FRONTEND_START%"
  echo.
  echo [DRY-RUN] Frontend URL: http://localhost:3000
  echo [DRY-RUN] Backend URL:  http://localhost:8000
  echo [DRY-RUN] Swagger URL:  http://localhost:8000/docs
  exit /b 0
)

echo [1/2] Starting backend window...
start "Interview Copilot Backend" cmd /k "%BACKEND_START%"

timeout /t 2 /nobreak >nul

echo [2/2] Starting frontend window...
start "Interview Copilot Frontend" cmd /k "%FRONTEND_START%"

echo.
echo [DONE] Both windows launched.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo Swagger:  http://localhost:8000/docs
exit /b 0
