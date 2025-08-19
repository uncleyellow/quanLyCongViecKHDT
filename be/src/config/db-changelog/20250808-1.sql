-- Add indexes for better filtering performance on cards table
-- These indexes will improve the performance of filter operations

-- Index for filtering by status
CREATE INDEX idx_cards_status ON cards(status);

-- Index for filtering by type
CREATE INDEX idx_cards_type ON cards(type);

-- Index for filtering by due date
CREATE INDEX idx_cards_due_date ON cards(dueDate);

-- Index for filtering by priority
CREATE INDEX idx_cards_priority ON cards(priority);

-- Composite index for board and list filtering
CREATE INDEX idx_cards_board_list ON cards(boardId, listId);

-- Index for text search on title and description
CREATE FULLTEXT INDEX idx_cards_text_search ON cards(title, description);

-- Index for filtering by creation date
CREATE INDEX idx_cards_created_at ON cards(createdAt);

-- Index for filtering by archived status
CREATE INDEX idx_cards_archived ON cards(archived);

-- Composite index for common filter combinations
CREATE INDEX idx_cards_status_priority ON cards(status, priority);
CREATE INDEX idx_cards_status_due_date ON cards(status, dueDate);
CREATE INDEX idx_cards_type_status ON cards(type, status);
