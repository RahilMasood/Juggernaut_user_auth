# Test script for engagements endpoint
# This script logs in, gets a token, and tests the engagements endpoint

Write-Host "`n🔐 Logging in..." -ForegroundColor Cyan

# Login
$loginBody = @{
    email = "admin@example.com"
    password = "9Ql?=n1%lt&maC6v"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/v1/auth/login" `
    -ContentType "application/json" `
    -Body $loginBody

$token = $loginResponse.data.accessToken
$refreshToken = $loginResponse.data.refreshToken

Write-Host "✅ Login successful!" -ForegroundColor Green
Write-Host "Access Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
Write-Host "`n📋 Testing engagements endpoint..." -ForegroundColor Cyan

# Test engagements endpoint
try {
    $engagementsResponse = Invoke-RestMethod -Method GET -Uri "http://localhost:3000/api/v1/engagements" `
        -Headers @{ Authorization = "Bearer $token" }
    
    Write-Host "✅ Success!" -ForegroundColor Green
    $engagementsResponse | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error Details:" -ForegroundColor Yellow
        $errorJson | ConvertTo-Json -Depth 3
    }
}

Write-Host "`n💡 Tip: Access tokens expire in 15 minutes. Use the refresh token to get a new access token." -ForegroundColor Yellow
Write-Host "Refresh Token: $($refreshToken.Substring(0, 20))..." -ForegroundColor Gray

