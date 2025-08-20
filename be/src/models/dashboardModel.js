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
    } else if (user.type === 'boss') {
      // Boss users: get all cards from all departments in their company
      query = `
        SELECT 
          c.status,
          c.dueDate,
          COUNT(*) as count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        INNER JOIN users u ON b.ownerId = u.id
        WHERE u.companyId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        GROUP BY c.status, c.dueDate
      `
      params = [user.companyId]
    } else {
      // For other roles (admin), get all cards from boards they own
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

const getActiveMembers = async (data) => {
  try {
    // First, get user information to determine their role and department
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return []
    }

    let query
    let params = []

    if (user.type === 'staff') {
      // Staff users: only get members from boards where they are the owner
      query = `
        SELECT DISTINCT
          u.id,
          u.name,
          u.email,
          u.avatar,
          u.type as userType,
          COUNT(DISTINCT c.id) as totalTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'todo' THEN c.id END) as todoTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'inProgress' THEN c.id END) as inProgressTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'done' THEN c.id END) as doneTasks,
          COUNT(DISTINCT CASE WHEN c.status != 'done' AND c.dueDate IS NOT NULL AND c.dueDate < NOW() THEN c.id END) as overdueTasks
        FROM users u
        INNER JOIN boardMembers bm ON u.id = bm.memberId
        INNER JOIN boards b ON bm.boardId = b.id
        INNER JOIN cards c ON b.id = c.boardId
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND bm.deletedAt IS NULL
        GROUP BY u.id, u.name, u.email, u.avatar, u.type
        ORDER BY u.name
      `
      params = [data.userId]
    } else if (user.type === 'manager') {
      // Manager users: get members from their own boards + boards owned by staff in their department
      query = `
        SELECT DISTINCT
          u.id,
          u.name,
          u.email,
          u.avatar,
          u.type as userType,
          COUNT(DISTINCT c.id) as totalTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'todo' THEN c.id END) as todoTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'inProgress' THEN c.id END) as inProgressTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'done' THEN c.id END) as doneTasks,
          COUNT(DISTINCT CASE WHEN c.status != 'done' AND c.dueDate IS NOT NULL AND c.dueDate < NOW() THEN c.id END) as overdueTasks
        FROM users u
        INNER JOIN boardMembers bm ON u.id = bm.memberId
        INNER JOIN boards b ON bm.boardId = b.id
        INNER JOIN cards c ON b.id = c.boardId
        WHERE (b.ownerId = ? 
        OR (b.ownerId IN (
          SELECT u2.id 
          FROM users u2 
          WHERE u2.departmentId = ? 
          AND u2.type = 'staff'
        )))
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND bm.deletedAt IS NULL
        GROUP BY u.id, u.name, u.email, u.avatar, u.type
        ORDER BY u.name
      `
      params = [data.userId, user.departmentId]
    } else if (user.type === 'boss') {
      // Boss users: get all members from all departments in their company
      query = `
        SELECT DISTINCT
          u.id,
          u.name,
          u.email,
          u.avatar,
          u.type as userType,
          COUNT(DISTINCT c.id) as totalTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'todo' THEN c.id END) as todoTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'inProgress' THEN c.id END) as inProgressTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'done' THEN c.id END) as doneTasks,
          COUNT(DISTINCT CASE WHEN c.status != 'done' AND c.dueDate IS NOT NULL AND c.dueDate < NOW() THEN c.id END) as overdueTasks
        FROM users u
        INNER JOIN boardMembers bm ON u.id = bm.memberId
        INNER JOIN boards b ON bm.boardId = b.id
        INNER JOIN cards c ON b.id = c.boardId
        INNER JOIN users boardOwner ON b.ownerId = boardOwner.id
        WHERE boardOwner.companyId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND bm.deletedAt IS NULL
        GROUP BY u.id, u.name, u.email, u.avatar, u.type
        ORDER BY u.name
      `
      params = [user.companyId]
    } else {
      // For other roles (admin), get all members from boards they own
      query = `
        SELECT DISTINCT
          u.id,
          u.name,
          u.email,
          u.avatar,
          u.type as userType,
          COUNT(DISTINCT c.id) as totalTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'todo' THEN c.id END) as todoTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'inProgress' THEN c.id END) as inProgressTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'done' THEN c.id END) as doneTasks,
          COUNT(DISTINCT CASE WHEN c.status != 'done' AND c.dueDate IS NOT NULL AND c.dueDate < NOW() THEN c.id END) as overdueTasks
        FROM users u
        INNER JOIN boardMembers bm ON u.id = bm.memberId
        INNER JOIN boards b ON bm.boardId = b.id
        INNER JOIN cards c ON b.id = c.boardId
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND bm.deletedAt IS NULL
        GROUP BY u.id, u.name, u.email, u.avatar, u.type
        ORDER BY u.name
      `
      params = [data.userId]
    }

    const result = await db.query(query, params)
    return result[0]
  } catch (error) {
    throw new Error(error)
  }
}

