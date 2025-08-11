-- Migration: Add cardOrderIds field to users table
-- This field will store the order of cards for each user as a JSON array of card IDs

ALTER TABLE users 
ADD COLUMN cardOrderIds JSON DEFAULT '[]' COMMENT 'Array of card IDs in order for this user';

-- Add index for better performance when querying by cardOrderIds
CREATE INDEX idx_users_card_order_ids ON users(cardOrderIds);
