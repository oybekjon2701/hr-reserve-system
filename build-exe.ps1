Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  HR Rezerv Tizimi - EXE Builder" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install root dependencies (electron, electron-builder)
Write-Host "[1/4] Root dependencies o'rnatilmoqda..." -ForegroundColor Yellow
Set-Location $PSScriptRoot
npm.cmd install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Xatolik: Root dependencies o'rnatilmadi!" -ForegroundColor Red
    exit 1
}
Write-Host "  Tamom!" -ForegroundColor Green

# Step 2: Install backend dependencies
Write-Host "[2/4] Backend dependencies o'rnatilmoqda..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"
npm.cmd install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Xatolik: Backend dependencies o'rnatilmadi!" -ForegroundColor Red
    exit 1
}
Write-Host "  Tamom!" -ForegroundColor Green

# Step 3: Build frontend
Write-Host "[3/4] Frontend build qilinmoqda..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\frontend"
npm.cmd install
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Xatolik: Frontend build qilinmadi!" -ForegroundColor Red
    exit 1
}
Write-Host "  Tamom!" -ForegroundColor Green

# Step 4: Build EXE
Write-Host "[4/4] EXE build qilinmoqda..." -ForegroundColor Yellow
Set-Location $PSScriptRoot
npx.cmd electron-builder --win --x64
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Xatolik: EXE build qilinmadi!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  BUILD MUVAFFAQIYATLI TUGALLANDI!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Natijalar: release\ papkasida" -ForegroundColor White
Write-Host "  - HR-Rezerv-Tizimi-Setup.exe (o'rnatish)" -ForegroundColor White
Write-Host "  - HR-Rezerv-Tizimi-portable.exe (o'rnatish talab qilmaydi)" -ForegroundColor White
Write-Host ""
