import Joi from 'joi'
import db from '../config/db'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators'

// Define Collection (Name & Schema)
const USER_TABLE_NAME = 'users'
const USER_TABLE_SCHEMA = Joi.object({
  id: Joi.string().length(36).required(),
  name: Joi.string().min(1).max(100).required().trim().strict(),
  email: Joi.string().email().max(150).required().trim().strict(),
  passwordHash: Joi.string().min(1).max(255).required().trim().strict(),
  type: Joi.string().valid('staff', 'manager', 'boss', 'admin').default('staff'),
  status: Joi.string().valid('online', 'banned', 'disabled').default('online'),
  avatar: Joi.string().max(255).allow(null).default(null),
  mustChangePassword: Joi.boolean().default(true),
  boardOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),
  createdAt: Joi.date().allow(null).default(Date.now),
  updatedAt: Joi.date().allow(null).default(Date.now),
  deletedAt: Joi.date().allow(null).default(null)
})

const INVALID_UPDATE_FIELDS = ['id', 'createdAt']
const INVALID_RESPONSE_FIELDS = ['passwordHash']

const validateBeforeCreate = async (data) => {
  try {
    return await USER_TABLE_SCHEMA.validateAsync(data, { abortEarly: false })
  } catch (error) {
    throw new Error(error)
  }
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const { deletedAt, createdAt, updatedAt, ...dataToInsert } = validData
    const query = `INSERT INTO ${USER_TABLE_NAME} (${Object.keys(dataToInsert).join(', ')}) VALUES (${Object.values(dataToInsert).map(value => typeof value === 'string' ? `'${value}'` : value).join(', ')})`
    const createdUser = await db.query(query)
    return createdUser
  } catch (error) {
    throw new Error(error)
  }
}

const login = async (data) => {
  try {
    const { email, passwordHash } = data

    const query = `SELECT * FROM ${USER_TABLE_NAME} WHERE email = ? AND password_hash = ?`
    const loginUser = await db.query(query, [email, passwordHash])
    if (loginUser[0][0]) {
      const user = loginUser[0][0]
      INVALID_RESPONSE_FIELDS.forEach(field => {
        delete user[field]
      })
      return user
    }
    return null
  } catch (error) { throw new Error(error) }
}

const getUserByEmail = async (email) => {
  try {
    const query = `SELECT * FROM ${USER_TABLE_NAME} WHERE email = ? AND deletedAt IS NULL`
    const user = await db.query(query, [email])
    return user[0][0]
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    const query = `SELECT * FROM ${USER_TABLE_NAME} WHERE id = ? AND deletedAt IS NULL`
    const [user] = await db.query(query, [id])
    return user[0]
  } catch (error) {
    throw new Error(error)
  }
}

const getDetails = async (id) => {
  try {
    const query = `SELECT * FROM ${USER_TABLE_NAME} WHERE id = ? AND deletedAt IS NULL`
    const result = await db.query(query, [id])

    return result[0] || {}
  } catch (error) {
    throw new Error(error)
  }
}

const getAllUsers = async () => {
  try {
    const query = `SELECT * FROM ${USER_TABLE_NAME} WHERE deletedAt IS NULL ORDER BY createdAt DESC`
    const result = await db.query(query)
    return result[0] || []
  } catch (error) {
    throw new Error(error)
  }
}

const getUsersByType = async (type) => {
  try {
    const query = `SELECT * FROM ${USER_TABLE_NAME} WHERE type = ? AND deletedAt IS NULL ORDER BY createdAt DESC`
    const result = await db.query(query, [type])
    return result[0] || []
  } catch (error) {
    throw new Error(error)
  }
}

const deleteUser = async (userId) => {
  try {
    const query = `UPDATE ${USER_TABLE_NAME} SET deletedAt = NOW() WHERE id = ?`
    const result = await db.query(query, [userId])
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (userId, updateData) => {
  try {
    Object.keys(updateData).forEach(key => {
      if (INVALID_UPDATE_FIELDS.includes(key)) {
        delete updateData[key]
      }
    })
    const query = `UPDATE ${USER_TABLE_NAME} SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')}, updatedAt = NOW() WHERE id = ?`
    const result = await db.query(query, [...Object.values(updateData), userId])

    return result
  } catch (error) {
    throw new Error(error)
  }
}

const changePassword = async (userId, newPasswordHash) => {
  try {
    const query = `UPDATE ${USER_TABLE_NAME} SET passwordHash = ?, mustChangePassword = FALSE, updatedAt = NOW() WHERE id = ?`
    const result = await db.query(query, [newPasswordHash, userId])
    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const userModel = {
  USER_TABLE_NAME,
  USER_TABLE_SCHEMA,
  createNew,
  login,
  getUserByEmail,
  findOneById,
  getDetails,
  getAllUsers,
  getUsersByType,
  update,
  deleteUser,
  changePassword
}