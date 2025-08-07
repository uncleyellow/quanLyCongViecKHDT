import { StatusCodes } from 'http-status-codes'
import { boardService } from '../services/boardService'
import { boardModel } from '../models/boardModel'
import { listModel } from '../models/listModel'
import { cardModel } from '../models/cardModel'
import { boardMemberModel } from '../models/boardMemberModel'
import ApiError from '../utils/ApiError'

const getList = async (req, res, next) => {
    try {
        const { userId } = req.user
        const boardList = await boardService.getList({ ...req.query, userId: userId })
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
        const newBoard = await boardService.createNew({ ...req.body, userId: userId })
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
        const boardDetail = await boardService.getDetail({ ...req.params, userId: userId })
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
        const updatedBoard = await boardService.update({ ...req.params, userId: userId }, req.body)
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
        const updatedBoard = await boardService.updatePartial({ ...req.params, userId: userId }, req.body)
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
        const deletedBoard = await boardService.delete({ ...req.params, userId: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Board deleted successfully',
            data: deletedBoard
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const reorder = async (req, res, next) => {
    try {
        const { userId } = req.user
        const reorderedBoard = await boardService.reorder({ ...req.params, userId: userId }, req.body)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Board lists reordered successfully',
            data: reorderedBoard
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const updateViewConfig = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { viewConfig } = req.body
        const updatedBoard = await boardService.updateViewConfig({ ...req.params, userId: userId }, { viewConfig })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Board view config updated successfully',
            data: updatedBoard
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const updateRecurringConfig = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { recurringConfig } = req.body
        const updatedBoard = await boardService.updateRecurringConfig({ ...req.params, userId: userId }, { recurringConfig })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Board recurring config updated successfully',
            data: updatedBoard
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}



const getFilteredBoard = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { userId } = req.user;
        const filterCriteria = req.query;

        // Get the board with basic info
        const board = await boardModel.getDetail({ id: boardId, userId: userId });
        if (!board) {
            throw new ApiError(404, 'Board not found');
        }

        // Get all lists for this board
        const lists = await listModel.getList({ boardId });

        // Apply filters to cards in each list
        for (let list of lists) {
            let cards = await cardModel.getList({ boardId: boardId, listId: list.id });
            console.log(cards)
            // Apply member filter
            if (filterCriteria.member && filterCriteria.member !== '') {
                cards = cards.filter(card => {
                    if (!card.members || !Array.isArray(card.members)) return false;
                    return card.members.some(member => member.memberId === filterCriteria.member);
                });
            }

            // Apply title filter
            if (filterCriteria.title && filterCriteria.title.trim() !== '') {
                const titleLower = filterCriteria.title.toLowerCase();
                cards = cards.filter(card =>
                    card.title && card.title.toLowerCase().includes(titleLower)
                );
            }

            // Apply description filter
            if (filterCriteria.description && filterCriteria.description.trim() !== '') {
                const descLower = filterCriteria.description.toLowerCase();
                cards = cards.filter(card =>
                    card.description && card.description.toLowerCase().includes(descLower)
                );
            }

            // Apply status filter
            if (filterCriteria.status && filterCriteria.status !== '') {
                cards = cards.filter(card => card.status === filterCriteria.status);
            }

            // Apply date range filter
            if (filterCriteria.startDate || filterCriteria.endDate) {
                cards = cards.filter(card => {
                    const cardDate = new Date(card.createdAt);

                    if (filterCriteria.startDate) {
                        const startDate = new Date(filterCriteria.startDate);
                        startDate.setHours(0, 0, 0, 0);
                        if (cardDate < startDate) return false;
                    }

                    if (filterCriteria.endDate) {
                        const endDate = new Date(filterCriteria.endDate);
                        endDate.setHours(23, 59, 59, 999);
                        if (cardDate > endDate) return false;
                    }

                    return true;
                });
            }

            // Ensure all cards have required properties
            for (let card of cards) {
                // Ensure labels array exists
                if (!card.labels) {
                    card.labels = [];
                }

                // Ensure members array exists
                if (!card.members) {
                    card.members = [];
                }

                // Ensure checklistItems array exists
                if (!card.checklistItems) {
                    card.checklistItems = [];
                }
            }

            list.cards = cards;
        }

        // Get board members
        const members = await boardMemberModel.getBoardMembers(boardId);

        // Ensure board has required properties
        if (!board.labels) {
            board.labels = [];
        }

        const result = {
            ...board,
            lists,
            members
        };

        res.status(200).json({
            statusCode: 200,
            message: 'Filtered board retrieved successfully',
            data: result
        });
    } catch (error) { next(error) }
}

export const boardController = {
    getList,
    createNew,
    getDetail,
    update,
    updatePartial,
    deleteItem,
    reorder,
    updateViewConfig,
    updateRecurringConfig,
    getFilteredBoard
}