# Mahle Inventory Management System - Quick Setup Guide

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MAHLE INVENTORY MANAGEMENT SYSTEM" -ForegroundColor Cyan
Write-Host "           Quick Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version
    Write-Host "✓ PostgreSQL found: $pgVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ PostgreSQL not found. Please install PostgreSQL first." -ForegroundColor Red
    exit
}

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         DATABASE SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Database setup
$dbName = "mahle_inventory"
$dbUser = Read-Host "Enter PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "postgres"
}

Write-Host "Creating database: $dbName" -ForegroundColor Yellow

# Create database
$env:PGPASSWORD = Read-Host "Enter PostgreSQL password" -AsSecureString
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:PGPASSWORD))

psql -U $dbUser -c "CREATE DATABASE $dbName;" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database created successfully" -ForegroundColor Green
}
else {
    Write-Host "! Database might already exist (continuing...)" -ForegroundColor Yellow
}

# Run schema
Write-Host "Running database schema..." -ForegroundColor Yellow
Set-Location backend
psql -U $dbUser -d $dbName -f config/database.sql
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database schema applied successfully" -ForegroundColor Green
}
else {
    Write-Host "✗ Failed to apply database schema" -ForegroundColor Red
    Set-Location ..
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         BACKEND SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
    Set-Location ..
    exit
}

# Update .env file
Write-Host "Configuring backend environment..." -ForegroundColor Yellow
$envContent = @"
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$dbName
DB_USER=$dbUser
DB_PASSWORD=$env:PGPASSWORD
JWT_SECRET=mahle_secret_key_2026_change_this_in_production
NODE_ENV=development
"@
$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✓ Backend environment configured" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         FRONTEND SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location frontend
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    Set-Location ..
    exit
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "        SETUP COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start Backend Server:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "2. Start Frontend (in a new terminal):" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Open browser and navigate to:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "4. Login with default admin credentials:" -ForegroundColor Yellow
Write-Host "   Email: admin@mahle.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         Enjoy! 🚀" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
