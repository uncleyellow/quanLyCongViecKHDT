-- Add recurringConfig column to boards table
ALTER TABLE boards 
ADD COLUMN recurringConfig JSON DEFAULT NULL 
COMMENT 'JSON configuration for recurring tasks settings';

-- Update existing boards with default recurring config
UPDATE boards 
SET recurringConfig = JSON_OBJECT(
    'isRecurring', false,
    'completedListId', NULL
) 
WHERE recurringConfig IS NULL; 