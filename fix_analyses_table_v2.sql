-- Добавляем недостающие колонки в таблицу analyses
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS analysis_data JSONB,
ADD COLUMN IF NOT EXISTS compatibility_rating VARCHAR,
ADD COLUMN IF NOT EXISTS compatibility_score INTEGER;

-- Проверяем структуру таблицы
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'analyses' 
ORDER BY ordinal_position;