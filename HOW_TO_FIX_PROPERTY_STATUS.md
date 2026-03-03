# STEP-BY-STEP FIX GUIDE

## Current Problem
Properties are showing in the wrong tabs because the `create_property` function is setting status to 'active' instead of 'pending'.

## Solution Steps

### Step 1: Run the Diagnostic Query
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file: `CHECK_CURRENT_STATUS.sql`
4. Copy and paste the contents into SQL Editor
5. Click **Run**
6. **Check the results**: Look at the function definition - does it include `status` in the INSERT?

### Step 2: Apply the Fix
1. Open the file: `FIX_PROPERTY_STATUS.sql`
2. Copy **ALL** the contents
3. Go to Supabase Dashboard → **SQL Editor**
4. Paste the entire script
5. Click **Run**
6. Wait for success message

### Step 3: Verify the Fix
After running the script, you should see:
- ✅ Function dropped and recreated
- ✅ Permissions granted
- ✅ Verification query showing the function definition
- ✅ Status column default showing 'pending'::text

### Step 4: Test the Complete Flow

#### Test 1: Create New Property
1. Log in as a **Host**
2. Go to **Host Dashboard** → **Properties**
3. Click **Add Property**
4. Fill in all details and submit
5. **Expected Result**: Property appears in **Pending** tab (NOT Active)

#### Test 2: Admin Approval
1. Open a new browser tab
2. Log in as **Admin**
3. Go to **Admin Panel** → **Property Management** (or Properties tab)
4. You should see tabs: All | Pending | Active | Rejected
5. Click **Pending** tab
6. Find the property you just created
7. Click **Approve** button
8. **Expected Result**: Property disappears from Pending tab

#### Test 3: Check Host Dashboard
1. Switch back to Host Dashboard tab
2. Go to **Properties** section
3. **Expected Result**: 
   - Property is now in **Active** tab
   - Property is NOT in **Pending** tab anymore

#### Test 4: Rejection Flow
1. As Host, create another property
2. Verify it appears in **Pending** tab
3. As Admin, go to Property Management → Pending tab
4. Click **Reject** button on the property
5. Switch to Host Dashboard
6. **Expected Result**: Property is now in **Rejected** tab

## Important Notes

### Admin Panel Property Management
The admin has **TWO** places to manage properties:

1. **Admin Panel → Properties Tab** (in AdminPanelInteractive)
   - Shows only pending properties
   - Basic approve/reject functionality

2. **Admin Panel → Property Management Page** (dedicated page)
   - Shows ALL properties with tabs: All | Pending | Active | Rejected
   - Better UI with table view
   - Approve/Reject buttons for pending properties
   - Can re-approve rejected properties

**Recommendation**: Use the **Property Management** page for better visibility.

### Host Dashboard
Host sees their own properties in tabs:
- **All Properties**: Shows everything
- **Pending**: Awaiting admin approval
- **Active**: Approved by admin
- **Rejected**: Rejected by admin

## Troubleshooting

### If properties still show in wrong tabs:

1. **Clear browser cache and refresh**
2. **Check the database directly**:
   ```sql
   SELECT id, name, status FROM properties ORDER BY created_at DESC LIMIT 5;
   ```
3. **Verify the function was updated**:
   ```sql
   SELECT pg_get_functiondef(oid) 
   FROM pg_proc 
   WHERE proname = 'create_property';
   ```
4. **Check for errors in browser console** (F12)

### If real-time updates don't work:
1. Refresh the page manually
2. Check browser console for Supabase realtime errors
3. Verify you're logged in with the correct user

## Files Reference
- **SQL Fix**: `FIX_PROPERTY_STATUS.sql`
- **Diagnostic**: `CHECK_CURRENT_STATUS.sql`
- **Admin Property Management**: `src/app/admin-panel/property-management/components/PropertyList.tsx`
- **Host Properties**: `src/app/host-dashboard/components/Properties.tsx`
