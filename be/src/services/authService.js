/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { userModel } from '../models/userModel'
import ApiError from '../utils/ApiError'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

const createNew = async (reqBody) => {
  try {
    // Xử lý logic dữ liệu tùy đặc thù dự án
    const newUser = {
      ...reqBody,
      id: uuidv4()
    }

    // Hash password before saving to database
    newUser.passwordHash = crypto.createHash('sha256').update(newUser.password).digest('hex')
    delete newUser.password // Remove plain password from object

    // Gọi tới tằng Model để xử lý lưu bản ghi newBoard vào trong Database
    const createdUser = await userModel.createNew(newUser)

    // Lấy bản ghi board vừa tạo ra để trả về cho tầng controller
    const getNewUser = await userModel.findOneById(createdUser[0].insertId)
    delete getNewUser.passwordHash
    const token = jwt.sign({ userId: getNewUser.id }, process.env.JWT_SECRET, { expiresIn: '14d' })
    return { ...getNewUser, token }
  } catch (error) {
    throw error
  }
}

const login = async (reqBody) => {
  try {
    const { email, password } = reqBody
    const user = await userModel.getUserByEmail(email)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    // Hash password before comparing with database
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
    const isPasswordCorrect = user.passwordHash === hashedPassword
    if (!isPasswordCorrect) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized: Invalid credentials')

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '14d' })

    delete user.passwordHash
    return { ...user, token }
  } catch (error) { throw error }
}

// const getDetails = async (boardId) => {
//   try {
//     const board = await boardModel.getDetails(boardId)
//     if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found')

//     const resBoard = cloneDeep(board)
//     // Đưa card về đúng column của nó
//     resBoard.columns.forEach(column => {
//       column.cards = board.cards.filter(card => card.columnId.toString() === column._id.toString())
//     })

//     delete resBoard.cards

//     return resBoard
//   } catch (error) { throw error }
// }

// const update = async (boardId, reqBody) => {
//   try {
//     const updateBoard = {
//       ...reqBody,
//       updatedAt: Date.now()
//     }
//     const updatedBoard = await boardModel.getDetails(boardId, updateBoard)

//     return updatedBoard
//   } catch (error) { throw error }
// }

export const authService = {
  createNew,
  login
  // getDetails,
  // update
}