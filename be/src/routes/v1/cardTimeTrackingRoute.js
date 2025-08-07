import express from 'express'
import { cardTimeTrackingController } from '../../controllers/cardTimeTrackingController'
import { verifyToken } from '../../middlewares/verifyToken'

// Debug logs
console.log('cardTimeTrackingController:', cardTimeTrackingController)
console.log('createTimeTracking:', cardTimeTrackingController?.createTimeTracking)
console.log('verifyToken:', verifyToken)

const router = express.Router()

// Create time tracking record
router.post('/tracking', verifyToken, cardTimeTrackingController.createTimeTracking)

// Get time tracking history for a card
router.get('/tracking/:cardId/history', verifyToken, cardTimeTrackingController.getTimeTrackingHistory)

// Get card time summary
router.get('/tracking/:cardId/summary', verifyToken, cardTimeTrackingController.getCardTimeSummary)

// Reset total time for a card
router.post('/tracking/:cardId/reset', verifyToken, cardTimeTrackingController.resetTotalTime)

export default router
