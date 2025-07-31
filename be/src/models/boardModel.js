import Joi from 'joi'
import db from '../config/db'

// Define Collection (Name & Schema)
const BOARD_TABLE_NAME = 'boards'
const BOARD_TABLE_SCHEMA = Joi.object({
  id: Joi.string().uuid().required(),
  title: Joi.string().max(255).required().trim().strict(),
  description: Joi.string().allow(null, '').trim().strict(),
  icon: Joi.string().max(255).allow(null, '').trim().strict(),
  last_activity: Joi.date().allow(null).default(null),
  owner_id: Joi.string().uuid().allow(null).default(null),
  is_public: Joi.number().integer().valid(0, 1).default(0),
  company_id: Joi.string().uuid().allow(null).default(null),
  department_id: Joi.string().uuid().allow(null).default(null),
  created_by: Joi.string().uuid().allow(null).default(null),
  updated_by: Joi.string().uuid().allow(null).default(null),
  deleted_by: Joi.string().uuid().allow(null).default(null),
  created_at: Joi.date().default(Date.now),
  updated_at: Joi.date().default(Date.now),
  deleted_at: Joi.date().allow(null).default(null)
})

const INVALID_UPDATE_FIELDS = ['id', 'created_at']

const validateBeforeCreate = async (data) => {
  try {
    return await BOARD_TABLE_SCHEMA.validateAsync(data, { abortEarly: false })
  } catch (error) {
    throw new Error(error)
  }
}

const getList = async (data) => {
  try {
    const query = `SELECT * FROM ${BOARD_TABLE_NAME} WHERE owner_id = ?`
    const boardList = await db.query(query, [data.user_id])
    return boardList[0]
  } catch (error) { throw new Error(error) }
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const { deleted_at, created_at, updated_at, ...dataToInsert } = validData
    const query = `INSERT INTO ${BOARD_TABLE_NAME} (${Object.keys(dataToInsert).join(', ')}) VALUES (${Object.values(dataToInsert).map(value => typeof value === 'string' ? `'${value}'` : value).join(', ')})`
    const createdBoard = await db.query(query)
    return createdBoard[0].insertId
  } catch (error) {
    throw new Error(error)
  }
}

const getDetail = async (data) => {
  try {
    const query = `SELECT * FROM ${BOARD_TABLE_NAME} WHERE id = ? AND user_id = ?`
    const boardDetail = await db.query(query, [data.id, data.user_id])
    return boardDetail[0]
  } catch (error) { throw new Error(error) }
}

const update = async (data, dataUpdate) => {
  try {
    const query = `UPDATE ${BOARD_TABLE_NAME} SET ? WHERE id = ? AND user_id = ?`
    const updatedBoard = await db.query(query, [dataUpdate, data.id, data.user_id])
    return updatedBoard[0]
  } catch (error) { throw new Error(error) }
}

const updatePartial = async (data, dataUpdate) => {
  try {
    const query = `UPDATE ${BOARD_TABLE_NAME} SET ? WHERE id = ? AND user_id = ?`
    const updatedBoard = await db.query(query, [dataUpdate, data.id, data.user_id])
    return updatedBoard[0]
  } catch (error) { throw new Error(error) }
}

const deleteNote = async (data) => {
  try {
    const query = `DELETE FROM ${BOARD_TABLE_NAME} WHERE id = ? AND user_id = ?`
    const deletedBoard = await db.query(query, [data.id, data.user_id])
    return deletedBoard[0]
  } catch (error) { throw new Error(error) }
}

export const boardModel = {
  BOARD_TABLE_NAME,
  BOARD_TABLE_SCHEMA,
  getList,
  createNew,
  getDetail,
  update,
  updatePartial,
  deleteNote
}