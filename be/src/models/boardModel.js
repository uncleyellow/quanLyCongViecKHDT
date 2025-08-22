import Joi from 'joi'
import db from '../config/db'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators'

// Define Collection (Name & Schema)
const BOARD_TABLE_NAME = 'boards'
const BOARD_TABLE_SCHEMA = Joi.object({
  id: Joi.string().uuid().required(),
  title: Joi.string().max(255).required().trim().strict(),
  description: Joi.string().allow(null, '').trim().strict(),
  icon: Joi.string().max(255).allow(null, '').trim().strict(),
  lastActivity: Joi.date().allow(null).default(null),
  ownerId: Joi.string().uuid().allow(null).default(null),
  isPublic: Joi.number().integer().valid(0, 1).default(0),
  companyId: Joi.string().uuid().allow(null).default(null),
  departmentId: Joi.string().uuid().allow(null).default(null),
  listOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),
  viewConfig: Joi.object({
    showTitle: Joi.boolean().default(true),
    showDescription: Joi.boolean().default(true),
    showDueDate: Joi.boolean().default(true),
    showMembers: Joi.boolean().default(true),
    showLabels: Joi.boolean().default(true),
    showChecklist: Joi.boolean().default(true),
    showStatus: Joi.boolean().default(true),
    showType: Joi.boolean().default(true)
  }).allow(null).default(null),
  recurringConfig: Joi.object({
    isRecurring: Joi.boolean().default(false),
    completedListId: Joi.string().uuid().allow(null).default(null)
  }).allow(null).default(null),
  isAssigned: Joi.boolean().default(false),
  createdBy: Joi.string().uuid().allow(null).default(null),
  updatedBy: Joi.string().uuid().allow(null).default(null),
  deletedBy: Joi.string().uuid().allow(null).default(null),
  createdAt: Joi.date().default(Date.now),
  updatedAt: Joi.date().default(Date.now),
  deletedAt: Joi.date().allow(null).default(null)
})

const INVALID_UPDATE_FIELDS = ['id', 'createdAt']

const validateBeforeCreate = async (data) => {
  try {
    return await BOARD_TABLE_SCHEMA.validateAsync(data, { abortEarly: false })
  } catch (error) {
    throw new Error(error)
  }
}

const getList = async (data) => {
  try {
    // First, get user information to determine their role and department
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return []
    }

    let query
    let params = []

    if (user.type === 'staff') {
      // Staff users: only get boards where they are the owner
      query = `
        SELECT b.*, u.name as ownerName 
        FROM ${BOARD_TABLE_NAME} b
        LEFT JOIN users u ON b.ownerId = u.id
        WHERE b.ownerId = ? AND b.deletedAt IS NULL
      `
      params = [data.userId]
    } else if (user.type === 'manager') {
      // Manager users: get their own boards + boards owned by staff in their department
      query = `
        SELECT DISTINCT b.*, u.name as ownerName 
        FROM ${BOARD_TABLE_NAME} b
        LEFT JOIN users u ON b.ownerId = u.id
        WHERE (b.ownerId = ? 
        OR (b.ownerId IN (
          SELECT u2.id 
          FROM users u2 
          WHERE u2.departmentId = ? 
          AND u2.type = 'staff'
        )))
        AND b.deletedAt IS NULL
      `
      params = [data.userId, user.departmentId]
    } else {
      // For other roles (boss, admin), get all boards (existing behavior)
      query = `
        SELECT b.*, u.name as ownerName 
        FROM ${BOARD_TABLE_NAME} b
        LEFT JOIN users u ON b.ownerId = u.id
        WHERE b.ownerId = ? AND b.deletedAt IS NULL
      `
      params = [data.userId]
    }

    const boardList = await db.query(query, params)
    return boardList[0]
  } catch (error) { throw new Error(error) }
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const { deletedAt, createdAt, updatedAt, ...dataToInsert } = validData
    const query = `INSERT INTO ${BOARD_TABLE_NAME} (${Object.keys(dataToInsert).join(', ')}) VALUES (${Object.values(dataToInsert).map(value => typeof value === 'string' ? `'${value}'` : (value === null || value.length == 0 ? 'NULL' : value)).join(', ')})`
    const createdBoard = await db.query(query)
    return createdBoard[0].insertId
  } catch (error) {
    throw new Error(error)
  }
}

