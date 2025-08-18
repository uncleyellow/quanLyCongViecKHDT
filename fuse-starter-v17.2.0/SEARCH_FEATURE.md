# Tính năng Tìm kiếm và Bộ lọc Công việc

## Mô tả
Đã thêm tính năng tìm kiếm và bộ lọc nâng cao vào màn hình danh sách công việc (Tasks List) cho phép người dùng tìm kiếm và lọc công việc theo nhiều tiêu chí khác nhau.

## Tính năng

### 1. Search Box (Tìm kiếm cơ bản)
- **Vị trí**: Được đặt trong header của màn hình, giữa tiêu đề và các nút hành động
- **Giao diện**: Sử dụng Material Design với mat-form-field
- **Placeholder**: "Tìm theo tên hoặc mô tả..."
- **Icon**: Magnifying glass icon
- **Chức năng**: Tìm kiếm theo tên và mô tả công việc

### 2. Advanced Filter (Bộ lọc nâng cao)
- **Nút kích hoạt**: Nút "Bộ lọc" trong header với badge hiển thị số lượng bộ lọc đang áp dụng
- **Panel**: Panel có thể mở/đóng hiển thị bên dưới header
- **Chức năng**: Cho phép tạo nhiều bộ lọc với các điều kiện phức tạp

#### 2.1 Các trường có thể lọc:
- **Tiêu đề** (string): Tìm kiếm theo tên công việc
- **Mô tả** (string): Tìm kiếm theo mô tả công việc
- **Ngày hết hạn** (date): Lọc theo ngày hết hạn
- **Trạng thái** (select): Lọc theo trạng thái (Chưa làm, Đang thực hiện, Đã hoàn thành, v.v.)
- **Tên bảng** (string): Lọc theo tên bảng chứa công việc
- **ID bảng** (string): Lọc theo ID bảng
- **Tên danh sách** (string): Lọc theo tên danh sách
- **Lặp lại** (select): Lọc theo công việc có lặp lại hay không

#### 2.2 Các toán tử so sánh:
**Cho trường String:**
- Chứa / Không chứa
- Bằng / Không bằng
- Bắt đầu bằng / Kết thúc bằng

**Cho trường Number:**
- Bằng / Không bằng
- Lớn hơn / Lớn hơn hoặc bằng
- Nhỏ hơn / Nhỏ hơn hoặc bằng

**Cho trường Date:**
- Bằng / Không bằng
- Sau ngày / Từ ngày
- Trước ngày / Đến ngày
- Trong khoảng

**Cho trường Select:**
- Bằng / Không bằng
- Trong danh sách / Không trong danh sách

### 3. Hiển thị kết quả
- **Số lượng kết quả**: Hiển thị số lượng công việc tìm thấy dưới search box
- **Lọc theo nhóm**: Kết quả vẫn được nhóm theo board như giao diện gốc
- **Chỉ hiển thị nhóm có kết quả**: Các board không có công việc phù hợp sẽ bị ẩn
- **Thông báo thông minh**: Hiển thị loại bộ lọc đang áp dụng (tìm kiếm, bộ lọc, hoặc cả hai)

### 4. Quản lý bộ lọc
- **Thêm bộ lọc**: Nút "Thêm bộ lọc" để tạo bộ lọc mới
- **Xóa bộ lọc**: Nút X trên từng bộ lọc để xóa riêng lẻ
- **Xóa tất cả**: Nút "Xóa tất cả" để xóa toàn bộ bộ lọc
- **Xóa tìm kiếm**: Nút X trong search box để xóa từ khóa tìm kiếm

### 5. Thông báo khi không có kết quả
- **Khi có tìm kiếm/bộ lọc**: "Không tìm thấy công việc nào phù hợp!"
- **Khi không có tìm kiếm/bộ lọc**: "Chưa có công việc nào được giao!"
- **Gợi ý**: "Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc."

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

<!-- Filter Panel -->
<div class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" 
     *ngIf="showFilterPanel">
    <!-- Filter controls and form fields -->
</div>
```

### Component (list.component.ts)
- **Thuộc tính**:
  - `searchTerm: string` - Từ khóa tìm kiếm
  - `filteredBoardGroups: BoardGroup[]` - Danh sách board groups đã lọc
  - `filters: Filter[]` - Danh sách các bộ lọc
  - `availableFields: FilterField[]` - Các trường có thể lọc
  - `showFilterPanel: boolean` - Trạng thái hiển thị panel bộ lọc

- **Phương thức**:
  - `onSearchChange(searchTerm: string)` - Xử lý khi từ khóa thay đổi
  - `clearSearch()` - Xóa tìm kiếm
  - `applySearch()` - Áp dụng bộ lọc tìm kiếm
  - `addFilter()` - Thêm bộ lọc mới
  - `removeFilter(filterId: string)` - Xóa bộ lọc
  - `clearAllFilters()` - Xóa tất cả bộ lọc
  - `toggleFilterPanel()` - Mở/đóng panel bộ lọc
  - `applyFilters()` - Áp dụng các bộ lọc
  - `evaluateFilter(card: UserCard, filter: Filter)` - Đánh giá một bộ lọc
  - `getFilteredTasksCount()` - Đếm số lượng công việc đã lọc

## Cách sử dụng

### Tìm kiếm cơ bản:
1. **Tìm kiếm**: Nhập từ khóa vào ô tìm kiếm
2. **Xem kết quả**: Kết quả sẽ hiển thị ngay lập tức
3. **Xóa tìm kiếm**: Nhấn nút X hoặc xóa toàn bộ từ khóa

### Bộ lọc nâng cao:
1. **Mở panel bộ lọc**: Nhấn nút "Bộ lọc" trong header
2. **Thêm bộ lọc**: Nhấn "Thêm bộ lọc"
3. **Chọn trường**: Chọn trường muốn lọc (tiêu đề, ngày hết hạn, trạng thái, v.v.)
4. **Chọn điều kiện**: Chọn toán tử so sánh (bằng, chứa, lớn hơn, v.v.)
5. **Nhập giá trị**: Nhập giá trị cần lọc
6. **Xem kết quả**: Kết quả sẽ được lọc ngay lập tức
7. **Thêm bộ lọc khác**: Có thể thêm nhiều bộ lọc để kết hợp
8. **Xóa bộ lọc**: Nhấn nút X trên từng bộ lọc hoặc "Xóa tất cả"

### Tương tác:
- Vẫn có thể thực hiện các thao tác khác như kéo thả, đánh dấu hoàn thành
- Bộ lọc và tìm kiếm có thể kết hợp với nhau
- Panel bộ lọc có thể mở/đóng để tiết kiệm không gian

## Tương thích
- Tương thích với tất cả tính năng hiện có
- Không ảnh hưởng đến chức năng kéo thả và sắp xếp
- Hoạt động với cả recurring boards và regular boards
- Responsive design cho mobile và desktop
- Hỗ trợ dark mode
