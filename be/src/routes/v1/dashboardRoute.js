import express from 'express'
import { dashboardController } from '../../controllers/dashboardController.js'
import { verifyToken } from '../../middlewares/verifyToken.js'

const router = express.Router()

/**
 * @swagger
 * /api/v1/dashboard/work-statistics:
 *   get:
 *     summary: Get work statistics by status
 *     description: Retrieve work statistics grouped by status (todo, inProgress, done, overdue) for the authenticated user
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Work statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Work statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     todo:
 *                       type: integer
 *                       description: Number of tasks with todo status
 *                       example: 5
 *                     inProgress:
 *                       type: integer
 *                       description: Number of tasks with inProgress status
 *                       example: 3
 *                     done:
 *                       type: integer
 *                       description: Number of tasks with done status
 *                       example: 12
 *                     overdue:
 *                       type: integer
 *                       description: Number of tasks that are overdue (past due date and not done)
 *                       example: 2
 *                     total:
 *                       type: integer
 *                       description: Total number of tasks
 *                       example: 22
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/work-statistics', verifyToken, dashboardController.getWorkStatistics)

/**
 * @swagger
 * /api/v1/dashboard/active-members:
 *   get:
 *     summary: Get active members with their task statistics
 *     description: Retrieve list of all members who are currently participating in tasks, with their task statistics by status
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Active members retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: User ID
 *                         example: "04c0e666-6f53-11f0-be72-089798dd3038"
 *                       name:
 *                         type: string
 *                         description: User full name
 *                         example: "Nguyễn Văn A"
 *                       email:
 *                         type: string
 *                         format: email
 *                         description: User email
 *                         example: "user@example.com"
 *                       avatar:
 *                         type: string
 *                         nullable: true
 *                         description: User avatar URL
 *                         example: "https://example.com/avatar.jpg"
 *                       userType:
 *                         type: string
 *                         description: User role type
 *                         example: "staff"
 *                       totalTasks:
 *                         type: integer
 *                         description: Total number of tasks assigned to this member
 *                         example: 15
 *                       todoTasks:
 *                         type: integer
 *                         description: Number of todo tasks
 *                         example: 5
 *                       inProgressTasks:
 *                         type: integer
 *                         description: Number of in-progress tasks
 *                         example: 3
 *                       doneTasks:
 *                         type: integer
 *                         description: Number of completed tasks
 *                         example: 7
 *                       overdueTasks:
 *                         type: integer
 *                         description: Number of overdue tasks
 *                         example: 2
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/active-members', verifyToken, dashboardController.getActiveMembers)

/**
 * @swagger
 * /api/v1/dashboard/chart-data:
 *   get:
 *     summary: Get chart data for different chart types
 *     description: Retrieve chart data based on chart type and time range
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chartType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [status, timeline, member, priority, department]
 *         description: Type of chart data to retrieve
 *       - in: query
 *         name: timeRange
 *         required: false
 *         schema:
 *           type: string
 *           enum: [week, month, quarter]
 *           default: month
 *         description: Time range for the chart data
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Chart data retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     series:
 *                       type: array
 *                       description: Chart series data
 *                     labels:
 *                       type: array
 *                       description: Chart labels
 *                     categories:
 *                       type: array
 *                       description: Chart categories (for timeline charts)
 *       400:
 *         description: Bad request - Invalid chart type
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/chart-data', verifyToken, dashboardController.getChartData)

/**
 * @swagger
 * /api/v1/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview statistics
 *     description: Retrieve comprehensive dashboard overview including total boards, cards, members, completion rate, and recent activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Dashboard overview retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalBoards:
 *                       type: integer
 *                       description: Total number of boards
 *                       example: 5
 *                     totalCards:
 *                       type: integer
 *                       description: Total number of cards/tasks
 *                       example: 25
 *                     totalMembers:
 *                       type: integer
 *                       description: Total number of members
 *                       example: 12
 *                     completionRate:
 *                       type: integer
 *                       description: Task completion rate percentage
 *                       example: 75
 *                     recentActivity:
 *                       type: array
 *                       description: Recent card activities
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             description: Card title
 *                           status:
 *                             type: string
 *                             description: Card status
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Last update time
 *                           updatedBy:
 *                             type: string
 *                             description: Name of user who updated the card
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/overview', verifyToken, dashboardController.getDashboardOverview)

router.get('/gantt-chart', verifyToken, dashboardController.getGanttChartData)

/**
 * @swagger
 * /api/v1/dashboard/gantt-chart:
 *   get:
 *     summary: Get Gantt chart data for completed tasks
 *     description: Retrieve data for Gantt chart showing completed tasks over time (day/week/month)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: month
 *         description: Time range for the chart data
 *         example: month
 *     responses:
 *       200:
 *         description: Gantt chart data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Gantt chart data retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     series:
 *                       type: array
 *                       description: Chart series data
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Series name
 *                             example: Công việc hoàn thành
 *                           data:
 *                             type: array
 *                             description: Data points
 *                             items:
 *                               type: integer
 *                               example: 5
 *                     categories:
 *                       type: array
 *                       description: Chart categories (time periods)
 *                       items:
 *                         type: string
 *                         example: Tháng 1 2024
 *                     timeRange:
 *                       type: string
 *                       description: Selected time range
 *                       example: month
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

export default router
