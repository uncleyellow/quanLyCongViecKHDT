import Joi from 'joi'
import db from '../config/db'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators'

// Define Collection (Name & Schema)
const LIST_TABLE_NAME = 'lists'
const LIST_TABLE_SCHEMA = Joi.object({
    id: Joi.string().uuid().required(),
    boardId: Joi.string().uuid().required(),
    title: Joi.string().max(255).required().trim().strict(),
    color: Joi.string().max(20).default('#3B82F6').trim().strict(),
    archived: Joi.number().integer().valid(0, 1).default(0),
    cardOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),
    createdBy: Joi.string().uuid().allow(null).default(null),
    updatedBy: Joi.string().uuid().allow(null).default(null),
    deletedBy: Joi.string().uuid().allow(null).default(null),
    createdAt: Joi.date().allow(null).default(Date.now),
    updatedAt: Joi.date().allow(null).default(Date.now),
    deletedAt: Joi.date().allow(null).default(null)
})

const INVALID_UPDATE_FIELDS = ['id', 'createdAt']

const validateBeforeCreate = async (data) => {
    try {
        return await LIST_TABLE_SCHEMA.validateAsync(data, { abortEarly: false })
    } catch (error) {
        throw new Error(error)
    }
}

const getList = async (data) => {
    try {
        const query = `SELECT * FROM ${LIST_TABLE_NAME} WHERE boardId = ? AND deletedAt IS NULL`
        const listData = await db.query(query, [data.boardId])
        return listData[0]
    } catch (error) { throw new Error(error) }
}

const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        const { deletedAt, createdAt, updatedAt, cardOrderIds, updatedBy, createdBy, deletedBy, ...dataToInsert } = validData
        const query = `INSERT INTO ${LIST_TABLE_NAME} (${Object.keys(dataToInsert).join(', ')}) VALUES (${Object.values(dataToInsert).map(value => typeof value === 'string' ? `'${value}'` : value).join(', ')})`
        const createdList = await db.query(query)
        return createdList[0].insertId
    } catch (error) {
        throw new Error(error)
    }
}

const getDetail = async (data) => {
    try {
        const query = `SELECT * FROM ${LIST_TABLE_NAME} WHERE id = ? AND boardId = ? AND deletedAt IS NULL`
        const listDetail = await db.query(query, [data.id, data.boardId])
        return listDetail[0][0]
    } catch (error) { throw new Error(error) }
}

const update = async (data, dataUpdate) => {
    try {
        const query = `UPDATE ${LIST_TABLE_NAME} SET ? WHERE id = ? AND boardId = ? AND deletedAt IS NULL`
        const updatedList = await db.query(query, [dataUpdate, data.id, dataUpdate.boardId])
        return updatedList[0]
    } catch (error) { throw new Error(error) }
}

const updatePartial = async (data, dataUpdate) => {
    try {
        const query = `UPDATE ${LIST_TABLE_NAME} SET ? WHERE id = ? AND boardId = ? AND deletedAt IS NULL`
        const updatedList = await db.query(query, [dataUpdate, data.id, data.boardId])
        return updatedList[0]
    } catch (error) { throw new Error(error) }
}

const deleteItem = async (data) => {
    try {
        const query = `UPDATE ${LIST_TABLE_NAME} SET deletedAt = NOW(), deletedBy = ? WHERE id = ?`
        const deletedList = await db.query(query, [data.userId, data.id])
        return deletedList[0]
    } catch (error) { throw new Error(error) }
}

export const listModel = {
    LIST_TABLE_NAME,
    LIST_TABLE_SCHEMA,
    getList,
    createNew,
    getDetail,
    update,
    updatePartial,
    deleteItem
}