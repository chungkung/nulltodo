$ErrorActionPreference = "SilentlyContinue"

function Download-File($url, $output) {
    Write-Host "下载: $url"
    $webClient = New-Object System.Net.WebClient
    try {
        $webClient.DownloadFile($url, $output)
        return $true
    } catch {
        Write-Host "下载失败: $_" -ForegroundColor Red
        return $false
    } finally {
        $webClient.Dispose()
    }
}

function Install-NodeJS {
    Write-Host "正在下载 Node.js LTS..." -ForegroundColor Cyan
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $installerPath = "$env:TEMP\nodejs-installer.msi"

    if (Download-File $nodeUrl $installerPath) {
        Write-Host "正在安装 Node.js (可能需要管理员权限)..." -ForegroundColor Cyan
        Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait -NoNewWindow
        Write-Host "Node.js 安装完成！" -ForegroundColor Green

        Start-Sleep -Seconds 3

        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        return $true
    }
    return $false
}

function Install-Python {
    Write-Host "正在下载 Python 3.11..." -ForegroundColor Cyan
    $pythonUrl = "https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe"
    $installerPath = "$env:TEMP\python-installer.exe"

    if (Download-File $pythonUrl $installerPath) {
        Write-Host "正在安装 Python (可能需要管理员权限)..." -ForegroundColor Cyan
        Start-Process $installerPath -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1" -Wait -NoNewWindow
        Write-Host "Python 安装完成！" -ForegroundColor Green

        Start-Sleep -Seconds 3

        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        return $true
    }
    return $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI任务管家 - 自动安装脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$nodeInstalled = $false
$pythonInstalled = $false

Write-Host "[1/4] 检查 Node.js..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✓ Node.js 已安装: $nodeVersion" -ForegroundColor Green
    $nodeInstalled = $true
} else {
    Write-Host "✗ Node.js 未安装，开始自动安装..." -ForegroundColor Red
    $nodeInstalled = Install-NodeJS
}

Write-Host ""
Write-Host "[2/4] 检查 Python..." -ForegroundColor Yellow
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonVersion = python --version
    Write-Host "✓ Python 已安装: $pythonVersion" -ForegroundColor Green
    $pythonInstalled = $true
} else {
    Write-Host "✗ Python 未安装，开始自动安装..." -ForegroundColor Red
    $pythonInstalled = Install-Python
}

Write-Host ""
Write-Host "[3/4] 刷新环境变量..." -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host "[4/4] 安装项目依赖..." -ForegroundColor Yellow

if ($nodeInstalled) {
    Write-Host "`n安装前端依赖 (npm install)..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 前端依赖安装完成" -ForegroundColor Green
    } else {
        Write-Host "✗ npm install 失败" -ForegroundColor Red
    }
}

if ($pythonInstalled) {
    Write-Host "`n安装后端依赖..." -ForegroundColor Cyan
    pip install flask flask-cors requests
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 后端依赖安装完成" -ForegroundColor Green
    } else {
        Write-Host "✗ pip install 失败" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($nodeInstalled -and $pythonInstalled) {
    Write-Host "  ✓ 所有依赖安装完成！" -ForegroundColor Green
} else {
    Write-Host "  ⚠ 部分依赖安装失败，请手动安装" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "启动方式：" -ForegroundColor White
Write-Host "  后端: python api/app.py" -ForegroundColor Gray
Write-Host "  前端: npm run dev" -ForegroundColor Gray
Write-Host "  访问: http://localhost:3000" -ForegroundColor Gray
Write-Host ""

Read-Host "按 Enter 键退出"
