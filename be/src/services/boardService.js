/* eslint-disable no-useless-catch */
import { boardModel } from '../models/boardModel'


const getList = async (reqBody) => {
  try {
    const boardList = await boardModel.getList(reqBody)
    return boardList
  } catch (error) {
    throw error
  }
}

const createNew = async (reqBody) => {
  try {
    const newBoard = await boardModel.createNew(reqBody)
    return newBoard
  } catch (error) { throw error }
}

const getDetail = async (reqBody) => {
  try {
    const boardDetail = await boardModel.getDetail(reqBody)
    return boardDetail
  } catch (error) { throw error }
}

const update = async (reqBody, reqBodyUpdate) => {
  try {
    const updatedBoard = await boardModel.update(reqBody, reqBodyUpdate)
    return updatedBoard
  } catch (error) { throw error }
}

const updatePartial = async (reqBody, reqBodyUpdate) => {
  try {
    const updatedBoard = await boardModel.updatePartial(reqBody, reqBodyUpdate)
    return updatedBoard
  } catch (error) { throw error }
}

const deleteItem = async (reqBody) => {
  try {
    const deletedBoard = await boardModel.deleteBoard(reqBody)
    return deletedBoard
  } catch (error) { throw error }
}

export const boardService = {
  getList,
  createNew,
  getDetail,
  update,
  updatePartial,
  deleteItem
}