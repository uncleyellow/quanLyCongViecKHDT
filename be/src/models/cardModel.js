import Joi from 'joi'
import db from '../config/db'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators'

// Define Collection (Name & Schema)
const CARD_TABLE_NAME = 'cards'
const CARD_TABLE_SCHEMA = Joi.object({
    id: Joi.string().uuid().required(),
    boardId: Joi.string().uuid().required(),
    listId: Joi.string().uuid().required(),
    title: Joi.string().max(255).required().trim().strict(),
    description: Joi.string().allow(null).default(null),
    position: Joi.number().integer().default(0),
    dueDate: Joi.alternatives().try(
        Joi.date().iso(),
        Joi.date()
    ).allow(null).default(null),
    type: Joi.string().max(50).default('normal'),
    checklistItems: Joi.alternatives().try(
        Joi.string().allow(null),
        Joi.array().items(
            Joi.alternatives().try(
                Joi.string().allow(null),
                Joi.object()
            )
        ).allow(null)
    ).default(null),
    labels: Joi.alternatives().try(
        Joi.string().allow(null),
        Joi.array().items(Joi.string().uuid().allow(null))
    ).default(null),
    startDate: Joi.date().allow(null).default(null),
    endDate: Joi.date().allow(null).default(null),
    members: Joi.array().items(Joi.object().allow(null)).default(null),
    createdAt: Joi.date().default(Date.now),
    createdBy: Joi.string().uuid().allow(null).default(null),
    updatedBy: Joi.string().uuid().allow(null).default(null),
    deletedBy: Joi.string().uuid().allow(null).default(null),
    updatedAt: Joi.date().allow(null).default(null),
    deletedAt: Joi.date().allow(null).default(null),
    archived: Joi.number().integer().valid(0, 1).default(0),
    dependencies: Joi.string().allow(null).default(null),
    status: Joi.string().max(50).default('todo')
})

const INVALID_UPDATE_FIELDS = ['id', 'createdAt']

const validateBeforeCreate = async (data) => {
    try {
        return await CARD_TABLE_SCHEMA.validateAsync(data, { abortEarly: false })
    } catch (error) {
        throw new Error(error)
    }
}

const getList = async (data) => {
    try {
        const query = `SELECT * FROM ${CARD_TABLE_NAME} WHERE boardId = ? AND listId = ?`
        const listData = await db.query(query, [data.boardId, data.listId])
        return listData[0]
    } catch (error) { throw new Error(error) }
}

const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        const dataToInsertCleaned = {}
        Object.entries(validData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                dataToInsertCleaned[key] = value
            }
        })

        delete dataToInsertCleaned.createdAt
        delete dataToInsertCleaned.createdBy
        delete dataToInsertCleaned.updatedBy
        delete dataToInsertCleaned.deletedBy
        delete dataToInsertCleaned.updatedAt
        delete dataToInsertCleaned.deletedAt

        const columns = Object.keys(dataToInsertCleaned).join(', ')
        const values = Object.values(dataToInsertCleaned)
            .map(value => {
                if (typeof value === 'string') {
                    return `'${value.replace(/'/g, "''")}'`
                } else if (value === null) {
                    return 'NULL'
                } else {
                    return value
                }
            })
            .join(', ')

        const query = `INSERT INTO ${CARD_TABLE_NAME} (${columns}) VALUES (${values})`
        const createdList = await db.query(query)
        return createdList[0].insertId
    } catch (error) {
        throw new Error(error)
    }
}

const getDetail = async (data) => {
    try {
        const query = `SELECT * FROM ${CARD_TABLE_NAME} WHERE id = ?`
        const listDetail = await db.query(query, [data.id])
        return listDetail[0][0]
    } catch (error) { throw new Error(error) }
}

const update = async (data, dataUpdate) => {
    try {
        const query = `UPDATE ${CARD_TABLE_NAME} SET ? WHERE id = ?`
        const updatedList = await db.query(query, [dataUpdate, data.id])
        return updatedList[0]
    } catch (error) { throw new Error(error) }
}

const updatePartial = async (data, dataUpdate) => {
    try {
        const query = `UPDATE ${CARD_TABLE_NAME} SET ? WHERE id = ?`
        const updatedList = await db.query(query, [dataUpdate, data.id])
        return updatedList[0]
    } catch (error) { throw new Error(error) }
}

const deleteNote = async (data) => {
    try {
        const query = `DELETE FROM ${CARD_TABLE_NAME} WHERE id = ? AND boardId = ?`
        const deletedList = await db.query(query, [data.id, data.boardId])
        return deletedList[0]
    } catch (error) { throw new Error(error) }
}

export const cardModel = {
    CARD_TABLE_NAME,
    CARD_TABLE_SCHEMA,
    getList,
    createNew,
    getDetail,
    update,
    updatePartial,
    deleteNote
}