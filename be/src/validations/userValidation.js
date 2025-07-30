import Joi from 'joi'

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).max(255).required().trim().strict(),
  newPassword: Joi.string().min(6).max(255).required().trim().strict(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().trim().strict()
})

export const userValidation = {
  changePasswordSchema
} 