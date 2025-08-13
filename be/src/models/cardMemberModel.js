import Joi from 'joi'
import db from '../config/db'

// Define Collection (Name & Schema)
const CARD_MEMBER_TABLE_NAME = 'cardmembers'
const CARD_MEMBER_TABLE_SCHEMA = Joi.object({
  cardId: Joi.string().uuid().required(),
  memberId: Joi.string().uuid().required(),
  joinedAt: Joi.date().allow(null).default(Date.now),
  role: Joi.string().valid('owner', 'admin', 'member', 'viewer').default('member')
})

const INVALID_UPDATE_FIELDS = ['cardId', 'memberId', 'joinedAt']

const validateBeforeCreate = async (data) => {
  try {
    return await CARD_MEMBER_TABLE_SCHEMA.validateAsync(data, { abortEarly: false })
  } catch (error) {
    console.error('error:', error)
    throw new Error(error)
  }
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const { joinedAt, ...dataToInsert } = validData
    const query = `INSERT INTO ${CARD_MEMBER_TABLE_NAME} (${Object.keys(dataToInsert).join(', ')}) VALUES (${Object.values(dataToInsert).map(value => typeof value === 'string' ? `'${value}'` : value).join(', ')})`
    const createdCardMember = await db.query(query)
    return createdCardMember[0].insertId
  } catch (error) {
    throw new Error(error)
  }
}

const createNewMany = async (dataArray) => {
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
    const query = `INSERT INTO ${CARD_MEMBER_TABLE_NAME} (${columns.join(', ')}) VALUES ${values}`
    const result = await db.query(query)
    return result[0].insertId
  } catch (error) {
    console.error('error:', error)
    throw new Error(error)
  }
}


const getCardMembers = async (cardId) => {
  try {
    const query = `
      SELECT cm.*, u.name, u.email, u.avatar, u.type as userType
      FROM ${CARD_MEMBER_TABLE_NAME} cm
      LEFT JOIN users u ON cm.memberId = u.id
      WHERE cm.cardId = ?
      ORDER BY cm.joinedAt ASC
    `
    const cardMembers = await db.query(query, [cardId])
    return cardMembers[0]
  } catch (error) {
    throw new Error(error)
  }
}

const getMemberCards = async (memberId) => {
  try {
    const query = `
      SELECT cm.*, c.title, c.description, c.icon, c.lastActivity
      FROM ${CARD_MEMBER_TABLE_NAME} cm
      LEFT JOIN cards c ON cm.cardId = c.id
      WHERE cm.memberId = ? AND c.deletedAt IS NULL
      ORDER BY c.lastActivity DESC
    `
    const memberCards = await db.query(query, [memberId])
    return memberCards[0]
  } catch (error) {
    throw new Error(error)
  }
}

const getCardMember = async (cardId, memberId) => {
  try {
    const query = `
      SELECT cm.*, u.name, u.email, u.avatar, u.type as userType
      FROM ${CARD_MEMBER_TABLE_NAME} cm
      LEFT JOIN users u ON cm.memberId = u.id
      WHERE cm.cardId = ? AND cm.memberId = ?
    `
    const cardMember = await db.query(query, [cardId, memberId])
    return cardMember[0][0]
  } catch (error) {
    throw new Error(error)
  }
}

const updateMemberRole = async (cardId, memberId, newRole) => {
  try {
    const query = `UPDATE ${CARD_MEMBER_TABLE_NAME} SET role = ? WHERE cardId = ? AND memberId = ?`
    const updatedCardMember = await db.query(query, [newRole, cardId, memberId])
    return updatedCardMember[0]
  } catch (error) {
    throw new Error(error)
  }
}

const removeMember = async (cardId, memberId) => {
  try {
    const query = `DELETE FROM ${CARD_MEMBER_TABLE_NAME} WHERE cardId = ? AND memberId = ?`
    const deletedCardMember = await db.query(query, [cardId, memberId])
    return deletedCardMember[0]
  } catch (error) {
    throw new Error(error)
  }
}

const addMember = async (cardId, memberId, role = 'member') => {
  try {
    const data = {
      cardId,
      memberId,
      role
    }
    return await createNew(data)
  } catch (error) {
    throw new Error(error)
  }
}

const isMemberOfCard = async (cardId, memberId) => {
  try {
    const query = `SELECT COUNT(*) as count FROM ${CARD_MEMBER_TABLE_NAME} WHERE cardId = ? AND memberId = ?`
    const result = await db.query(query, [cardId, memberId])
    return result[0][0].count > 0
  } catch (error) {
    throw new Error(error)
  }
}

const getMemberRole = async (cardId, memberId) => {
  try {
    const query = `SELECT role FROM ${CARD_MEMBER_TABLE_NAME} WHERE cardId = ? AND memberId = ?`
    const result = await db.query(query, [cardId, memberId])
    return result[0][0]?.role || null
  } catch (error) {
    throw new Error(error)
  }
}

const getCardMembersCount = async (cardId) => {
  try {
    const query = `SELECT COUNT(*) as count FROM ${CARD_MEMBER_TABLE_NAME} WHERE cardId = ?`
    const result = await db.query(query, [cardId])
    return result[0][0].count
  } catch (error) {
    throw new Error(error)
  }
}

const checkMemberExists = async (cardId, memberId) => {
  try {
    const query = `SELECT COUNT(*) as count FROM ${CARD_MEMBER_TABLE_NAME} WHERE cardId = ? AND memberId = ?`
    const result = await db.query(query, [cardId, memberId])
    return result[0][0].count > 0
  } catch (error) {
    throw new Error(error)
  }
}

const addMemberIfNotExists = async (cardId, memberId, role = 'member') => {
  try {
    // Kiểm tra xem member đã tồn tại chưa
    const exists = await checkMemberExists(cardId, memberId)
    if (!exists) {
      // Nếu chưa tồn tại thì thêm mới
      const data = {
        cardId,
        memberId,
        role
      }
      return await createNew(data)
    } else {
      // Nếu đã tồn tại thì trả về thông báo
      return { message: 'Member already exists', exists: true }
    }
  } catch (error) {
    throw new Error(error)
  }
}

const addMembersIfNotExists = async (membersArray) => {
  try {
    if (!Array.isArray(membersArray) || membersArray.length === 0) {
      throw new Error('Input must be a non-empty array')
    }

    const results = []

    for (const member of membersArray) {
      const { cardId, memberId, role = 'member' } = member

      // Kiểm tra xem member đã tồn tại chưa
      const exists = await checkMemberExists(cardId, memberId)

      if (!exists) {
        // Nếu chưa tồn tại thì thêm mới
        const data = {
          cardId,
          memberId,
          role
        }
        const result = await createNew(data)
        results.push({ memberId, added: true, result })
      } else {
        // Nếu đã tồn tại thì ghi log
        results.push({ memberId, added: false, message: 'Member already exists' })
      }
    }

    return results
  } catch (error) {
    throw new Error(error)
  }
}

export const cardMemberModel = {
  CARD_MEMBER_TABLE_NAME,
  CARD_MEMBER_TABLE_SCHEMA,
  createNew,
  createNewMany,
  getCardMembers,
  getMemberCards,
  getCardMember,
  updateMemberRole,
  removeMember,
  addMember,
  isMemberOfCard,
  getMemberRole,
  getCardMembersCount,
  checkMemberExists,
  addMemberIfNotExists,
  addMembersIfNotExists
} 