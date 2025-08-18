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

    // Handle JSON fields
    if (reqBody.checklistItems !== undefined) {
      reqBody.checklistItems = JSON.stringify(reqBody.checklistItems)
    }

    const newCard = await cardModel.createNew(reqBody)
    const newCardMember = await cardMemberModel.addMemberIfNotExists(reqBody.id, reqBody.createdBy, 'member')
    return newCard
  } catch (error) { throw error }
}

const getDetail = async (reqBody) => {
  try {
    const listDetail = await cardModel.getDetail(reqBody)
    
    // Get card members if card exists
    if (listDetail && listDetail.id) {
      try {
        const members = await cardMemberModel.getCardMembers(listDetail.id)
        listDetail.members = members
      } catch (memberError) {
        console.error('Error fetching card members:', memberError)
        listDetail.members = []
      }
    }
    
    return listDetail
  } catch (error) { throw error }
}

const update = async (reqBody, reqBodyUpdate) => {
  reqBodyUpdate.archived = reqBodyUpdate.archived === true ? 1 : 0
  
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


  
  try {
    const updatedList = await cardModel.updatePartial(reqBody, reqBodyUpdate)
    return updatedList
  } catch (error) { throw error }
}





const deleteItem = async (reqBody) => {
  try {
    const deletedItem = await cardModel.deleteItem(reqBody)
    return deletedItem
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

// Helper function to evaluate a single filter against a card
const evaluateFilter = (card, filter) => {
  const { field, operator, value } = filter
  
  // Get field value from card
  let fieldValue
  switch (field) {
    case 'title':
      fieldValue = card.title
      break
    case 'description':
      fieldValue = card.description
      break
    case 'dueDate':
      fieldValue = card.dueDate
      break
    case 'status':
      fieldValue = card.status
      break
    case 'recurring':
      fieldValue = card.recurringConfig ? JSON.parse(card.recurringConfig).isRecurring : false
      break
    default:
      fieldValue = card[field]
  }
  
  // Debug logging for date fields
  if (field === 'dueDate') {
    console.log(`Field value for dueDate: ${fieldValue}, type: ${typeof fieldValue}`)
  }
  
  // Handle null/undefined field values
  if (fieldValue === null || fieldValue === undefined) {
    switch (operator) {
      case 'equals':
        return value === null || value === undefined || value === ''
      case 'not_equals':
        return value !== null && value !== undefined && value !== ''
      case 'contains':
      case 'starts_with':
      case 'ends_with':
        return false
      case 'not_contains':
        return true
      default:
        return false
    }
  }
  
  // Evaluate based on operator
  switch (operator) {
    // String operators
    case 'contains':
      return String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase())
    case 'not_contains':
      return !String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase())
    case 'equals':
      // Special handling for date fields - compare only date part
      if (field === 'dueDate') {
        if (!fieldValue || !value) return fieldValue === value
        const fieldDate = new Date(fieldValue)
        const valueDate = new Date(value)
        // Set both dates to start of day for comparison
        fieldDate.setHours(0, 0, 0, 0)
        valueDate.setHours(0, 0, 0, 0)
        return fieldDate.getTime() === valueDate.getTime()
      }
      return String(fieldValue || '').toLowerCase() === String(value || '').toLowerCase()
    case 'not_equals':
      // Special handling for date fields - compare only date part
      if (field === 'dueDate') {
        if (!fieldValue || !value) return fieldValue !== value
        const fieldDate = new Date(fieldValue)
        const valueDate = new Date(value)
        // Set both dates to start of day for comparison
        fieldDate.setHours(0, 0, 0, 0)
        valueDate.setHours(0, 0, 0, 0)
        return fieldDate.getTime() !== valueDate.getTime()
      }
      return String(fieldValue || '').toLowerCase() !== String(value || '').toLowerCase()
    case 'starts_with':
      return String(fieldValue || '').toLowerCase().startsWith(String(value || '').toLowerCase())
    case 'ends_with':
      return String(fieldValue || '').toLowerCase().endsWith(String(value || '').toLowerCase())
    
    // Number operators
    case 'greater_than':
      // Check if this is a date field
      if (field === 'dueDate') {
        if (!fieldValue || !value) return false
        const fieldDate = new Date(fieldValue)
        const valueDate = new Date(value)
        // Set both dates to start of day for comparison
        fieldDate.setHours(0, 0, 0, 0)
        valueDate.setHours(0, 0, 0, 0)
        return fieldDate > valueDate
      }
      return Number(fieldValue) > Number(value)
    case 'greater_than_or_equal':
      // Check if this is a date field
      if (field === 'dueDate') {
        if (!fieldValue || !value) return false
        const fieldDate = new Date(fieldValue)
        const valueDate = new Date(value)
        // Set both dates to start of day for comparison
        fieldDate.setHours(0, 0, 0, 0)
        valueDate.setHours(0, 0, 0, 0)
        return fieldDate >= valueDate
      }
      return Number(fieldValue) >= Number(value)
    case 'less_than':
      // Check if this is a date field
      if (field === 'dueDate') {
        if (!fieldValue || !value) return false
        const fieldDate = new Date(fieldValue)
        const valueDate = new Date(value)
        // Set both dates to start of day for comparison
        fieldDate.setHours(0, 0, 0, 0)
        valueDate.setHours(0, 0, 0, 0)
        return fieldDate < valueDate
      }
      return Number(fieldValue) < Number(value)
    case 'less_than_or_equal':
      // Check if this is a date field
      if (field === 'dueDate') {
        if (!fieldValue || !value) return false
        const fieldDate = new Date(fieldValue)
        const valueDate = new Date(value)
        // Set both dates to start of day for comparison
        fieldDate.setHours(0, 0, 0, 0)
        valueDate.setHours(0, 0, 0, 0)
        return fieldDate <= valueDate
      }
      return Number(fieldValue) <= Number(value)
    
    // Date operators (for backward compatibility)
    case 'date_greater_than':
      if (!fieldValue || !value) return false
      const fieldDate1 = new Date(fieldValue)
      const valueDate1 = new Date(value)
      fieldDate1.setHours(0, 0, 0, 0)
      valueDate1.setHours(0, 0, 0, 0)
      return fieldDate1 > valueDate1
    case 'date_greater_than_or_equal':
      if (!fieldValue || !value) return false
      const fieldDate2 = new Date(fieldValue)
      const valueDate2 = new Date(value)
      fieldDate2.setHours(0, 0, 0, 0)
      valueDate2.setHours(0, 0, 0, 0)
      return fieldDate2 >= valueDate2
    case 'date_less_than':
      if (!fieldValue || !value) return false
      const fieldDate3 = new Date(fieldValue)
      const valueDate3 = new Date(value)
      fieldDate3.setHours(0, 0, 0, 0)
      valueDate3.setHours(0, 0, 0, 0)
      return fieldDate3 < valueDate3
    case 'date_less_than_or_equal':
      if (!fieldValue || !value) return false
      const fieldDate4 = new Date(fieldValue)
      const valueDate4 = new Date(value)
      fieldDate4.setHours(0, 0, 0, 0)
      valueDate4.setHours(0, 0, 0, 0)
      return fieldDate4 <= valueDate4
    
    // Select operators
    case 'in':
      return Array.isArray(value) ? value.includes(fieldValue) : value === fieldValue
    case 'not_in':
      return Array.isArray(value) ? !value.includes(fieldValue) : value !== fieldValue
    
    default:
      return true
  }
}

