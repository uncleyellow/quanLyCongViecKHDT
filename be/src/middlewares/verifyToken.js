import jwt from 'jsonwebtoken'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError'

const verifyToken = (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization
    if (!authHeader) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Access token is required')
    }

    // Kiểm tra format của Authorization header
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid authorization header format')
    }

    const token = parts[1]

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Thêm thông tin user vào request object
    req.user = decoded

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token'))
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Token has expired'))
    }
    next(error)
  }
}

export { verifyToken } 