// Thêm các model mới cho biểu đồ
const getStatusChartData = async (data) => {
  try {
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return {
        series: [0, 0, 0, 0],
        labels: ['Todo', 'In Progress', 'Done', 'Overdue']
      }
    }

    let query
    let params = []

    if (user.type === 'staff') {
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
    } else if (user.type === 'boss') {
      query = `
        SELECT 
          c.status,
          c.dueDate,
          COUNT(*) as count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        INNER JOIN users u ON b.ownerId = u.id
        WHERE u.companyId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        GROUP BY c.status, c.dueDate
      `
      params = [user.companyId]
    } else {
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

    const chartData = {
      todo: 0,
      inProgress: 0,
      done: 0,
      overdue: 0
    }

    statusCounts.forEach(row => {
      const status = row.status
      const dueDate = row.dueDate
      const count = parseInt(row.count)
      
      const isOverdue = status !== 'done' && dueDate && new Date(dueDate) < new Date()
      
      if (isOverdue) {
        chartData.overdue += count
      } else {
        if (status === 'todo') {
          chartData.todo += count
        } else if (status === 'inProgress') {
          chartData.inProgress += count
        } else if (status === 'done') {
          chartData.done += count
        }
      }
    })

    return {
      series: [chartData.todo, chartData.inProgress, chartData.done, chartData.overdue],
      labels: ['Todo', 'In Progress', 'Done', 'Overdue']
    }
  } catch (error) {
    throw new Error(error)
  }
}

const getTimelineChartData = async (data) => {
  try {
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return {
        series: [{ name: 'Tasks', data: [] }],
        categories: []
      }
    }

    let dateFormat, dateRange
    switch (data.timeRange) {
      case 'week':
        dateFormat = '%Y-%u'
        dateRange = 'DATE_SUB(NOW(), INTERVAL 7 DAY)'
        break
      case 'month':
        dateFormat = '%Y-%m'
        dateRange = 'DATE_SUB(NOW(), INTERVAL 30 DAY)'
        break
      case 'quarter':
        dateFormat = '%Y-%m'
        dateRange = 'DATE_SUB(NOW(), INTERVAL 90 DAY)'
        break
      default:
        dateFormat = '%Y-%m'
        dateRange = 'DATE_SUB(NOW(), INTERVAL 30 DAY)'
    }

    let query
    let params = []

    if (user.type === 'staff') {
      query = `
        SELECT 
          DATE_FORMAT(c.createdAt, ?) as period,
          COUNT(*) as count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        WHERE b.ownerId = ? 
        AND c.createdAt >= ${dateRange}
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        GROUP BY DATE_FORMAT(c.createdAt, ?)
        ORDER BY period
      `
      params = [dateFormat, data.userId, dateFormat]
    } else if (user.type === 'manager') {
      query = `
        SELECT 
          DATE_FORMAT(c.createdAt, ?) as period,
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
        AND c.createdAt >= ${dateRange}
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        GROUP BY DATE_FORMAT(c.createdAt, ?)
        ORDER BY period
      `
      params = [dateFormat, data.userId, user.departmentId, dateFormat]
    } else if (user.type === 'boss') {
      query = `
        SELECT 
          DATE_FORMAT(c.createdAt, ?) as period,
          COUNT(*) as count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        INNER JOIN users u ON b.ownerId = u.id
        WHERE u.companyId = ? 
        AND c.createdAt >= ${dateRange}
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        GROUP BY DATE_FORMAT(c.createdAt, ?)
        ORDER BY period
      `
      params = [dateFormat, user.companyId, dateFormat]
    } else {
      query = `
        SELECT 
          DATE_FORMAT(c.createdAt, ?) as period,
          COUNT(*) as count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        WHERE b.ownerId = ? 
        AND c.createdAt >= ${dateRange}
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        GROUP BY DATE_FORMAT(c.createdAt, ?)
        ORDER BY period
      `
      params = [dateFormat, data.userId, dateFormat]
    }

    const result = await db.query(query, params)
    const timelineData = result[0]

    return {
      series: [{ 
        name: 'Tasks', 
        data: timelineData.map(row => parseInt(row.count))
      }],
      categories: timelineData.map(row => row.period)
    }
  } catch (error) {
    throw new Error(error)
  }
}

