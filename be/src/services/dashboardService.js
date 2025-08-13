import { dashboardModel } from '../models/dashboardModel.js'

const getWorkStatistics = async (data) => {
  try {
    const statistics = await dashboardModel.getWorkStatisticsByStatus(data)
    return statistics
  } catch (error) {
    throw new Error(error)
  }
}

export const dashboardService = {
  getWorkStatistics
}
