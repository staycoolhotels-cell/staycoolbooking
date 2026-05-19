-- First, remove any duplicate verifications, keeping the most recent one
DELETE FROM "public"."verifications"
WHERE id NOT IN (
  SELECT id FROM (
    SELECT DISTINCT ON (user_id) id
    FROM "public"."verifications"
    ORDER BY user_id, created_at DESC
  ) t
);

-- Then add the unique constraint
ALTER TABLE "public"."verifications" 
ADD CONSTRAINT "verifications_user_id_key" UNIQUE ("user_id");
