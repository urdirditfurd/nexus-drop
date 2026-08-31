# Demarrage local NEXUS-DROP (Windows, sans Docker)
# Port 3001 : EBX occupe deja le 3000 sur ta machine
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$FrontPort = 3001
$ApiPort = 8000

if (-not (Test-Path "$Root\backend\main.py")) {
    Write-Error "Lance ce script depuis nexus-drop\scripts\"
}

if (-not (Test-Path "$Root\.env")) {
    Copy-Item "$Root\.env.example" "$Root\.env"
}

Write-Host "=== NEXUS-DROP demarrage local ===" -ForegroundColor Cyan
Write-Host "EBX reste sur http://localhost:3000 | NEXUS sur http://localhost:$FrontPort" -ForegroundColor DarkGray

# Arreter l'ancienne API sur :8000 (sinon routes manquantes ex. /auto-publish/dry-run)
$on8000 = Get-NetTCPConnection -LocalPort $ApiPort -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $on8000) {
    if ($procId -and $procId -ne 0) {
        Write-Host "Arret processus API existant (PID $procId) sur port $ApiPort..." -ForegroundColor Yellow
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 1

$dbPath = ($Root + "\backend\nexus_drop.db").Replace("\", "/")
$cors = "http://localhost:$FrontPort,http://127.0.0.1:$FrontPort"
$backendCmd = "Set-Location '$Root\backend'; `$env:PLAYWRIGHT_BROWSERS_PATH='0'; `$env:DATABASE_URL='sqlite+aiosqlite:///$dbPath'; `$env:BACKEND_CORS_ORIGINS='$cors'; python main.py"
$frontendCmd = "Set-Location '$Root\frontend'; `$env:NEXT_PUBLIC_API_URL='http://localhost:$ApiPort'; npm run dev"

Write-Host "Ouverture de 2 fenetres PowerShell (API + Front)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "=== URLs NEXUS-DROP ===" -ForegroundColor Green
Write-Host "  Boutique + Admin : http://localhost:$FrontPort"
Write-Host "  API docs         : http://localhost:$ApiPort/docs"
Write-Host "  Auto-Publish     : http://localhost:$FrontPort/admin/auto-publish"
Write-Host "  Dry-Run API      : POST http://localhost:$ApiPort/auto-publish/dry-run"
Write-Host "  Admin login      : http://localhost:$FrontPort/admin/login"
Write-Host "  Email            : admin@nexus-drop.local"
Write-Host "  Mot de passe     : NexusAdmin2026! (voir .env)"
Write-Host ""
Write-Host "Attends ~15s que Next.js compile."
Write-Host "Ne confonds pas avec EBX : http://localhost:3000 = EBX"
