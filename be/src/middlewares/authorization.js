import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError'

// Middleware kiểm tra quyền truy cập resource
const checkResourceAccess = (resourceUserId) => {
  return (req, res, next) => {
    try {
      const currentUserId = req.user.userId
      const targetUserId = resourceUserId(req)

      if (currentUserId !== targetUserId) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Access denied: You can only access your own resources')
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Middleware kiểm tra quyền admin (có thể mở rộng sau)
const requireAdmin = (req, res, next) => {
  try {
    // Có thể thêm logic kiểm tra role admin ở đây
    // Ví dụ: if (req.user.role !== 'admin') throw new ApiError(StatusCodes.FORBIDDEN, 'Admin access required')
    
    next()
  } catch (error) {
    next(error)
  }
}

export { checkResourceAccess, requireAdmin } 