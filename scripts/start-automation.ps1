# Demarrage automation NEXUS-DROP — Redis + Celery Worker + Celery Beat
# Usage: .\scripts\start-automation.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Backend = Join-Path $Root "backend"

if (-not (Test-Path (Join-Path $Backend "workers\pipeline.py"))) {
    Write-Error "Lance ce script depuis nexus-drop\scripts\"
}

Write-Host "=== NEXUS-DROP Automation (Redis + Celery) ===" -ForegroundColor Cyan

# Redis via Docker
$redisRunning = docker ps --filter "name=nexus-redis" --format "{{.Names}}" 2>$null
if ($redisRunning -ne "nexus-redis") {
    $existing = docker ps -a --filter "name=nexus-redis" --format "{{.Names}}" 2>$null
    if ($existing -eq "nexus-redis") {
        Write-Host "Demarrage conteneur nexus-redis existant..." -ForegroundColor Yellow
        docker start nexus-redis | Out-Null
    } else {
        Write-Host "Creation conteneur Redis nexus-redis..." -ForegroundColor Yellow
        docker run -d -p 6379:6379 --name nexus-redis redis:alpine | Out-Null
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "Redis nexus-redis deja actif." -ForegroundColor Green
}

$envBlock = @"
Set-Location '$Backend'
`$env:PYTHONPATH = '$Backend'
`$env:PLAYWRIGHT_BROWSERS_PATH = '0'
`$env:REDIS_URL = 'redis://localhost:6379/0'
`$env:CELERY_BROKER_URL = 'redis://localhost:6379/0'
"@

$workerCmd = $envBlock + @"

Write-Host '=== Celery Worker (pipeline) ===' -ForegroundColor Green
celery -A workers.pipeline worker --loglevel=info --pool=solo
"@

$beatCmd = $envBlock + @"

Write-Host '=== Celery Beat (scheduler) ===' -ForegroundColor Green
celery -A workers.celerybeat beat --loglevel=info
"@

Write-Host "Ouverture Worker + Beat dans 2 fenetres PowerShell..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", $workerCmd
Start-Sleep -Seconds 1
Start-Process powershell -ArgumentList "-NoExit", "-Command", $beatCmd

Write-Host ""
Write-Host "Automation demarree." -ForegroundColor Green
Write-Host "  Redis   : localhost:6379"
Write-Host "  Worker  : celery -A workers.pipeline worker --pool=solo"
Write-Host "  Beat    : celery -A workers.celerybeat beat"
Write-Host ""
Write-Host "NOTE: stack legacy scraper/celery_app.py ignoree — utiliser backend/workers/ uniquement."
