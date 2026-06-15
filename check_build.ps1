Set-Location -Path "d:\PersonalProject"
npm run build 2>&1 | Select-Object -First 50
