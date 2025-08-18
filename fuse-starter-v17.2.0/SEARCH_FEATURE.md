# Tính năng Tìm kiếm Công việc

## Mô tả
Đã thêm tính năng tìm kiếm vào màn hình danh sách công việc (Tasks List) cho phép người dùng tìm kiếm công việc theo tên và mô tả.

## Tính năng

### 1. Search Box
- **Vị trí**: Được đặt trong header của màn hình, giữa tiêu đề và các nút hành động
- **Giao diện**: Sử dụng Material Design với mat-form-field
- **Placeholder**: "Tìm theo tên hoặc mô tả..."
- **Icon**: Magnifying glass icon

### 2. Chức năng tìm kiếm
- **Tìm kiếm theo**: 
  - Tên công việc (title)
  - Mô tả công việc (description)
- **Phương thức tìm kiếm**: Case-insensitive, tìm kiếm từng phần (partial match)
- **Tìm kiếm real-time**: Kết quả được cập nhật ngay khi người dùng nhập

### 3. Hiển thị kết quả
- **Số lượng kết quả**: Hiển thị số lượng công việc tìm thấy dưới search box
- **Lọc theo nhóm**: Kết quả vẫn được nhóm theo board như giao diện gốc
- **Chỉ hiển thị nhóm có kết quả**: Các board không có công việc phù hợp sẽ bị ẩn

### 4. Xóa tìm kiếm
- **Nút X**: Xuất hiện khi có từ khóa tìm kiếm
- **Chức năng**: Xóa toàn bộ từ khóa và hiển thị lại tất cả công việc

### 5. Thông báo khi không có kết quả
- **Khi có tìm kiếm**: "Không tìm thấy công việc nào phù hợp!"
- **Khi không có tìm kiếm**: "Chưa có công việc nào được giao!"

## Cấu trúc Code

### Template (list.component.html)
```html
<!-- Search Box -->
<mat-form-field class="w-full" appearance="outline" floatLabel="always">
    <mat-label>Tìm kiếm công việc</mat-label>
    <input matInput 
           [(ngModel)]="searchTerm" 
           (ngModelChange)="onSearchChange($event)"
           placeholder="Tìm theo tên hoặc mô tả...">
    <mat-icon matSuffix [svgIcon]="'heroicons_outline:magnifying-glass'"></mat-icon>
    <button mat-icon-button matSuffix 
            *ngIf="searchTerm" 
            (click)="clearSearch()">
        <mat-icon [svgIcon]="'heroicons_outline:x-mark'"></mat-icon>
    </button>
</mat-form-field>
```

### Component (list.component.ts)
- **Thuộc tính**:
  - `searchTerm: string` - Từ khóa tìm kiếm
  - `filteredBoardGroups: BoardGroup[]` - Danh sách board groups đã lọc

- **Phương thức**:
  - `onSearchChange(searchTerm: string)` - Xử lý khi từ khóa thay đổi
  - `clearSearch()` - Xóa tìm kiếm
  - `applySearch()` - Áp dụng bộ lọc tìm kiếm
  - `getFilteredTasksCount()` - Đếm số lượng công việc đã lọc

## Cách sử dụng

1. **Tìm kiếm**: Nhập từ khóa vào ô tìm kiếm
2. **Xem kết quả**: Kết quả sẽ hiển thị ngay lập tức
3. **Xóa tìm kiếm**: Nhấn nút X hoặc xóa toàn bộ từ khóa
4. **Tương tác**: Vẫn có thể thực hiện các thao tác khác như kéo thả, đánh dấu hoàn thành

## Tương thích
- Tương thích với tất cả tính năng hiện có
- Không ảnh hưởng đến chức năng kéo thả và sắp xếp
- Hoạt động với cả recurring boards và regular boards
- Responsive design cho mobile và desktop
