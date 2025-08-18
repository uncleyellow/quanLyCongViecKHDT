# Quản lý Version - Hệ thống Quản lý Công việc Ratraco

## 📋 Tổng quan

Hệ thống quản lý version được tích hợp vào footer của ứng dụng, cho phép người dùng xem phiên bản hiện tại và lịch sử các thay đổi.

## 🎯 Tính năng

### 1. Hiển thị Version trong Footer
- Hiển thị phiên bản hiện tại bên cạnh tên ứng dụng
- Version được hiển thị dưới dạng badge có thể click
- Tự động cập nhật từ file JSON

### 2. Màn hình Lịch sử Version
- Hiển thị danh sách tất cả các phiên bản
- Thông tin chi tiết về mỗi phiên bản:
  - Số version
  - Ngày phát hành
  - Loại cập nhật (feature, bugfix, release, hotfix)
  - Tiêu đề và mô tả
  - Danh sách các thay đổi
  - Tác giả

### 3. Phân loại Version
- **feature**: Tính năng mới
- **bugfix**: Sửa lỗi
- **release**: Phát hành chính thức
- **hotfix**: Sửa lỗi khẩn cấp

## 📁 Cấu trúc File

```
src/
├── assets/
│   └── data/
│       └── version-history.json    # File chứa lịch sử version
├── app/
│   ├── core/
│   │   └── services/
│   │       └── version.service.ts  # Service quản lý version
│   └── modules/
│       └── admin/
│           └── version-history/    # Module version history
│               ├── version-history.component.ts
│               ├── version-history.component.html
│               ├── version-history.component.scss
│               └── version-history.module.ts
```

## 🔧 Cách sử dụng

### 1. Xem Version hiện tại
- Version hiện tại được hiển thị trong footer dưới dạng badge màu xanh
- Format: `v1.2.0`

### 2. Xem Lịch sử Version
- Click vào badge version trong footer
- Hoặc truy cập trực tiếp: `/admin/version-history`

### 3. Cập nhật Version mới

#### Bước 1: Cập nhật file JSON
Chỉnh sửa file `src/assets/data/version-history.json`:

```json
{
  "currentVersion": "1.3.0",
  "versions": [
    {
      "version": "1.3.0",
      "releaseDate": "2025-08-20",
      "type": "feature",
      "title": "Tính năng mới",
      "description": "Mô tả tính năng mới",
      "changes": [
        "Thay đổi 1",
        "Thay đổi 2",
        "Thay đổi 3"
      ],
      "author": "Development Team"
    },
    // ... các version cũ
  ]
}
```

#### Bước 2: Quy tắc đặt tên Version
Sử dụng Semantic Versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Thay đổi lớn, không tương thích ngược
- **MINOR**: Tính năng mới, tương thích ngược
- **PATCH**: Sửa lỗi, tương thích ngược

#### Bước 3: Commit và Deploy
```bash
git add src/assets/data/version-history.json
git commit -m "feat: bump version to 1.3.0"
git push
```

## 📝 Template cho Version mới

```json
{
  "version": "1.3.0",
  "releaseDate": "2025-08-20",
  "type": "feature",
  "title": "Tên tính năng",
  "description": "Mô tả ngắn gọn về tính năng",
  "changes": [
    "Thêm tính năng A",
    "Cải thiện tính năng B",
    "Sửa lỗi C",
    "Tối ưu hiệu suất D"
  ],
  "author": "Tên tác giả"
}
```

## 🎨 Giao diện

### Footer
- Version badge: Màu xanh, có hiệu ứng hover
- Vị trí: Bên cạnh tên ứng dụng

### Màn hình Version History
- Header: Hiển thị phiên bản hiện tại
- Danh sách version: Card layout với thông tin chi tiết
- Badge màu theo loại version:
  - 🔵 Feature: Xanh dương
  - 🟢 Bugfix: Xanh lá
  - 🟣 Release: Tím
  - 🔴 Hotfix: Đỏ

## 🔄 Tự động hóa

### Cập nhật Version tự động
Để tự động cập nhật version khi có thay đổi:

1. Tạo script build tự động
2. Tích hợp với CI/CD pipeline
3. Tự động tăng version number

### Ví dụ Script
```bash
#!/bin/bash
# auto-version.sh

# Đọc version hiện tại
CURRENT_VERSION=$(node -p "require('./src/assets/data/version-history.json').currentVersion")

# Tăng minor version
NEW_VERSION=$(node -e "
  const v = '$CURRENT_VERSION'.split('.');
  v[1] = parseInt(v[1]) + 1;
  v[2] = 0;
  console.log(v.join('.'));
")

# Cập nhật file JSON
node -e "
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync('./src/assets/data/version-history.json', 'utf8'));
  data.currentVersion = '$NEW_VERSION';
  data.versions.unshift({
    version: '$NEW_VERSION',
    releaseDate: new Date().toISOString().split('T')[0],
    type: 'feature',
    title: 'Auto version bump',
    description: 'Automatic version update',
    changes: ['Auto version bump'],
    author: 'CI/CD Pipeline'
  });
  fs.writeFileSync('./src/assets/data/version-history.json', JSON.stringify(data, null, 2));
"

echo "Version updated from $CURRENT_VERSION to $NEW_VERSION"
```

## 🚀 Best Practices

1. **Luôn cập nhật version** khi có thay đổi đáng kể
2. **Mô tả chi tiết** các thay đổi trong mỗi version
3. **Sử dụng đúng loại version** (feature, bugfix, etc.)
4. **Commit message rõ ràng** khi cập nhật version
5. **Test kỹ** trước khi release version mới

## 📞 Hỗ trợ

Nếu có vấn đề với hệ thống version, liên hệ:
- Email: kiniemboquenjerry@gmail.com
- Zalo: 0985363602
