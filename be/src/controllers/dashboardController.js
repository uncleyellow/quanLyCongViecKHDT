import { StatusCodes } from 'http-status-codes'
import { dashboardService } from '../services/dashboardService.js'

const getWorkStatistics = async (req, res, next) => {
  try {
    const { userId } = req.user
    const statistics = await dashboardService.getWorkStatistics({ userId })
    
    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: 'Work statistics retrieved successfully',
      data: statistics
    }
    
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) {
    next(error)
  }
}

const getActiveMembers = async (req, res, next) => {
  try {
    const { userId } = req.user
    const members = await dashboardService.getActiveMembers({ userId })
    
    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: 'Active members retrieved successfully',
      data: members
    }
    
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) {
    next(error)
  }
}

export const dashboardController = {
  getWorkStatistics,
  getActiveMembers
}
