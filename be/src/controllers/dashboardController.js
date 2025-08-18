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

// Thêm các controller mới cho biểu đồ
const getChartData = async (req, res, next) => {
  try {
    const { userId } = req.user
    const { chartType, timeRange = 'month' } = req.query
    
    let chartData
    switch (chartType) {
      case 'status':
        chartData = await dashboardService.getStatusChartData({ userId, timeRange })
        break
      case 'timeline':
        chartData = await dashboardService.getTimelineChartData({ userId, timeRange })
        break
      case 'member':
        chartData = await dashboardService.getMemberChartData({ userId, timeRange })
        break
      case 'priority':
        chartData = await dashboardService.getPriorityChartData({ userId, timeRange })
        break
      case 'department':
        chartData = await dashboardService.getDepartmentChartData({ userId, timeRange })
        break
      default:
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: StatusCodes.BAD_REQUEST,
          status: 'error',
          message: 'Invalid chart type'
        })
    }
    
    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: 'Chart data retrieved successfully',
      data: chartData
    }
    
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) {
    next(error)
  }
}

const getDashboardOverview = async (req, res, next) => {
  try {
    const { userId } = req.user
    const overview = await dashboardService.getDashboardOverview({ userId })
    
    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: 'Dashboard overview retrieved successfully',
      data: overview
    }
    
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) {
    next(error)
  }
}

const getGanttChartData = async (req, res, next) => {
  try {
    const { userId } = req.user
    const { timeRange = 'month' } = req.query
    
    const ganttData = await dashboardService.getGanttChartData({ userId, timeRange })
    
    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: 'Gantt chart data retrieved successfully',
      data: ganttData
    }
    
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) {
    next(error)
  }
}

export const dashboardController = {
  getWorkStatistics,
  getActiveMembers,
  getChartData,
  getDashboardOverview,
  getGanttChartData
}
