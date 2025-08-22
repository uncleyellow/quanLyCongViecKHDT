import express from 'express'
import { cronController } from '../../controllers/cronController.js'
import { verifyToken } from '../../middlewares/verifyToken.js'

const router = express.Router()

// Apply authentication middleware to all routes
router.use(verifyToken)

// GET /api/v1/cron/status - Get cron job status
router.get('/status', cronController.getCronStatus)

// POST /api/v1/cron/trigger-recurring-cards - Manually trigger recurring card duplication
router.post('/trigger-recurring-cards', cronController.triggerRecurringCardDuplication)

export default router