const getMemberChartData = async (data) => {
  try {
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return {
        series: [],
        labels: []
      }
    }

    let query
    let params = []

    if (user.type === 'staff') {
      query = `
        SELECT 
          u.name,
          COUNT(DISTINCT c.id) as totalTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'done' THEN c.id END) as completedTasks
        FROM users u
        INNER JOIN boardMembers bm ON u.id = bm.memberId
        INNER JOIN boards b ON bm.boardId = b.id
        INNER JOIN cards c ON b.id = c.boardId
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND bm.deletedAt IS NULL
        GROUP BY u.id, u.name
        ORDER BY totalTasks DESC
        LIMIT 10
      `
      params = [data.userId]
    } else if (user.type === 'manager') {
      query = `
        SELECT 
          u.name,
          COUNT(DISTINCT c.id) as totalTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'done' THEN c.id END) as completedTasks
        FROM users u
        INNER JOIN boardMembers bm ON u.id = bm.memberId
        INNER JOIN boards b ON bm.boardId = b.id
        INNER JOIN cards c ON b.id = c.boardId
        WHERE (b.ownerId = ? 
        OR (b.ownerId IN (
          SELECT u2.id 
          FROM users u2 
          WHERE u2.departmentId = ? 
          AND u2.type = 'staff'
        )))
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND bm.deletedAt IS NULL
        GROUP BY u.id, u.name
        ORDER BY totalTasks DESC
        LIMIT 10
      `
      params = [data.userId, user.departmentId]
    } else if (user.type === 'boss') {
      query = `
        SELECT 
          u.name,
          COUNT(DISTINCT c.id) as totalTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'done' THEN c.id END) as completedTasks
        FROM users u
        INNER JOIN boardMembers bm ON u.id = bm.memberId
        INNER JOIN boards b ON bm.boardId = b.id
        INNER JOIN cards c ON b.id = c.boardId
        INNER JOIN users boardOwner ON b.ownerId = boardOwner.id
        WHERE boardOwner.companyId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND bm.deletedAt IS NULL
        GROUP BY u.id, u.name
        ORDER BY totalTasks DESC
        LIMIT 10
      `
      params = [user.companyId]
    } else {
      query = `
        SELECT 
          u.name,
          COUNT(DISTINCT c.id) as totalTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'done' THEN c.id END) as completedTasks
        FROM users u
        INNER JOIN boardMembers bm ON u.id = bm.memberId
        INNER JOIN boards b ON bm.boardId = b.id
        INNER JOIN cards c ON b.id = c.boardId
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND bm.deletedAt IS NULL
        GROUP BY u.id, u.name
        ORDER BY totalTasks DESC
        LIMIT 10
      `
      params = [data.userId]
    }

    const result = await db.query(query, params)
    const memberData = result[0]

    return {
      series: memberData.map(row => parseInt(row.totalTasks)),
      labels: memberData.map(row => row.name)
    }
  } catch (error) {
    throw new Error(error)
  }
}

