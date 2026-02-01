ALTER TABLE properties ADD COLUMN license_url TEXT;
ALTER TABLE properties ADD COLUMN tax_bill_url TEXT;
ALTER TABLE properties ADD COLUMN current_bill_url TEXT;

ALTER TABLE properties ALTER COLUMN license_url SET DEFAULT 'https://dlislsrlwovcxsuqdlvy.supabase.co/storage/v1/object/public/documents/';
ALTER TABLE properties ALTER COLUMN tax_bill_url SET DEFAULT 'https://dlislsrlwovcxsuqdlvy.supabase.co/storage/v1/object/public/documents/';
ALTER TABLE properties ALTER COLUMN current_bill_url SET DEFAULT 'https://dlislsrlwovcxsuqdlvy.supabase.co/storage/v1/object/public/documents/';
