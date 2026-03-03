# PowerShell script to execute the bookings RLS fix
# This script uses psql to connect to Supabase and execute the SQL

# Connection details (copied from existing project scripts)
$env:PGPASSWORD = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q"
$dbHost = "aws-0-ap-south-1.pooler.supabase.com"
$port = "6543"
$database = "postgres"
$user = "postgres.dlislsrlwovcxsuqdlvy"

# SQL to execute (content of e:\staycoolbooking1\supabase\migrations\20260207_fix_bookings_rls.sql)
$sql = @"
-- Enable RLS on bookings table if not already enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS ""Allow authenticated users to insert bookings"" ON public.bookings;
DROP POLICY IF EXISTS ""Users can insert their own bookings"" ON public.bookings;

-- Create policy to allow authenticated users to insert
CREATE POLICY ""Allow authenticated users to insert bookings""
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = guest_id);

-- Also ensure they can view their own bookings
DROP POLICY IF EXISTS ""Users can view their own bookings"" ON public.bookings;
CREATE POLICY ""Users can view their own bookings""
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = guest_id);

-- Grant necessary permissions
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
"@

# Execute using psql
Write-Host "Connecting to Supabase database..."
Write-Host "Host: $dbHost"

try {
    $sql | psql -h $dbHost -p $port -U $user -d $database
    Write-Host ""
    Write-Host "SQL executed successfully!" -ForegroundColor Green
    Write-Host "The bookings RLS fix has been applied." -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "Error executing SQL: $_" -ForegroundColor Red
    Write-Host "If psql is not installed, please manually run the SQL in 'supabase/migrations/20260207_fix_bookings_rls.sql'." -ForegroundColor Yellow
}
