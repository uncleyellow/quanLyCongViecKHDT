/* eslint-disable no-useless-catch */
import { cardModel } from '../models/cardModel'
import { userModel } from '../models/userModel'
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
  // Only process checklistItems if it exists
  if (reqBodyUpdate.checklistItems !== undefined) {
    reqBodyUpdate.checklistItems = JSON.stringify(reqBodyUpdate.checklistItems)
  }

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
  if (reqBodyUpdate.trackingStartTime) {
    reqBodyUpdate.trackingStartTime = formatDateTimeForMySQL(reqBodyUpdate.trackingStartTime)
  }

  // Only process labels if it exists
  if (reqBodyUpdate.labels !== undefined) {
    reqBodyUpdate.labels = JSON.stringify(reqBodyUpdate.labels)
  }

  // Handle metadata field
  if (reqBodyUpdate.metadata !== undefined) {
    reqBodyUpdate.metadata = JSON.stringify(reqBodyUpdate.metadata)
  }
  
  try {
    const updatedList = await cardModel.updatePartial(reqBody, reqBodyUpdate)
    return updatedList
  } catch (error) { throw error }
}

// Add custom field to card metadata
const addCustomField = async (cardId, fieldName, fieldValue, fieldType = 'string') => {
  try {
    // Get current card data
    const card = await cardModel.getDetail({ id: cardId })
    if (!card) {
      throw new Error('Card not found')
    }

    // Parse existing metadata or create new
    let metadata = {}
    if (card.metadata) {
      try {
        metadata = typeof card.metadata === 'string' ? JSON.parse(card.metadata) : card.metadata
      } catch (e) {
        metadata = {}
      }
    }

    // Add new field to metadata
    metadata[fieldName] = {
      value: fieldValue,
      type: fieldType,
      createdAt: new Date().toISOString()
    }

    // Update card with new metadata
    const updateData = { metadata: JSON.stringify(metadata) }
    const updatedCard = await cardModel.updatePartial({ id: cardId }, updateData)
    return updatedCard
  } catch (error) { throw error }
}

// Update custom field in card metadata
const updateCustomField = async (cardId, fieldName, fieldValue) => {
  try {
    // Get current card data
    const card = await cardModel.getDetail({ id: cardId })
    if (!card) {
      throw new Error('Card not found')
    }

    // Parse existing metadata
    let metadata = {}
    if (card.metadata) {
      try {
        metadata = typeof card.metadata === 'string' ? JSON.parse(card.metadata) : card.metadata
      } catch (e) {
        metadata = {}
      }
    }

    // Check if field exists
    if (!metadata[fieldName]) {
      throw new Error('Custom field not found')
    }

    // Update field value
    metadata[fieldName].value = fieldValue
    metadata[fieldName].updatedAt = new Date().toISOString()

    // Update card with new metadata
    const updateData = { metadata: JSON.stringify(metadata) }
    const updatedCard = await cardModel.updatePartial({ id: cardId }, updateData)
    return updatedCard
  } catch (error) { throw error }
}

// Remove custom field from card metadata
const removeCustomField = async (cardId, fieldName) => {
  try {
    // Get current card data
    const card = await cardModel.getDetail({ id: cardId })
    if (!card) {
      throw new Error('Card not found')
    }

    // Parse existing metadata
    let metadata = {}
    if (card.metadata) {
      try {
        metadata = typeof card.metadata === 'string' ? JSON.parse(card.metadata) : card.metadata
      } catch (e) {
        metadata = {}
      }
    }

    // Check if field exists
    if (!metadata[fieldName]) {
      throw new Error('Custom field not found')
    }

    // Remove field
    delete metadata[fieldName]

    // Update card with new metadata
    const updateData = { metadata: JSON.stringify(metadata) }
    const updatedCard = await cardModel.updatePartial({ id: cardId }, updateData)
    return updatedCard
  } catch (error) { throw error }
}

