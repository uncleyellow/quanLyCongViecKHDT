import { v4 as uuidv4 } from 'uuid'
import cardTimeTrackingModel from '../models/cardTimeTrackingModel.js'
import { cardModel } from '../models/cardModel.js'
import ApiError from '../utils/ApiError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { formatDateTimeForMySQL } from '../utils/formatters.js'

const createTimeTracking = catchAsync(async (req, res) => {
    const { cardId, action, note } = req.body
    const userId = req.user?.userId || req.user?.id || 'default-user' // Fallback for testing

    if (!cardId || !action) {
        throw new ApiError(400, 'Card ID and action are required')
    }

    console.log('cardModel:', cardModel) // Debug log
    console.log('cardModel.update:', cardModel?.update) // Debug log

    const trackingData = {
        id: uuidv4(),
        cardId,
        userId,
        action,
        startTime: formatDateTimeForMySQL(new Date()),
        note: note || null
    }

    // If action is stop, calculate duration
    if (action === 'stop') {
        // Get current card to get trackingStartTime
        const card = await cardModel.getDetail({ id: cardId })
        if (card && card.trackingStartTime) {
            const endTime = new Date()
            const startTime = new Date(card.trackingStartTime)
            
            console.log('STOP DEBUG - Card trackingStartTime:', card.trackingStartTime)
            console.log('STOP DEBUG - Start time parsed:', startTime)
            console.log('STOP DEBUG - End time (now):', endTime)
            console.log('STOP DEBUG - Time difference (ms):', endTime - startTime)
            
            const duration = Math.floor((endTime - startTime) / 1000)
            trackingData.endTime = formatDateTimeForMySQL(endTime)
            trackingData.duration = duration

            // Update card's total time spent
            const newTotalTime = (card.totalTimeSpent || 0) + duration
            console.log('STOP action - Current totalTimeSpent:', card.totalTimeSpent, 'Duration:', duration, 'New total:', newTotalTime)
            await cardModel.update({ id: cardId }, { 
                totalTimeSpent: newTotalTime,
                isTracking: 0,
                trackingStartTime: null
            })
        }
    } else if (action === 'start') {
        // Update card to start tracking
        await cardModel.update({ id: cardId }, { 
            isTracking: 1,
            trackingStartTime: formatDateTimeForMySQL(new Date())
        })
    } else if (action === 'pause') {
        // Calculate duration and update card
        const card = await cardModel.getDetail({ id: cardId })
        if (card && card.trackingStartTime) {
            const pauseTime = new Date()
            const startTime = new Date(card.trackingStartTime)
            
            console.log('PAUSE DEBUG - Start time from DB:', card.trackingStartTime)
            console.log('PAUSE DEBUG - Start time parsed:', startTime)
            console.log('PAUSE DEBUG - Pause time (now):', pauseTime)
            console.log('PAUSE DEBUG - Time difference (ms):', pauseTime - startTime)
            
            const duration = Math.floor((pauseTime - startTime) / 1000)
            const newTotalTime = (card.totalTimeSpent || 0) + duration

            console.log('PAUSE action - Current totalTimeSpent:', card.totalTimeSpent, 'Duration:', duration, 'New total:', newTotalTime)

            await cardModel.update({ id: cardId }, { 
                totalTimeSpent: newTotalTime,
                isTracking: 0,
                trackingStartTime: null,
                trackingPauseTime: 0 // Reset pause time when pausing
            })

            trackingData.endTime = formatDateTimeForMySQL(pauseTime)
            trackingData.duration = duration
        }
    } else if (action === 'resume') {
        // Update card to resume tracking
        await cardModel.update({ id: cardId }, { 
            isTracking: 1,
            trackingStartTime: formatDateTimeForMySQL(new Date()),
            trackingPauseTime: 0 // Reset pause time when resuming
        })
    }

    const newTracking = await cardTimeTrackingModel.createNew(trackingData)
    res.status(201).json({
        status: 'success',
        data: {
            id: newTracking,
            ...trackingData
        }
    })
})

const getTimeTrackingHistory = catchAsync(async (req, res) => {
    const { cardId } = req.params

    if (!cardId) {
        throw new ApiError(400, 'Card ID is required')
    }

    const history = await cardTimeTrackingModel.getList({ cardId })
    res.status(200).json({
        status: 'success',
        data: history
    })
})

const getCardTimeSummary = catchAsync(async (req, res) => {
    const { cardId } = req.params

    if (!cardId) {
        throw new ApiError(400, 'Card ID is required')
    }

    const card = await cardModel.getDetail({ id: cardId })
    if (!card) {
        throw new ApiError(404, 'Card not found')
    }

    const history = await cardTimeTrackingModel.getList({ cardId })
    
    // Calculate current session time if tracking
    let currentSessionTime = 0
    if (card.isTracking && card.trackingStartTime) {
        const now = new Date()
        currentSessionTime = Math.floor((now - new Date(card.trackingStartTime)) / 1000)
    }

    res.status(200).json({
        status: 'success',
        data: {
            totalTimeSpent: card.totalTimeSpent || 0,
            isTracking: card.isTracking || 0,
            trackingStartTime: card.trackingStartTime,
            trackingPauseTime: card.trackingPauseTime || 0,
            currentSessionTime,
            history
        }
    })
})

const resetTotalTime = catchAsync(async (req, res) => {
    const { cardId } = req.params

    if (!cardId) {
        throw new ApiError(400, 'Card ID is required')
    }

    // Reset totalTimeSpent to 0
    await cardModel.update({ id: cardId }, { 
        totalTimeSpent: 0,
        isTracking: 0,
        trackingStartTime: null,
        trackingPauseTime: 0
    })

    res.status(200).json({
        status: 'success',
        message: 'Total time reset successfully'
    })
})

export const cardTimeTrackingController = {
    createTimeTracking,
    getTimeTrackingHistory,
    getCardTimeSummary,
    resetTotalTime
}

export default cardTimeTrackingController
