import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/ApiError';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators';

const createNew = async (req, res, next) => {
    const correctCondition = Joi.object({
      boardId: Joi.string().uuid().required(),
      listId: Joi.string().uuid().required(),
      title: Joi.string().required().min(3).max(50).trim().strict(),
      description: Joi.string().allow(null, '').optional(),
      dueDate: Joi.date().allow(null, '').optional(),
      type: Joi.string().valid('normal', 'emergency', 'low').optional(),
      checklistItems: Joi.alternatives().try(
        Joi.string().allow(null, ''),
        Joi.array().items(Joi.string().allow(null, '')).allow(null)
      ).optional(),
      startDate: Joi.date().allow(null, '').optional(),
      endDate: Joi.date().allow(null, '').optional(),
      members: Joi.string().allow(null, '').optional(),
      dependencies: Joi.string().allow(null, '').optional(),
      status: Joi.string().valid('todo', 'in_progress', 'done', 'blocked', 'cancelled').optional()
    })

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

const update = async (req, res, next) => {
    const correctCondition = Joi.object({
      title: Joi.string().min(3).max(50).trim().strict().optional(),
      description: Joi.string().allow(null, '').optional(),
      columnId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).optional(),
      order: Joi.number().integer().min(0).optional(),
      priority: Joi.string().valid('low', 'medium', 'high').optional(),
      dueDate: Joi.date().iso().optional(),
      assignees: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).optional()
    })

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

const updatePartial = async (req, res, next) => {
    const correctCondition = Joi.object({
      title: Joi.string().min(3).max(50).trim().strict().optional(),
      description: Joi.string().allow(null, '').optional(),
      columnId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).optional(),
      order: Joi.number().integer().min(0).optional(),
      priority: Joi.string().valid('low', 'medium', 'high').optional(),
      dueDate: Joi.date().iso().optional(),
      assignees: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).optional()
    })

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

const updateCardOrder = async (req, res, next) => {
    const correctCondition = Joi.object({
      cardOrderIds: Joi.array().items(
        Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
      ).required().min(1)
    })

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

const validateId = async (req, res, next) => {
    const correctCondition = Joi.object({
      id: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
    })

    try {
        await correctCondition.validateAsync(req.params, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

const validateBoardId = async (req, res, next) => {
    const correctCondition = Joi.object({
      boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
    })

    try {
        await correctCondition.validateAsync(req.params, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

const validateColumnId = async (req, res, next) => {
    const correctCondition = Joi.object({
      columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
    })

    try {
        await correctCondition.validateAsync(req.params, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

export const cardValidation = {
    createNew,
    update,
    updatePartial,
    updateCardOrder,
    validateId,
    validateBoardId,
    validateColumnId
}