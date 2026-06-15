# AI任务管家 - 前端依赖安装脚本

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI任务管家 - 前端依赖安装" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 刷新环境变量
Write-Host "刷新环境变量..." -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

Start-Sleep -Seconds 2

# 检查Node.js
Write-Host ""
Write-Host "检查Node.js安装..." -ForegroundColor Yellow
try {
    $nodeVersion = & node --version 2>&1
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js 未找到，请重启终端" -ForegroundColor Red
    Write-Host "提示：安装Node.js后需要重启终端才能生效" -ForegroundColor Gray
    exit 1
}

# 检查npm
Write-Host "检查npm安装..." -ForegroundColor Yellow
try {
    $npmVersion = & npm --version 2>&1
    Write-Host "✓ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm 未找到，请重启终端" -ForegroundColor Red
    exit 1
}

# 安装依赖
Write-Host ""
Write-Host "安装前端依赖 (npm install)..." -ForegroundColor Cyan
Write-Host "这可能需要几分钟时间..." -ForegroundColor Gray
Write-Host ""

$projectPath = "D:\PersonalProject"

try {
    Set-Location $projectPath

    Write-Host "执行 npm install..." -ForegroundColor Yellow
    $npmResult = & npm install 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ 前端依赖安装成功！" -ForegroundColor Green
        Write-Host ""

        # 检查vite
        Write-Host "检查Vite构建工具..." -ForegroundColor Yellow
        if (Test-Path "$projectPath\node_modules\vite") {
            Write-Host "✓ Vite 已安装" -ForegroundColor Green
        } else {
            Write-Host "⚠ Vite 未正确安装" -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  ✓ 安装完成！" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "启动方式：" -ForegroundColor White
        Write-Host "  1. 后端: python api\app.py" -ForegroundColor Gray
        Write-Host "  2. 前端: npm run dev" -ForegroundColor Gray
        Write-Host "  3. 访问: http://localhost:3000" -ForegroundColor Gray
        Write-Host ""

    } else {
        Write-Host "✗ npm install 失败" -ForegroundColor Red
        Write-Host $npmResult -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "✗ 安装过程中出错: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "按 Enter 键退出..." -ForegroundColor Gray
Read-Host
