@echo off
echo Building Fuse Angular...

REM Check if node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed!
    exit /b 1
)

REM Set memory limit
set NODE_OPTIONS=--max-old-space-size=8192

REM Clean previous build
if exist "dist" rmdir /s /q "dist"

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Build using npx
echo Building for production...
npx @angular/cli build --configuration production --base-href ./

if errorlevel 1 (
    echo Build failed!
    exit /b 1
) else (
    echo Build completed successfully!
    echo Output directory: dist\
)