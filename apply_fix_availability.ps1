# PowerShell script to apply check_availability fix
# Using credentials from apply_bookings_rls.ps1

$env:PGPASSWORD = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q"
$dbHost = "aws-0-ap-south-1.pooler.supabase.com"
$port = "6543"
$database = "postgres"
$user = "postgres.dlislsrlwovcxsuqdlvy"
$sqlFile = "e:\staycoolbooking1\fix_check_availability.sql"

Write-Host "Connecting to Supabase database..."
Write-Host "Host: $dbHost"

try {
    Get-Content $sqlFile | psql -h $dbHost -p $port -U $user -d $database
    Write-Host ""
    Write-Host "SQL executed successfully!" -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "Error executing SQL: $_" -ForegroundColor Red
}
