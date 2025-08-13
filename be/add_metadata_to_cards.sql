-- Add metadata column to cards table
ALTER TABLE cards ADD COLUMN metadata JSON DEFAULT '{}';

-- Create index for metadata column for better performance
CREATE INDEX idx_cards_metadata ON cards(metadata);

-- Add comment to explain the purpose of metadata column
ALTER TABLE cards MODIFY COLUMN metadata JSON COMMENT 'Stores custom fields and additional data for cards in JSON format';
