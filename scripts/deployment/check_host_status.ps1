# PowerShell script to check host status
$env:PGPASSWORD = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q"
$dbHost = "aws-0-ap-south-1.pooler.supabase.com"
$port = "6543"
$database = "postgres"
$user = "postgres.dlislsrlwovcxsuqdlvy"

$sql = @"
SELECT id, email, role, status, created_at FROM public.users WHERE role = 'host' ORDER BY created_at DESC;
"@

$sql | psql -h $dbHost -p $port -U $user -d $database
