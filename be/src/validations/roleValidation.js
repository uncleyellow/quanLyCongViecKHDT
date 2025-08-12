import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError'

const createRole = async (req, res, next) => {
    const correctCondition = Joi.object({
        name: Joi.string().max(100).required().trim().strict(),
        description: Joi.string().allow(null, '').optional()
    })

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

const updateRole = async (req, res, next) => {
    const correctCondition = Joi.object({
        name: Joi.string().max(100).optional().trim().strict(),
        description: Joi.string().allow(null, '').optional()
    })

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

const assignPermissionsToRole = async (req, res, next) => {
    const correctCondition = Joi.object({
        permissionIds: Joi.array().items(Joi.string().uuid()).required()
    })

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

export const roleValidation = {
    createRole,
    updateRole,
    assignPermissionsToRole
}
