# PowerShell script to execute the role column fix SQL
# This script uses psql to connect to Supabase and execute the SQL

$env:PGPASSWORD = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q"

# Supabase connection details
$dbHost = "aws-0-ap-south-1.pooler.supabase.com"
$port = "6543"
$database = "postgres"
$user = "postgres.dlislsrlwovcxsuqdlvy"

# SQL to execute
$sql = @"
-- Fix users.role column to have a default value and update trigger function

-- Step 1: Add default value to the role column
ALTER TABLE public.users 
ALTER COLUMN role SET DEFAULT 'guest';

-- Step 2: Update any existing NULL role values to 'guest'
UPDATE public.users
SET role = 'guest'
WHERE role IS NULL;

-- Step 3: Replace the handle_new_user function with correct implementation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS `$`$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name', 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'guest')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
`$`$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
"@

# Execute using psql
Write-Host "Connecting to Supabase database..."
Write-Host "Host: $dbHost"
Write-Host "Database: $database"
Write-Host ""

# Try to execute the SQL
try {
    $sql | psql -h $dbHost -p $port -U $user -d $database
    Write-Host ""
    Write-Host "SQL executed successfully!" -ForegroundColor Green
    Write-Host "The role column fix has been applied." -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "Error executing SQL: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "If psql is not installed, please:" -ForegroundColor Yellow
    Write-Host "1. Go to https://dlislsrlwovcxsuqdlvy.supabase.co/project/_/sql" -ForegroundColor Yellow
    Write-Host "2. Copy the SQL from fix_role_column_MANUAL.sql" -ForegroundColor Yellow
    Write-Host "3. Paste and run it in the SQL Editor" -ForegroundColor Yellow
}
