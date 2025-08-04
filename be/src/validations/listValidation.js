import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators'

const createNew = async (req, res, next) => {
    const correctCondition = Joi.object({
        boardId: Joi.string().length(36).required().strict(),
        title: Joi.string().min(3).max(255).required().trim().strict(),
        color: Joi.string().min(3).max(20).trim().strict()
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
        boardId: Joi.string().uuid(),
        title: Joi.string().min(3).max(255).trim().strict(),
        archived: Joi.boolean(),
        cardOrderIds: Joi.array().items(Joi.string().uuid()).default([]),
        color: Joi.string().min(3).max(20).trim().strict()
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
        title: Joi.string().min(3).max(255).trim().strict(),
        archived: Joi.boolean()
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
        cardOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).required()
    })

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

export const listValidation = {
    createNew,
    update,
    updatePartial,
    updateCardOrder
} 