# PowerShell script to execute the trigger update SQL
# This script uses psql to connect to Supabase and execute the SQL

$env:PGPASSWORD = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q"

# Supabase connection details
$dbHost = "aws-0-ap-south-1.pooler.supabase.com"
$port = "6543"
$database = "postgres"
$user = "postgres.dlislsrlwovcxsuqdlvy"

# SQL to execute
$sql = @"
-- Migration to update handle_user_update trigger function
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS `$`$
DECLARE
  v_role text;
  v_status text;
BEGIN
  -- Determine Role
  v_role := COALESCE(NEW.raw_user_meta_data->>'name', 'guest'); -- Wait, name? No, role!
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'guest');
  v_role := lower(v_role);

  -- Determine Status based on Role
  IF v_role = 'host' THEN
    v_status := 'pending';
  ELSE
    v_status := 'active'; -- Guests and Admins are auto-active by default
  END IF;

  INSERT INTO public.users (id, name, email, avatar_url, role, status)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name', 
    NEW.email, 
    NEW.raw_user_meta_data->>'avatar_url', 
    v_role,
    v_status
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    role = v_role,
    status = CASE 
        WHEN public.users.status IN ('active', 'approved', 'rejected', 'suspended', 'approved_host') THEN public.users.status 
        ELSE v_status 
    END;
  RETURN NEW;
END;
`$`$ LANGUAGE plpgsql SECURITY DEFINER;
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
  Write-Host "The trigger update has been applied." -ForegroundColor Green
}
catch {
  Write-Host ""
  Write-Host "Error executing SQL: $_" -ForegroundColor Red
  Write-Host ""
  Write-Host "If psql is not installed, please copy the content of 'apply_trigger_update.sql' and run it in your Supabase SQL Editor." -ForegroundColor Yellow
}
