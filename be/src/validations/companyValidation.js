import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError'

const createCompany = async (req, res, next) => {
    const correctCondition = Joi.object({
        name: Joi.string().max(255).required().trim().strict(),
        description: Joi.string().allow(null, '').optional(),
        address: Joi.string().allow(null, '').optional(),
        phone: Joi.string().allow(null, '').optional(),
        email: Joi.string().email().allow(null, '').optional(),
        website: Joi.string().uri().allow(null, '').optional(),
        industry: Joi.string().allow(null, '').optional(),
        size: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise').allow(null, '').optional()
    })

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

const updateCompany = async (req, res, next) => {
    const correctCondition = Joi.object({
        name: Joi.string().max(255).optional().trim().strict(),
        description: Joi.string().allow(null, '').optional(),
        address: Joi.string().allow(null, '').optional(),
        phone: Joi.string().allow(null, '').optional(),
        email: Joi.string().email().allow(null, '').optional(),
        website: Joi.string().uri().allow(null, '').optional(),
        industry: Joi.string().allow(null, '').optional(),
        size: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise').allow(null, '').optional()
    })

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

export const companyValidation = {
    createCompany,
    updateCompany
}
