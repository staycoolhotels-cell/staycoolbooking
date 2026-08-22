-- Update bank_account_number for Venkata Ramana (venkataramananarne@gmail.com)
-- Targeted by email to avoid accidental row changes.
-- Run only once.

UPDATE public.host_kyc_details
SET
    bank_account_number = '32394071757',
    updated_at          = now()
WHERE
    email = 'venkataramananarne@gmail.com'
    AND (bank_account_number IS NULL OR bank_account_number = '');

-- Verify (optional — check updated row)
-- SELECT id, legal_business_name, email, bank_account_number, updated_at
-- FROM public.host_kyc_details
-- WHERE email = 'venkataramananarne@gmail.com';
