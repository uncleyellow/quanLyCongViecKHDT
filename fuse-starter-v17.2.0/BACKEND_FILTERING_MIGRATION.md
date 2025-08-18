# Chuyển đổi từ Lọc Frontend sang Backend

## Vấn đề ban đầu
- Lọc bằng Frontend gây vấn đề hiệu suất khi dữ liệu lớn
- Lỗi lọc tiêu đề không hoạt động chính xác
- Tất cả dữ liệu phải được tải về Frontend trước khi lọc

## Giải pháp: Lọc bằng Backend

### 1. Cập nhật Backend API

#### Controller (`be/src/controllers/cardController.js`)
```javascript
const getAllUserCards = async (req, res, next) => {
    try {
        const { userId } = req.user
        
        // Extract filter parameters from query
        const {
            searchTerm,
            filters,
            page = 1,
            limit = 50
        } = req.query
        
        // Parse filters if provided
        let parsedFilters = []
        if (filters) {
            try {
                parsedFilters = JSON.parse(filters)
            } catch (error) {
                console.error('Error parsing filters:', error)
                parsedFilters = []
            }
        }
        
        const result = await cardService.getAllUserCards(userId, {
            searchTerm,
            filters: parsedFilters,
            page: parseInt(page),
            limit: parseInt(limit)
        })
        
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'User cards fetched successfully',
            pagination: {
                total: result.total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(result.total / parseInt(limit))
            },
            data: result.cards
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}
```

#### Service (`be/src/services/cardService.js`)
```javascript
const getAllUserCards = async (userId, options = {}) => {
  try {
    const { searchTerm, filters = [], page = 1, limit = 50 } = options
    
    // Get all cards first
    let cards = await cardModel.getAllUserCards(userId)
    
    // Apply search filter if provided
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      cards = cards.filter(card => {
        const titleMatch = card.title?.toLowerCase().includes(searchLower)
        const descriptionMatch = card.description?.toLowerCase().includes(searchLower)
        return titleMatch || descriptionMatch
      })
    }
    
    // Apply advanced filters if provided
    if (filters && filters.length > 0) {
      cards = cards.filter(card => {
        return filters.every(filter => {
          return evaluateFilter(card, filter)
        })
      })
    }
    
    // ... rest of processing and pagination
  }
}
```

#### Helper Function `evaluateFilter`
```javascript
const evaluateFilter = (card, filter) => {
  const { field, operator, value } = filter
  
  // Get field value from card
  let fieldValue
  switch (field) {
    case 'title':
      fieldValue = card.title
      break
    case 'description':
      fieldValue = card.description
      break
    case 'dueDate':
      fieldValue = card.dueDate
      break
    case 'status':
      fieldValue = card.status
      break
    case 'boardTitle':
      fieldValue = card.boardTitle
      break
    case 'boardId':
      fieldValue = card.boardId
      break
    case 'listTitle':
      fieldValue = card.listTitle
      break
    case 'recurring':
      fieldValue = card.recurringConfig ? JSON.parse(card.recurringConfig).isRecurring : false
      break
    default:
      fieldValue = card[field]
  }
  
  // Handle null/undefined field values
  if (fieldValue === null || fieldValue === undefined) {
    switch (operator) {
      case 'equals':
        return value === null || value === undefined || value === ''
      case 'not_equals':
        return value !== null && value !== undefined && value !== ''
      case 'contains':
      case 'starts_with':
      case 'ends_with':
        return false
      case 'not_contains':
        return true
      default:
        return false
    }
  }
  
  // Evaluate based on operator
  switch (operator) {
    // String operators
    case 'contains':
      return String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase())
    case 'not_contains':
      return !String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase())
    case 'equals':
      return String(fieldValue || '').toLowerCase() === String(value || '').toLowerCase()
    case 'not_equals':
      return String(fieldValue || '').toLowerCase() !== String(value || '').toLowerCase()
    case 'starts_with':
      return String(fieldValue || '').toLowerCase().startsWith(String(value || '').toLowerCase())
    case 'ends_with':
      return String(fieldValue || '').toLowerCase().endsWith(String(value || '').toLowerCase())
    
    // Number operators
    case 'greater_than':
      return Number(fieldValue) > Number(value)
    case 'greater_than_or_equal':
      return Number(fieldValue) >= Number(value)
    case 'less_than':
      return Number(fieldValue) < Number(value)
    case 'less_than_or_equal':
      return Number(fieldValue) <= Number(value)
    
    // Date operators
    case 'date_greater_than':
      return fieldValue && new Date(fieldValue) > new Date(value)
    case 'date_greater_than_or_equal':
      return fieldValue && new Date(fieldValue) >= new Date(value)
    case 'date_less_than':
      return fieldValue && new Date(fieldValue) < new Date(value)
    case 'date_less_than_or_equal':
      return fieldValue && new Date(fieldValue) <= new Date(value)
    
    // Select operators
    case 'in':
      return Array.isArray(value) ? value.includes(fieldValue) : value === fieldValue
    case 'not_in':
      return Array.isArray(value) ? !value.includes(fieldValue) : value !== fieldValue
    
    default:
      return true
  }
}
```

### 2. Cập nhật Frontend

