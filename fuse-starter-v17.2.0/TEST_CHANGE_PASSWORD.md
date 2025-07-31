# Hướng dẫn Test Tính năng Đổi mật khẩu bắt buộc

## Chuẩn bị

### 1. Backend
- Đảm bảo backend server đang chạy trên `http://localhost:2001`
- API `/users/change-password` đã được implement
- Database có trường `must_change_password` trong bảng `users`

### 2. Frontend
- Đảm bảo frontend đang chạy trên `http://localhost:4200`
- Environment config đúng: `apiBaseUrl: 'http://localhost:2001/api/v1'`

## Test Cases

### Test Case 1: User có must_change_password = 1

**Mục tiêu**: Kiểm tra modal đổi mật khẩu xuất hiện sau khi đăng nhập

**Bước thực hiện**:
1. Mở browser và truy cập `http://localhost:4200/sign-in`
2. Đăng nhập với user có `must_change_password = 1`
3. Sau khi đăng nhập thành công, modal đổi mật khẩu sẽ xuất hiện

**Expected Result**:
- ✅ Modal đổi mật khẩu hiển thị
- ✅ Modal không thể đóng bằng click outside
- ✅ Form có 3 fields: Current Password, New Password, Confirm Password
- ✅ Submit button bị disable khi form invalid

### Test Case 2: Form Validation

**Mục tiêu**: Kiểm tra validation của form

**Bước thực hiện**:
1. Mở modal đổi mật khẩu
2. Test các trường hợp validation:

**Test 2.1: Empty fields**
- Để trống tất cả fields
- Expected: Submit button bị disable

**Test 2.2: Password mismatch**
- Nhập Current Password: "oldpass"
- Nhập New Password: "newpass123"
- Nhập Confirm Password: "differentpass"
- Expected: Error message "Mật khẩu xác nhận không khớp"

**Test 2.3: Short password**
- Nhập New Password: "123"
- Expected: Error message "Mật khẩu phải có ít nhất 6 ký tự"

**Test 2.4: Valid form**
- Nhập Current Password: "oldpass"
- Nhập New Password: "newpass123"
- Nhập Confirm Password: "newpass123"
- Expected: Submit button enable

### Test Case 3: API Success

**Mục tiêu**: Kiểm tra đổi mật khẩu thành công

**Bước thực hiện**:
1. Nhập form hợp lệ
2. Click "Đổi mật khẩu"
3. Đợi API response

**Expected Result**:
- ✅ Loading state hiển thị
- ✅ Success message: "Mật khẩu đã được thay đổi thành công!"
- ✅ Modal tự động đóng sau 2 giây
- ✅ Redirect đến dashboard

### Test Case 4: API Error

**Mục tiêu**: Kiểm tra xử lý lỗi

**Bước thực hiện**:
1. Nhập Current Password sai
2. Click "Đổi mật khẩu"

**Expected Result**:
- ✅ Error message hiển thị
- ✅ Loading state tắt
- ✅ Form vẫn enable để retry

### Test Case 5: User Cancel

**Mục tiêu**: Kiểm tra khi user cancel

**Bước thực hiện**:
1. Mở modal đổi mật khẩu
2. Click "Hủy"

**Expected Result**:
- ✅ Modal đóng
- ✅ User bị sign out
- ✅ Form login được reset
- ✅ Stay trên trang login

### Test Case 6: User có must_change_password = 0

**Mục tiêu**: Kiểm tra user không cần đổi mật khẩu

**Bước thực hiện**:
1. Đăng nhập với user có `must_change_password = 0`
2. Sau khi đăng nhập thành công

**Expected Result**:
- ✅ Không hiển thị modal đổi mật khẩu
- ✅ Redirect thẳng đến dashboard

## Debug Tips

### 1. Kiểm tra Network Tab
- Mở Developer Tools → Network Tab
- Kiểm tra API call `/auth/login` có trả về `must_change_password`
- Kiểm tra API call `/users/change-password` khi submit form

### 2. Kiểm tra Console
- Mở Developer Tools → Console Tab
- Kiểm tra có error nào không
- Log response từ API để debug

### 3. Kiểm tra Local Storage
- Mở Developer Tools → Application → Local Storage
- Kiểm tra token và user data được lưu đúng không

## Common Issues

### Issue 1: Modal không hiển thị
**Nguyên nhân**: `must_change_password` không đúng format hoặc API response sai
**Giải pháp**: Kiểm tra API response và đảm bảo `must_change_password` là number

### Issue 2: Form validation không hoạt động
**Nguyên nhân**: ReactiveFormsModule chưa được import
**Giải pháp**: Kiểm tra SharedModule và AuthSignInModule

### Issue 3: API call fail
**Nguyên nhân**: Backend chưa chạy hoặc endpoint sai
**Giải pháp**: Kiểm tra backend server và API endpoint

### Issue 4: Modal không đóng
**Nguyên nhân**: Dialog configuration sai
**Giải pháp**: Kiểm tra MatDialog configuration

## Test Data

### User có must_change_password = 1
```json
{
  "email": "test@example.com",
  "password": "oldpassword",
  "must_change_password": 1
}
```

### User có must_change_password = 0
```json
{
  "email": "normal@example.com", 
  "password": "password123",
  "must_change_password": 0
}
```

## Notes

- Đảm bảo backend API đã được test và hoạt động đúng
- Kiểm tra CORS configuration nếu có lỗi network
- Test trên nhiều browser khác nhau
- Test responsive design trên mobile 