// Get all custom fields from card metadata
const getCustomFields = async (cardId) => {
  try {
    const card = await cardModel.getDetail({ id: cardId })
    if (!card) {
      throw new Error('Card not found')
    }

    // Parse metadata
    let metadata = {}
    if (card.metadata) {
      try {
        metadata = typeof card.metadata === 'string' ? JSON.parse(card.metadata) : card.metadata
      } catch (e) {
        metadata = {}
      }
    }

    return metadata
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

const getAllUserCards = async (userId) => {
  try {
    const cards = await cardModel.getAllUserCards(userId)
    
    // Get user's card order preference
    const user = await userModel.findOneById(userId)
    let cardOrderIds = []
    
    if (user?.cardOrderIds) {
      try {
        // Handle both string and array formats
        if (typeof user.cardOrderIds === 'string') {
          cardOrderIds = JSON.parse(user.cardOrderIds)
        } else if (Array.isArray(user.cardOrderIds)) {
          cardOrderIds = user.cardOrderIds
        } else {
          cardOrderIds = []
        }
      } catch (parseError) {
        console.error('Error parsing cardOrderIds:', parseError)
        console.log('cardOrderIds value:', user.cardOrderIds)
        cardOrderIds = []
      }
    }
    
    // Process each card to format data properly
    const processedCards = cards.map(card => {
      // Parse JSON fields if they exist
      if (card.checklistItems && typeof card.checklistItems === 'string') {
        try {
          card.checklistItems = JSON.parse(card.checklistItems)
        } catch (e) {
          console.error(`Error parsing checklistItems for card ${card.id}:`, e)
          card.checklistItems = []
        }
      } else if (card.checklistItems === null || card.checklistItems === undefined) {
        card.checklistItems = []
      } else if (Array.isArray(card.checklistItems)) {
        // If it's already an array, keep it as is
      } else if (typeof card.checklistItems === 'object') {
        // If it's an object but not an array, try to convert it to array
        try {
          card.checklistItems = Object.values(card.checklistItems)
        } catch (e) {
          console.error(`Error converting checklistItems object to array for card ${card.id}:`, e)
          card.checklistItems = []
        }
      } else {
        console.error(`Card ${card.id} - checklistItems has unexpected type:`, typeof card.checklistItems, card.checklistItems)
        card.checklistItems = []
      }

      if (card.labels && typeof card.labels === 'string') {
        try {
          card.labels = JSON.parse(card.labels)
        } catch (e) {
          card.labels = []
        }
      } else {
        card.labels = []
      }

      if (card.members && typeof card.members === 'string') {
        try {
          card.members = JSON.parse(card.members)
        } catch (e) {
          card.members = []
        }
      } else {
        card.members = []
      }

      // Parse metadata if it exists
      if (card.metadata && typeof card.metadata === 'string') {
        try {
          card.metadata = JSON.parse(card.metadata)
        } catch (e) {
          card.metadata = {}
        }
      } else if (!card.metadata) {
        card.metadata = {}
      }

      return card
    })

    // Sort cards according to user's preferred order and completion status
    if (cardOrderIds.length > 0) {
      const cardMap = new Map(processedCards.map(card => [card.id, card]))
      const orderedCards = []
      const completedCards = []
      
      // Add cards in the order specified by cardOrderIds
      cardOrderIds.forEach(cardId => {
        if (cardMap.has(cardId)) {
          const card = cardMap.get(cardId)
          // Check if card is completed
          if (card.status === 'completed') {
            completedCards.push(card)
          } else {
            orderedCards.push(card)
          }
          cardMap.delete(cardId)
        }
      })
      
              // Add any remaining cards that weren't in the order list
        cardMap.forEach(card => {
          if (card.status === 'completed') {
            completedCards.push(card)
          } else {
            orderedCards.push(card)
          }
        })
      
      // Return ordered cards first, then completed cards at the end
      return [...orderedCards, ...completedCards]
    }

    // If no custom order, sort by completion status
    const incompleteCards = processedCards.filter(card => 
      card.status !== 'completed'
    )
    const completedCards = processedCards.filter(card => 
      card.status === 'completed'
    )
    
    return [...incompleteCards, ...completedCards]
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
  pushCardOrderIds,
  getAllUserCards,
  addCustomField,
  updateCustomField,
  removeCustomField,
  getCustomFields
}