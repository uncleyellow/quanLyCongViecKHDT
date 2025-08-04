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

-----DONE 