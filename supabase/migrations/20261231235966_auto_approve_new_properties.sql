-- New host listings are automatically approved and published.
-- This also covers create_property RPC calls that omit a status value.
ALTER TABLE public.properties
  ALTER COLUMN status SET DEFAULT 'active';