const getPriorityChartData = async (data) => {
  try {
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return {
        series: [0, 0, 0],
        labels: ['Low', 'Medium', 'High']
      }
    }

    let query
    let params = []

    if (user.type === 'staff') {
      query = `
        SELECT 
          c.priority,
          COUNT(*) as count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        GROUP BY c.priority
      `
      params = [data.userId]
    } else if (user.type === 'manager') {
      query = `
        SELECT 
          c.priority,
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
        GROUP BY c.priority
      `
      params = [data.userId, user.departmentId]
    } else if (user.type === 'boss') {
      query = `
        SELECT 
          c.priority,
          COUNT(*) as count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        INNER JOIN users u ON b.ownerId = u.id
        WHERE u.companyId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        GROUP BY c.priority
      `
      params = [user.companyId]
    } else {
      query = `
        SELECT 
          c.priority,
          COUNT(*) as count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        GROUP BY c.priority
      `
      params = [data.userId]
    }

    const result = await db.query(query, params)
    const priorityData = result[0]

    const chartData = {
      low: 0,
      medium: 0,
      high: 0
    }

    priorityData.forEach(row => {
      const priority = row.priority
      const count = parseInt(row.count)
      
      if (priority === 'low') {
        chartData.low += count
      } else if (priority === 'medium') {
        chartData.medium += count
      } else if (priority === 'high') {
        chartData.high += count
      }
    })

    return {
      series: [chartData.low, chartData.medium, chartData.high],
      labels: ['Low', 'Medium', 'High']
    }
  } catch (error) {
    throw new Error(error)
  }
}

const getDepartmentChartData = async (data) => {
  try {
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return {
        series: [],
        labels: []
      }
    }

    let query
    let params = []

    if (user.type === 'staff') {
      query = `
        SELECT 
          d.name as departmentName,
          COUNT(DISTINCT c.id) as totalTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'done' THEN c.id END) as completedTasks
        FROM departments d
        INNER JOIN users u ON d.id = u.departmentId
        INNER JOIN boardMembers bm ON u.id = bm.memberId
        INNER JOIN boards b ON bm.boardId = b.id
        INNER JOIN cards c ON b.id = c.boardId
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND bm.deletedAt IS NULL
        GROUP BY d.id, d.name
        ORDER BY totalTasks DESC
      `
      params = [data.userId]
    } else if (user.type === 'manager') {
      query = `
        SELECT 
          d.name as departmentName,
          COUNT(DISTINCT c.id) as totalTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'done' THEN c.id END) as completedTasks
        FROM departments d
        INNER JOIN users u ON d.id = u.departmentId
        INNER JOIN boardMembers bm ON u.id = bm.memberId
        INNER JOIN boards b ON bm.boardId = b.id
        INNER JOIN cards c ON b.id = c.boardId
        WHERE (b.ownerId = ? 
        OR (b.ownerId IN (
          SELECT u2.id 
          FROM users u2 
          WHERE u2.departmentId = ? 
          AND u2.type = 'staff'
        )))
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND bm.deletedAt IS NULL
        GROUP BY d.id, d.name
        ORDER BY totalTasks DESC
      `
      params = [data.userId, user.departmentId]
    } else if (user.type === 'boss') {
      query = `
        SELECT 
          d.name as departmentName,
          COUNT(DISTINCT c.id) as totalTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'done' THEN c.id END) as completedTasks
        FROM departments d
        INNER JOIN users u ON d.id = u.departmentId
        INNER JOIN boardMembers bm ON u.id = bm.memberId
        INNER JOIN boards b ON bm.boardId = b.id
        INNER JOIN cards c ON b.id = c.boardId
        INNER JOIN users boardOwner ON b.ownerId = boardOwner.id
        WHERE boardOwner.companyId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND bm.deletedAt IS NULL
        GROUP BY d.id, d.name
        ORDER BY totalTasks DESC
      `
      params = [user.companyId]
    } else {
      query = `
        SELECT 
          d.name as departmentName,
          COUNT(DISTINCT c.id) as totalTasks,
          COUNT(DISTINCT CASE WHEN c.status = 'done' THEN c.id END) as completedTasks
        FROM departments d
        INNER JOIN users u ON d.id = u.departmentId
        INNER JOIN boardMembers bm ON u.id = bm.memberId
        INNER JOIN boards b ON bm.boardId = b.id
        INNER JOIN cards c ON b.id = c.boardId
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND bm.deletedAt IS NULL
        GROUP BY d.id, d.name
        ORDER BY totalTasks DESC
      `
      params = [data.userId]
    }

    const result = await db.query(query, params)
    const departmentData = result[0]

    return {
      series: departmentData.map(row => parseInt(row.totalTasks)),
      labels: departmentData.map(row => row.departmentName)
    }
  } catch (error) {
    throw new Error(error)
  }
}

