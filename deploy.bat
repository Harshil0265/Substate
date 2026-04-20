@echo off
REM SUBSTATE Deployment Script for Windows
REM This script helps you deploy to GitHub and Vercel

echo ========================================
echo    SUBSTATE Deployment Script
echo ========================================
echo.

REM Check if git is initialized
if not exist .git (
    echo [*] Initializing Git repository...
    git init
    echo [+] Git initialized
) else (
    echo [+] Git repository already initialized
)

REM Check if .env exists
if not exist .env (
    echo [-] Error: .env file not found
    echo [!] Please create .env file from .env.example
    pause
    exit /b 1
)

REM Test build
echo.
echo [*] Testing build...
call npm run build

if errorlevel 1 (
    echo [-] Build failed! Please fix errors before deploying.
    pause
    exit /b 1
)

echo [+] Build successful

REM Add all files
echo.
echo [*] Adding files to git...
git add .

REM Get commit message
echo.
set /p commit_message="Enter commit message (or press Enter for default): "

if "%commit_message%"=="" (
    set commit_message=Deploy: Update SUBSTATE platform
)

REM Commit changes
git commit -m "%commit_message%"

REM Check if remote exists
git remote | findstr origin >nul
if errorlevel 1 (
    echo.
    echo [!] No remote repository found
    echo [?] Enter your GitHub repository URL:
    echo     Example: https://github.com/username/substate.git
    set /p repo_url="Repository URL: "
    
    if "%repo_url%"=="" (
        echo [-] No repository URL provided
        pause
        exit /b 1
    )
    
    git remote add origin %repo_url%
    echo [+] Remote repository added
)

REM Push to GitHub
echo.
echo [*] Pushing to GitHub...
git branch -M main
git push -u origin main

if errorlevel 1 (
    echo [-] Failed to push to GitHub
    echo [!] Please check your repository URL and credentials
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Deployment Complete!
echo ========================================
echo.
echo [+] Successfully pushed to GitHub!
echo.
echo Next Steps:
echo 1. Go to https://vercel.com
echo 2. Import your GitHub repository
echo 3. Add environment variables from .env
echo 4. Deploy!
echo.
echo For detailed instructions, see DEPLOYMENT.md
echo.
pause
