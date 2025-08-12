import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError'

const createPermission = async (req, res, next) => {
    const correctCondition = Joi.object({
        name: Joi.string().max(150).required().trim().strict(),
        description: Joi.string().allow(null, '').optional()
    })

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

const updatePermission = async (req, res, next) => {
    const correctCondition = Joi.object({
        name: Joi.string().max(150).optional().trim().strict(),
        description: Joi.string().allow(null, '').optional()
    })

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

export const permissionValidation = {
    createPermission,
    updatePermission
}
