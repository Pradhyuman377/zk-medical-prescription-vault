# ====================================================================
# Zero-Knowledge Medical Prescription Vault - 1-Click Launch Script
# ====================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptDir) {
    $ScriptDir = (Get-Location).Path
}

$aiPath = Join-Path $ScriptDir "ai_service"
$backendPath = Join-Path $ScriptDir "backend"
$frontendPath = Join-Path $ScriptDir "frontend"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[*] Launching Zero-Knowledge Prescription Vault Services..." -ForegroundColor Cyan
Write-Host "    Root Directory: $ScriptDir" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Python AI / OCR Microservice (Port 8000)
Write-Host "`n[1/3] Starting Python FastAPI AI Microservice on :8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$aiPath'; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

# 2. Start Node.js Express Backend (Port 5000)
Write-Host "[2/3] Starting Node.js Backend & Cryptographic Vault on :5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$backendPath'; npm run dev"

# 3. Start Vite Frontend (Port 5173)
Write-Host "[3/3] Starting React Vite Frontend on :5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$frontendPath'; npm run dev"

Write-Host "`n[OK] All services dispatched into separate terminal windows!" -ForegroundColor Green
Write-Host "Frontend URL: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host "AI Service:   http://localhost:8000/docs" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
