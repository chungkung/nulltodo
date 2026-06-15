$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI任务管家 - 依赖安装脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] 检查系统环境..." -ForegroundColor Yellow

$nodeInstalled = $false
$pythonInstalled = $false

try {
    node --version 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $nodeVersion = node --version
        Write-Host "✓ Node.js 已安装: $nodeVersion" -ForegroundColor Green
        $nodeInstalled = $true
    }
} catch {
    Write-Host "✗ Node.js 未安装" -ForegroundColor Red
}

try {
    python --version 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $pythonVersion = python --version
        Write-Host "✓ Python 已安装: $pythonVersion" -ForegroundColor Green
        $pythonInstalled = $true
    }
} catch {
    Write-Host "✗ Python 未安装" -ForegroundColor Red
}

Write-Host ""

if (-not $nodeInstalled) {
    Write-Host "[2/4] 安装 Node.js..." -ForegroundColor Yellow
    Write-Host "请手动下载安装 Node.js: https://nodejs.org/" -ForegroundColor Red
    Write-Host "推荐下载 LTS 版本" -ForegroundColor Gray
    Write-Host ""
}

if (-not $pythonInstalled) {
    Write-Host "[3/4] 安装 Python..." -ForegroundColor Yellow
    Write-Host "请手动下载安装 Python: https://www.python.org/downloads/" -ForegroundColor Red
    Write-Host "安装时勾选 'Add Python to PATH'" -ForegroundColor Gray
    Write-Host ""
}

if ($nodeInstalled -and $pythonInstalled) {
    Write-Host "[4/4] 安装项目依赖..." -ForegroundColor Yellow

    Write-Host "`n安装前端依赖 (npm install)..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ npm install 失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ 前端依赖安装完成" -ForegroundColor Green

    Write-Host "`n安装后端依赖..." -ForegroundColor Cyan
    pip install flask flask-cors requests
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ pip install 失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ 后端依赖安装完成" -ForegroundColor Green

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✓ 所有依赖安装完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "启动方式：" -ForegroundColor White
    Write-Host "  1. 后端: python api/app.py" -ForegroundColor Gray
    Write-Host "  2. 前端: npm run dev" -ForegroundColor Gray
    Write-Host "  3. 访问: http://localhost:3000" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "⚠ 请先安装缺失的依赖，然后重新运行此脚本" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
}
