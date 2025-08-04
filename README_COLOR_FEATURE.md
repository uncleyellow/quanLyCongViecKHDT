# Tính năng Màu sắc cho Lists

## Mô tả
Tính năng này cho phép mỗi list có một màu sắc riêng, và màu sắc này sẽ được hiển thị trên background của list và các card trong list đó.

## Các thay đổi đã thực hiện

### Backend
1. **Cập nhật model** (`be/src/models/listModel.js`):
   - Thêm trường `color` vào `LIST_TABLE_SCHEMA` với giá trị mặc định `#3B82F6`

### Frontend
1. **Cập nhật types** (`fuse-starter-v17.2.0/src/app/modules/admin/scrumboard/scrumboard.types.ts`):
   - Thêm `color?: string` vào interface `IList`

2. **Cập nhật models** (`fuse-starter-v17.2.0/src/app/modules/admin/scrumboard/scrumboard.models.ts`):
   - Thêm `color: string` vào class `List`
   - Thêm `color: string` vào class `CreateList`
   - Thêm `color?: string` vào class `UpdateList`
   - Cập nhật constructor để xử lý trường `color`

3. **Cập nhật giao diện** (`fuse-starter-v17.2.0/src/app/modules/admin/scrumboard/board/board.component.html`):
   - Thêm style binding cho list container với màu nền và viền
   - Thêm style binding cho cards container với màu nền và viền
   - Thêm style binding cho card với màu nền và viền bên trái

4. **Cập nhật add-list component**:
   - Thêm color picker với 6 màu sắc cơ bản
   - Cập nhật form để bao gồm trường `color`
   - Cập nhật output event để trả về cả `title` và `color`

5. **Tạo change-color-dialog component**:
   - Dialog component để chọn màu sắc cho list hiện có
   - Hiển thị preview màu sắc sẽ được áp dụng
   - Tích hợp với menu của list

6. **Cập nhật board component**:
   - Thêm method `changeListColor()` để xử lý đổi màu
   - Thêm option "Đổi màu list" vào menu của list

## Cách sử dụng

### Chạy Migration Database
Chạy lệnh SQL sau để thêm cột `color` vào bảng `lists`:

```sql
-- Thêm cột color vào bảng lists
ALTER TABLE lists
ADD COLUMN color VARCHAR(7) DEFAULT '#3B82F6'
COMMENT 'Color code for list background and cards';

-- Cập nhật màu sắc cho các list hiện có dựa trên tên
UPDATE lists
SET color = CASE 
    WHEN title LIKE '%todo%' OR title LIKE '%To do%' THEN '#EF4444'  -- Red
    WHEN title LIKE '%progress%' OR title LIKE '%In progress%' THEN '#F59E0B'  -- Amber
    WHEN title LIKE '%review%' OR title LIKE '%In review%' THEN '#3B82F6'  -- Blue
    WHEN title LIKE '%done%' OR title LIKE '%completed%' OR title LIKE '%Completed%' THEN '#10B981'  -- Green
    ELSE '#3B82F6'  -- Default blue
END
WHERE color IS NULL OR color = '#3B82F6';
```

### Tạo List mới
1. Click vào nút "Thêm danh sách" hoặc "Thêm danh sách khác"
2. Nhập tên cho list
3. Chọn màu sắc từ color picker (6 màu có sẵn)
4. Click "Add list"

### Đổi màu List hiện có
1. Click vào menu (3 chấm) của list cần đổi màu
2. Chọn "Đổi màu list"
3. Chọn màu sắc mới từ dialog
4. Click "Lưu" để áp dụng thay đổi

### Màu sắc có sẵn
- 🔴 Red: `#EF4444`
- 🟡 Amber: `#F59E0B`
- 🔵 Blue: `#3B82F6` (mặc định)
- 🟢 Green: `#10B981`
- 🟣 Purple: `#8B5CF6`
- 🟣 Pink: `#EC4899`

## Hiển thị
- **List container**: Background với màu sắc nhạt (20% opacity) và viền với màu sắc (40% opacity)
- **Cards container**: Background với màu sắc nhạt hơn (10% opacity) và viền với màu sắc (30% opacity)
- **Card**: Background với màu sắc nhạt (15% opacity) và viền bên trái với màu sắc đầy đủ

## Lưu ý
- Tất cả các list hiện có sẽ được gán màu mặc định `#3B82F6` (blue)
- Màu sắc được lưu dưới dạng mã hex 7 ký tự (bao gồm #)
- Tính năng này hoạt động với cả light mode và dark mode 