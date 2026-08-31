# Installation locale NEXUS-DROP (Windows, sans Docker)
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

Write-Host "=== NEXUS-DROP install dev ===" -ForegroundColor Cyan
Write-Host "Dossier: $Root"

if (-not (Test-Path "$Root\.env")) {
    Copy-Item "$Root\.env.example" "$Root\.env"
    Write-Host "Fichier .env cree depuis .env.example"
}

Write-Host ""
Write-Host "[1/2] Backend Python..." -ForegroundColor Yellow
Set-Location "$Root\backend"
python -m pip install --upgrade pip -q
python -m pip install -r requirements.txt -q
Write-Host "Backend OK"

Write-Host ""
Write-Host "[2/2] Frontend Next.js..." -ForegroundColor Yellow
Set-Location "$Root\frontend"
npm install
Write-Host "Frontend OK"

Write-Host ""
Write-Host "=== Installation terminee ===" -ForegroundColor Green
Write-Host "Lance ensuite: .\scripts\start-dev.ps1"
Write-Host "URL NEXUS: http://localhost:3001  (EBX reste sur :3000)"
