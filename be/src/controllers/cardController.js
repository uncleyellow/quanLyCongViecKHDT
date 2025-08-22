import { StatusCodes } from 'http-status-codes'
import { cardService } from '../services/cardService'
import { cardMemberModel } from '../models/cardMemberModel'
import { boardMemberModel } from '../models/boardMemberModel'
import { cardModel } from '../models/cardModel'

// Helper function to get board ID from card
const getBoardIdFromCard = async (cardId) => {
    try {
        const card = await cardModel.getDetail({ id: cardId })
        return card ? card.boardId : null
    } catch (error) {
        console.error('Error getting board ID from card:', error)
        return null
    }
}

// Helper function to add members to board if they don't exist
const addMembersToBoard = async (boardId, members) => {
    if (!boardId || !members || !Array.isArray(members)) {
        return
    }
    
    try {
        for (const member of members) {
            if (member.id || member.memberId) {
                const memberId = member.id || member.memberId
                const role = member.role || 'member'
                
                // Check if member already exists in board
                const isMemberOfBoard = await boardMemberModel.isMemberOfBoard(boardId, memberId)
                if (!isMemberOfBoard) {
                    console.log('Adding member to board:', memberId, 'with role:', role, 'to board:', boardId)
                    await boardMemberModel.addMemberIfNotExists(boardId, memberId, role)
                } else {
                    console.log('Member already exists in board:', memberId, 'board:', boardId)
                }
            }
        }
    } catch (error) {
        console.error('Error adding members to board:', error)
        // Don't fail the entire operation if board member addition fails
    }
}

