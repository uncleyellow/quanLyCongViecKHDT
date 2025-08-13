import express from 'express'
import { cardValidation } from '../../validations/cardValidation'
import { cardController } from '../../controllers/cardController'
import { verifyToken } from '../../middlewares/verifyToken'

const Router = express.Router()

/**
 * @swagger
 * /cards:
 *   get:
 *     summary: Get all cards with pagination and filtering
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for card title
 *       - in: query
 *         name: columnId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by column ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by priority
 *     responses:
 *       200:
 *         description: Cards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: List fetched successfully
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Card'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - boardId
 *               - columnId
 *               - title
 *             properties:
 *               boardId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               columnId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: Implement user authentication
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Add JWT authentication to the API
 *               order:
 *                 type: integer
 *                 example: 1
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: high
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-31T23:59:59.000Z
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["123e4567-e89b-12d3-a456-426614174002"]
 *     responses:
 *       201:
 *         description: Card created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: List created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Card'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
Router.route('/')
    .get(verifyToken, cardController.getList)
    .post(verifyToken, cardValidation.createNew, cardController.createNew)

/**
 * @swagger
 * /cards/user/all:
 *   get:
 *     summary: Get all cards for current user
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User cards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User cards fetched successfully
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Card'
 *                       - type: object
 *                         properties:
 *                           boardTitle:
 *                             type: string
 *                             example: "Project Management"
 *                           listTitle:
 *                             type: string
 *                             example: "To Do"
 *                           listColor:
 *                             type: string
 *                             example: "#3498db"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
Router.route('/user/all')
    .get(verifyToken, cardController.getAllUserCards)

/**
 * @swagger
 * /cards/{id}:
 *   get:
 *     summary: Get a specific card by ID
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *     responses:
 *       200:
 *         description: Card retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: List detail fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/Card'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Card not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a card completely
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: Updated card title
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Updated description
 *               columnId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               order:
 *                 type: integer
 *                 example: 2
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: medium
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-31T23:59:59.000Z
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["123e4567-e89b-12d3-a456-426614174002"]
 *     responses:
 *       200:
 *         description: Card updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: List updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Card'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Card not found
 *       500:
 *         description: Internal server error
 *   patch:
 *     summary: Update a card partially
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: Updated card title
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Updated description
 *               columnId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               order:
 *                 type: integer
 *                 example: 2
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: medium
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-31T23:59:59.000Z
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["123e4567-e89b-12d3-a456-426614174002"]
 *     responses:
 *       200:
 *         description: Card updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: List updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Card'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Card not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *     responses:
 *       200:
 *         description: Card deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: List deleted successfully
 *                 data:
 *                   $ref: '#/components/schemas/Card'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Card not found
 *       500:
 *         description: Internal server error
 */
Router.route('/:id')
    .get(verifyToken, cardController.getDetail)
    .put(verifyToken, cardValidation.update, cardController.update)
    .patch(verifyToken, cardValidation.updatePartial, cardController.updatePartial)
    .delete(verifyToken, cardController.deleteItem)

/**
 * @swagger
 * /cards/{cardId}/members:
 *   get:
 *     summary: Get all members of a card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *     responses:
 *       200:
 *         description: Card members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Card members fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       cardId:
 *                         type: string
 *                         format: uuid
 *                         description: Card ID
 *                       memberId:
 *                         type: string
 *                         format: uuid
 *                         description: Member ID
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 *                         description: When the member joined
 *                       role:
 *                         type: string
 *                         enum: [owner, admin, member, viewer]
 *                         description: Member role
 *                       name:
 *                         type: string
 *                         description: Member name
 *                       email:
 *                         type: string
 *                         format: email
 *                         description: Member email
 *                       avatar:
 *                         type: string
 *                         nullable: true
 *                         description: Member avatar URL
 *                       userType:
 *                         type: string
 *                         description: User type
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Card not found
 *       500:
 *         description: Internal server error
 */
Router.route('/:cardId/members')
    .get(verifyToken, cardController.getCardMembers)

/**
 * @swagger
 * /cards/board/{boardId}:
 *   get:
 *     summary: Get all cards by board ID
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Board ID
 *     responses:
 *       200:
 *         description: Cards by board retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Lists by board fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Card'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Board not found
 *       500:
 *         description: Internal server error
 */
Router.route('/board/:boardId')
    .get(verifyToken, cardValidation.validateBoardId, cardController.getListsByBoard)

/**
 * @swagger
 * /cards/column/{columnId}/order:
 *   patch:
 *     summary: Update card order within a column
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Column ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardOrderIds
 *             properties:
 *               cardOrderIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of card IDs in the desired order
 *                 example: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"]
 *     responses:
 *       200:
 *         description: Card order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Card order updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCards:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Card'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Column not found
 *       500:
 *         description: Internal server error
 */
Router.route('/column/:columnId/order')
    .patch(cardValidation.validateColumnId, cardValidation.updateCardOrder, cardController.updateCardOrder)

/**
 * @swagger
 * /cards/{cardId}/custom-fields:
 *   get:
 *     summary: Get all custom fields from card metadata
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *     responses:
 *       200:
 *         description: Custom fields retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Custom fields fetched successfully
 *                 data:
 *                   type: object
 *                   description: Object containing custom fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Card not found
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Add a custom field to card metadata
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fieldName
 *               - fieldValue
 *             properties:
 *               fieldName:
 *                 type: string
 *                 description: Name of the custom field
 *                 example: "priority_level"
 *               fieldValue:
 *                 type: string
 *                 description: Value of the custom field
 *                 example: "high"
 *               fieldType:
 *                 type: string
 *                 enum: [string, number, boolean, date]
 *                 default: string
 *                 description: Type of the custom field
 *     responses:
 *       200:
 *         description: Custom field added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Custom field added successfully
 *                 data:
 *                   $ref: '#/components/schemas/Card'
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Card not found
 *       500:
 *         description: Internal server error
 */
Router.route('/:cardId/custom-fields')
    .get(verifyToken, cardController.getCustomFields)
    .post(verifyToken, cardController.addCustomField)

/**
 * @swagger
 * /cards/{cardId}/custom-fields/{fieldName}:
 *   patch:
 *     summary: Update a custom field in card metadata
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: fieldName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the custom field
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fieldValue
 *             properties:
 *               fieldValue:
 *                 type: string
 *                 description: New value for the custom field
 *                 example: "medium"
 *     responses:
 *       200:
 *         description: Custom field updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Custom field updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Card'
 *       400:
 *         description: Bad request - missing fieldValue
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Card or custom field not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Remove a custom field from card metadata
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: fieldName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the custom field to remove
 *     responses:
 *       200:
 *         description: Custom field removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Custom field removed successfully
 *                 data:
 *                   $ref: '#/components/schemas/Card'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Card or custom field not found
 *       500:
 *         description: Internal server error
 */
Router.route('/:cardId/custom-fields/:fieldName')
    .patch(verifyToken, cardController.updateCustomField)
    .delete(verifyToken, cardController.removeCustomField)

export const cardRoute = Router