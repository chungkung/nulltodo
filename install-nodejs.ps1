$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI任务管家 - Node.js 安装脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
$installerPath = "$env:TEMP\nodejs-installer.msi"

Write-Host "正在下载 Node.js 20.11.0 LTS..." -ForegroundColor Yellow
Write-Host "下载地址: $nodeUrl" -ForegroundColor Gray

try {
    Write-Host "`n使用 Invoke-WebRequest 下载..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath -UserAgent "Mozilla/5.0"

    if (Test-Path $installerPath) {
        $fileSize = (Get-Item $installerPath).Length / 1MB
        Write-Host "✓ 下载完成！文件大小: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
        Write-Host ""

        Write-Host "正在安装 Node.js..." -ForegroundColor Yellow
        Write-Host "提示: 安装程序将自动运行，可能需要管理员权限" -ForegroundColor Gray
        Write-Host ""

        $process = Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet /norestart" -PassThru -WindowStyle Hidden

        Write-Host "等待安装完成..." -ForegroundColor Cyan
        $process.WaitForExit()

        Start-Sleep -Seconds 3

        Write-Host ""
        Write-Host "正在刷新环境变量..." -ForegroundColor Yellow
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

        Write-Host ""
        Write-Host "尝试检测 Node.js..." -ForegroundColor Cyan
        try {
            $nodeVersion = & "C:\Program Files\nodejs\node.exe" --version 2>$null
            if ($nodeVersion) {
                Write-Host "✓ Node.js 安装成功！版本: $nodeVersion" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠ Node.js 可能未正确添加到 PATH，请尝试重启终端" -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "清理临时文件..." -ForegroundColor Gray
        Remove-Item $installerPath -Force -ErrorAction SilentlyContinue

        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  ✓ 安装完成！" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "请重启终端或PowerShell以使Node.js生效" -ForegroundColor Yellow
        Write-Host "然后运行: npm install" -ForegroundColor Cyan
        Write-Host ""

    } else {
        Write-Host "✗ 下载失败" -ForegroundColor Red
    }

} catch {
    Write-Host "✗ 安装失败: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "请手动下载安装:" -ForegroundColor Yellow
    Write-Host "1. 访问: https://nodejs.org/" -ForegroundColor Gray
    Write-Host "2. 下载 Windows Installer (.msi)" -ForegroundColor Gray
    Write-Host "3. 运行安装程序" -ForegroundColor Gray
}

Write-Host ""
Write-Host "按 Enter 键退出..." -ForegroundColor Gray
Read-Host
