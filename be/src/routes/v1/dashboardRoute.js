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

export default router
