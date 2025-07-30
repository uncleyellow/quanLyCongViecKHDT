import express from 'express'
import { cardValidation } from '../../validations/cardValidation'
import { cardController } from '../../controllers/cardController'

const Router = express.Router()

/**
 * @swagger
 * /cards:
 *   post:
 *     summary: Create a new card
 *     tags: [Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - column_id
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: Implement user authentication
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Add JWT authentication to the API
 *               column_id:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               order:
 *                 type: integer
 *                 example: 1
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: high
 *     responses:
 *       201:
 *         description: Card created successfully
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
 */
Router.route('/')
    .post(cardValidation.createNew, cardController.createNew)

export const cardRoute = Router