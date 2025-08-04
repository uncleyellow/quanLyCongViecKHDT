import Joi from 'joi'
import db from '../config/db'

// Define Collection (Name & Schema)
const BOARD_MEMBER_TABLE_NAME = 'boardMembers'
const BOARD_MEMBER_TABLE_SCHEMA = Joi.object({
  boardId: Joi.string().uuid().required(),
  memberId: Joi.string().uuid().required(),
  joinedAt: Joi.date().allow(null).default(Date.now),
  role: Joi.string().valid('owner', 'admin', 'member', 'viewer').default('member')
})

const INVALID_UPDATE_FIELDS = ['boardId', 'memberId', 'joinedAt']

const validateBeforeCreate = async (data) => {
  try {
    return await BOARD_MEMBER_TABLE_SCHEMA.validateAsync(data, { abortEarly: false })
  } catch (error) {
    console.log('error:', error)
    throw new Error(error)
  }
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const { joinedAt, ...dataToInsert } = validData
    const query = `INSERT INTO ${BOARD_MEMBER_TABLE_NAME} (${Object.keys(dataToInsert).join(', ')}) VALUES (${Object.values(dataToInsert).map(value => typeof value === 'string' ? `'${value}'` : value).join(', ')})`
    const createdBoardMember = await db.query(query)
    return createdBoardMember[0].insertId
  } catch (error) {
    throw new Error(error)
  }
}

const createNewMany = async (dataArray) => {
  console.log('dataArray:', dataArray)
  try {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw new Error('Input must be a non-empty array')
    }

    // Validate all items
    const validatedDataArray = await Promise.all(
      dataArray.map(item => validateBeforeCreate(item))
    )

    // Prepare columns and values
    const columns = Object.keys(validatedDataArray[0]).filter(key => key !== 'joinedAt')
    const values = validatedDataArray.map(data =>
      '(' +
      columns.map(col => {
        const value = data[col]
        if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`
        } else if (value === null || value === undefined) {
          return 'NULL'
        } else {
          return value
        }
      }).join(', ') +
      ')'
    ).join(', ')

    const query = `INSERT INTO ${BOARD_MEMBER_TABLE_NAME} (${columns.join(', ')}) VALUES ${values}`
    const result = await db.query(query)
    return result[0].insertId
  } catch (error) {
    console.log('error:', error)
    throw new Error(error)
  }
}


const getBoardMembers = async (boardId) => {
  try {
    const query = `
      SELECT bm.*, u.name, u.email, u.avatar, u.type as userType
      FROM ${BOARD_MEMBER_TABLE_NAME} bm
      LEFT JOIN users u ON bm.memberId = u.id
      WHERE bm.boardId = ?
      ORDER BY bm.joinedAt ASC
    `
    const boardMembers = await db.query(query, [boardId])
    return boardMembers[0]
  } catch (error) {
    throw new Error(error)
  }
}

const getMemberBoards = async (memberId) => {
  try {
    const query = `
      SELECT bm.*, b.title, b.description, b.icon, b.lastActivity
      FROM ${BOARD_MEMBER_TABLE_NAME} bm
      LEFT JOIN boards b ON bm.boardId = b.id
      WHERE bm.memberId = ? AND b.deletedAt IS NULL
      ORDER BY b.lastActivity DESC
    `
    const memberBoards = await db.query(query, [memberId])
    return memberBoards[0]
  } catch (error) {
    throw new Error(error)
  }
}

const getBoardMember = async (boardId, memberId) => {
  try {
    const query = `
      SELECT bm.*, u.name, u.email, u.avatar, u.type as userType
      FROM ${BOARD_MEMBER_TABLE_NAME} bm
      LEFT JOIN users u ON bm.memberId = u.id
      WHERE bm.boardId = ? AND bm.memberId = ?
    `
    const boardMember = await db.query(query, [boardId, memberId])
    return boardMember[0][0]
  } catch (error) {
    throw new Error(error)
  }
}

const updateMemberRole = async (boardId, memberId, newRole) => {
  try {
    const query = `UPDATE ${BOARD_MEMBER_TABLE_NAME} SET role = ? WHERE boardId = ? AND memberId = ?`
    const updatedBoardMember = await db.query(query, [newRole, boardId, memberId])
    return updatedBoardMember[0]
  } catch (error) {
    throw new Error(error)
  }
}

const removeMember = async (boardId, memberId) => {
  try {
    const query = `DELETE FROM ${BOARD_MEMBER_TABLE_NAME} WHERE boardId = ? AND memberId = ?`
    const deletedBoardMember = await db.query(query, [boardId, memberId])
    return deletedBoardMember[0]
  } catch (error) {
    throw new Error(error)
  }
}

const addMember = async (boardId, memberId, role = 'member') => {
  try {
    const data = {
      boardId,
      memberId,
      role
    }
    return await createNew(data)
  } catch (error) {
    throw new Error(error)
  }
}

const isMemberOfBoard = async (boardId, memberId) => {
  try {
    const query = `SELECT COUNT(*) as count FROM ${BOARD_MEMBER_TABLE_NAME} WHERE boardId = ? AND memberId = ?`
    const result = await db.query(query, [boardId, memberId])
    return result[0][0].count > 0
  } catch (error) {
    throw new Error(error)
  }
}

const getMemberRole = async (boardId, memberId) => {
  try {
    const query = `SELECT role FROM ${BOARD_MEMBER_TABLE_NAME} WHERE boardId = ? AND memberId = ?`
    const result = await db.query(query, [boardId, memberId])
    return result[0][0]?.role || null
  } catch (error) {
    throw new Error(error)
  }
}

const getBoardMembersCount = async (boardId) => {
  try {
    const query = `SELECT COUNT(*) as count FROM ${BOARD_MEMBER_TABLE_NAME} WHERE boardId = ?`
    const result = await db.query(query, [boardId])
    return result[0][0].count
  } catch (error) {
    throw new Error(error)
  }
}

export const boardMemberModel = {
  BOARD_MEMBER_TABLE_NAME,
  BOARD_MEMBER_TABLE_SCHEMA,
  createNew,
  createNewMany,
  getBoardMembers,
  getMemberBoards,
  getBoardMember,
  updateMemberRole,
  removeMember,
  addMember,
  isMemberOfBoard,
  getMemberRole,
  getBoardMembersCount
} 