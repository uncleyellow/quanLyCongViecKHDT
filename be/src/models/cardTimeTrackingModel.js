import Joi from 'joi'
import db from '../config/db'

// Define Collection (Name & Schema)
const CARD_TIME_TRACKING_TABLE_NAME = 'card_time_tracking'
const CARD_TIME_TRACKING_TABLE_SCHEMA = Joi.object({
    id: Joi.string().uuid().required(),
    cardId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
    action: Joi.string().valid('start', 'pause', 'resume', 'stop').required(),
    startTime: Joi.date().required(),
    endTime: Joi.date().allow(null).default(null),
    duration: Joi.number().integer().default(0), // Duration in seconds
    note: Joi.string().allow(null).default(null),
    createdAt: Joi.date().default(Date.now)
})

const INVALID_UPDATE_FIELDS = ['id', 'createdAt']

const validateBeforeCreate = async (data) => {
    try {
        return await CARD_TIME_TRACKING_TABLE_SCHEMA.validateAsync(data, { abortEarly: false })
    } catch (error) {
        throw new Error(error)
    }
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

        const columns = Object.keys(dataToInsertCleaned).join(', ')
        const values = Object.values(dataToInsertCleaned)
            .map(value => {
                if (typeof value === 'string') {
                    return `'${value.replace(/'/g, "''")}'`
                } else if (value === null) {
                    return 'NULL'
                } else if (value instanceof Date) {
                    // Format date for MySQL
                    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`
                } else {
                    return value
                }
            })
            .join(', ')

        const query = `INSERT INTO ${CARD_TIME_TRACKING_TABLE_NAME} (${columns}) VALUES (${values})`
        const createdRecord = await db.query(query)
        return createdRecord[0].insertId
    } catch (error) {
        throw new Error(error)
    }
}

const getList = async (data) => {
    try {
        const query = `SELECT * FROM ${CARD_TIME_TRACKING_TABLE_NAME} WHERE cardId = ? ORDER BY startTime DESC`
        const listData = await db.query(query, [data.cardId])
        return listData[0]
    } catch (error) { throw new Error(error) }
}

const getDetail = async (data) => {
    try {
        const query = `SELECT * FROM ${CARD_TIME_TRACKING_TABLE_NAME} WHERE id = ?`
        const listData = await db.query(query, [data.id])
        return listData[0][0]
    } catch (error) { throw new Error(error) }
}

const update = async (data, dataUpdate) => {
    try {
        const validData = await validateBeforeCreate(dataUpdate)
        const dataToUpdateCleaned = {}
        Object.entries(validData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && !INVALID_UPDATE_FIELDS.includes(key)) {
                dataToUpdateCleaned[key] = value
            }
        })

        const setClause = Object.entries(dataToUpdateCleaned)
            .map(([key, value]) => {
                if (typeof value === 'string') {
                    return `${key} = '${value.replace(/'/g, "''")}'`
                } else if (value === null) {
                    return `${key} = NULL`
                } else {
                    return `${key} = ${value}`
                }
            })
            .join(', ')

        const query = `UPDATE ${CARD_TIME_TRACKING_TABLE_NAME} SET ${setClause} WHERE id = ?`
        const updatedRecord = await db.query(query, [data.id])
        return updatedRecord[0].affectedRows
    } catch (error) {
        throw new Error(error)
    }
}

const deleteRecord = async (data) => {
    try {
        const query = `DELETE FROM ${CARD_TIME_TRACKING_TABLE_NAME} WHERE id = ?`
        const deletedRecord = await db.query(query, [data.id])
        return deletedRecord[0].affectedRows
    } catch (error) { throw new Error(error) }
}

export default {
    CARD_TIME_TRACKING_TABLE_NAME,
    CARD_TIME_TRACKING_TABLE_SCHEMA,
    createNew,
    getList,
    getDetail,
    update,
    deleteRecord
}
