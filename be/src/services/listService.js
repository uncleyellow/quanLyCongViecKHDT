/* eslint-disable no-useless-catch */
import { listModel } from '../models/listModel'
import { v4 as uuidv4 } from 'uuid'

const getList = async (reqBody) => {
  try {
    const listData = await listModel.getList(reqBody)
    return listData
  } catch (error) {
    throw error
  }
}

const createNew = async (reqBody) => {
  try {
    reqBody.id = uuidv4()
    const newList = await listModel.createNew(reqBody)
    return newList
  } catch (error) { throw error }
}

const getDetail = async (reqBody) => {
  try {
    const listDetail = await listModel.getDetail(reqBody)
    return listDetail
  } catch (error) { throw error }
}

const update = async (reqBody, reqBodyUpdate) => {
  reqBodyUpdate.archived = reqBodyUpdate.archived === true ? 1 : 0
  reqBodyUpdate.cardOrderIds = JSON.stringify(reqBodyUpdate.cardOrderIds)
  try {
    const updatedList = await listModel.update(reqBody, reqBodyUpdate)
    return updatedList
  } catch (error) { throw error }
}

const updatePartial = async (reqBody, reqBodyUpdate) => {
  try {
    const updatedList = await listModel.updatePartial(reqBody, reqBodyUpdate)
    return updatedList
  } catch (error) { throw error }
}

const deleteItem = async (reqBody) => {
  try {
    const deletedList = await listModel.deleteItem(reqBody)
    return deletedList
  } catch (error) { throw error }
}

const getListsByBoard = async (boardId) => {
  try {
    const lists = await listModel.getListsByBoard(boardId)
    return lists
  } catch (error) { throw error }
}

const reorder = async (reqBody, reorderData) => {
  try {
    const reorderedList = await listModel.reorder(reqBody, reorderData)
    return reorderedList
  } catch (error) { throw error }
}

const pushCardOrderIds = async (card) => {
  try {
    const result = await listModel.pushCardOrderIds(card)
    return result
  } catch (error) { throw error }
}

export const listService = {
  getList,
  createNew,
  getDetail,
  update,
  updatePartial,
  deleteItem,
  getListsByBoard,
  reorder,
  pushCardOrderIds
}