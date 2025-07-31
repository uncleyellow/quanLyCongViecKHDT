# API Thay đổi mật khẩu cho người dùng đăng nhập lần đầu

## Tổng quan
Đã bổ sung hệ thống API để xử lý việc thay đổi mật khẩu bắt buộc cho người dùng đăng nhập lần đầu.

## Các thay đổi đã thực hiện

### 1. Database
- ✅ Đã thêm trường `must_change_password` vào bảng `users` (mặc định `TRUE`)

### 2. Model (`src/models/userModel.js`)
- ✅ Cập nhật schema để bao gồm trường `must_change_password`
- ✅ Thêm method `changePassword()` để cập nhật mật khẩu và set `must_change_password = FALSE`

### 3. Validation (`src/validations/userValidation.js`)
- ✅ Tạo file validation mới với schema `changePasswordSchema`
- ✅ Validate: mật khẩu hiện tại, mật khẩu mới (tối thiểu 6 ký tự), xác nhận mật khẩu

### 4. Service (`src/services/userService.js`)
- ✅ Thêm method `changePassword()` với logic:
  - Kiểm tra user tồn tại
  - Kiểm tra `must_change_password = true`
  - Verify mật khẩu hiện tại
  - Hash và cập nhật mật khẩu mới
  - Set `must_change_password = false`

### 5. Controller (`src/controllers/userController.js`)
- ✅ Thêm method `changePassword()` để xử lý request
- ✅ Thêm method `checkPasswordChangeRequired()` để kiểm tra trạng thái
- ✅ Validation input và error handling

### 6. Routes (`src/routes/v1/userRoute.js`)
- ✅ `POST /api/v1/users/change-password` - Thay đổi mật khẩu
- ✅ `GET /api/v1/users/check-password-change` - Kiểm tra trạng thái
- ✅ Swagger documentation đầy đủ

## API Endpoints

### 1. Kiểm tra trạng thái thay đổi mật khẩu
```
GET /api/v1/users/check-password-change
Authorization: Bearer <token>
```

### 2. Thay đổi mật khẩu
```
POST /api/v1/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword123", 
  "confirmPassword": "newpassword123"
}
```

## Luồng hoạt động

1. **Đăng nhập lần đầu**: User đăng nhập → `must_change_password: true`
2. **Kiểm tra trạng thái**: Frontend gọi `/check-password-change` 
3. **Hiển thị form**: Nếu `mustChangePassword: true` → hiển thị form thay đổi mật khẩu
4. **Thay đổi mật khẩu**: User nhập mật khẩu → gọi `/change-password`
5. **Hoàn tất**: `must_change_password` được set thành `false`

## Bảo mật

- ✅ Mật khẩu được hash bằng SHA-256
- ✅ Validation chặt chẽ input
- ✅ Kiểm tra mật khẩu hiện tại
- ✅ Chỉ cho phép thay đổi khi `must_change_password = true`
- ✅ Authentication token required

## Testing

Xem file `test-change-password-fix.md` để biết cách test các API này.

## Lưu ý quan trọng

### Sửa lỗi datetime
- **Vấn đề**: MySQL không thể xử lý timestamp dạng milliseconds từ `Date.now()`
- **Giải pháp**: Sử dụng `NOW()` của MySQL thay vì `Date.now()` trong các method:
  - `changePassword()`
  - `deleteUser()`
  - `update()` 