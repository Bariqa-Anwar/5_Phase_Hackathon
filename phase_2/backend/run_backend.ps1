# run_backend.ps1 — Activate the backend venv and start the FastAPI server
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$VenvActivate = Join-Path $ScriptDir "venv\Scripts\Activate.ps1"

if (-Not (Test-Path $VenvActivate)) {
    Write-Error "Virtual environment not found at $VenvActivate. Run 'python -m venv venv' first."
    exit 1
}

Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& $VenvActivate

Write-Host "Starting FastAPI backend on http://localhost:8000 ..." -ForegroundColor Green
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
