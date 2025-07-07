# Scrumboard Changelog - Backend Integration & Member Management

## Tổng quan
Đã hoàn thành việc kết nối frontend với backend mới và cải thiện quản lý member giống Trello.

## Backend Changes (api.py)

### 1. Database Migration
- ✅ Thêm trường `archived` cho bảng `lists` và `cards`
- ✅ Tự động migrate database khi khởi động

### 2. API Endpoints Mới
- ✅ `PUT /api/boards/{boardId}/lists/reorder` - Reorder lists
- ✅ `PUT /api/lists/{listId}/cards/reorder` - Reorder cards  
- ✅ `POST /api/cards/{cardId}/copy` - Copy card
- ✅ `PUT /api/cards/{cardId}/move` - Move card
- ✅ `PUT /api/lists/{listId}/archive` - Archive list
- ✅ `PUT /api/lists/{listId}/restore` - Restore list
- ✅ `PUT /api/cards/{cardId}/archive` - Archive card
- ✅ `PUT /api/cards/{cardId}/restore` - Restore card
- ✅ `POST /api/cards/{cardId}/checklist` - Add checklist item
- ✅ `PUT /api/cards/{cardId}/checklist/{itemId}` - Update checklist item
- ✅ `DELETE /api/cards/{cardId}/checklist/{itemId}` - Delete checklist item

### 3. Cải thiện API hiện có
- ✅ Chỉ trả về list/card chưa archived khi lấy board
- ✅ Validate đầu vào cho tất cả API (title, description, v.v.)
- ✅ Chuẩn hóa trả về lỗi (status code, message)

## Frontend Changes

### 1. Service Layer (scrumboard.service.ts)
- ✅ Thêm import `users` từ mock data
- ✅ Thay thế API member bằng mock data:
  - `getMembers()` - Lấy danh sách member từ mock
  - `getMemberByEmail()` - Tìm member theo email từ mock
  - `addMemberToBoard()` - Mock function
  - `removeMemberFromBoard()` - Mock function
- ✅ Thêm các API mới:
  - `reorderLists()`, `reorderCards()`
  - `copyCard()`, `moveCard()`
  - `archiveList()`, `restoreList()`
  - `archiveCard()`, `restoreCard()`
  - `addChecklistItem()`, `updateChecklistItem()`, `deleteChecklistItem()`

### 2. Board Component (board.component.ts)
- ✅ Thêm `members` array để lưu danh sách member
- ✅ Load members từ service trong `ngOnInit()`
- ✅ Thêm helper functions: `getMemberAvatar()`, `getMemberName()`
- ✅ Cập nhật kéo thả để sử dụng API reorder mới

### 3. Board Template (board.component.html)
- ✅ Thêm hiển thị member cho card:
  - Avatar member
  - Tên member
  - Chỉ hiển thị khi card có member

### 4. Boards Component (boards.component.ts)
- ✅ Cập nhật `openShareDialog()` để xử lý cả memberId và email
- ✅ Thêm `addMemberToBoard()` helper function
- ✅ FE tự xử lý thêm member vào board (không gọi API)

### 5. Share Board Dialog (share-board-dialog.compoment.ts)
- ✅ Thêm dropdown chọn member từ danh sách
- ✅ Vẫn giữ input email để nhập thủ công
- ✅ Cải thiện UI với avatar và tên member

### 6. Card Details Component (details.component.ts)
- ✅ Thêm `members` array để lưu danh sách member
- ✅ Load members từ service trong `ngOnInit()`
- ✅ Cập nhật checklist để sử dụng API mới
- ✅ Thay đổi `member` thành `selectedMember`

### 7. Card Details Template (details.component.html)
- ✅ Thay thế input email bằng dropdown chọn member
- ✅ Hiển thị avatar và tên member trong dropdown
- ✅ Cải thiện UI/UX

## Tính năng mới

### 1. Quản lý Member
- ✅ Lấy member từ mock data (data.ts)
- ✅ Hiển thị member trên card với avatar và tên
- ✅ Thêm member vào board qua dialog
- ✅ Chọn member cho card qua dropdown

### 2. Kéo thả (Drag & Drop)
- ✅ Reorder lists bằng API mới
- ✅ Reorder cards bằng API mới
- ✅ Cải thiện hiệu suất (không update từng item riêng lẻ)

### 3. Checklist
- ✅ Thêm/xóa/sửa checklist item bằng API riêng biệt
- ✅ Reload card sau khi thay đổi checklist

### 4. Archive/Restore
- ✅ API sẵn sàng cho archive/restore list và card
- ✅ Chỉ hiển thị list/card chưa archived

## Cải thiện UX/UI
- ✅ Dropdown chọn member thay vì nhập email
- ✅ Hiển thị avatar member trên card
- ✅ Cải thiện share board dialog
- ✅ Validate đầu vào rõ ràng
- ✅ Thông báo lỗi chuẩn hóa

## Tương thích
- ✅ Backward compatible với API cũ
- ✅ Tự động migrate database
- ✅ Mock data cho member (không phụ thuộc backend)

## Hướng dẫn sử dụng
1. Chạy backend: `python api.py`
2. Frontend sẽ tự động lấy member từ mock data
3. Có thể thêm member vào board qua nút "Share"
4. Có thể chọn member cho card trong card details
5. Kéo thả list/card sẽ sử dụng API reorder mới
6. Checklist sẽ sử dụng API riêng biệt

## Lưu ý
- Member được quản lý hoàn toàn ở frontend (mock data)
- Backend không lưu trạng thái member của board
- Nếu muốn đồng bộ member giữa board và user, cần lưu trạng thái ở FE
- Có thể mở rộng để hỗ trợ nhiều member trên 1 card 