import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/ApiError';
import { BOARD_TYPES } from '../utils/constants';

const createNew = async (req, res, next) => {
    const correctCondition = Joi.object({
        title: Joi.string().required().min(3).max(50).trim().strict().messages({
            'any.required': 'Title is required',
            'string.empty': 'Title is not allowed to be empty',
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title must be at most 50 characters long',
            'string.trim': 'Title must not contain leading or trailing spaces',
        }),
        description: Joi.string().required().min(3).max(256).trim().strict(),
        type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required()
    })

    try {
        // Chỉ định abortEarly: false để trường hợp có nhiều lỗi thì trả về tất cả lỗi
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        // Validate dữ liệu hợp lệ thì cho request đi tiếp sang controller
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

const update = async (req, res, next) => {
    const correctCondition = Joi.object({
        title: Joi.string().min(3).max(50).trim().strict(),
        description: Joi.string().min(3).max(256).trim().strict(),
        type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE)
    })

    try {
        // Chỉ định abortEarly: false để trường hợp có nhiều lỗi thì trả về tất cả lỗi
        await correctCondition.validateAsync(req.body, { 
            abortEarly: false, 
            allowUnknown: true // Không cần đẩy lên 1 số field
         })
        // Validate dữ liệu hợp lệ thì cho request đi tiếp sang controller
        next()
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
}

export const boardValidation = {
    createNew,
    update
}