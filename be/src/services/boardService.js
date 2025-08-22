/* eslint-disable no-useless-catch */
import { boardModel } from '../models/boardModel'
import { listService } from './listService'
import { cardModel } from '../models/cardModel'
import { cardMemberModel } from '../models/cardMemberModel'
import { v4 as uuidv4 } from 'uuid'
import { userModel } from '../models/userModel'
import db from '../config/db.js'


const getList = async (reqBody) => {
  try {
    const boardList = await boardModel.getList(reqBody)

    // Lấy thông tin user để biết boardOrderIds
    const user = await userModel.findOneById(reqBody.userId)

    if (user && user.boardOrderIds) {
      // Parse boardOrderIds từ JSON string nếu cần
      let boardOrderIds = user.boardOrderIds
      if (typeof boardOrderIds === 'string') {
        try {
          boardOrderIds = JSON.parse(boardOrderIds)
        } catch (error) {
          boardOrderIds = []
        }
      }

      // Sắp xếp board theo boardOrderIds
      if (boardOrderIds && Array.isArray(boardOrderIds) && boardList.length > 0) {
        const boardMap = new Map(boardList.map(board => [board.id, board]))
        const sortedBoards = []
        boardOrderIds.forEach(boardId => {
          if (boardMap.has(boardId)) {
            sortedBoards.push(boardMap.get(boardId))
            boardMap.delete(boardId)
          }
        })
        // Thêm các board còn lại (nếu có) vào cuối
        boardMap.forEach(board => {
          sortedBoards.push(board)
        })
        return sortedBoards
      }
    }

    return boardList
  } catch (error) {
    throw error
  }
}

const createNew = async (reqBody) => {
  try {
    reqBody.id = uuidv4()
    reqBody.createdBy = reqBody.userId
    reqBody.updatedBy = reqBody.userId
    reqBody.ownerId = reqBody.userId
    delete reqBody.userId
    const newBoard = await boardModel.createNew(reqBody)
    return newBoard
  } catch (error) { throw error }
}

const filterAssignedCards = async (cards, userId) => {
  try {
    // Lấy tất cả cardId mà user này được gán (từ bảng cardmembers)
    const assignedCardIdsQuery = `
      SELECT DISTINCT cardId 
      FROM cardmembers 
      WHERE memberId = ?
    `
    const assignedCardIdsResult = await db.query(assignedCardIdsQuery, [userId])
    const assignedCardIds = assignedCardIdsResult[0].map(row => row.cardId)

    if (assignedCardIds.length === 0) {
      return []
    }

    // Lấy chi tiết từng card được gán cho user
    const assignedCards = []

    for (const cardId of assignedCardIds) {
      // Lấy thông tin chi tiết của card
      const cardDetailQuery = `
        SELECT c.*, 
               b.title as boardTitle,
               l.title as listTitle,
               l.color as listColor
        FROM cards c
        LEFT JOIN boards b ON c.boardId = b.id
        LEFT JOIN lists l ON c.listId = l.id
        WHERE c.id = ? AND c.archived = 0 AND c.deletedAt IS NULL
      `
      const cardDetailResult = await db.query(cardDetailQuery, [cardId])
      const cardDetail = cardDetailResult[0][0]

      if (cardDetail) {
        // Kiểm tra xem user có phải là owner của card này không
        const isCurrentUserOwner = cardDetail.createdBy === userId

        // Chỉ thêm card nếu user KHÔNG phải là owner (người khác giao cho user)
        if (!isCurrentUserOwner) {
          // Lấy thông tin members của card
          const cardMembersQuery = `
            SELECT cm.*, u.name, u.email, u.avatar
            FROM cardmembers cm
            LEFT JOIN users u ON cm.memberId = u.id
            WHERE cm.cardId = ?
          `
          const cardMembersResult = await db.query(cardMembersQuery, [cardId])
          const cardMembers = cardMembersResult[0]

          // Tạo card với thông tin đầy đủ
          const enrichedCard = {
            ...cardDetail,
            members: cardMembers || [],
            // Thêm thông tin về người giao việc
            assignedBy: cardDetail.createdBy,
            assignedByInfo: cardMembers.find(member => member.memberId === cardDetail.createdBy) || null
          }

          assignedCards.push(enrichedCard)
        }
      }
    }

    return assignedCards
  } catch (error) {
    console.error('Error filtering assigned cards:', error)
    return [] // Return empty array if filtering fails
  }
}

