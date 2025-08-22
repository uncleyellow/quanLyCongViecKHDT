-- Add priority column to cards table
ALTER TABLE cards ADD COLUMN priority ENUM('low', 'medium', 'high') DEFAULT 'medium' AFTER status;

-- Update existing cards to have medium priority
UPDATE cards SET priority = 'medium' WHERE priority IS NULL;
