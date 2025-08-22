import cron from 'node-cron'
import db from '../config/db.js'
import { v4 as uuidv4 } from 'uuid'

class CronService {
    constructor() {
        this.isInitialized = false
    }

    init() {
        if (this.isInitialized) {
            console.log('Cron service already initialized')
            return
        }

        // Schedule the recurring card duplication job to run every day at 8:00 AM
        cron.schedule('0 8 * * *', async () => {
            console.log('Running daily recurring card duplication job...')
            await this.duplicateRecurringCards()
        }, {
            scheduled: true,
            timezone: 'Asia/Ho_Chi_Minh' // Vietnam timezone
        })

        console.log('Cron service initialized - recurring card duplication scheduled for 8:00 AM daily')
        this.isInitialized = true
    }

    async duplicateRecurringCards() {
        try {
            console.log('Starting recurring card duplication process...')

            // Get all boards with recurringConfig.isRecurring = true
            const getRecurringBoardsQuery = `
                SELECT id, title, recurringConfig 
                FROM boards 
                WHERE JSON_EXTRACT(recurringConfig, '$.isRecurring') = true 
                AND deletedAt IS NULL
            `
            const recurringBoards = await db.query(getRecurringBoardsQuery)
            const boards = recurringBoards[0]

            if (boards.length === 0) {
                console.log('No recurring boards found')
                return
            }

            console.log(`Found ${boards.length} recurring boards`)

            for (const board of boards) {
                await this.duplicateCardsForBoard(board)
            }

            console.log('Recurring card duplication process completed successfully')
        } catch (error) {
            console.error('Error in recurring card duplication:', error)
        }
    }

    async duplicateCardsForBoard(board) {
        try {
            console.log(`Processing board: ${board.title} (${board.id})`)

            // Get all cards from this board
            const getCardsQuery = `
                SELECT * FROM cards 
                WHERE boardId = ? 
                AND archived = 0 
                AND deletedAt IS NULL
            `
            const cardsResult = await db.query(getCardsQuery, [board.id])
            const cards = cardsResult[0]

            if (cards.length === 0) {
                console.log(`No cards found for board: ${board.title}`)
                return
            }

            console.log(`Found ${cards.length} cards to duplicate for board: ${board.title}`)

            // Get today's date
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Duplicate each card
            for (const card of cards) {
                await this.duplicateCard(card, today)
            }

            console.log(`Completed duplicating cards for board: ${board.title}`)
        } catch (error) {
            console.error(`Error duplicating cards for board ${board.id}:`, error)
        }
    }

    async duplicateCard(originalCard, newDueDate) {
        try {
            // Create new card data with updated dueDate
            const newCardData = {
                id: uuidv4(),
                boardId: originalCard.boardId,
                listId: originalCard.listId,
                title: originalCard.title,
                description: originalCard.description,
                position: originalCard.position,
                dueDate: newDueDate,
                type: originalCard.type,
                checklistItems: originalCard.checklistItems,
                startDate: originalCard.startDate,
                endDate: originalCard.endDate,
                createdBy: originalCard.createdBy,
                status: originalCard.status,
                priority: originalCard.priority,
                totalTimeSpent: 0, // Reset time tracking for new card
                isTracking: 0,
                trackingStartTime: null,
                trackingPauseTime: 0
            }

            // Insert the new card
            const columns = Object.keys(newCardData).join(', ')
            const values = Object.values(newCardData)
                .map(value => {
                    if (typeof value === 'string') {
                        return `'${value.replace(/'/g, '\'\'')}'`
                    } else if (value === null) {
                        return 'NULL'
                    } else if (value instanceof Date) {
                        return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`
                    } else if (Array.isArray(value) || typeof value === 'object') {
                        return `'${JSON.stringify(value).replace(/'/g, '\'\'')}'`
                    } else {
                        return value
                    }
                })
                .join(', ')

            const insertQuery = `INSERT INTO cards (${columns}) VALUES (${values})`
            await db.query(insertQuery)

            // Duplicate card members if any
            await this.duplicateCardMembers(originalCard.id, newCardData.id)

            console.log(`Duplicated card: ${originalCard.title} with new due date: ${newDueDate.toDateString()}`)
        } catch (error) {
            console.error(`Error duplicating card ${originalCard.id}:`, error)
        }
    }

    async duplicateCardMembers(originalCardId, newCardId) {
        try {
            // Get original card members
            const getMembersQuery = `
                SELECT memberId FROM cardmembers 
                WHERE cardId = ?
            `
            const membersResult = await db.query(getMembersQuery, [originalCardId])
            const members = membersResult[0]

            if (members.length === 0) {
                return
            }

            // Insert members for the new card
            for (const member of members) {
                const insertMemberQuery = `
                    INSERT INTO cardmembers (cardId, memberId) 
                    VALUES (?, ?)
                `
                await db.query(insertMemberQuery, [newCardId, member.memberId])
            }

            console.log(`Duplicated ${members.length} members for card ${newCardId}`)
        } catch (error) {
            console.error(`Error duplicating card members for card ${newCardId}:`, error)
        }
    }

    // Method to manually trigger the duplication (for testing)
    async triggerManualDuplication() {
        console.log('Manually triggering recurring card duplication...')
        await this.duplicateRecurringCards()
    }
}

export const cronService = new CronService()
