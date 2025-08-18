import { dashboardModel } from '../models/dashboardModel.js'

const getWorkStatistics = async (data) => {
  try {
    const statistics = await dashboardModel.getWorkStatisticsByStatus(data)
    return statistics
  } catch (error) {
    throw new Error(error)
  }
}

const getActiveMembers = async (data) => {
  try {
    const members = await dashboardModel.getActiveMembers(data)
    return members
  } catch (error) {
    throw new Error(error)
  }
}

// Thêm các service mới cho biểu đồ
const getStatusChartData = async (data) => {
  try {
    const chartData = await dashboardModel.getStatusChartData(data)
    return chartData
  } catch (error) {
    throw new Error(error)
  }
}

const getTimelineChartData = async (data) => {
  try {
    const chartData = await dashboardModel.getTimelineChartData(data)
    return chartData
  } catch (error) {
    throw new Error(error)
  }
}

const getMemberChartData = async (data) => {
  try {
    const chartData = await dashboardModel.getMemberChartData(data)
    return chartData
  } catch (error) {
    throw new Error(error)
  }
}

const getPriorityChartData = async (data) => {
  try {
    const chartData = await dashboardModel.getPriorityChartData(data)
    return chartData
  } catch (error) {
    throw new Error(error)
  }
}

const getDepartmentChartData = async (data) => {
  try {
    const chartData = await dashboardModel.getDepartmentChartData(data)
    return chartData
  } catch (error) {
    throw new Error(error)
  }
}

const getDashboardOverview = async (data) => {
  try {
    const overview = await dashboardModel.getDashboardOverview(data)
    return overview
  } catch (error) {
    throw new Error(error)
  }
}

const getGanttChartData = async (data) => {
  try {
    const ganttData = await dashboardModel.getGanttChartData(data)
    return ganttData
  } catch (error) {
    throw new Error(error)
  }
}

export const dashboardService = {
  getWorkStatistics,
  getActiveMembers,
  getStatusChartData,
  getTimelineChartData,
  getMemberChartData,
  getPriorityChartData,
  getDepartmentChartData,
  getDashboardOverview,
  getGanttChartData
}
