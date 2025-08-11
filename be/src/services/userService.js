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

export const userService = {
  getMe,
  changePassword,
  updateBoardOrder,
  updateCardOrder
}