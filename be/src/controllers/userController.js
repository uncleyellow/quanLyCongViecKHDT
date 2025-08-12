import { StatusCodes } from 'http-status-codes'
import { userService } from '../services/userService'
import { userValidation } from '../validations/userValidation'

const getMe = async (req, res, next) => {
  try {
    const { userId } = req.user
    const user = await userService.getMe(userId)
    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: 'User fetched successfully',
      data: user
    }
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) { next(error) }
}

const changePassword = async (req, res, next) => {
  try {
    const { userId } = req.user
    const { currentPassword, newPassword } = req.body

    // Validate input
    const { error } = userValidation.changePasswordSchema.validate(req.body)
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        code: StatusCodes.BAD_REQUEST,
        status: 'error',
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      })
    }

    const result = await userService.changePassword(userId, currentPassword, newPassword)

    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: result.message,
      data: null
    }
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) { next(error) }
}

const checkPasswordChangeRequired = async (req, res, next) => {
  try {
    const { userId } = req.user
    const user = await userService.getMe(userId)

    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: 'Password change status checked successfully',
      data: {
        mustChangePassword: user.mustChangePassword || false
      }
    }
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) { next(error) }
}

const updateBoardOrder = async (req, res, next) => {
  try {
    const { userId } = req.user
    const { boardOrderIds } = req.body

    // Validate input
    if (!boardOrderIds || !Array.isArray(boardOrderIds)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        code: StatusCodes.BAD_REQUEST,
        status: 'error',
        message: 'boardOrderIds must be an array'
      })
    }

    const result = await userService.updateBoardOrder(userId, boardOrderIds)

    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: 'Board order updated successfully',
      data: result
    }
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) { next(error) }
}

const updateCardOrder = async (req, res, next) => {
  try {
    const { userId } = req.user
    const { cardOrderIds } = req.body

    // Validate input
    if (!cardOrderIds || !Array.isArray(cardOrderIds)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        code: StatusCodes.BAD_REQUEST,
        status: 'error',
        message: 'cardOrderIds must be an array'
      })
    }

    const result = await userService.updateCardOrder(userId, cardOrderIds)

    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: 'Card order updated successfully',
      data: result
    }
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) { next(error) }
}

const getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers(req.query)
    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: 'Users retrieved successfully',
      pagination: result.pagination,
      data: result.data
    }
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) { next(error) }
}

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await userService.getUserById(id)
    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: 'User retrieved successfully',
      data: user
    }
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) { next(error) }
}

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body
    const updatedUser = await userService.updateUser(id, updateData)
    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: 'User updated successfully',
      data: updatedUser
    }
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) { next(error) }
}

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await userService.deleteUser(id)
    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: result.message,
      data: null
    }
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) { next(error) }
}

const createUser = async (req, res, next) => {
  try {
    const userData = req.body
    const createdUser = await userService.createUser(userData)
    const responseObject = {
      code: StatusCodes.CREATED,
      status: 'success',
      message: 'User created successfully',
      data: createdUser
    }
    res.status(StatusCodes.CREATED).json(responseObject)
  } catch (error) { next(error) }
}

export const userController = {
  getMe,
  changePassword,
  checkPasswordChangeRequired,
  updateBoardOrder,
  updateCardOrder,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser
}