import { StatusCodes } from 'http-status-codes'
import { boardService } from '../services/boardService'

const getList = async (req, res, next) => {
    try {
        const { userId } = req.user
        const boardList = await boardService.getList({ ...req.query, user_id: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Board list fetched successfully',
            pagination: {
                total: boardList.length,
                page: req.query.page || 1,
                limit: req.query.limit || 10
            },
            data: boardList
        }
        // Có kết quả thì trả về phía Client
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const createNew = async (req, res, next) => {
    try {
        const { userId } = req.user
        const newBoard = await boardService.createNew({ ...req.body, user_id: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Board created successfully',
            data: newBoard
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const getDetail = async (req, res, next) => {
    try {
        const { userId } = req.user
        const boardDetail = await boardService.getDetail({ ...req.params, user_id: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Board detail fetched successfully',
            data: boardDetail
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const update = async (req, res, next) => {
    try {
        const { userId } = req.user
        const updatedBoard = await boardService.update({ ...req.params, user_id: userId }, req.body)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Board updated successfully',
            data: updatedBoard
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const updatePartial = async (req, res, next) => {
    try {
        const { userId } = req.user
        const updatedBoard = await boardService.updatePartial({ ...req.params, user_id: userId }, req.body)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Board updated successfully',
            data: updatedBoard
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const deleteItem = async (req, res, next) => {
    try {
        const { userId } = req.user
        const deletedBoard = await boardService.delete({ ...req.params, user_id: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Board deleted successfully',
            data: deletedBoard
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

export const boardController = {
    getList,
    createNew,
    getDetail,
    update,
    updatePartial,
    deleteItem
}