const getDetail = async (data) => {
  try {
    // First, get user information to determine their role and department
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return null
    }

    let query
    let params = []

    if (user.type === 'staff') {
      // Staff users: only get boards where they are the owner
      query = `
        SELECT b.*, u.name as ownerName 
        FROM ${BOARD_TABLE_NAME} b
        LEFT JOIN users u ON b.ownerId = u.id
        WHERE b.id = ? AND b.ownerId = ? AND b.deletedAt IS NULL
      `
      params = [data.id, data.userId]
    } else if (user.type === 'manager') {
      // Manager users: get their own boards + boards owned by staff in their department
      query = `
        SELECT b.*, u.name as ownerName 
        FROM ${BOARD_TABLE_NAME} b
        LEFT JOIN users u ON b.ownerId = u.id
        WHERE b.id = ? 
        AND (b.ownerId = ? 
        OR b.ownerId IN (
          SELECT u2.id 
          FROM users u2 
          WHERE u2.departmentId = ? 
          AND u2.type = 'staff'
        ))
        AND b.deletedAt IS NULL
      `
      params = [data.id, data.userId, user.departmentId]
    } else {
      // For other roles (boss, admin), get all boards (existing behavior)
      query = `
        SELECT b.*, u.name as ownerName 
        FROM ${BOARD_TABLE_NAME} b
        LEFT JOIN users u ON b.ownerId = u.id
        WHERE b.id = ? AND b.ownerId = ? AND b.deletedAt IS NULL
      `
      params = [data.id, data.userId]
    }

    const boardDetail = await db.query(query, params)
    return boardDetail[0][0]
  } catch (error) { throw new Error(error) }
}

const update = async (data, dataUpdate) => {
  try {
    // First, get user information to determine their role and department
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return { affectedRows: 0 }
    }

    let query
    let params = []

    if (user.type === 'staff') {
      // Staff users: only update boards where they are the owner
      query = `UPDATE ${BOARD_TABLE_NAME} SET ? WHERE id = ? AND ownerId = ? AND deletedAt IS NULL`
      params = [dataUpdate, data.id, data.userId]
    } else if (user.type === 'manager') {
      // Manager users: can update their own boards + boards owned by staff in their department
      query = `
        UPDATE ${BOARD_TABLE_NAME} b
        SET ?
        WHERE b.id = ? 
        AND (b.ownerId = ? 
        OR b.ownerId IN (
          SELECT u.id 
          FROM users u 
          WHERE u.departmentId = ? 
          AND u.type = 'staff'
        ))
        AND b.deletedAt IS NULL
      `
      params = [dataUpdate, data.id, data.userId, user.departmentId]
    } else {
      // For other roles (boss, admin), existing behavior
      query = `UPDATE ${BOARD_TABLE_NAME} SET ? WHERE id = ? AND ownerId = ? AND deletedAt IS NULL`
      params = [dataUpdate, data.id, data.userId]
    }

    const updatedBoard = await db.query(query, params)
    return updatedBoard[0]
  } catch (error) { throw new Error(error) }
}

const updatePartial = async (data, dataUpdate) => {
  try {
    // First, get user information to determine their role and department
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return { affectedRows: 0 }
    }

    let query
    let params = []

    if (user.type === 'staff') {
      // Staff users: only update boards where they are the owner
      query = `UPDATE ${BOARD_TABLE_NAME} SET ? WHERE id = ? AND ownerId = ? AND deletedAt IS NULL`
      params = [dataUpdate, data.id, data.userId]
    } else if (user.type === 'manager') {
      // Manager users: can update their own boards + boards owned by staff in their department
      query = `
        UPDATE ${BOARD_TABLE_NAME} b
        SET ?
        WHERE b.id = ? 
        AND (b.ownerId = ? 
        OR b.ownerId IN (
          SELECT u.id 
          FROM users u 
          WHERE u.departmentId = ? 
          AND u.type = 'staff'
        ))
        AND b.deletedAt IS NULL
      `
      params = [dataUpdate, data.id, data.userId, user.departmentId]
    } else {
      // For other roles (boss, admin), existing behavior
      query = `UPDATE ${BOARD_TABLE_NAME} SET ? WHERE id = ? AND ownerId = ? AND deletedAt IS NULL`
      params = [dataUpdate, data.id, data.userId]
    }

    const updatedBoard = await db.query(query, params)
    return updatedBoard[0]
  } catch (error) { throw new Error(error) }
}