const getAllUserCards = async (userId, options = {}) => {
  try {
    const { searchTerm, filters = [], page = 1, limit = 50 } = options
    
    // Get all cards first
    let cards = await cardModel.getAllUserCards(userId)
    
    // Apply search filter if provided
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      cards = cards.filter(card => {
        const titleMatch = card.title?.toLowerCase().includes(searchLower)
        const descriptionMatch = card.description?.toLowerCase().includes(searchLower)
        return titleMatch || descriptionMatch
      })
    }
    
    // Apply advanced filters if provided
    if (filters && filters.length > 0) {
      console.log('Applying filters:', JSON.stringify(filters, null, 2))
      
      // Log some sample cards for debugging
      if (cards.length > 0) {
        console.log('Sample cards dueDate values:')
        cards.slice(0, 3).forEach((card, index) => {
          console.log(`  Card ${index + 1}: dueDate = ${card.dueDate}, type = ${typeof card.dueDate}`)
        })
      }
      
      cards = cards.filter(card => {
        return filters.every(filter => {
          const result = evaluateFilter(card, filter)
          if (filter.field === 'dueDate') {
            console.log(`Date filter: ${filter.operator} ${filter.value} (type: ${typeof filter.value}), card dueDate: ${card.dueDate} (type: ${typeof card.dueDate}), result: ${result}`)
          }
          return result
        })
      })
      console.log(`After filtering: ${cards.length} cards`)
    }
    
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
    
    const sortedCards = [...incompleteCards, ...completedCards]
    
    // Apply pagination
    const total = sortedCards.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedCards = sortedCards.slice(startIndex, endIndex)
    
    return {
      cards: paginatedCards,
      total: total
    }
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
  getAllUserCards
}