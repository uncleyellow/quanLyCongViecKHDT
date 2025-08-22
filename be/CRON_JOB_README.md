# Cron Job - Recurring Card Duplication

## Overview

This cron job automatically duplicates cards in recurring boards every day at 8:00 AM (Vietnam timezone). It filters boards that have `recurringConfig.isRecurring: true` and creates new copies of all cards with today's date as the due date.

## Features

- **Automatic Execution**: Runs daily at 8:00 AM (Asia/Ho_Chi_Minh timezone)
- **Board Filtering**: Only processes boards with `recurringConfig.isRecurring: true`
- **Card Duplication**: Creates identical copies of all cards in recurring boards
- **Date Update**: Sets the new cards' due date to today
- **Member Preservation**: Duplicates card member assignments
- **Time Tracking Reset**: Resets time tracking fields for new cards

## Configuration

### Cron Schedule
- **Pattern**: `0 8 * * *` (Every day at 8:00 AM)
- **Timezone**: Asia/Ho_Chi_Minh (Vietnam)

### Board Configuration
To enable recurring functionality for a board, set the `recurringConfig` field:

```json
{
  "recurringConfig": {
    "isRecurring": true,
    "completedListId": "optional-list-id-for-completed-cards"
  }
}
```

## API Endpoints

### Get Cron Status
```
GET /api/v1/cron/status
```
Returns the current status of the cron service.

**Response:**
```json
{
  "success": true,
  "data": {
    "isInitialized": true,
    "nextRun": "Daily at 8:00 AM (Asia/Ho_Chi_Minh timezone)",
    "description": "Recurring card duplication for boards with isRecurring: true"
  }
}
```

### Manually Trigger Duplication
```
POST /api/v1/cron/trigger-recurring-cards
```
Manually triggers the recurring card duplication process (admin only).

**Response:**
```json
{
  "success": true,
  "message": "Recurring card duplication triggered successfully",
  "timestamp": "2024-01-15T08:00:00.000Z"
}
```

## Implementation Details

### Files Created/Modified

1. **`src/services/cronService.js`** - Main cron service implementation
2. **`src/controllers/cronController.js`** - API controller for cron operations
3. **`src/routes/v1/cronRoute.js`** - API routes for cron endpoints
4. **`src/routes/v1/index.js`** - Added cron routes to main router
5. **`app.js`** - Added cron service initialization

### Dependencies Added

- `node-cron` - For scheduling the daily job

### Database Operations

The cron job performs the following database operations:

1. **Query recurring boards**:
   ```sql
   SELECT id, title, recurringConfig 
   FROM boards 
   WHERE JSON_EXTRACT(recurringConfig, '$.isRecurring') = true 
   AND deletedAt IS NULL
   ```

2. **Query cards for each board**:
   ```sql
   SELECT * FROM cards 
   WHERE boardId = ? 
   AND archived = 0 
   AND deletedAt IS NULL
   ```

3. **Insert new cards** with updated due date and reset time tracking

4. **Duplicate card members** if any exist

## Testing

### Manual Test
Run the test script to verify functionality:
```bash
node test-cron.js
```

### API Test
1. Check cron status:
   ```bash
   curl -X GET "http://localhost:3000/api/v1/cron/status" \
        -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. Manually trigger duplication:
   ```bash
   curl -X POST "http://localhost:3000/api/v1/cron/trigger-recurring-cards" \
        -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Logging

The cron service provides detailed logging:
- Initialization status
- Number of recurring boards found
- Number of cards duplicated per board
- Success/failure messages for each operation

## Error Handling

- Graceful error handling for individual board/card operations
- Continues processing other boards if one fails
- Detailed error logging for debugging

## Security

- API endpoints require authentication
- Manual trigger requires admin privileges
- All database operations use parameterized queries

## Monitoring

Monitor the application logs for:
- Cron service initialization messages
- Daily execution logs
- Error messages and stack traces
- Success confirmations

## Troubleshooting

### Common Issues

1. **Cron not running**: Check if the service is initialized in logs
2. **No cards duplicated**: Verify boards have `recurringConfig.isRecurring: true`
3. **Database errors**: Check database connection and permissions
4. **Timezone issues**: Verify server timezone matches Asia/Ho_Chi_Minh

### Debug Commands

1. Check cron status via API
2. Manually trigger duplication for testing
3. Review application logs for detailed execution information