const deleteNote = async (data) => {
  try {
    // First, get user information to determine their role and department
    const userQuery = `SELECT id, type, departmentId, companyId FROM users WHERE id = ?`
    const userResult = await db.query(userQuery, [data.userId])
    const user = userResult[0][0]

    if (!user) {
      return { affectedRows: 0 }
    }

    let query
    let params = []

    if (user.type === 'staff') {
      // Staff users: only delete boards where they are the owner
      query = `DELETE FROM ${BOARD_TABLE_NAME} WHERE id = ? AND ownerId = ? AND deletedAt IS NULL`
      params = [data.id, data.userId]
    } else if (user.type === 'manager') {
      // Manager users: can delete their own boards + boards owned by staff in their department
      query = `
        DELETE b FROM ${BOARD_TABLE_NAME} b
        WHERE b.id = ? 
        AND (b.ownerId = ? 
        OR b.ownerId IN (
          SELECT u.id 
          FROM users u 
          WHERE u.departmentId = ? 
          AND u.type = 'staff'
        ))
        AND b.deletedAt IS NULL
      `
      params = [data.id, data.userId, user.departmentId]
    } else {
      // For other roles (boss, admin), existing behavior
      query = `DELETE FROM ${BOARD_TABLE_NAME} WHERE id = ? AND ownerId = ? AND deletedAt IS NULL`
      params = [data.id, data.userId]
    }

    const deletedBoard = await db.query(query, params)
    return deletedBoard[0]
  } catch (error) { throw new Error(error) }
}

const reorder = async (data, reorderData) => {
  try {
    const { listOrderIds } = reorderData
    const query = `UPDATE ${BOARD_TABLE_NAME} SET listOrderIds = ?, updatedAt = NOW() WHERE id = ? AND ownerId = ? AND deletedAt IS NULL`
    const updatedBoard = await db.query(query, [JSON.stringify(listOrderIds), data.id, data.userId])

    // Return the updated board details
    const getUpdatedBoard = `
      SELECT b.*, u.name as ownerName 
      FROM ${BOARD_TABLE_NAME} b
      LEFT JOIN users u ON b.ownerId = u.id
      WHERE b.id = ? AND b.ownerId = ? AND b.deletedAt IS NULL
    `
    const boardDetail = await db.query(getUpdatedBoard, [data.id, data.userId])
    return boardDetail[0][0]
  } catch (error) { throw new Error(error) }
}

const updateViewConfig = async (data, dataUpdate) => {
  try {
    const { viewConfig } = dataUpdate
    const query = `UPDATE ${BOARD_TABLE_NAME} SET viewConfig = ?, updatedAt = NOW() WHERE id = ? AND ownerId = ? AND deletedAt IS NULL`
    const updatedBoard = await db.query(query, [JSON.stringify(viewConfig), data.id, data.userId])

    // Return the updated board details
    const getUpdatedBoard = `
      SELECT b.*, u.name as ownerName 
      FROM ${BOARD_TABLE_NAME} b
      LEFT JOIN users u ON b.ownerId = u.id
      WHERE b.id = ? AND b.ownerId = ? AND b.deletedAt IS NULL
    `
    const boardDetail = await db.query(getUpdatedBoard, [data.id, data.userId])
    return boardDetail[0][0]
  } catch (error) { throw new Error(error) }
}

const updateRecurringConfig = async (data, dataUpdate) => {
  try {
    const { recurringConfig } = dataUpdate
    const query = `UPDATE ${BOARD_TABLE_NAME} SET recurringConfig = ?, updatedAt = NOW() WHERE id = ? AND ownerId = ? AND deletedAt IS NULL`
    const updatedBoard = await db.query(query, [JSON.stringify(recurringConfig), data.id, data.userId])

    // Return the updated board details
    const getUpdatedBoard = `
      SELECT b.*, u.name as ownerName 
      FROM ${BOARD_TABLE_NAME} b
      LEFT JOIN users u ON b.ownerId = u.id
      WHERE b.id = ? AND b.ownerId = ? AND b.deletedAt IS NULL
    `
    const boardDetail = await db.query(getUpdatedBoard, [data.id, data.userId])
    return boardDetail[0][0]
  } catch (error) { throw new Error(error) }
}

const updateAssignedConfig = async (data, dataUpdate) => {
  try {
    const { isAssigned } = dataUpdate
    const query = `UPDATE ${BOARD_TABLE_NAME} SET isAssigned = ?, updatedAt = NOW() WHERE id = ? AND ownerId = ? AND deletedAt IS NULL`
    const updatedBoard = await db.query(query, [isAssigned, data.id, data.userId])

    // Return the updated board details
    const getUpdatedBoard = `
      SELECT b.*, u.name as ownerName 
      FROM ${BOARD_TABLE_NAME} b
      LEFT JOIN users u ON b.ownerId = u.id
      WHERE b.id = ? AND b.ownerId = ? AND b.deletedAt IS NULL
    `
    const boardDetail = await db.query(getUpdatedBoard, [data.id, data.userId])
    return boardDetail[0][0]
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
  deleteNote,
  reorder,
  updateViewConfig,
  updateRecurringConfig,
  updateAssignedConfig
}