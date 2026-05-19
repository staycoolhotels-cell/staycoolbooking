@echo off
echo ============================================
echo   FIX FOR ROLE COLUMN NULL ISSUE
echo ============================================
echo.
echo Opening Supabase SQL Editor in your browser...
echo.
start https://dlislsrlwovcxsuqdlvy.supabase.co/project/_/sql
echo.
echo INSTRUCTIONS:
echo 1. The Supabase SQL Editor should open in your browser
echo 2. Copy ALL the SQL from: fix_role_column_MANUAL.sql
echo 3. Paste it into the SQL Editor
echo 4. Click "RUN" or press Ctrl+Enter
echo 5. Wait for "Success" message
echo.
echo The SQL will:
echo   - Add default value 'guest' to role column
echo   - Update any NULL role values to 'guest'
echo   - Fix the trigger to read role from signup form
echo.
echo After running the SQL, try logging in again.
echo.
pause
