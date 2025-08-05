/* eslint-disable no-useless-catch */
import { cardModel } from '../models/cardModel'
import { v4 as uuidv4 } from 'uuid'
import { formatDateTimeForMySQL } from '../utils/formatters'
import { boardMemberModel } from '../models/boardMemberModel'
import { cardMemberModel } from '../models/cardMemberModel'

const getList = async (reqBody) => {
  try {
    const listData = await cardModel.getList(reqBody)
    return listData
  } catch (error) {
    throw error
  }
}

const createNew = async (reqBody) => {
  try {
    reqBody.id = uuidv4()

    // Format datetime fields for MySQL
    if (reqBody.dueDate) {
      reqBody.dueDate = formatDateTimeForMySQL(reqBody.dueDate)
    }
    if (reqBody.startDate) {
      reqBody.startDate = formatDateTimeForMySQL(reqBody.startDate)
    }
    if (reqBody.endDate) {
      reqBody.endDate = formatDateTimeForMySQL(reqBody.endDate)
    }

    const newCard = await cardModel.createNew(reqBody)
    const newCardMember = await cardMemberModel.addMemberIfNotExists(reqBody.id, reqBody.createdBy, 'member')
    return newCard
  } catch (error) { throw error }
}

const getDetail = async (reqBody) => {
  try {
    const listDetail = await cardModel.getDetail(reqBody)
    return listDetail
  } catch (error) { throw error }
}

const update = async (reqBody, reqBodyUpdate) => {
  reqBodyUpdate.archived = reqBodyUpdate.archived === true ? 1 : 0
  reqBodyUpdate.checklistItems = JSON.stringify(reqBodyUpdate.checklistItems)
  // Format datetime fields for MySQL
  if (reqBodyUpdate.dueDate) {
    reqBodyUpdate.dueDate = formatDateTimeForMySQL(reqBodyUpdate.dueDate)
  }
  if (reqBodyUpdate.startDate) {
    reqBodyUpdate.startDate = formatDateTimeForMySQL(reqBodyUpdate.startDate)
  }
  if (reqBodyUpdate.endDate) {
    reqBodyUpdate.endDate = formatDateTimeForMySQL(reqBodyUpdate.endDate)
  }
  const labels = JSON.stringify(reqBodyUpdate.labels)
  delete reqBodyUpdate.labels
  // Xử lý danh sách members
  const members = reqBodyUpdate.members
  delete reqBodyUpdate.members

  const newMembers = members.map(member => ({
    cardId: reqBody.id,
    memberId: member.memberId,
    role: 'member'
  }))

  // Sử dụng hàm mới để kiểm tra trước khi thêm
  const newCardMember = await cardMemberModel.addMembersIfNotExists(newMembers)
  try {
    const updatedList = await cardModel.update(reqBody, reqBodyUpdate)
    return updatedList
  } catch (error) { throw error }
}

const updatePartial = async (reqBody, reqBodyUpdate) => {
  reqBodyUpdate.checklistItems = JSON.stringify(reqBodyUpdate.checklistItems)

  // Format datetime fields for MySQL
  if (reqBodyUpdate.dueDate) {
    reqBodyUpdate.dueDate = formatDateTimeForMySQL(reqBodyUpdate.dueDate)
  }
  if (reqBodyUpdate.startDate) {
    reqBodyUpdate.startDate = formatDateTimeForMySQL(reqBodyUpdate.startDate)
  }
  if (reqBodyUpdate.endDate) {
    reqBodyUpdate.endDate = formatDateTimeForMySQL(reqBodyUpdate.endDate)
  }

  const labels = JSON.stringify(reqBodyUpdate.labels)
  delete reqBodyUpdate.labels
  try {
    const updatedList = await cardModel.updatePartial(reqBody, reqBodyUpdate)
    return updatedList
  } catch (error) { throw error }
}

const deleteItem = async (reqBody) => {
  try {
    const deletedList = await cardModel.deleteList(reqBody)
    return deletedList
  } catch (error) { throw error }
}

const getListsByBoard = async (boardId) => {
  try {
    const lists = await cardModel.getListsByBoard(boardId)
    return lists
  } catch (error) { throw error }
}

const updateCardOrder = async (listId, cardOrderIds) => {
  try {
    const result = await cardModel.updateCardOrder(listId, cardOrderIds)
    return result
  } catch (error) { throw error }
}

const pushCardOrderIds = async (card) => {
  try {
    const result = await cardModel.pushCardOrderIds(card)
    return result
  } catch (error) { throw error }
}

export const cardService = {
  getList,
  createNew,
  getDetail,
  update,
  updatePartial,
  deleteItem,
  getListsByBoard,
  updateCardOrder,
  pushCardOrderIds
}