const getDashboardOverview = async (data) => {
  try {
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return {
        totalBoards: 0,
        totalCards: 0,
        totalMembers: 0,
        completionRate: 0,
        recentActivity: []
      }
    }

    let boardQuery, cardQuery, memberQuery, activityQuery
    let params = []

    if (user.type === 'staff') {
      boardQuery = `
        SELECT COUNT(*) as count FROM boards WHERE ownerId = ? AND deletedAt IS NULL
      `
      cardQuery = `
        SELECT COUNT(*) as count FROM cards c
        INNER JOIN boards b ON c.boardId = b.id
        WHERE b.ownerId = ? AND b.deletedAt IS NULL AND c.deletedAt IS NULL
      `
      memberQuery = `
        SELECT COUNT(DISTINCT bm.memberId) as count FROM boardMembers bm
        INNER JOIN boards b ON bm.boardId = b.id
        WHERE b.ownerId = ? AND b.deletedAt IS NULL AND bm.deletedAt IS NULL
      `
      activityQuery = `
        SELECT 
          c.title,
          c.status,
          c.updatedAt,
          u.name as updatedBy
        FROM cards c
        INNER JOIN boards b ON c.boardId = b.id
        LEFT JOIN users u ON c.updatedBy = u.id
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL 
        AND c.deletedAt IS NULL
        ORDER BY c.updatedAt DESC
        LIMIT 5
      `
      params = [data.userId]
    } else if (user.type === 'manager') {
      boardQuery = `
        SELECT COUNT(*) as count FROM boards 
        WHERE ownerId = ? 
        OR (ownerId IN (
          SELECT u2.id FROM users u2 WHERE u2.departmentId = ? AND u2.type = 'staff'
        ))
        AND deletedAt IS NULL
      `
      cardQuery = `
        SELECT COUNT(*) as count FROM cards c
        INNER JOIN boards b ON c.boardId = b.id
        WHERE (b.ownerId = ? 
        OR (b.ownerId IN (
          SELECT u2.id FROM users u2 WHERE u2.departmentId = ? AND u2.type = 'staff'
        )))
        AND b.deletedAt IS NULL AND c.deletedAt IS NULL
      `
      memberQuery = `
        SELECT COUNT(DISTINCT bm.memberId) as count FROM boardMembers bm
        INNER JOIN boards b ON bm.boardId = b.id
        WHERE (b.ownerId = ? 
        OR (b.ownerId IN (
          SELECT u2.id FROM users u2 WHERE u2.departmentId = ? AND u2.type = 'staff'
        )))
        AND b.deletedAt IS NULL AND bm.deletedAt IS NULL
      `
      activityQuery = `
        SELECT 
          c.title,
          c.status,
          c.updatedAt,
          u.name as updatedBy
        FROM cards c
        INNER JOIN boards b ON c.boardId = b.id
        LEFT JOIN users u ON c.updatedBy = u.id
        WHERE (b.ownerId = ? 
        OR (b.ownerId IN (
          SELECT u2.id FROM users u2 WHERE u2.departmentId = ? AND u2.type = 'staff'
        )))
        AND b.deletedAt IS NULL AND c.deletedAt IS NULL
        ORDER BY c.updatedAt DESC
        LIMIT 5
      `
      params = [data.userId, user.departmentId]
    } else if (user.type === 'boss') {
      boardQuery = `
        SELECT COUNT(*) as count FROM boards b
        INNER JOIN users u ON b.ownerId = u.id
        WHERE u.companyId = ? AND b.deletedAt IS NULL
      `
      cardQuery = `
        SELECT COUNT(*) as count FROM cards c
        INNER JOIN boards b ON c.boardId = b.id
        INNER JOIN users u ON b.ownerId = u.id
        WHERE u.companyId = ? AND b.deletedAt IS NULL AND c.deletedAt IS NULL
      `
      memberQuery = `
        SELECT COUNT(DISTINCT bm.memberId) as count FROM boardMembers bm
        INNER JOIN boards b ON bm.boardId = b.id
        INNER JOIN users u ON b.ownerId = u.id
        WHERE u.companyId = ? AND b.deletedAt IS NULL AND bm.deletedAt IS NULL
      `
      activityQuery = `
        SELECT 
          c.title,
          c.status,
          c.updatedAt,
          u.name as updatedBy
        FROM cards c
        INNER JOIN boards b ON c.boardId = b.id
        INNER JOIN users boardOwner ON b.ownerId = boardOwner.id
        LEFT JOIN users u ON c.updatedBy = u.id
        WHERE boardOwner.companyId = ? 
        AND b.deletedAt IS NULL 
        AND c.deletedAt IS NULL
        ORDER BY c.updatedAt DESC
        LIMIT 5
      `
      params = [user.companyId]
    } else {
      boardQuery = `
        SELECT COUNT(*) as count FROM boards WHERE ownerId = ? AND deletedAt IS NULL
      `
      cardQuery = `
        SELECT COUNT(*) as count FROM cards c
        INNER JOIN boards b ON c.boardId = b.id
        WHERE b.ownerId = ? AND b.deletedAt IS NULL AND c.deletedAt IS NULL
      `
      memberQuery = `
        SELECT COUNT(DISTINCT bm.memberId) as count FROM boardMembers bm
        INNER JOIN boards b ON bm.boardId = b.id
        WHERE b.ownerId = ? AND b.deletedAt IS NULL AND bm.deletedAt IS NULL
      `
      activityQuery = `
        SELECT 
          c.title,
          c.status,
          c.updatedAt,
          u.name as updatedBy
        FROM cards c
        INNER JOIN boards b ON c.boardId = b.id
        LEFT JOIN users u ON c.updatedBy = u.id
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL 
        AND c.deletedAt IS NULL
        ORDER BY c.updatedAt DESC
        LIMIT 5
      `
      params = [data.userId]
    }

    const [boardResult, cardResult, memberResult, activityResult] = await Promise.all([
      db.query(boardQuery, params),
      db.query(cardQuery, params),
      db.query(memberQuery, params),
      db.query(activityQuery, params)
    ])

    const totalBoards = parseInt(boardResult[0][0].count)
    const totalCards = parseInt(cardResult[0][0].count)
    const totalMembers = parseInt(memberResult[0][0].count)
    const recentActivity = activityResult[0]

    // Calculate completion rate
    const completedCardsQuery = cardQuery.replace('COUNT(*)', 'COUNT(CASE WHEN c.status = "done" THEN 1 END)')
    const completedResult = await db.query(completedCardsQuery, params)
    const completedCards = parseInt(completedResult[0][0].count)
    const completionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0

    return {
      totalBoards,
      totalCards,
      totalMembers,
      completionRate,
      recentActivity
    }
  } catch (error) {
    throw new Error(error)
  }
}

