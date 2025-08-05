-- Change type of checklistItems column to cards table
ALTER TABLE ratraco_task_management.cards
MODIFY checklistItems JSON DEFAULT NULL;

-- Change foreign key of boardMembers table
ALTER TABLE boardMembers
DROP FOREIGN KEY boardMembers_ibfk_2;

DELETE FROM boardMembers;

ALTER TABLE boardMembers
ADD CONSTRAINT boardMembers_ibfk_2 FOREIGN KEY (memberId)
REFERENCES users (id) ON DELETE CASCADE;

-- Add viewConfig column to boards table
ALTER TABLE boards
ADD COLUMN viewConfig JSON DEFAULT NULL;

-- Add color column to lists table
ALTER TABLE lists
ADD COLUMN color varchar(20) DEFAULT NULL AFTER title;

-- Add cardMembers table
CREATE TABLE cardMembers (
  cardId varchar(36) NOT NULL,
  memberId varchar(36) NOT NULL,
  joinedAt datetime DEFAULT CURRENT_TIMESTAMP,
  role varchar(50) DEFAULT 'member',
  PRIMARY KEY (cardId, memberId)
)
ENGINE = INNODB,
AVG_ROW_LENGTH = 2048,
CHARACTER SET utf8mb4,
COLLATE utf8mb4_0900_ai_ci;

-- Ràng buộc khóa ngoại đến bảng cards
ALTER TABLE cardMembers
ADD CONSTRAINT cardMembers_ibfk_1 FOREIGN KEY (cardId)
REFERENCES cards (id) ON DELETE CASCADE;

-- Ràng buộc khóa ngoại đến bảng users
ALTER TABLE cardMembers
ADD CONSTRAINT cardMembers_ibfk_2 FOREIGN KEY (memberId)
REFERENCES users (id) ON DELETE CASCADE;


-----DONE 