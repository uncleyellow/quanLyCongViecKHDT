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

export default router
