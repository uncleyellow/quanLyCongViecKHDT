-- 1. Sửa lại tên trường trong bảng list thành camelCase

ALTER TABLE lists
CHANGE COLUMN board_id boardId VARCHAR(36) NOT NULL,
CHANGE COLUMN created_at createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
CHANGE COLUMN card_order_ids cardOrderIds JSON DEFAULT NULL,
CHANGE COLUMN created_by createdBy VARCHAR(36) DEFAULT NULL,
CHANGE COLUMN updated_by updatedBy VARCHAR(36) DEFAULT NULL,
CHANGE COLUMN deleted_by deletedBy VARCHAR(36) DEFAULT NULL,
CHANGE COLUMN updated_at updatedAt DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
CHANGE COLUMN deleted_at deletedAt DATETIME DEFAULT NULL;

-- Đổi lại index cho đúng tên cột mới
DROP INDEX boardId ON ratraco_task_management.lists;
CREATE INDEX idx_lists_boardId ON ratraco_task_management.lists (boardId);

-- Đổi lại foreign key constraint cho đúng tên cột mới
ALTER TABLE ratraco_task_management.lists
DROP FOREIGN KEY lists_ibfk_1;

ALTER TABLE ratraco_task_management.lists
ADD CONSTRAINT lists_ibfk_1 FOREIGN KEY (boardId)
REFERENCES ratraco_task_management.boards (id) ON DELETE CASCADE;

-- 2. Sửa lại tên trường trong bảng boards thành camelCase

-- Bước 1: Xóa foreign key
ALTER TABLE ratraco_task_management.boards
DROP FOREIGN KEY boards_ibfk_1,
DROP FOREIGN KEY boards_ibfk_2,
DROP FOREIGN KEY boards_ibfk_3;

-- Bước 2: Đổi tên cột sang camelCase
ALTER TABLE ratraco_task_management.boards
CHANGE COLUMN last_activity lastActivity DATETIME DEFAULT NULL,
CHANGE COLUMN owner_id ownerId VARCHAR(36) DEFAULT NULL,
CHANGE COLUMN is_public isPublic TINYINT DEFAULT 0,
CHANGE COLUMN created_at createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
CHANGE COLUMN company_id companyId VARCHAR(36) DEFAULT NULL,
CHANGE COLUMN department_id departmentId VARCHAR(36) DEFAULT NULL,
CHANGE COLUMN created_by createdBy VARCHAR(36) DEFAULT NULL,
CHANGE COLUMN updated_by updatedBy VARCHAR(36) DEFAULT NULL,
CHANGE COLUMN deleted_by deletedBy VARCHAR(36) DEFAULT NULL,
CHANGE COLUMN updated_at updatedAt DATETIME DEFAULT NULL,
CHANGE COLUMN deleted_at deletedAt DATETIME DEFAULT NULL,
CHANGE COLUMN list_order_ids listOrderIds JSON DEFAULT NULL;

-- Bước 3: Thêm lại foreign key với tên mới
ALTER TABLE ratraco_task_management.boards
ADD CONSTRAINT boards_ibfk_1 FOREIGN KEY (ownerId)
REFERENCES ratraco_task_management.users (id) ON DELETE SET NULL,
ADD CONSTRAINT boards_ibfk_2 FOREIGN KEY (companyId)
REFERENCES ratraco_task_management.companies (id) ON DELETE SET NULL,
ADD CONSTRAINT boards_ibfk_3 FOREIGN KEY (departmentId)
REFERENCES ratraco_task_management.departments (id) ON DELETE SET NULL;

-- 3. Sửa lại tên trường trong bảng cards thành camelCase
-- Bước 1: Xóa foreign key và index
ALTER TABLE ratraco_task_management.cards
DROP FOREIGN KEY cards_ibfk_1,
DROP FOREIGN KEY cards_ibfk_2;

DROP INDEX idx_cards_board_id ON ratraco_task_management.cards;
DROP INDEX idx_cards_list_id ON ratraco_task_management.cards;

-- Bước 2: Đổi tên cột sang camelCase
ALTER TABLE ratraco_task_management.cards
CHANGE COLUMN board_id boardId VARCHAR(36) NOT NULL,
CHANGE COLUMN list_id listId VARCHAR(36) NOT NULL,
CHANGE COLUMN due_date dueDate DATETIME DEFAULT NULL,
CHANGE COLUMN checklist_items checklistItems TEXT DEFAULT NULL,
CHANGE COLUMN start_date startDate DATETIME DEFAULT NULL,
CHANGE COLUMN end_date endDate DATETIME DEFAULT NULL,
CHANGE COLUMN created_at createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
CHANGE COLUMN member members VARCHAR(255) DEFAULT NULL;

-- Bước 3: Thêm lại index với tên cột mới
ALTER TABLE ratraco_task_management.cards
ADD INDEX idx_cards_boardId (boardId),
ADD INDEX idx_cards_listId (listId);

-- Bước 4: Thêm lại foreign key với tên cột mới
ALTER TABLE ratraco_task_management.cards
ADD CONSTRAINT cards_ibfk_1 FOREIGN KEY (boardId)
REFERENCES ratraco_task_management.boards (id) ON DELETE CASCADE,
ADD CONSTRAINT cards_ibfk_2 FOREIGN KEY (listId)
REFERENCES ratraco_task_management.lists (id) ON DELETE CASCADE;

-- 4. Thêm các trường createdBy, updatedBy, deletedBy, updatedAt, deletedAt vào bảng cards
ALTER TABLE ratraco_task_management.cards
ADD COLUMN createdBy varchar(36) DEFAULT NULL,
ADD COLUMN updatedBy varchar(36) DEFAULT NULL,
ADD COLUMN deletedBy varchar(36) DEFAULT NULL,
ADD COLUMN updatedAt datetime DEFAULT NULL,
ADD COLUMN deletedAt datetime DEFAULT NULL;
