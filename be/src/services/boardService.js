/* eslint-disable no-useless-catch */
import { boardModel } from '../models/boardModel'
import { listService } from './listService'
import { cardModel } from '../models/cardModel'
import { boardMemberModel } from '../models/boardMemberModel'

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
    if (boardDetail && boardDetail.id) {
      // Parse listOrderIds từ JSON string nếu cần
      let listOrderIds = boardDetail.listOrderIds
      if (typeof listOrderIds === 'string') {
        try {
          listOrderIds = JSON.parse(listOrderIds)
        } catch (error) {
          listOrderIds = []
        }
      }

      // Lấy danh sách các list thuộc board này
      let lists = await listService.getList({ boardId: boardDetail.id })

      // Với mỗi list, lấy danh sách card trong list đó
      if (lists && lists.length > 0) {
        // Import cardService ở đầu file nếu cần, hoặc require tại đây nếu chưa có
        // Để tránh require lặp lại, import ở đầu file: import { cardModel } from '../models/cardModel'
        // Nhưng ở đây sẽ require trực tiếp để tránh lỗi nếu chưa import
        // Lấy cards cho từng list song song và thêm thông tin board members cho mỗi card
        lists = await Promise.all(
          lists.map(async (list) => {
            const cards = await cardModel.getList({ boardId: boardDetail.id, listId: list.id })

            // Thêm thông tin board members cho mỗi card
            const cardsWithMembers = await Promise.all(
              cards.map(async (card) => {
                // Lấy danh sách board members
                const boardMembers = await boardMemberModel.getBoardMembers(boardDetail.id)

                return {
                  ...card,
                  members: boardMembers || []
                }
              })
            )

            return { ...list, cards: cardsWithMembers }
          })
        )
      }

      // Sắp xếp lists theo listOrderIds
      if (listOrderIds && Array.isArray(listOrderIds) && lists.length > 0) {
        const listMap = new Map(lists.map(list => [list.id, list]))
        const sortedLists = []
        listOrderIds.forEach(listId => {
          if (listMap.has(listId)) {
            sortedLists.push(listMap.get(listId))
            listMap.delete(listId)
          }
        })
        // Thêm các list còn lại (nếu có) vào cuối
        listMap.forEach(list => {
          sortedLists.push(list)
        })
        boardDetail.lists = sortedLists
      } else {
        boardDetail.lists = lists
      }

      // Cập nhật lại listOrderIds đã parse
      boardDetail.listOrderIds = listOrderIds
    }
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

const reorder = async (reqBody, reorderData) => {
  try {
    const reorderedBoard = await boardModel.reorder(reqBody, reorderData)

    // Lấy danh sách lists đã được sắp xếp theo thứ tự mới
    if (reorderedBoard && reorderedBoard.id) {
      // Parse listOrderIds từ JSON string nếu cần
      let listOrderIds = reorderedBoard.listOrderIds
      if (typeof listOrderIds === 'string') {
        try {
          listOrderIds = JSON.parse(listOrderIds)
        } catch (error) {
          listOrderIds = []
        }
      }

      const lists = await listService.getList({ boardId: reorderedBoard.id })

      // Lấy cards cho từng list và thêm thông tin board members
      if (lists && lists.length > 0) {
        const listsWithCards = await Promise.all(
          lists.map(async (list) => {
            const cards = await cardModel.getList({ boardId: reorderedBoard.id, listId: list.id })

            // Thêm thông tin board members cho mỗi card
            const cardsWithMembers = await Promise.all(
              cards.map(async (card) => {
                // Lấy danh sách board members
                const boardMembers = await boardMemberModel.getBoardMembers(reorderedBoard.id)

                return {
                  ...card,
                  boardMembers: boardMembers || []
                }
              })
            )

            return { ...list, cards: cardsWithMembers }
          })
        )

        // Sắp xếp lists theo listOrderIds mới
        if (listOrderIds && Array.isArray(listOrderIds) && listsWithCards.length > 0) {
          const listMap = new Map(listsWithCards.map(list => [list.id, list]))

          const sortedLists = []
          listOrderIds.forEach(listId => {
            if (listMap.has(listId)) {
              sortedLists.push(listMap.get(listId))
              listMap.delete(listId)
            }
          })

          // Thêm các list còn lại vào cuối
          listMap.forEach(list => {
            sortedLists.push(list)
          })

          reorderedBoard.lists = sortedLists
        } else {
          reorderedBoard.lists = listsWithCards
        }
      } else {
        reorderedBoard.lists = lists
      }

      // Cập nhật lại listOrderIds đã parse
      reorderedBoard.listOrderIds = listOrderIds
    }

    return reorderedBoard
  } catch (error) { throw error }
}

export const boardService = {
  getList,
  createNew,
  getDetail,
  update,
  updatePartial,
  deleteItem,
  reorder
}