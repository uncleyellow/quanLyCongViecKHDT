import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError'

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(255).required().trim().strict(),
  newPassword: Joi.string().min(1).max(255).required().trim().strict(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().trim().strict()
})

const updateUser = async (req, res, next) => {
  const correctCondition = Joi.object({
    name: Joi.string().min(1).max(100).optional().trim().strict(),
    email: Joi.string().email().max(150).optional().trim().strict(),
    type: Joi.string().valid('staff', 'manager', 'boss', 'admin').optional(),
    status: Joi.string().valid('online', 'banned', 'disabled').optional(),
    avatar: Joi.string().max(255).allow(null, '').optional(),
    departmentId: Joi.string().uuid().allow(null, '').optional(),
    companyId: Joi.string().uuid().allow(null, '').optional()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const createUser = async (req, res, next) => {
  const correctCondition = Joi.object({
    name: Joi.string().min(1).max(100).required().trim().strict(),
    email: Joi.string().email().max(150).required().trim().strict(),
    password: Joi.string().min(6).max(255).required().trim().strict(),
    type: Joi.string().valid('staff', 'manager', 'boss', 'admin').default('staff'),
    status: Joi.string().valid('online', 'banned', 'disabled').default('online'),
    avatar: Joi.string().max(255).allow(null, '').optional(),
    departmentId: Joi.string().uuid().allow(null, '').optional(),
    companyId: Joi.string().uuid().allow(null, '').optional()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const userValidation = {
  changePasswordSchema,
  updateUser,
  createUser
} 