-- Add isAssigned field to boards table
ALTER TABLE boards 
ADD COLUMN isAssigned BOOLEAN DEFAULT FALSE 
COMMENT 'Whether this board is for assigned tasks';

-- Update existing boards with default isAssigned value
UPDATE boards 
SET isAssigned = FALSE 
WHERE isAssigned IS NULL;
