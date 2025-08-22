import { cronService } from '../services/cronService.js'
import { ApiError } from '../utils/ApiError.js'
import { StatusCodes } from 'http-status-codes'

const triggerRecurringCardDuplication = async (req, res, next) => {
    try {
        // Check if user has admin privileges (you can modify this based on your auth system)
        if (!req.user || req.user.type !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Access denied. Admin privileges required.')
        }

        // Manually trigger the recurring card duplication
        await cronService.triggerManualDuplication()

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Recurring card duplication triggered successfully',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        next(error)
    }
}

const getCronStatus = async (req, res, next) => {
    try {
        // Check if user has admin privileges
        if (!req.user || req.user.type !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Access denied. Admin privileges required.')
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                isInitialized: cronService.isInitialized,
                nextRun: 'Daily at 8:00 AM (Asia/Ho_Chi_Minh timezone)',
                description: 'Recurring card duplication for boards with isRecurring: true'
            }
        })
    } catch (error) {
        next(error)
    }
}

export const cronController = {
    triggerRecurringCardDuplication,
    getCronStatus
}
