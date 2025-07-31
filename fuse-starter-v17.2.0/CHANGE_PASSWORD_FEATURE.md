# Tính năng Đổi mật khẩu bắt buộc - Frontend

## Tổng quan
Tính năng này yêu cầu người dùng đổi mật khẩu sau khi đăng nhập thành công nếu trường `must_change_password` của user = 1.

## Các thay đổi đã thực hiện

### 1. User Types (`src/app/core/user/user.types.ts`)
- ✅ Thêm trường `must_change_password?: number` vào interface User

### 2. Auth Service (`src/app/core/auth/auth.service.ts`)
- ✅ Thêm method `changePassword()` để gọi API `/users/change-password`

### 3. Change Password Modal Component
- ✅ Tạo component `ChangePasswordModalComponent` với form validation
- ✅ Template HTML với UI đẹp và responsive
- ✅ Validation: mật khẩu hiện tại, mật khẩu mới (tối thiểu 6 ký tự), xác nhận mật khẩu
- ✅ Error handling và loading states

### 4. Sign-in Component (`src/app/modules/auth/sign-in/sign-in.component.ts`)
- ✅ Cập nhật logic đăng nhập để kiểm tra `must_change_password`
- ✅ Thêm method `showChangePasswordModal()` để hiển thị modal
- ✅ Xử lý redirect sau khi đổi mật khẩu thành công

### 5. Module Configuration
- ✅ Cập nhật `AuthSignInModule` để include `ChangePasswordModalComponent`
- ✅ Thêm `MatDialogModule` cho modal functionality

## Luồng hoạt động

1. **Đăng nhập**: User nhập email/password và submit form
2. **Kiểm tra response**: Sau khi đăng nhập thành công, kiểm tra `user.must_change_password`
3. **Hiển thị modal**: Nếu `must_change_password === 1`, hiển thị modal đổi mật khẩu
4. **Form validation**: Validate input trước khi submit
5. **API call**: Gọi `/users/change-password` với data form
6. **Success handling**: Hiển thị thông báo thành công và redirect
7. **Error handling**: Hiển thị lỗi nếu có và cho phép retry

## API Endpoint

```
POST /users/change-password
Content-Type: application/json
Authorization: Bearer <token>

{
  "currentPassword": "string",
  "newPassword": "string", 
  "confirmPassword": "string"
}
```

## Validation Rules

- **Current Password**: Bắt buộc
- **New Password**: Bắt buộc, tối thiểu 6 ký tự
- **Confirm Password**: Bắt buộc, phải khớp với New Password

## UI/UX Features

- ✅ Modal không thể đóng bằng click outside (disableClose: true)
- ✅ Loading state khi submit form
- ✅ Error messages rõ ràng cho từng field
- ✅ Success message khi đổi mật khẩu thành công
- ✅ Responsive design cho mobile và desktop
- ✅ Material Design components

## Error Handling

- ✅ Network errors
- ✅ Validation errors
- ✅ Server errors với message từ backend
- ✅ User cancellation (sign out và reset form)

## Security

- ✅ Form validation client-side
- ✅ Password confirmation check
- ✅ Token-based authentication
- ✅ Secure password input fields

## Testing

### Test Cases

1. **Đăng nhập với user có must_change_password = 1**
   - Expected: Hiển thị modal đổi mật khẩu
   - Modal không thể đóng

2. **Đăng nhập với user có must_change_password = 0**
   - Expected: Redirect thẳng đến dashboard

3. **Form validation**
   - Empty fields → Disable submit button
   - Password mismatch → Show error message
   - Short password → Show error message

4. **API success**
   - Expected: Success message → Auto redirect sau 2s

5. **API error**
   - Expected: Show error message → Allow retry

6. **User cancel**
   - Expected: Sign out → Reset form → Stay on login page

## Files Modified/Created

### Created
- `src/app/modules/auth/change-password-modal/change-password-modal.component.ts`
- `src/app/modules/auth/change-password-modal/change-password-modal.component.html`
- `CHANGE_PASSWORD_FEATURE.md`

### Modified
- `src/app/core/user/user.types.ts` - Thêm must_change_password field
- `src/app/core/auth/auth.service.ts` - Thêm changePassword method
- `src/app/modules/auth/sign-in/sign-in.component.ts` - Cập nhật logic đăng nhập
- `src/app/modules/auth/sign-in/sign-in.module.ts` - Thêm component và module

## Dependencies

- Angular Material Dialog
- Angular Reactive Forms
- Fuse UI Components
- RxJS Observables

## Notes

- Modal sẽ tự động đóng sau 2 giây khi đổi mật khẩu thành công
- Nếu user cancel, sẽ sign out và reset form
- Form validation real-time với visual feedback
- Responsive design cho tất cả screen sizes 