#### Service (`fuse-starter-v17.2.0/src/app/modules/admin/tasks/tasks.service.ts`)
```typescript
getUserCards(options?: {
    searchTerm?: string;
    filters?: any[];
    page?: number;
    limit?: number;
}): Observable<UserCard[]>
{
    console.log('getUserCards - calling API with options:', options);
    
    // Build query parameters
    const params: any = {};
    if (options?.searchTerm) {
        params.searchTerm = options.searchTerm;
    }
    if (options?.filters && options.filters.length > 0) {
        params.filters = JSON.stringify(options.filters);
    }
    if (options?.page) {
        params.page = options.page.toString();
    }
    if (options?.limit) {
        params.limit = options.limit.toString();
    }
    
    return this._httpClient.get<any>(`${environment.apiBaseUrl}/cards/user/all`, { params }).pipe(
        map((response: any) => {
            // Process response...
            return processedCards;
        })
    );
}
```

#### Component (`fuse-starter-v17.2.0/src/app/modules/admin/tasks/list/list.component.ts`)
```typescript
/**
 * Load cards with current filters and search
 */
private loadCardsWithFilters(): void
{
    const options: any = {};
    
    if (this.searchTerm && this.searchTerm.trim()) {
        options.searchTerm = this.searchTerm.trim();
    }
    
    if (this.filters && this.filters.length > 0) {
        // Only include filters that have all required fields
        const validFilters = this.filters.filter(filter => 
            filter.field && filter.operator && filter.value !== null && filter.value !== undefined
        );
        if (validFilters.length > 0) {
            options.filters = validFilters;
        }
    }
    
    this._tasksService.getUserCards(options).subscribe((userCards: UserCard[]) => {
        this.userCards = userCards;
        this.updateBoardGroupsWithSearch();
        this.updateTasksCount();
        this.updateNavigationCount();
        this._changeDetectorRef.markForCheck();
    });
}
```

### 3. Các thay đổi chính

#### Xóa bỏ Frontend Filtering Logic
- Xóa `applySearch()`
- Xóa `applyFilters()`
- Xóa `applyFiltersToCurrentResults()`
- Xóa `evaluateFilter()`
- Xóa `getFieldValue()`

#### Cập nhật Method Calls
- `onSearchChange()` → `loadCardsWithFilters()`
- `clearSearch()` → `loadCardsWithFilters()`
- `removeFilter()` → `loadCardsWithFilters()`
- `clearAllFilters()` → `loadCardsWithFilters()`
- `onFilterChange()` → `loadCardsWithFilters()`

#### Cập nhật `updateBoardGroupsWithSearch()`
```typescript
private updateBoardGroupsWithSearch(): void
{
    this.boardGroups = this.groupTasksByBoard(this.userCards);
    this.filteredBoardGroups = [...this.boardGroups];
}
```

### 4. Lợi ích

#### Hiệu suất
- ✅ Chỉ tải dữ liệu cần thiết từ Backend
- ✅ Giảm tải cho Frontend khi dữ liệu lớn
- ✅ Hỗ trợ pagination để tối ưu hóa

#### Độ tin cậy
- ✅ Lọc chính xác hơn với logic Backend
- ✅ Xử lý đúng các trường hợp null/undefined
- ✅ Không bị lỗi JavaScript ở Frontend

#### Khả năng mở rộng
- ✅ Dễ dàng thêm các operator mới
- ✅ Có thể tối ưu hóa query database
- ✅ Hỗ trợ caching ở Backend

### 5. API Parameters

#### Query Parameters
- `searchTerm`: Từ khóa tìm kiếm (string)
- `filters`: Mảng các filter (JSON string)
- `page`: Trang hiện tại (number, default: 1)
- `limit`: Số lượng item mỗi trang (number, default: 50)

#### Filter Object Structure
```javascript
{
  field: 'title',           // Tên trường
  operator: 'contains',     // Operator
  value: 'search text'      // Giá trị
}
```

#### Response Format
```javascript
{
  code: 200,
  status: 'success',
  message: 'User cards fetched successfully',
  pagination: {
    total: 100,
    page: 1,
    limit: 50,
    totalPages: 2
  },
  data: [...cards]
}
```

### 6. Test Cases

#### Search
- ✅ Tìm kiếm theo tiêu đề
- ✅ Tìm kiếm theo mô tả
- ✅ Tìm kiếm không phân biệt hoa thường
- ✅ Xử lý khoảng trắng

#### Filters
- ✅ Lọc tiêu đề với operator "chứa"
- ✅ Lọc trạng thái với operator "bằng"
- ✅ Lọc ngày hết hạn với operator "sau ngày"
- ✅ Kết hợp nhiều filter

#### Pagination
- ✅ Phân trang đúng
- ✅ Trả về tổng số records
- ✅ Tính toán tổng số trang

### 7. Migration Checklist

- [x] Cập nhật Backend controller
- [x] Cập nhật Backend service
- [x] Thêm helper function evaluateFilter
- [x] Cập nhật Frontend service
- [x] Cập nhật Frontend component
- [x] Xóa Frontend filtering logic
- [x] Test build thành công
- [x] Test API với parameters
- [x] Test UI functionality

### 8. Next Steps

1. **Database Optimization**: Có thể thêm indexes cho các trường thường được lọc
2. **Caching**: Implement Redis cache cho kết quả lọc
3. **Advanced Queries**: Sử dụng SQL WHERE clauses thay vì JavaScript filtering
4. **Real-time Updates**: Implement WebSocket cho real-time updates
