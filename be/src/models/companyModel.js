import Joi from 'joi'
import db from '../config/db'

// Define Collection (Name & Schema)
const COMPANY_TABLE_NAME = 'companies'
const COMPANY_TABLE_SCHEMA = Joi.object({
    id: Joi.string().uuid().required(),
    name: Joi.string().max(255).required().trim().strict(),
    description: Joi.string().allow(null).default(null),
    address: Joi.string().allow(null).default(null),
    phone: Joi.string().allow(null).default(null),
    email: Joi.string().email().allow(null).default(null),
    website: Joi.string().uri().allow(null).default(null),
    industry: Joi.string().allow(null).default(null),
    size: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise').default(null),
    createdAt: Joi.date().default(Date.now),
    createdBy: Joi.string().uuid().allow(null).default(null),
    updatedBy: Joi.string().uuid().allow(null).default(null),
    deletedBy: Joi.string().uuid().allow(null).default(null),
    updatedAt: Joi.date().allow(null).default(null),
    deletedAt: Joi.date().allow(null).default(null)
})

const INVALID_UPDATE_FIELDS = ['id', 'createdAt']

const validateBeforeCreate = async (data) => {
    try {
        return await COMPANY_TABLE_SCHEMA.validateAsync(data, { abortEarly: false })
    } catch (error) {
        throw new Error(error)
    }
}

const getList = async (data) => {
    try {
        const { page = 1, limit = 10, search } = data
        const offset = (page - 1) * limit
        
        let query = `SELECT * FROM ${COMPANY_TABLE_NAME} WHERE deletedAt IS NULL`
        let countQuery = `SELECT COUNT(*) as total FROM ${COMPANY_TABLE_NAME} WHERE deletedAt IS NULL`
        
        // Add search condition if search parameter is provided
        if (search && search.trim() !== '') {
            const searchCondition = ` AND (name LIKE '%${search.replace(/'/g, '\'\'')}%' OR description LIKE '%${search.replace(/'/g, '\'\'')}%')`
            query += searchCondition
            countQuery += searchCondition
        }
        
        // Add ordering and pagination
        query += ` ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}`
        
        const [listData, countData] = await Promise.all([
            db.query(query),
            db.query(countQuery)
        ])
        
        return {
            data: listData[0],
            pagination: {
                total: countData[0][0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countData[0][0].total / limit)
            }
        }
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
                    return `'${value.replace(/'/g, '\'\'')}'`
                } else if (value === null) {
                    return 'NULL'
                } else if (value instanceof Date) {
                    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`
                } else {
                    return value
                }
            })
            .join(', ')

        const query = `INSERT INTO ${COMPANY_TABLE_NAME} (${columns}) VALUES (${values})`
        const result = await db.query(query)
        return result[0]
    } catch (error) { throw new Error(error) }
}

const getDetail = async (data) => {
    try {
        const query = `SELECT * FROM ${COMPANY_TABLE_NAME} WHERE id = ? AND deletedAt IS NULL`
        const detailData = await db.query(query, [data.id])
        return detailData[0][0]
    } catch (error) { throw new Error(error) }
}

const update = async (data, updateData) => {
    try {
        const dataToUpdateCleaned = {}
        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && !INVALID_UPDATE_FIELDS.includes(key)) {
                dataToUpdateCleaned[key] = value
            }
        })

        if (Object.keys(dataToUpdateCleaned).length === 0) {
            throw new Error('No valid data to update')
        }

        const setClause = Object.entries(dataToUpdateCleaned)
            .map(([key, value]) => {
                if (typeof value === 'string') {
                    return `${key} = '${value.replace(/'/g, '\'\'')}'`
                } else if (value === null) {
                    return `${key} = NULL`
                } else if (value instanceof Date) {
                    return `${key} = '${value.toISOString().slice(0, 19).replace('T', ' ')}'`
                } else {
                    return `${key} = ${value}`
                }
            })
            .join(', ')

        const query = `UPDATE ${COMPANY_TABLE_NAME} SET ${setClause}, updatedAt = NOW() WHERE id = ? AND deletedAt IS NULL`
        const result = await db.query(query, [data.id])
        return result[0]
    } catch (error) { throw new Error(error) }
}

const deleteItem = async (data) => {
    try {
        const query = `UPDATE ${COMPANY_TABLE_NAME} SET deletedAt = NOW() WHERE id = ? AND deletedAt IS NULL`
        const result = await db.query(query, [data.id])
        return result[0]
    } catch (error) { throw new Error(error) }
}

export const companyModel = {
    getList,
    createNew,
    getDetail,
    update,
    delete: deleteItem
}
