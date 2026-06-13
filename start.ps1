# start.ps1
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $ScriptDir) { $ScriptDir = $pwd }

Write-Host "Starting Xeno AI Command Center..." -ForegroundColor Green

# Load environment variables from .env file if it exists
$EnvFile = "$ScriptDir\.env"
if (Test-Path $EnvFile) {
    Write-Host "Loading environment variables from .env..." -ForegroundColor Gray
    Get-Content $EnvFile | ForEach-Object {
        $Line = $_.Trim()
        if ($Line -and -not $Line.StartsWith("#") -and $Line.Contains("=")) {
            $Key, $Value = $Line.Split("=", 2)
            $Key = $Key.Trim()
            $Value = $Value.Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($Key, $Value, "Process")
        }
    }
} else {
    Write-Warning "No .env file found at $EnvFile. Please copy .env.example to .env and fill in your keys."
}

# Verify variables or set safe defaults
if (-not $env:GROQ_API_KEY) {
    Write-Warning "GROQ_API_KEY is not set. AI copilot features will not work."
}

if (-not $env:MONGODB_URI) {
    $env:MONGODB_URI = "mongodb://localhost:27017"
    Write-Host "MONGODB_URI is not set. Defaulting to local MongoDB: $env:MONGODB_URI" -ForegroundColor Yellow
}

Write-Host "Starting Backend Service on Port 8000..." -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory $ScriptDir -ArgumentList "-NoExit", "-Command", "`$env:GROQ_API_KEY='$env:GROQ_API_KEY'; `$env:MONGODB_URI='$env:MONGODB_URI'; .\venv\Scripts\python.exe backend/main.py"

Write-Host "Starting Next.js Frontend on Port 3000..." -ForegroundColor Magenta
Start-Process powershell -WorkingDirectory "$ScriptDir\frontend" -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "All services started! Once Next.js is ready, open http://localhost:3000 in your browser." -ForegroundColor Green
