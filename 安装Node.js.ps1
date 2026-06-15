# AI任务管家 - Node.js 自动安装脚本

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI任务管家 - Node.js 安装向导" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Node.js 下载链接 (LTS版本 20.11.0)
$nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
$installerPath = "$env:TEMP\nodejs-installer.msi"

Write-Host "[1/4] 检查系统环境..." -ForegroundColor Yellow
$is64Bit = [Environment]::Is64BitOperatingSystem
Write-Host "系统架构: $(if ($is64Bit) {'64位'} else {'32位'})" -ForegroundColor Cyan

Write-Host ""
Write-Host "[2/4] 下载 Node.js 20.11.0 LTS..." -ForegroundColor Yellow
Write-Host "下载链接: $nodeUrl" -ForegroundColor Gray
Write-Host "这可能需要几分钟时间，取决于您的网络速度..." -ForegroundColor Gray
Write-Host ""

try {
    # 使用 WebClient 下载
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($nodeUrl, $installerPath)

    if (Test-Path $installerPath) {
        $fileSize = (Get-Item $installerPath).Length / 1MB
        Write-Host "✓ 下载完成！文件大小: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
    } else {
        Write-Host "✗ 下载失败" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ 下载失败: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "请手动下载:" -ForegroundColor Yellow
    Write-Host "1. 访问: https://nodejs.org/" -ForegroundColor Gray
    Write-Host "2. 下载 Windows Installer (.msi) 64位版本" -ForegroundColor Gray
    Write-Host "3. 运行安装程序" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "[3/4] 安装 Node.js..." -ForegroundColor Yellow
Write-Host "提示: 安装程序需要管理员权限" -ForegroundColor Gray
Write-Host ""

try {
    # 使用 msiexec 静默安装
    $process = Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet /norestart" -PassThru -Wait

    if ($process.ExitCode -eq 0) {
        Write-Host "✓ 安装成功！" -ForegroundColor Green
    } else {
        Write-Host "✗ 安装失败 (错误码: $($process.ExitCode))" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ 安装失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[4/4] 验证安装..." -ForegroundColor Yellow

# 等待一小段时间让安装完成
Start-Sleep -Seconds 3

# 刷新环境变量
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

try {
    # 查找Node.js安装路径
    $nodePath = & where.exe node 2>$null
    if ($nodePath) {
        Write-Host "✓ Node.js 路径: $nodePath" -ForegroundColor Green

        $nodeVersion = & node --version
        Write-Host "✓ Node.js 版本: $nodeVersion" -ForegroundColor Green

        $npmVersion = & npm --version
        Write-Host "✓ npm 版本: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠ Node.js 已安装但未在当前PATH中找到" -ForegroundColor Yellow
        Write-Host "请重启终端后再试" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠ 验证安装时出现问题" -ForegroundColor Yellow
    Write-Host "请重启终端后再验证" -ForegroundColor Gray
}

# 清理临时文件
Write-Host ""
Write-Host "清理临时文件..." -ForegroundColor Gray
Remove-Item $installerPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ Node.js 安装完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "重要提示:" -ForegroundColor Yellow
Write-Host "  请重启终端或PowerShell以使Node.js生效" -ForegroundColor Gray
Write-Host ""
Write-Host "下一步操作:" -ForegroundColor White
Write-Host "  1. 重启终端" -ForegroundColor Cyan
Write-Host "  2. 进入项目目录: cd D:\PersonalProject" -ForegroundColor Cyan
Write-Host "  3. 安装依赖: npm install" -ForegroundColor Cyan
Write-Host "  4. 启动后端: python api\app.py" -ForegroundColor Cyan
Write-Host "  5. 启动前端: npm run dev" -ForegroundColor Cyan
Write-Host "  6. 访问应用: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Write-Host "按 Enter 键退出..." -ForegroundColor Gray
Read-Host
