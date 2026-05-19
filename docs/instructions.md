# Property Approval Workflow Implementation Guide

This document outlines the database schema, RLS policies, and application code for the property approval workflow.

## 1. Database Schema

The `properties` table needs a `status` column to track the approval state of a property. A `rejection_reason` column is also added to store the reason for rejection.

### `properties` Table Structure

```sql
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text,
  description text,
  -- ... other property fields
  host_id uuid,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_host_id_fkey FOREIGN KEY (host_id) REFERENCES auth.users (id),
  CONSTRAINT properties_status_check CHECK (status IN ('pending', 'active', 'rejected'))
);
```

### Migration File

A new migration file has been created to add the `rejection_reason` column and the `status` check constraint:

`supabase/migrations/20260202100000_add_rejection_reason_and_status_constraint.sql`

```sql
ALTER TABLE public.properties
ADD COLUMN rejection_reason TEXT;

ALTER TABLE public.properties
ADD CONSTRAINT properties_status_check CHECK (status IN ('pending', 'active', 'rejected'));
```

## 2. Row Level Security (RLS) Policies

RLS policies are essential for controlling access to the `properties` table.

### RLS Policies Migration

A new migration file has been created to update the RLS policies:

`supabase/migrations/20260202110000_update_rls_for_approval_workflow.sql`

```sql
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "1_Hosts_Can_Insert_Own_Properties" ON public.properties;
DROP POLICY IF EXISTS "2_Hosts_Can_Update_Own_Properties" ON public.properties;
DROP POLICY IF EXISTS "User can see own properties" ON public.properties;
DROP POLICY IF EXISTS "Allow hosts to select their own properties" ON public.properties;
DROP POLICY IF EXISTS "Properties are viewable by everyone." ON public.properties;
DROP POLICY IF EXISTS "Admin can read all properties" ON public.properties;
DROP POLICY IF EXISTS "Admin can update any property" ON public.properties;

-- RLS Policies for Hosts

-- Hosts can insert properties with status = 'pending'
CREATE POLICY "Hosts can insert their own properties"
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_id AND status = 'pending');

-- Hosts can view their own properties
CREATE POLICY "Hosts can view their own properties"
ON public.properties FOR SELECT
TO authenticated
USING (auth.uid() = host_id);

-- Hosts can update their own properties (but not the status)
CREATE POLICY "Hosts can update their own properties"
ON public.properties FOR UPDATE
TO authenticated
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id AND status <> 'active');

-- RLS Policies for Admins

-- Admins can view all properties
CREATE POLICY "Admins can view all properties"
ON public.properties FOR SELECT
TO authenticated
USING (get_my_claim('user_role') = '"admin"');

-- Admins can update any property (including status)
CREATE POLICY "Admins can update any property"
ON public.properties FOR UPDATE
TO authenticated
USING (get_my_claim('user_role') = '"admin"');

-- Public Access
-- Anyone can view active properties
CREATE POLICY "Public can view active properties"
ON public.properties FOR SELECT
TO anon, authenticated
USING (status = 'active');
```

## 3. SQL for Approving/Rejecting a Property

### Approve Property

```sql
UPDATE public.properties
SET status = 'active'
WHERE id = 'property_id';
```

### Reject Property

```sql
UPDATE public.properties
SET
  status = 'rejected',
  rejection_reason = 'Reason for rejection'
WHERE id = 'property_id';
```

## 4. Supabase Client Code (Next.js)

### Host Saving a Property

This function should be used when a host creates a new property.

`src/lib/property-actions.ts`
```typescript
// src/lib/property-actions.ts

import { supabase } from './supabaseClient';
import { Property } from './types';

export const createProperty = async (propertyData: Omit<Property, 'id' | 'created_at' | 'host_id' | 'status'>) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('properties')
    .insert([
      {
        ...propertyData,
        host_id: user.id,
        status: 'pending', // Explicitly set status to pending
      },
    ])
    .select();

  if (error) {
    console.error('Error creating property:', error);
    return null;
  }

  return data;
};
```

### Admin Approving/Rejecting a Property

These functions should be used by an admin to manage property approvals.

`src/lib/admin-actions.ts`
```typescript
// src/lib/admin-actions.ts

import { supabase } from './supabaseClient';

export const approveProperty = async (propertyId: string) => {
  const { data, error } = await supabase
    .from('properties')
    .update({ status: 'active' })
    .eq('id', propertyId)
    .select();

  if (error) {
    console.error('Error approving property:', error);
    return null;
  }

  return data;
};

export const rejectProperty = async (propertyId: string, rejectionReason: string) => {
  const { data, error } = await supabase
    .from('properties')
    .update({ status: 'rejected', rejection_reason: rejectionReason })
    .eq('id', propertyId)
    .select();

  if (error) {
    console.error('Error rejecting property:', error);
    return null;
  }

  return data;
};
```