const getList = async (req, res, next) => {
    try {
        const { userId } = req.user
        const listData = await cardService.getList({ ...req.query, userId: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'List fetched successfully',
            pagination: {
                total: listData.length,
                page: req.query.page || 1,
                limit: req.query.limit || 10
            },
            data: listData
        }
        // Có kết quả thì trả về phía Client
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const createNew = async (req, res, next) => {
    try {
        const { userId } = req.user
        
        // Filter out fields that don't exist in database
        const { labels, members, metadata, ...validFields } = req.body
        
        const newCard = await cardService.createNew({ ...validFields, createdBy: userId })
        
        // Handle members separately if provided
        if (members && Array.isArray(members) && newCard && newCard.id) {
            try {
                console.log('Processing members for new card:', newCard.id, 'Members:', members);
                
                // Get board ID for this card
                const boardId = newCard.boardId;
                
                // Add new members to card
                for (const member of members) {
                    if (member.id || member.memberId) {
                        const memberId = member.id || member.memberId;
                        const role = member.role || 'member';
                        
                        console.log('Adding member to new card:', memberId, 'with role:', role, 'to card:', newCard.id);
                        await cardMemberModel.addMemberIfNotExists(newCard.id, memberId, role);
                    }
                }
                
                // Also add members to the board
                await addMembersToBoard(boardId, members);
                
                console.log('Card members added successfully for new card:', newCard.id);
            } catch (memberError) {
                console.error('Error adding card members:', memberError);
                // Don't fail the entire creation if member addition fails
            }
        }
        
        const responseObject = {
            code: StatusCodes.CREATED,
            status: 'success',
            message: 'Card created successfully',
            data: newCard
        }
        res.status(StatusCodes.CREATED).json(responseObject)
    } catch (error) { next(error) }
}

const getDetail = async (req, res, next) => {
    try {
        const { userId } = req.user
        const listDetail = await cardService.getDetail({ ...req.params, userId: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'List detail fetched successfully',
            data: listDetail
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const update = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { id } = req.params
        
        // Filter out fields that don't exist in database
        const { labels, members, metadata, ...validFields } = req.body
        
        const updatedList = await cardService.update({ ...req.params, userId: userId }, { ...validFields, updatedBy: userId })
        
        // Handle members separately if provided
        if (members && Array.isArray(members)) {
            try {
                console.log('Processing members for card:', id, 'Members:', members);
                
                // Get board ID for this card
                const boardId = await getBoardIdFromCard(id);
                
                // Clear existing members for this card
                await cardMemberModel.removeAllCardMembers(id);
                console.log('Cleared existing members for card:', id);
                
                // Add new members to card
                for (const member of members) {
                    if (member.id || member.memberId) {
                        const memberId = member.id || member.memberId;
                        const role = member.role || 'member';
                        
                        console.log('Adding member:', memberId, 'with role:', role, 'to card:', id);
                        await cardMemberModel.addMemberIfNotExists(id, memberId, role);
                    }
                }
                
                // Also add members to the board
                await addMembersToBoard(boardId, members);
                
                console.log('Card members updated successfully for card:', id);
            } catch (memberError) {
                console.error('Error updating card members:', memberError);
                // Don't fail the entire update if member update fails
            }
        }
        
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Card updated successfully',
            data: updatedList
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const updatePartial = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { id } = req.params
        
        // Filter out fields that don't exist in database
        const { labels, members, metadata, ...validFields } = req.body
        
        const updatedList = await cardService.updatePartial({ ...req.params, userId: userId }, { ...validFields, updatedBy: userId })
        
        // Handle members separately if provided
        if (members && Array.isArray(members)) {
            try {
                console.log('Processing members for card (partial update):', id, 'Members:', members);
                
                // Get board ID for this card
                const boardId = await getBoardIdFromCard(id);
                
                // Clear existing members for this card
                await cardMemberModel.removeAllCardMembers(id);
                console.log('Cleared existing members for card (partial update):', id);
                
                // Add new members to card
                for (const member of members) {
                    if (member.id || member.memberId) {
                        const memberId = member.id || member.memberId;
                        const role = member.role || 'member';
                        
                        console.log('Adding member (partial update):', memberId, 'with role:', role, 'to card:', id);
                        await cardMemberModel.addMemberIfNotExists(id, memberId, role);
                    }
                }
                
                // Also add members to the board
                await addMembersToBoard(boardId, members);
                
                console.log('Card members updated successfully for card (partial update):', id);
            } catch (memberError) {
                console.error('Error updating card members (partial update):', memberError);
                // Don't fail the entire update if member update fails
            }
        }
        
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Card updated successfully',
            data: updatedList
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const deleteItem = async (req, res, next) => {
    try {
        const { userId } = req.user
        const deletedList = await cardService.deleteItem({ ...req.params, userId: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'List deleted successfully',
            data: deletedList
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const getListsByBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params
        const lists = await cardService.getListsByBoard(boardId)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Lists by board fetched successfully',
            data: lists
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const updateCardOrder = async (req, res, next) => {
    try {
        const { listId } = req.params
        const { cardOrderIds } = req.body
        const result = await cardService.updateCardOrder(listId, cardOrderIds)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Card order updated successfully',
            data: result
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const getAllUserCards = async (req, res, next) => {
    try {
        const { userId } = req.user
        
        // Extract filter parameters from query
        const {
            searchTerm,
            filters,
            page = 1,
            limit = 50
        } = req.query
        
        // Parse filters if provided
        let parsedFilters = []
        if (filters) {
            try {
                parsedFilters = JSON.parse(filters)
            } catch (error) {
                console.error('Error parsing filters:', error)
                parsedFilters = []
            }
        }
        
        const result = await cardService.getAllUserCards(userId, {
            searchTerm,
            filters: parsedFilters,
            page: parseInt(page),
            limit: parseInt(limit)
        })
        
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'User cards fetched successfully',
            pagination: {
                total: result.total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(result.total / parseInt(limit))
            },
            data: result.cards
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const getCardMembers = async (req, res, next) => {
    try {
        const { cardId } = req.params
        const members = await cardMemberModel.getCardMembers(cardId)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Card members fetched successfully',
            data: members
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

// Add custom field to card metadata
const addCustomField = async (req, res, next) => {
    try {
        const { cardId } = req.params
        const { fieldName, fieldValue, fieldType = 'string' } = req.body
        
        if (!fieldName || fieldValue === undefined) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                code: StatusCodes.BAD_REQUEST,
                status: 'error',
                message: 'fieldName and fieldValue are required'
            })
        }

        const updatedCard = await cardService.addCustomField(cardId, fieldName, fieldValue, fieldType)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Custom field added successfully',
            data: updatedCard
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

// Update custom field in card metadata
const updateCustomField = async (req, res, next) => {
    try {
        const { cardId, fieldName } = req.params
        const { fieldValue } = req.body
        
        if (fieldValue === undefined) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                code: StatusCodes.BAD_REQUEST,
                status: 'error',
                message: 'fieldValue is required'
            })
        }

        const updatedCard = await cardService.updateCustomField(cardId, fieldName, fieldValue)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Custom field updated successfully',
            data: updatedCard
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

// Remove custom field from card metadata
const removeCustomField = async (req, res, next) => {
    try {
        const { cardId, fieldName } = req.params
        
        const updatedCard = await cardService.removeCustomField(cardId, fieldName)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Custom field removed successfully',
            data: updatedCard
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

// Get all custom fields from card metadata
const getCustomFields = async (req, res, next) => {
    try {
        const { cardId } = req.params
        
        const customFields = await cardService.getCustomFields(cardId)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Custom fields fetched successfully',
            data: customFields
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

export const cardController = {
    getList,
    createNew,
    getDetail,
    update,
    updatePartial,
    deleteItem,
    getListsByBoard,
    updateCardOrder,
    getAllUserCards,
    getCardMembers,
    addCustomField,
    updateCustomField,
    removeCustomField,
    getCustomFields
}