import express from 'express'
import { StatusCodes } from 'http-status-codes'
// import { postValidation } from '.src/validations/postValidation'
import { boardController } from '../../controllers/boardController'
import { verifyToken } from '../../middlewares/verifyToken'
import { boardValidation } from '../../validations/boardValidation'

const Router = express.Router()

/**
 * @swagger
 * /boards:
 *   get:
 *     summary: Get all boards
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of boards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new board
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: My Project Board
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: A board for managing project tasks
 *               icon:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *                 example: 📋
 *               isPublic:
 *                 type: integer
 *                 enum: [0, 1]
 *                 default: 0
 *                 example: 1
 *     responses:
 *       201:
 *         description: Board created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
Router.route('/')
  .get(verifyToken, boardController.getList) // get list board
  .post(verifyToken, boardController.createNew) // create new board

/**
 * @swagger
 * /boards/{id}:
 *   get:
 *     summary: Get board by ID
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Board ID
 *     responses:
 *       200:
 *         description: Board retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Board not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update board (full update)
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Board ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: My Project Board
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: A board for managing project tasks
 *               icon:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *                 example: 📋
 *               isPublic:
 *                 type: integer
 *                 enum: [0, 1]
 *                 default: 0
 *                 example: 1
 *     responses:
 *       200:
 *         description: Board updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Board not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Update board (partial update)
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Board ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: Updated Board Title
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Updated board description
 *               icon:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *                 example: 🎯
 *               isPublic:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 0
 *     responses:
 *       200:
 *         description: Board updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Board not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete board
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Board ID
 *     responses:
 *       200:
 *         description: Board deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Board not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
Router.route('/:id')
  .get(verifyToken, boardController.getDetail) // get detail board
  .put(verifyToken, boardController.update) // update board
  .patch(verifyToken, boardController.updatePartial) // update partial board
  .delete(verifyToken, boardController.deleteItem) // delete board

/**
 * @swagger
 * /boards/{id}/reorder:
 *   patch:
 *     summary: Reorder lists in a board
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Board ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listOrderIds
 *             properties:
 *               listOrderIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"]
 *                 description: Array of list IDs in the desired order
 *     responses:
 *       200:
 *         description: Lists reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Board not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
Router.route('/:id/reorder')
  .patch(verifyToken, boardValidation.reorder, boardController.reorder) // reorder lists in board

/**
 * @swagger
 * /boards/{id}/view-config:
 *   patch:
 *     summary: Update board view configuration
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Board ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - viewConfig
 *             properties:
 *               viewConfig:
 *                 type: object
 *                 properties:
 *                   showTitle:
 *                     type: boolean
 *                     default: true
 *                   showDescription:
 *                     type: boolean
 *                     default: true
 *                   showDueDate:
 *                     type: boolean
 *                     default: true
 *                   showMembers:
 *                     type: boolean
 *                     default: true
 *                   showLabels:
 *                     type: boolean
 *                     default: true
 *                   showChecklist:
 *                     type: boolean
 *                     default: true
 *                   showStatus:
 *                     type: boolean
 *                     default: true
 *                   showType:
 *                     type: boolean
 *                     default: true
 *     responses:
 *       200:
 *         description: View configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Board not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
Router.route('/:id/view-config')
  .patch(verifyToken, boardController.updateViewConfig) // update board view config

/**
 * @swagger
 * /boards/{id}/recurring-config:
 *   patch:
 *     summary: Update board recurring configuration
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Board ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recurringConfig
 *             properties:
 *               recurringConfig:
 *                 type: object
 *                 properties:
 *                   isRecurring:
 *                     type: boolean
 *                     default: false
 *                     description: Whether this board is for recurring tasks
 *                   completedListId:
 *                     type: string
 *                     format: uuid
 *                     nullable: true
 *                     description: ID of the list where cards are marked as completed
 *     responses:
 *       200:
 *         description: Recurring configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Board not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
Router.route('/:id/recurring-config')
  .patch(verifyToken, boardController.updateRecurringConfig) // update board recurring config

export const boardRoute = Router