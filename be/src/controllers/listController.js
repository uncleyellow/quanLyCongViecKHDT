import { StatusCodes } from 'http-status-codes'
import { listService } from '../services/listService'

const getList = async (req, res, next) => {
    try {
        const { userId } = req.user
        const listData = await listService.getList({ ...req.query, userId: userId })
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
        const newList = await listService.createNew({ ...req.body, createdBy: userId })
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
        const listDetail = await listService.getDetail({ ...req.params, userId: userId })
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
        const updatedList = await listService.update({ ...req.params, userId: userId }, { ...req.body, updatedBy: userId })
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
        const updatedList = await listService.updatePartial({ ...req.params, userId: userId }, { ...req.body, updatedBy: userId })
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
        const deletedList = await listService.deleteItem({ ...req.params, userId: userId })
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
        const lists = await listService.getListsByBoard(boardId)
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
        const result = await listService.updateCardOrder(listId, cardOrderIds)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Card order updated successfully',
            data: result
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

export const listController = {
    getList,
    createNew,
    getDetail,
    update,
    updatePartial,
    deleteItem,
    getListsByBoard,
    updateCardOrder
}