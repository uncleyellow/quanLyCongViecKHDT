import db from '../config/db'

const DASHBOARD_TABLE_NAME = 'cards'

const getWorkStatisticsByStatus = async (data) => {
  try {
    // First, get user information to determine their role and department
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return {
        todo: 0,
        inProgress: 0,
        done: 0,
        overdue: 0,
        total: 0
      }
    }

    let query
    let params = []

    if (user.type === 'staff') {
      // Staff users: only get cards from boards where they are the owner
      query = `
        SELECT 
          c.status,
          c.dueDate,
          COUNT(*) as count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        GROUP BY c.status, c.dueDate
      `
      params = [data.userId]
    } else if (user.type === 'manager') {
      // Manager users: get cards from their own boards + boards owned by staff in their department
      query = `
        SELECT 
          c.status,
          c.dueDate,
          COUNT(*) as count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        WHERE (b.ownerId = ? 
        OR (b.ownerId IN (
          SELECT u2.id 
          FROM users u2 
          WHERE u2.departmentId = ? 
          AND u2.type = 'staff'
        )))
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        GROUP BY c.status, c.dueDate
      `
      params = [data.userId, user.departmentId]
    } else {
      // For other roles (boss, admin), get all cards from boards they own
      query = `
        SELECT 
          c.status,
          c.dueDate,
          COUNT(*) as count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        GROUP BY c.status, c.dueDate
      `
      params = [data.userId]
    }

    const result = await db.query(query, params)
    const statusCounts = result[0]

    // Initialize default counts
    const statistics = {
      todo: 0,
      inProgress: 0,
      done: 0,
      overdue: 0,
      total: 0
    }

    // Process the results
    statusCounts.forEach(row => {
      const status = row.status
      const dueDate = row.dueDate
      const count = parseInt(row.count)
      
      // Check if card is overdue (not done and past due date)
      const isOverdue = status !== 'done' && dueDate && new Date(dueDate) < new Date()
      
      if (isOverdue) {
        statistics.overdue += count
      } else {
        if (status === 'todo') {
          statistics.todo += count
        } else if (status === 'inProgress') {
          statistics.inProgress += count
        } else if (status === 'done') {
          statistics.done += count
        }
      }
      
      statistics.total += count
    })

    return statistics
  } catch (error) {
    throw new Error(error)
  }
}

export const dashboardModel = {
  DASHBOARD_TABLE_NAME,
  getWorkStatisticsByStatus
}
