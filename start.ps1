param(
    [switch]$Electron
)

if ($Electron) {
    Write-Host "=== HR Rezerv Tizimi (Electron) ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if electron is installed
    $electronPath = Join-Path $PSScriptRoot "node_modules\.bin\electron.cmd"
    if (-not (Test-Path $electronPath)) {
        Write-Host "Electron o'rnatilmagan. O'rnatilmoqda..." -ForegroundColor Yellow
        Set-Location $PSScriptRoot
        npm.cmd install
    }
    
    Write-Host "Electron ilovasi ishga tushirilmoqda..." -ForegroundColor Yellow
    Set-Location $PSScriptRoot
    npx.cmd electron .
} else {
    Write-Host "=== HR Rezerv Tizimi ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Start backend
    Write-Host "[1/2] Backend server ishga tushirilmoqda..." -ForegroundColor Yellow
    $backendJob = Start-Job -ScriptBlock {
        Set-Location "$using:PSScriptRoot\backend"
        node server.js
    }

    Start-Sleep -Seconds 3

    # Check if backend started
    $health = $null
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -ErrorAction Stop
    } catch {}

    if ($health) {
        Write-Host "  Backend ishlayapti: http://localhost:3001" -ForegroundColor Green
    } else {
        Write-Host "  Backend ishga tushmadi!" -ForegroundColor Red
        Stop-Job $backendJob
        exit 1
    }

    Write-Host ""
    Write-Host "[2/2] Frontend ishga tushirilmoqda..." -ForegroundColor Yellow

    # Start frontend dev server
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location "$using:PSScriptRoot\frontend"
        npm.cmd exec vite -- --host
    }

    Start-Sleep -Seconds 5

    Write-Host "  Frontend ishlayapti: http://localhost:5173" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== Tizim muvaffaqiyatli ishga tushdi! ===" -ForegroundColor Cyan
    Write-Host "Kirish: http://localhost:5173" -ForegroundColor White
    Write-Host "Login: admin / admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "Electron versiyasi: .\start.ps1 -Electron" -ForegroundColor Gray
    Write-Host "EXE build: .\build-exe.ps1" -ForegroundColor Gray
    Write-Host "Tugatish uchun CTRL+C ni bosing" -ForegroundColor Gray

    # Wait for jobs
    Wait-Job $backendJob, $frontendJob
}
