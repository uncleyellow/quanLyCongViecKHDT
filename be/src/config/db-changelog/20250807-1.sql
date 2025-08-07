-- Add time tracking fields to cards table
ALTER TABLE cards ADD COLUMN totalTimeSpent INTEGER DEFAULT 0;
ALTER TABLE cards ADD COLUMN isTracking INTEGER DEFAULT 0;
ALTER TABLE cards ADD COLUMN trackingStartTime DATETIME DEFAULT NULL;
ALTER TABLE cards ADD COLUMN trackingPauseTime INTEGER DEFAULT 0;

-- Create card_time_tracking table
CREATE TABLE IF NOT EXISTS card_time_tracking (
    id VARCHAR(36) PRIMARY KEY,
    cardId VARCHAR(36) NOT NULL,
    userId VARCHAR(36) NOT NULL,
    action ENUM('start', 'pause', 'resume', 'stop') NOT NULL,
    startTime DATETIME NOT NULL,
    endTime DATETIME DEFAULT NULL,
    duration INTEGER DEFAULT 0,
    note TEXT DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cardId) REFERENCES cards(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_card_time_tracking_card_id ON card_time_tracking(cardId);
CREATE INDEX idx_card_time_tracking_user_id ON card_time_tracking(userId);
CREATE INDEX idx_card_time_tracking_start_time ON card_time_tracking(startTime);
