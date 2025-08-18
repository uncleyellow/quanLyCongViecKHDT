# Sửa lỗi: Lọc tiêu đề không hoạt động chính xác

## Vấn đề
Khi người dùng chọn lọc tiêu đề với điều kiện "chứa" và nhập một giá trị có trong tiêu đề task, kết quả không hiển thị gì mặc dù lẽ ra phải có kết quả.

## Nguyên nhân
1. **Xử lý null/undefined không đúng**: Khi `fieldValue` là `null` hoặc `undefined`, việc gọi `String(fieldValue).toLowerCase()` trả về `"null"` hoặc `"undefined"`, gây ra lỗi logic.
2. **Thiếu xử lý trim()**: Các chuỗi có thể chứa khoảng trắng thừa.
3. **Trùng lặp case trong switch**: Các operator `greater_than`, `less_than` bị trùng lặp giữa number và date.

## Giải pháp

### 1. Xử lý null/undefined field values
```typescript
// Handle null/undefined field values
if (fieldValue === null || fieldValue === undefined) {
    switch (filter.operator) {
        case 'equals':
            return filter.value === null || filter.value === undefined || filter.value === '';
        case 'not_equals':
            return filter.value !== null && filter.value !== undefined && filter.value !== '';
        case 'contains':
        case 'starts_with':
        case 'ends_with':
            return false; // null/undefined cannot contain, start with, or end with anything
        case 'not_contains':
            return true; // null/undefined does not contain anything
        default:
            return false;
    }
}
```

### 2. Cải thiện xử lý chuỗi
```typescript
case 'contains':
    const fieldStr = String(fieldValue || '').toLowerCase().trim();
    const filterStr = String(filter.value || '').toLowerCase().trim();
    const containsResult = fieldStr.includes(filterStr);
    return containsResult;
```

### 3. Sửa trùng lặp operator cho date/number
```typescript
case 'greater_than':
    if (fieldConfig.type === 'date') {
        return fieldValue && new Date(fieldValue) > new Date(filter.value);
    }
    return Number(fieldValue) > Number(filter.value);
```

### 4. Thêm debug logging
```typescript
// Debug logging for title filtering
if (filter.field === 'title' && filter.operator === 'contains') {
    console.log('Filter debug:', {
        cardTitle: card.title,
        fieldValue: fieldValue,
        filterValue: filter.value,
        operator: filter.operator
    });
}
```

## Cải tiến khác

### Xử lý chuỗi an toàn
- Sử dụng `String(fieldValue || '')` thay vì `String(fieldValue)`
- Thêm `.trim()` để loại bỏ khoảng trắng thừa
- Xử lý đúng các trường hợp `null`/`undefined`

### Logic operator rõ ràng
- Kiểm tra `fieldConfig.type` để phân biệt date và number operators
- Xử lý riêng biệt cho từng loại dữ liệu

## Kết quả
- ✅ Lọc tiêu đề hoạt động chính xác với điều kiện "chứa"
- ✅ Xử lý đúng các trường hợp `null`/`undefined`
- ✅ Loại bỏ khoảng trắng thừa trong chuỗi
- ✅ Debug logging để dễ dàng troubleshoot
- ✅ Logic operator rõ ràng và không trùng lặp

## Test cases
1. **Tiêu đề có chứa từ khóa** → Lọc "chứa" → Hiển thị kết quả ✅
2. **Tiêu đề null/undefined** → Lọc "chứa" → Không hiển thị ✅
3. **Tiêu đề có khoảng trắng** → Lọc "chứa" → Hiển thị kết quả ✅
4. **Giá trị lọc null/undefined** → Xử lý đúng ✅

## Debug
Khi test, kiểm tra console log để xem:
- `cardTitle`: Tiêu đề thực tế của card
- `fieldValue`: Giá trị được lấy từ card
- `filterValue`: Giá trị người dùng nhập
- `containsResult`: Kết quả so sánh