const getAssignedCardsFromOtherBoards = async (userId, currentBoardId) => {
  try {
    console.log('=== DEBUG: getAssignedCardsFromOtherBoards called ===')
    console.log('userId:', userId)
    console.log('currentBoardId:', currentBoardId)

    // Lấy tất cả cards mà user này là member nhưng không phải owner
    const allAssignedCards = await cardModel.getAssignedCardsByUser(userId)
    console.log('=== DEBUG: allAssignedCards ===', allAssignedCards)

    // Filter chỉ lấy cards từ board khác (không phải board hiện tại)
    const assignedCardsFromOtherBoards = []

    for (const card of allAssignedCards) {
      console.log('=== DEBUG: Processing card ===', card.id, 'boardId:', card.boardId, 'currentBoardId:', currentBoardId)
      if (card.boardId !== currentBoardId) {
        console.log('=== DEBUG: Card is from different board, enriching ===')
        // Lấy thông tin board của card này
        const cardBoard = await boardModel.getDetail({ id: card.boardId })

        // Lấy thông tin list của card này
        const cardList = await listService.getDetail({ id: card.listId })

        // Lấy thông tin members của card
        const cardMembers = await cardMemberModel.getCardMembers(card.id)

        // Tạo card với thông tin đầy đủ
        const enrichedCard = {
          ...card,
          members: cardMembers || [],
          boardTitle: cardBoard?.title || 'Unknown Board',
          listTitle: cardList?.title || 'Unknown List',
          // Thêm prefix để phân biệt với card của board hiện tại
          title: `[${cardBoard?.title || 'Other'}] ${card.title}`,
          description: card.description ? `[${cardBoard?.title || 'Other'}] ${card.description}` : card.description
        }

        assignedCardsFromOtherBoards.push(enrichedCard)
        console.log('=== DEBUG: Enriched card added ===', enrichedCard.title)
      } else {
        console.log('=== DEBUG: Card is from same board, skipping ===')
      }
    }

    console.log('=== DEBUG: Final assignedCardsFromOtherBoards ===', assignedCardsFromOtherBoards)
    return assignedCardsFromOtherBoards
  } catch (error) {
    console.error('Error getting assigned cards from other boards:', error)
    return []
  }
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
            let cards = await cardModel.getList({ boardId: boardDetail.id, listId: list.id })

            // Thêm thông tin board members cho mỗi card
            const cardsWithMembers = await Promise.all(
              cards.map(async (card) => {
                // Lấy danh sách board members
                const cardMembers = await cardMemberModel.getCardMembers(card.id)

                return {
                  ...card,
                  members: cardMembers || []
                }
              })
            )

            // If this is an assigned task board, filter cards where current user is a member but not the owner
            if (boardDetail.isAssigned && reqBody.userId) {
              cards = await filterAssignedCards(cardsWithMembers, reqBody.userId)
            } else {
              cards = cardsWithMembers
            }

            return { ...list, cards: cards }
          })
        )
      }

      // Nếu có userId, thêm các card được giao từ các board khác
      console.log('=== DEBUG: Checking for assigned cards from other boards ===')
      console.log('reqBody.userId:', reqBody.userId)
      console.log('boardDetail.id:', boardDetail.id)

      if (reqBody.userId) {
        console.log('=== DEBUG: UserId exists, getting assigned cards ===')
        const assignedCardsFromOtherBoards = await getAssignedCardsFromOtherBoards(reqBody.userId, boardDetail.id)
        console.log('=== DEBUG: Assigned cards from other boards ===', assignedCardsFromOtherBoards)

        // Tạo một list ảo để chứa các card được giao từ board khác
        if (assignedCardsFromOtherBoards.length > 0) {
          console.log('=== DEBUG: Creating assigned list ===')
          const assignedList = {
            id: 'assigned-from-other-boards',
            title: 'Công việc được giao từ board khác',
            color: '#4CAF50',
            boardId: boardDetail.id,
            position: 999999, // Đặt ở cuối
            archived: false,
            cardOrderIds: [],
            cards: assignedCardsFromOtherBoards
          }

          lists.push(assignedList)
          console.log('=== DEBUG: Assigned list added ===')
        } else {
          console.log('=== DEBUG: No assigned cards found ===')
        }
      } else {
        console.log('=== DEBUG: No userId provided ===')
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
                const cardMembers = await cardMemberModel.getCardMembers(card.id)

                return {
                  ...card,
                  members: cardMembers || []
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

const updateViewConfig = async (reqBody, reqBodyUpdate) => {
  try {
    const updatedBoard = await boardModel.updateViewConfig(reqBody, reqBodyUpdate)

    // Return complete board data with lists and cards like getDetail method
    if (updatedBoard && updatedBoard.id) {
      // Parse listOrderIds từ JSON string nếu cần
      let listOrderIds = updatedBoard.listOrderIds
      if (typeof listOrderIds === 'string') {
        try {
          listOrderIds = JSON.parse(listOrderIds)
        } catch (error) {
          listOrderIds = []
        }
      }

      // Lấy danh sách các list thuộc board này
      let lists = await listService.getList({ boardId: updatedBoard.id })

      // Với mỗi list, lấy danh sách card trong list đó
      if (lists && lists.length > 0) {
        // Lấy cards cho từng list song song và thêm thông tin board members cho mỗi card
        lists = await Promise.all(
          lists.map(async (list) => {
            const cards = await cardModel.getList({ boardId: updatedBoard.id, listId: list.id })

            // Thêm thông tin board members cho mỗi card
            const cardsWithMembers = await Promise.all(
              cards.map(async (card) => {
                // Lấy danh sách board members
                const cardMembers = await cardMemberModel.getCardMembers(card.id)
                return {
                  ...card,
                  members: cardMembers || []
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
        updatedBoard.lists = sortedLists
      } else {
        updatedBoard.lists = lists
      }

      // Cập nhật lại listOrderIds đã parse
      updatedBoard.listOrderIds = listOrderIds
    }

    return updatedBoard
  } catch (error) { throw error }
}

const updateRecurringConfig = async (reqBody, reqBodyUpdate) => {
  try {
    const updatedBoard = await boardModel.updateRecurringConfig(reqBody, reqBodyUpdate)

    // Return complete board data with lists and cards like getDetail method
    if (updatedBoard && updatedBoard.id) {
      // Parse listOrderIds từ JSON string nếu cần
      let listOrderIds = updatedBoard.listOrderIds
      if (typeof listOrderIds === 'string') {
        try {
          listOrderIds = JSON.parse(listOrderIds)
        } catch (error) {
          listOrderIds = []
        }
      }

      // Lấy danh sách các list thuộc board này
      let lists = await listService.getList({ boardId: updatedBoard.id })

      // Với mỗi list, lấy danh sách card trong list đó
      if (lists && lists.length > 0) {
        // Lấy cards cho từng list song song và thêm thông tin board members cho mỗi card
        lists = await Promise.all(
          lists.map(async (list) => {
            const cards = await cardModel.getList({ boardId: updatedBoard.id, listId: list.id })

            // Thêm thông tin board members cho mỗi card
            const cardsWithMembers = await Promise.all(
              cards.map(async (card) => {
                // Lấy danh sách board members
                const cardMembers = await cardMemberModel.getCardMembers(card.id)
                return {
                  ...card,
                  members: cardMembers || []
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
        updatedBoard.lists = sortedLists
      } else {
        updatedBoard.lists = lists
      }

      // Cập nhật lại listOrderIds đã parse
      updatedBoard.listOrderIds = listOrderIds
    }

    return updatedBoard
  } catch (error) { throw error }
}

const updateAssignedConfig = async (reqBody, reqBodyUpdate) => {
  try {
    const updatedBoard = await boardModel.updateAssignedConfig(reqBody, reqBodyUpdate)

    // Return complete board data with lists and cards like getDetail method
    if (updatedBoard && updatedBoard.id) {
      // Parse listOrderIds từ JSON string nếu cần
      let listOrderIds = updatedBoard.listOrderIds
      if (typeof listOrderIds === 'string') {
        try {
          listOrderIds = JSON.parse(listOrderIds)
        } catch (error) {
          listOrderIds = []
        }
      }

      // Lấy danh sách các list thuộc board này
      let lists = await listService.getList({ boardId: updatedBoard.id })

      // Với mỗi list, lấy danh sách card trong list đó
      if (lists && lists.length > 0) {
        // Lấy cards cho từng list song song và thêm thông tin board members cho mỗi card
        lists = await Promise.all(
          lists.map(async (list) => {
            const cards = await cardModel.getList({ boardId: updatedBoard.id, listId: list.id })

            // Thêm thông tin board members cho mỗi card
            const cardsWithMembers = await Promise.all(
              cards.map(async (card) => {
                // Lấy danh sách board members
                const cardMembers = await cardMemberModel.getCardMembers(card.id)
                return {
                  ...card,
                  members: cardMembers || []
                }
              })
            )

            // Filter assigned cards if board is assigned task board
            let filteredCards = cardsWithMembers
            if (updatedBoard.isAssigned) {
              filteredCards = await filterAssignedCards(cardsWithMembers, reqBody.userId)
            }

            return { ...list, cards: filteredCards }
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
        updatedBoard.lists = sortedLists
      } else {
        updatedBoard.lists = lists
      }

      // Cập nhật lại listOrderIds đã parse
      updatedBoard.listOrderIds = listOrderIds
    }

    return updatedBoard
  } catch (error) { throw error }
}

export const boardService = {
  getList,
  createNew,
  getDetail,
  update,
  updatePartial,
  deleteItem,
  reorder,
  updateViewConfig,
  updateRecurringConfig,
  updateAssignedConfig
}