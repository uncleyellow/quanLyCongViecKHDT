import Joi from 'joi'
import db from '../config/db'
import { v4 as uuidv4 } from 'uuid'

// Define Collection (Name & Schema)
const DEPARTMENT_TABLE_NAME = 'departments'

// Schema for creating new department (id is optional, will be auto-generated)
const DEPARTMENT_CREATE_SCHEMA = Joi.object({
    id: Joi.string().uuid().optional(),
    name: Joi.string().max(255).required().trim().strict(),
    description: Joi.string().allow(null).default(null),
    companyId: Joi.string().uuid().required(),
    createdAt: Joi.date().default(Date.now),
    createdBy: Joi.string().uuid().allow(null).default(null),
    updatedBy: Joi.string().uuid().allow(null).default(null),
    deletedBy: Joi.string().uuid().allow(null).default(null),
    updatedAt: Joi.date().allow(null).default(null),
    deletedAt: Joi.date().allow(null).default(null)
})

// Schema for updating department
const DEPARTMENT_UPDATE_SCHEMA = Joi.object({
    name: Joi.string().max(255).required().trim().strict(),
    description: Joi.string().allow(null).default(null),
    companyId: Joi.string().uuid().required()
})

const INVALID_UPDATE_FIELDS = ['id', 'createdAt']

const validateBeforeCreate = async (data) => {
    try {
        return await DEPARTMENT_CREATE_SCHEMA.validateAsync(data, { abortEarly: false })
    } catch (error) {
        throw new Error(error)
    }
}

const validateBeforeUpdate = async (data) => {
    try {
        return await DEPARTMENT_UPDATE_SCHEMA.validateAsync(data, { abortEarly: false })
    } catch (error) {
        throw new Error(error)
    }
}

const getList = async (data) => {
    try {
        const { page = 1, limit = 10, search, companyId, sort = 'createdAt', order = 'DESC' } = data
        const offset = (page - 1) * limit
        
        let query = `
            SELECT d.*, c.name as companyName 
            FROM ${DEPARTMENT_TABLE_NAME} d
            LEFT JOIN companies c ON d.companyId = c.id
            WHERE d.deletedAt IS NULL
        `
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM ${DEPARTMENT_TABLE_NAME} d
            LEFT JOIN companies c ON d.companyId = c.id
            WHERE d.deletedAt IS NULL
        `
        
        // Add company filter if companyId is provided
        if (companyId && companyId.trim() !== '') {
            const companyCondition = ` AND d.companyId = '${companyId.replace(/'/g, '\'\'')}'`
            query += companyCondition
            countQuery += companyCondition
        }
        
        // Add search condition if search parameter is provided
        if (search && search.trim() !== '') {
            const searchCondition = ` AND (d.name LIKE '%${search.replace(/'/g, '\'\'')}%' OR d.description LIKE '%${search.replace(/'/g, '\'\'')}%')`
            query += searchCondition
            countQuery += searchCondition
        }
        
        // Validate sort field to prevent SQL injection
        const allowedSortFields = ['name', 'createdAt', 'description', 'companyName']
        const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt'
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
        
        // Add ordering and pagination
        query += ` ORDER BY d.${sortField} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`
        
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
        
        // Auto-generate UUID if not provided
        if (!validData.id) {
            validData.id = uuidv4()
        }
        
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

        const query = `INSERT INTO ${DEPARTMENT_TABLE_NAME} (${columns}) VALUES (${values})`
        const result = await db.query(query)
        return result[0]
    } catch (error) { throw new Error(error) }
}

const getDetail = async (data) => {
    try {
        const query = `
            SELECT d.*, c.name as companyName 
            FROM ${DEPARTMENT_TABLE_NAME} d
            LEFT JOIN companies c ON d.companyId = c.id
            WHERE d.id = ? AND d.deletedAt IS NULL
        `
        const detailData = await db.query(query, [data.id])
        return detailData[0][0]
    } catch (error) { throw new Error(error) }
}

const update = async (data, updateData) => {
    try {
        const validUpdateData = await validateBeforeUpdate(updateData)
        
        const dataToUpdateCleaned = {}
        Object.entries(validUpdateData).forEach(([key, value]) => {
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
                    return `d.${key} = '${value.replace(/'/g, '\'\'')}'`
                } else if (value === null) {
                    return `d.${key} = NULL`
                } else if (value instanceof Date) {
                    return `d.${key} = '${value.toISOString().slice(0, 19).replace('T', ' ')}'`
                } else {
                    return `d.${key} = ${value}`
                }
            })
            .join(', ')

        const query = `UPDATE ${DEPARTMENT_TABLE_NAME} d SET ${setClause}, d.updatedAt = NOW() WHERE d.id = ? AND d.deletedAt IS NULL`
        const result = await db.query(query, [data.id])
        return result[0]
    } catch (error) { throw new Error(error) }
}

const deleteItem = async (data) => {
    try {
        const query = `UPDATE ${DEPARTMENT_TABLE_NAME} SET deletedAt = NOW() WHERE id = ? AND deletedAt IS NULL`
        const result = await db.query(query, [data.id])
        return result[0]
    } catch (error) { throw new Error(error) }
}

export const departmentModel = {
    getList,
    createNew,
    getDetail,
    update,
    delete: deleteItem
}
