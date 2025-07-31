-- thêm cột must_change_password vào bảng users
ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE;
