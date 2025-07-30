@echo off
echo Building and Deploying Fuse Angular to GitHub Pages...

REM Check if node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed! Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo npm is not installed! Please install npm.
    exit /b 1
)

REM Set memory limit for Node.js
set NODE_OPTIONS=--max-old-space-size=8192

REM Clean previous build
if exist "dist" (
    echo Cleaning previous build...
    rmdir /s /q "dist"
)

REM Install dependencies if node_modules is missing
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Check if angular-cli-ghpages is installed, install if missing
if not exist "node_modules\@angular-schule\angular-cli-ghpages" (
    echo Installing angular-cli-ghpages...
    npm install --save-dev @angular-schule/angular-cli-ghpages
)

REM Build the project for production
echo Building for production...
npx ng build --configuration production --base-href https://uncleyellow.github.io/quanLyCongViecKHDT/

if errorlevel 1 (
    echo Build failed!
    exit /b 1
)

REM Check if GH_TOKEN is set
if "%GH_TOKEN%"=="" (
    echo GH_TOKEN environment variable is not set!
    echo Please set GH_TOKEN with your GitHub Personal Access Token.
    echo Instructions: https://github.com/settings/tokens (select repo and workflow scopes)
    exit /b 1
)

REM Deploy to GitHub Pages
echo Deploying to GitHub Pages...
npx ng deploy --repo=https://%GH_TOKEN%@github.com/uncleyellow/quanLyCongViecKHDT.git --no-silent

if errorlevel 1 (
    echo Deployment failed!
    exit /b 1
) else (
    echo Deployment completed successfully!
    echo Your site should be live at https://uncleyellow.github.io/quanLyCongViecKHDT/
)

echo Done!
pause