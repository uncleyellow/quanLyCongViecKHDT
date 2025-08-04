ALTER TABLE companies
MODIFY id VARCHAR(36) NOT NULL DEFAULT (UUID());


INSERT INTO companies(name, description) 
VALUES ('Công ty Ratraco', 'Công ty Ratraco'),
('Công ty GreenLine Logistics', 'Công ty GreenLine Logistics');

ALTER TABLE departments
MODIFY id VARCHAR(36) NOT NULL DEFAULT (UUID());

-- Thêm data phòng ban cho Công ty Ratraco
INSERT INTO departments (name, company_id)
SELECT dept_names.name, c.id
FROM (
  SELECT 'Phòng Kế hoạch' AS name
  UNION ALL
  SELECT 'Phòng Kế Toán'
) AS dept_names
JOIN companies c ON c.name = 'Công ty Ratraco';

-- Thêm data phòng ban cho Công ty GreenLine Logistics
INSERT INTO departments (name, company_id)
SELECT dept_names.name, c.id
FROM (
  SELECT 'Phòng Kế hoạch' AS name
  UNION ALL
  SELECT 'Phòng Kế Toán'
) AS dept_names
JOIN companies c ON c.name = 'Công ty GreenLine Logistics';

-- Thêm cột departmentId và companyId vào bảng users
ALTER TABLE users
ADD COLUMN departmentId VARCHAR(36),
ADD COLUMN companyId VARCHAR(36),
ADD CONSTRAINT fk_users_department
  FOREIGN KEY (departmentId) REFERENCES departments(id)
  ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_users_company
  FOREIGN KEY (companyId) REFERENCES companies(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Thêm phòng BOD cho công ty Ratraco
INSERT INTO departments (name, company_id)
SELECT 'Phòng BOD', id
FROM companies
WHERE name = 'Công ty Ratraco';

-- Thêm phòng BOD cho công ty GreenLine Logistics
INSERT INTO departments (name, company_id)
SELECT 'Phòng BOD', id
FROM companies
WHERE name = 'Công ty GreenLine Logistics';

-- Thêm data user
-- Khai báo và gán biến cho Company "GreenLine Logistics"
SELECT id INTO @companyId_grl FROM companies WHERE name = 'Công ty GreenLine Logistics';

-- Lấy departmentId của các phòng thuộc công ty GreenLine Logistics
SELECT id INTO @deptId_grl_bod FROM departments WHERE name = 'Phòng BOD' AND company_id = @companyId_grl;
SELECT id INTO @deptId_grl_kh FROM departments WHERE name = 'Phòng Kế hoạch' AND company_id = @companyId_grl;

-- Khai báo và gán biến cho Company "Ratraco"
SELECT id INTO @companyId_ratraco FROM companies WHERE name = 'Công ty Ratraco';

-- Lấy departmentId của các phòng thuộc công ty Ratraco
SELECT id INTO @deptId_ratraco_bod FROM departments WHERE name = 'Phòng BOD' AND company_id = @companyId_ratraco;
SELECT id INTO @deptId_ratraco_kh FROM departments WHERE name = 'Phòng Kế hoạch' AND company_id = @companyId_ratraco;
SELECT id INTO @deptId_ratraco_kt FROM departments WHERE name = 'Phòng Kế Toán' AND company_id = @companyId_ratraco;

-- Insert dữ liệu vào bảng users
INSERT INTO users (id, name, email, password_hash, type, companyId, departmentId)
VALUES
(UUID(), 'longgrl', 'longgrl@gamil.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'boss', @companyId_grl, @deptId_grl_bod),
(UUID(), 'gianggrl', 'gianggrl@gmail.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'manager', @companyId_grl, @deptId_grl_kh),
(UUID(), 'Nhân viên phòng kế hoạch công ty GreenLine Logistics', 'vyratracogrl@gmail.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'staff', @companyId_grl, @deptId_grl_kh),

(UUID(), 'Giám Đốc Công Ty Ratraco', 'hunggiamdoc@ratraco.com.vn', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'boss', @companyId_ratraco, @deptId_ratraco_bod),
(UUID(), 'Trưởng Phòng Kế hoạch đầu tư công ty Ratraco', 'giangtruongphong@gmail.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'manager', @companyId_ratraco, @deptId_ratraco_kh),
(UUID(), 'Trưởng Phòng Kế Toán công ty Ratraco', 'quyen@ratraco.com.vn', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'manager', @companyId_ratraco, @deptId_ratraco_kt),

(UUID(), 'Nhân viên phòng Kế Hoạch công ty Ratraco', 'giangit@gmail.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'staff', @companyId_ratraco, @deptId_ratraco_kh),
(UUID(), 'Nhân viên phòng Kế Hoạch công ty Ratraco', 'ducanh.workingnow@gmail.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'staff', @companyId_ratraco, @deptId_ratraco_kh),
(UUID(), 'Nhân viên phòng Kế Hoạch công ty Ratraco', 'anhdt@ratraco.com.vn', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'staff', @companyId_ratraco, @deptId_ratraco_kh),
(UUID(), 'Nhân viên phòng Kế Hoạch công ty Ratraco', 'huyen@ratraco.com.vn', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'staff', @companyId_ratraco, @deptId_ratraco_kh),
(UUID(), 'Nhân viên phòng Kế Hoạch công ty Ratraco', 'khanhnhata01@gmail.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'staff', @companyId_ratraco, @deptId_ratraco_kh),
(UUID(), 'Nhân viên phòng Kế Toán công ty Ratraco', 'huyenketoan@gmail.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'staff', @companyId_ratraco, @deptId_ratraco_kt);

-- Cập nhật lại bảng users
-- Bước 1: Xóa foreign key
ALTER TABLE users
DROP FOREIGN KEY fk_users_company,
DROP FOREIGN KEY fk_users_department;

-- Bước 2: Đổi tên các cột sang camelCase
ALTER TABLE users
CHANGE COLUMN password_hash passwordHash VARCHAR(255) NOT NULL,
CHANGE COLUMN created_at createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
CHANGE COLUMN updated_at updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
CHANGE COLUMN deleted_at deletedAt DATETIME DEFAULT NULL,
CHANGE COLUMN must_change_password mustChangePassword TINYINT(1) DEFAULT 1,
CHANGE COLUMN board_order_ids boardOrderIds JSON DEFAULT NULL;

-- Bước 3: Thêm lại foreign key
ALTER TABLE users
ADD CONSTRAINT fk_users_company FOREIGN KEY (companyId)
REFERENCES companies (id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_users_department FOREIGN KEY (departmentId)
REFERENCES departments (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Cập nhật lại bảng boardMembers
-- Bước 1: Xóa foreign key
ALTER TABLE board_members
DROP FOREIGN KEY board_members_ibfk_1,
DROP FOREIGN KEY board_members_ibfk_2;

-- Bước 2: Đổi tên bảng
RENAME TABLE board_members TO boardMembers;

-- Bước 3: Đổi tên các cột sang camelCase
ALTER TABLE boardMembers
CHANGE COLUMN board_id boardId VARCHAR(36) NOT NULL,
CHANGE COLUMN member_id memberId VARCHAR(36) NOT NULL,
CHANGE COLUMN joined_at joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Bước 4: Thêm lại foreign key với tên cột mới
ALTER TABLE boardMembers
ADD CONSTRAINT boardMembers_ibfk_1 FOREIGN KEY (boardId)
REFERENCES boards (id) ON DELETE CASCADE,
ADD CONSTRAINT boardMembers_ibfk_2 FOREIGN KEY (memberId)
REFERENCES members (id) ON DELETE CASCADE;
