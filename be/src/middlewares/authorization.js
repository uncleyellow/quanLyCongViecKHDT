import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError'
import { userModel } from '../models/userModel'
import { userRoleModel } from '../models/userRoleModel'

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

// Middleware kiểm tra quyền admin
const requireAdmin = async (req, res, next) => {
  try {
    const { userId } = req.user
    
    // Query database để lấy thông tin user
    const user = await userModel.findOneById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    console.log('User type:', user.type)
    
    if (user.type !== 'admin') {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Admin access required')
    }
    
    next()
  } catch (error) {
    next(error)
  }
}

// Middleware kiểm tra permission cụ thể
const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      const { userId } = req.user
      
      // Kiểm tra user có permission không
      const hasPermission = await userRoleModel.hasPermission(userId, permissionName)
      
      if (!hasPermission) {
        throw new ApiError(StatusCodes.FORBIDDEN, `Permission '${permissionName}' required`)
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

export { checkResourceAccess, requireAdmin, requirePermission } 