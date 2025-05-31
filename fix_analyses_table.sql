-- Fix analyses table structure
-- Add missing columns if they don't exist

-- Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'analyses' 
ORDER BY ordinal_position;

-- Add missing columns to analyses table
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS compatibility_score INTEGER;

ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS compatibility_rating VARCHAR;

ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS analysis_data JSONB;

-- Update existing records to have default values
UPDATE analyses 
SET compatibility_score = 0 
WHERE compatibility_score IS NULL;

UPDATE analyses 
SET compatibility_rating = 'unknown' 
WHERE compatibility_rating IS NULL;

UPDATE analyses 
SET analysis_data = '{}' 
WHERE analysis_data IS NULL;

-- Make required fields NOT NULL
ALTER TABLE analyses 
ALTER COLUMN compatibility_score SET NOT NULL;

ALTER TABLE analyses 
ALTER COLUMN compatibility_rating SET NOT NULL;

ALTER TABLE analyses 
ALTER COLUMN analysis_data SET NOT NULL;

-- Verify the updated structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'analyses' 
ORDER BY ordinal_position;