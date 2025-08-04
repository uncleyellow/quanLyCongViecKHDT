-- Change type of checklistItems column to cards table
ALTER TABLE ratraco_task_management.cards
MODIFY checklistItems JSON DEFAULT NULL;
