import express from 'express'
import { columnValidation } from '../../validations/columnValidation'
import { columnController } from '../../controllers/columnController'
import { StatusCodes } from 'http-status-codes'

const Router = express.Router()

/**
 * @swagger
 * /columns:
 *   post:
 *     summary: Create a new column
 *     tags: [Columns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - board_id
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: To Do
 *               board_id:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               order:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Column created successfully
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
    .post(columnValidation.createNew, columnController.createNew)

/**
 * @swagger
 * /columns/{id}:
 *   put:
 *     summary: Update column
 *     tags: [Columns]
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: In Progress
 *               order:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Column updated successfully
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
 *         description: Column not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
Router.route('/:id')
    .put((req, res) => {
        res.status(StatusCodes.OK).json({ message: 'Note: API update board' })
    })
   
export const columnRoute = Router