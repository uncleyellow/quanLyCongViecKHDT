import { StatusCodes } from 'http-status-codes'
import { authService } from '../services/authService'

const createNew = async (req, res, next) => {
  try {
    // console.log('req.body: ', req.body)
    // console.log('req.query: ', req.query)
    // console.log('req.params: ', req.params)
    // console.log('req.file: ', req.file)
    // console.log('req.cookies: ', req.cookies)
    // console.log('req.jwtDecoded: ', req.jwtDecoded)

    // Điều hướng dữ liệu sang tầng Service
    const createUser = await authService.createNew(req.body)
    const responseObject = {
      code: StatusCodes.CREATED,
      status: 'success',
      message: 'User created successfully',
      data: createUser
    }
    // Có kết quả thì trả về phía Client
    res.status(StatusCodes.CREATED).json(responseObject)
  } catch (error) { next(error) }
}

const login = async (req, res, next) => {
  try {
    const loginUser = await authService.login(req.body)
    const responseObject = {
      code: StatusCodes.OK,
      status: 'success',
      message: 'Login successfully',
      data: loginUser
    }
    res.status(StatusCodes.OK).json(responseObject)
  } catch (error) { next(error) }
}

// const getDetails = async (req, res, next) => {
//     try {
//         const boardId = req.params.id
//         const board = await boardService.getDetails(boardId)
//         res.status(StatusCodes.OK).json(board)
//     } catch (error) { next(error) }
// }

// const update = async (req, res, next) => {
//     try {
//         const boardId = req.params.id
//         const updatedBoard = await boardService.update(boardId, req.body)
//         res.status(StatusCodes.OK).json(updatedBoard)
//     } catch (error) { next(error) }
// }

export const authController = {
  createNew,
  login
  // getDetails,
  // update
}