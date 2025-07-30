import Joi from 'joi'
import db from '../config/db'

// Define Collection (Name & Schema)
const USER_TABLE_NAME = 'users'
const USER_TABLE_SCHEMA = Joi.object({
  id: Joi.string().length(36).required(),
  name: Joi.string().min(1).max(100).required().trim().strict(),
  email: Joi.string().email().max(150).required().trim().strict(),
  password_hash: Joi.string().min(1).max(255).required().trim().strict(),
  type: Joi.string().valid('staff', 'manager', 'boss', 'admin').default('staff'),
  created_at: Joi.date().allow(null).default(Date.now),
  updated_at: Joi.date().allow(null).default(Date.now),
  deleted_at: Joi.date().allow(null).default(null),
  status: Joi.string().valid('online', 'banned', 'disabled').default('online'),
  avatar: Joi.string().max(255).allow(null).default(null)
})

const INVALID_UPDATE_FIELDS = ['id', 'created_at']
const INVALID_RESPONSE_FIELDS = ['password_hash']

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
    const { deleted_at, created_at, updated_at, ...dataToInsert } = validData
    const query = `INSERT INTO ${USER_TABLE_NAME} (${Object.keys(dataToInsert).join(', ')}) VALUES (${Object.values(dataToInsert).map(value => typeof value === 'string' ? `'${value}'` : value).join(', ')})`
    const createdUser = await db.query(query)
    return createdUser
  } catch (error) {
    throw new Error(error)
  }
}

const login = async (data) => {
  try {
    const { email, password_hash } = data

    const query = `SELECT * FROM ${USER_TABLE_NAME} WHERE email = ? AND password_hash = ?`
    const loginUser = await db.query(query, [email, password_hash])
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
    const query = `SELECT * FROM ${USER_TABLE_NAME} WHERE email = ? AND deleted_at IS NULL`
    const user = await db.query(query, [email])
    return user[0][0]
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    const query = `SELECT * FROM ${USER_TABLE_NAME} WHERE id = ? AND deleted_at IS NULL`
    const [user] = await db.query(query, [id])
    return user[0]
  } catch (error) {
    throw new Error(error)
  }
}

const getDetails = async (id) => {
  try {
    const query = `SELECT * FROM ${USER_TABLE_NAME} WHERE id = ? AND deleted_at IS NULL`
    const result = await db.query(query, [id])

    return result[0] || {}
  } catch (error) {
    throw new Error(error)
  }
}

const getAllUsers = async () => {
  try {
    const query = `SELECT * FROM ${USER_TABLE_NAME} WHERE deleted_at IS NULL ORDER BY created_at DESC`
    const result = await db.query(query)
    return result[0] || []
  } catch (error) {
    throw new Error(error)
  }
}

const getUsersByType = async (type) => {
  try {
    const query = `SELECT * FROM ${USER_TABLE_NAME} WHERE type = ? AND deleted_at IS NULL ORDER BY created_at DESC`
    const result = await db.query(query, [type])
    return result[0] || []
  } catch (error) {
    throw new Error(error)
  }
}

const deleteUser = async (userId) => {
  try {
    const query = `UPDATE ${USER_TABLE_NAME} SET deleted_at = ? WHERE id = ?`
    const result = await db.query(query, [Date.now(), userId])
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
    updateData.updated_at = Date.now()
    const query = `UPDATE ${USER_TABLE_NAME} SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')} WHERE id = ?`
    const result = await db.query(query, [...Object.values(updateData), userId])

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
  deleteUser
}