const getGanttChartData = async (data) => {
  try {
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return {
        series: [],
        categories: [],
        timeRange: data.timeRange
      }
    }

    let query
    let params = []

    // Xác định khoảng thời gian
    let dateFilter = ''
    const now = new Date()
    
    switch (data.timeRange) {
      case 'day':
        // 7 ngày gần nhất
        dateFilter = 'AND DATE(c.endDate) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
        break
      case 'week':
        // 8 tuần gần nhất
        dateFilter = 'AND DATE(c.endDate) >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)'
        break
      case 'month':
      default:
        // 12 tháng gần nhất
        dateFilter = 'AND DATE(c.endDate) >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)'
        break
    }

    if (user.type === 'staff') {
      query = `
        SELECT 
          CASE 
            WHEN ? = 'day' THEN DATE(c.endDate)
            WHEN ? = 'week' THEN DATE(DATE_SUB(c.endDate, INTERVAL WEEKDAY(c.endDate) DAY))
            WHEN ? = 'month' THEN DATE_FORMAT(c.endDate, '%Y-%m-01')
          END as period,
          COUNT(*) as completed_count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND c.status = 'done'
        AND c.endDate IS NOT NULL
        ${dateFilter}
        GROUP BY period
        ORDER BY period ASC
      `
      params = [data.timeRange, data.timeRange, data.timeRange, data.userId]
    } else if (user.type === 'manager') {
      query = `
        SELECT 
          CASE 
            WHEN ? = 'day' THEN DATE(c.endDate)
            WHEN ? = 'week' THEN DATE(DATE_SUB(c.endDate, INTERVAL WEEKDAY(c.endDate) DAY))
            WHEN ? = 'month' THEN DATE_FORMAT(c.endDate, '%Y-%m-01')
          END as period,
          COUNT(*) as completed_count
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
        AND c.status = 'done'
        AND c.endDate IS NOT NULL
        ${dateFilter}
        GROUP BY period
        ORDER BY period ASC
      `
      params = [data.timeRange, data.timeRange, data.timeRange, data.userId, user.departmentId]
    } else if (user.type === 'boss') {
      query = `
        SELECT 
          CASE 
            WHEN ? = 'day' THEN DATE(c.endDate)
            WHEN ? = 'week' THEN DATE(DATE_SUB(c.endDate, INTERVAL WEEKDAY(c.endDate) DAY))
            WHEN ? = 'month' THEN DATE_FORMAT(c.endDate, '%Y-%m-01')
          END as period,
          COUNT(*) as completed_count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        INNER JOIN users u ON b.ownerId = u.id
        WHERE u.companyId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND c.status = 'done'
        AND c.endDate IS NOT NULL
        ${dateFilter}
        GROUP BY period
        ORDER BY period ASC
      `
      params = [data.timeRange, data.timeRange, data.timeRange, user.companyId]
    } else {
      query = `
        SELECT 
          CASE 
            WHEN ? = 'day' THEN DATE(c.endDate)
            WHEN ? = 'week' THEN DATE(DATE_SUB(c.endDate, INTERVAL WEEKDAY(c.endDate) DAY))
            WHEN ? = 'month' THEN DATE_FORMAT(c.endDate, '%Y-%m-01')
          END as period,
          COUNT(*) as completed_count
        FROM ${DASHBOARD_TABLE_NAME} c
        INNER JOIN boards b ON c.boardId = b.id
        WHERE b.ownerId = ? 
        AND b.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND c.status = 'done'
        AND c.endDate IS NOT NULL
        ${dateFilter}
        GROUP BY period
        ORDER BY period ASC
      `
      params = [data.timeRange, data.timeRange, data.timeRange, data.userId]
    }

    const result = await db.query(query, params)
    const ganttData = result[0]

    // Tạo categories và series cho biểu đồ
    const categories = ganttData.map(row => {
      const period = row.period
      if (data.timeRange === 'day') {
        return new Date(period).toLocaleDateString('vi-VN', { 
          month: 'short', 
          day: 'numeric' 
        })
      } else if (data.timeRange === 'week') {
        const date = new Date(period)
        const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)
        return `Tuần ${weekNumber} (${date.toLocaleDateString('vi-VN', { month: 'short' })})`
      } else {
        return new Date(period).toLocaleDateString('vi-VN', { 
          month: 'short', 
          year: 'numeric' 
        })
      }
    })

    const series = [{
      name: 'Công việc hoàn thành',
      data: ganttData.map(row => parseInt(row.completed_count))
    }]

    return {
      series,
      categories,
      timeRange: data.timeRange
    }
  } catch (error) {
    throw new Error(error)
  }
}

export const dashboardModel = {
  DASHBOARD_TABLE_NAME,
  getWorkStatisticsByStatus,
  getActiveMembers,
  getStatusChartData,
  getTimelineChartData,
  getMemberChartData,
  getPriorityChartData,
  getDepartmentChartData,
  getDashboardOverview,
  getGanttChartData
}
