-- Remove email column from users table
-- Email is now only stored in Supabase Auth, not in our database
ALTER TABLE "users" DROP COLUMN IF EXISTS "email";



