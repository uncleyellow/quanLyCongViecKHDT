-- thêm cột must_change_password vào bảng users
ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE;

-- thêm cột created_by, updated_by, deleted_by, updated_at, deleted_at vào bảng lists
ALTER TABLE ratraco_task_management.lists
ADD COLUMN created_by VARCHAR(36) DEFAULT NULL,
ADD COLUMN updated_by VARCHAR(36) DEFAULT NULL,
ADD COLUMN deleted_by VARCHAR(36) DEFAULT NULL,
ADD COLUMN updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at DATETIME DEFAULT NULL;
