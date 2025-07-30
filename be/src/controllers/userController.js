import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/userService'

const getMe = async (req, res, next) => {
  try {
    console.log('req.user', req.user)
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

export const userController = {
  getMe
}