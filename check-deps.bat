@echo off
chcp 65001 >nul
echo ========================================
echo    AI任务管家 - 依赖安装脚本
echo ========================================
echo.

echo [1/4] 检查 Node.js...
where node >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Node.js 已安装
    for /f "delims=" %%i in ('node --version') do echo   版本: %%i
) else (
    echo ✗ Node.js 未安装
    echo   请手动下载: https://nodejs.org/
)
echo.

echo [2/4] 检查 Python...
where python >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Python 已安装
    for /f "delims=" %%i in ('python --version') do echo   版本: %%i
) else (
    echo ✗ Python 未安装
    echo   请手动下载: https://www.python.org/downloads/
)
echo.

echo [3/4] 检查 pip...
where pip >nul 2>&1
if %errorlevel%==0 (
    echo ✓ pip 已安装
) else (
    echo ✗ pip 未安装
)
echo.

echo ========================================
echo 安装说明
echo ========================================
echo.
echo 如果上述依赖未安装，请手动安装:
echo.
echo 1. Node.js: https://nodejs.org/ (下载LTS版本)
echo 2. Python: https://www.python.org/downloads/
echo.
echo 安装完成后，重新运行此脚本
echo.

pause
