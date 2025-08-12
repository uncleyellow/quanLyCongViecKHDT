/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { userModel } from '../models/userModel'
import ApiError from '../utils/ApiError'
import crypto from 'crypto'

const getMe = async (id) => {
  const user = await userModel.findOneById(id)
  delete user.passwordHash
  return user
}

const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Lấy thông tin user hiện tại
    const user = await userModel.findOneById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    // Hash mật khẩu hiện tại để so sánh
    const currentPasswordHash = crypto.createHash('sha256').update(currentPassword).digest('hex')

    // Kiểm tra mật khẩu hiện tại có đúng không
    if (user.passwordHash !== currentPasswordHash) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Current password is incorrect')
    }

    // Hash mật khẩu mới
    const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex')

    // Cập nhật mật khẩu mới và đánh dấu đã thay đổi
    await userModel.changePassword(userId, newPasswordHash)

    return { message: 'Password changed successfully' }
  } catch (error) {
    throw error
  }
}

const updateBoardOrder = async (userId, boardOrderIds) => {
  try {
    // Cập nhật thứ tự board cho user
    await userModel.updateBoardOrder(userId, boardOrderIds)
    
    return { message: 'Board order updated successfully' }
  } catch (error) {
    throw error
  }
}

const updateCardOrder = async (userId, cardOrderIds) => {
  try {
    // Cập nhật thứ tự card cho user
    await userModel.updateCardOrder(userId, cardOrderIds)
    
    return { message: 'Card order updated successfully' }
  } catch (error) {
    throw error
  }
}

const getAllUsers = async (data) => {
  try {
    const result = await userModel.getAllUsers(data)
    
    // Remove sensitive fields from response
    const sanitizedData = result.data.map(user => {
      const { passwordHash, ...sanitizedUser } = user
      return sanitizedUser
    })
    
    return {
      data: sanitizedData,
      pagination: result.pagination
    }
  } catch (error) { throw error }
}

const updateUser = async (userId, updateData) => {
  try {
    // Check if user exists
    const existingUser = await userModel.findOneById(userId)
    if (!existingUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    // Update user
    const result = await userModel.update(userId, updateData)
    
    // Get updated user data
    const updatedUser = await userModel.findOneById(userId)
    const { passwordHash, ...sanitizedUser } = updatedUser
    
    return sanitizedUser
  } catch (error) { throw error }
}

const deleteUser = async (userId) => {
  try {
    // Check if user exists
    const existingUser = await userModel.findOneById(userId)
    if (!existingUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    // Soft delete user
    const result = await userModel.deleteUser(userId)
    
    return { message: 'User deleted successfully' }
  } catch (error) { throw error }
}

const getUserById = async (userId) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    const { passwordHash, ...sanitizedUser } = user
    return sanitizedUser
  } catch (error) { throw error }
}

const createUser = async (userData) => {
  try {
    // Check if email already exists
    const existingUser = await userModel.getUserByEmail(userData.email)
    if (existingUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists')
    }

    // Hash password if provided
    if (userData.password) {
      const passwordHash = crypto.createHash('sha256').update(userData.password).digest('hex')
      userData.passwordHash = passwordHash
      delete userData.password
    }

    // Generate UUID for user ID
    const { v4: uuidv4 } = await import('uuid')
    userData.id = uuidv4()

    // Handle optional fields
    if (userData.departmentId === '') userData.departmentId = null
    if (userData.companyId === '') userData.companyId = null

    // Create user
    const result = await userModel.createNew(userData)
    
    // Get created user data with company and department names
    const createdUser = await userModel.findOneById(userData.id)
    const { passwordHash, ...sanitizedUser } = createdUser
    
    return sanitizedUser
  } catch (error) { throw error }
}

export const userService = {
  getMe,
  changePassword,
  updateBoardOrder,
  updateCardOrder,
  getAllUsers,
  updateUser,
  deleteUser,
  getUserById,
  createUser
}