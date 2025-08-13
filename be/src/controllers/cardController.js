import { StatusCodes } from 'http-status-codes'
import { cardService } from '../services/cardService'

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
        const newList = await cardService.createNew({ ...req.body, createdBy: userId })
        const responseObject = {
            code: StatusCodes.CREATED,
            status: 'success',
            message: 'List created successfully',
            data: newList
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
        const updatedList = await cardService.update({ ...req.params, userId: userId }, { ...req.body, updatedBy: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'List updated successfully',
            data: updatedList
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const updatePartial = async (req, res, next) => {
    try {
        const { userId } = req.user
        const updatedList = await cardService.updatePartial({ ...req.params, userId: userId }, { ...req.body, updatedBy: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'List updated successfully',
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
        const cards = await cardService.getAllUserCards(userId)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'User cards fetched successfully',
            pagination: {
                total: cards.length,
                page: 1,
                limit: cards.length
            },
            data: cards
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
    addCustomField,
    updateCustomField,
    removeCustomField,
    getCustomFields
}