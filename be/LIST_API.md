# List API Documentation

## Tổng quan
API này cung cấp các endpoint để quản lý danh sách (lists) trong hệ thống quản lý công việc. Mỗi list thuộc về một board và có thể chứa nhiều cards.

## Base URL
```
/api/v1/lists
```

## Authentication
Tất cả các API đều yêu cầu authentication thông qua Bearer Token trong header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### 1. Lấy danh sách tất cả lists
**GET** `/api/v1/lists`

**Query Parameters:**
- `boardId` (optional): Filter theo board ID
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số item mỗi trang (default: 10)

**Response:**
```json
{
  "code": 200,
  "status": "success",
  "message": "List fetched successfully",
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "boardId": "123e4567-e89b-12d3-a456-426614174001",
      "title": "To Do",
      "order": 1,
      "archived": 0,
      "card_order_ids": [],
      "created_by": "user123",
      "updated_by": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. Tạo list mới
**POST** `/api/v1/lists`

**Request Body:**
```json
{
  "boardId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "In Progress",
  "order": 2,
  "archived": 0
}
```

**Response:**
```json
{
  "code": 201,
  "status": "success",
  "message": "List created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "boardId": "123e4567-e89b-12d3-a456-426614174000",
    "title": "In Progress",
    "order": 2,
    "archived": 0,
    "card_order_ids": [],
    "created_by": "user123",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Lấy chi tiết list
**GET** `/api/v1/lists/{id}`

**Response:**
```json
{
  "code": 200,
  "status": "success",
  "message": "List detail fetched successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "boardId": "123e4567-e89b-12d3-a456-426614174001",
    "title": "To Do",
    "order": 1,
    "archived": 0,
    "card_order_ids": ["507f1f77bcf86cd799439013"],
    "created_by": "user123",
    "updated_by": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Cập nhật list (PUT - cập nhật toàn bộ)
**PUT** `/api/v1/lists/{id}`

**Request Body:**
```json
{
  "title": "Done",
  "order": 3,
  "archived": 1
}
```

### 5. Cập nhật list (PATCH - cập nhật một phần)
**PATCH** `/api/v1/lists/{id}`

**Request Body:**
```json
{
  "title": "Completed"
}
```

### 6. Xóa list (soft delete)
**DELETE** `/api/v1/lists/{id}`

**Response:**
```json
{
  "code": 200,
  "status": "success",
  "message": "List deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "deleted_at": "2024-01-01T00:00:00.000Z",
    "deleted_by": "user123"
  }
}
```

### 7. Lấy tất cả lists theo board
**GET** `/api/v1/lists/board/{boardId}`

**Response:**
```json
{
  "code": 200,
  "status": "success",
  "message": "Lists by board fetched successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "boardId": "123e4567-e89b-12d3-a456-426614174001",
      "title": "To Do",
      "order": 1,
      "archived": 0,
      "card_order_ids": []
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "boardId": "123e4567-e89b-12d3-a456-426614174001",
      "title": "In Progress",
      "order": 2,
      "archived": 0,
      "card_order_ids": []
    }
  ]
}
```

### 8. Cập nhật thứ tự cards trong list
**PUT** `/api/v1/lists/{listId}/card-order`

**Request Body:**
```json
{
  "card_order_ids": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
}
```

**Response:**
```json
{
  "code": 200,
  "status": "success",
  "message": "Card order updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "card_order_ids": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Validation Rules

### Tạo list mới
- `boardId`: Bắt buộc, độ dài 36 ký tự (UUID)
- `title`: Bắt buộc, độ dài 3-255 ký tự
- `order`: Tùy chọn, số nguyên >= 0, default: 0
- `archived`: Tùy chọn, 0 hoặc 1, default: 0

### Cập nhật list
- `title`: Tùy chọn, độ dài 3-255 ký tự
- `order`: Tùy chọn, số nguyên >= 0
- `archived`: Tùy chọn, 0 hoặc 1

### Cập nhật thứ tự cards
- `card_order_ids`: Bắt buộc, mảng các ObjectId hợp lệ

## Error Responses

### 400 Bad Request
```json
{
  "code": 400,
  "status": "error",
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "code": 401,
  "status": "error",
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "code": 404,
  "status": "error",
  "message": "List not found"
}
```

### 422 Unprocessable Entity
```json
{
  "code": 422,
  "status": "error",
  "message": "Validation error message"
}
```

## Database Schema

```javascript
{
  _id: ObjectId,
  id: String (36 chars, UUID),
  boardId: String (36 chars, UUID),
  title: String (max 255 chars),
  order: Number (integer, >= 0),
  archived: Number (0 or 1),
  card_order_ids: [ObjectId],
  created_by: String (36 chars, UUID),
  updated_by: String (36 chars, UUID),
  deleted_by: String (36 chars, UUID),
  created_at: Date,
  updated_at: Date,
  deleted_at: Date
}
```

## Notes

1. **Soft Delete**: Khi xóa list, hệ thống sẽ đánh dấu `deleted_at` thay vì xóa hoàn toàn
2. **Card Order**: Thứ tự cards được lưu trong mảng `card_order_ids`
3. **Archived**: Lists có thể được archive (ẩn) thay vì xóa
4. **Pagination**: API lấy danh sách hỗ trợ phân trang
5. **Authentication**: Tất cả API đều yêu cầu token hợp lệ 