-- Add viewConfig column to boards table
ALTER TABLE boards 
ADD COLUMN viewConfig JSON DEFAULT NULL 
COMMENT 'JSON configuration for board view settings';

-- Update existing boards with default view config
UPDATE boards 
SET viewConfig = JSON_OBJECT(
    'showTitle', true,
    'showDescription', true,
    'showDueDate', true,
    'showMembers', true,
    'showLabels', true,
    'showChecklist', true,
    'showStatus', true,
    'showType', true
) 
WHERE viewConfig IS NULL; 