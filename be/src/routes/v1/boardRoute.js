import express from 'express'
import { StatusCodes } from 'http-status-codes'
// import { postValidation } from '.src/validations/postValidation'
import { boardController } from '../../controllers/boardController'
import { verifyToken } from '../../middlewares/verifyToken'

const Router = express.Router()

/**
 * @swagger
 * tags:
 *   - name: Boards2
 *     description: Board management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Board:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated board ID
 *         title:
 *           type: string
 *           maxLength: 255
 *           description: Board title
 *         description:
 *           type: string
 *           nullable: true
 *           description: Board description
 *         icon:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           description: Board icon
 *         last_activity:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Last activity timestamp
 *         owner_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Board owner ID
 *         is_public:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *           description: Board visibility (0 = private, 1 = public)
 *         company_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Company ID
 *         department_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Department ID
 *         created_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: User who created the board
 *         updated_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: User who last updated the board
 *         deleted_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: User who deleted the board
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Board creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Board last update timestamp
 *         deleted_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Board deletion timestamp
 *     Error:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           description: HTTP status code
 *         status:
 *           type: string
 *           description: Error status
 *         message:
 *           type: string
 *           description: Error message
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           description: HTTP status code
 *         status:
 *           type: string
 *           description: Success status
 *         message:
 *           type: string
 *           description: Success message
 *         data:
 *           type: object
 *           description: Response data
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Boards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               code: 201
 *               status: success
 *               message: User created successfully
 *               data:
 *                 id: 1
 *                 email: user@example.com
 *                 name: John Doe
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */


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
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Note: API get list board
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
 *               is_public:
 *                 type: integer
 *                 enum: [0, 1]
 *                 default: 0
 *                 example: 1
 *               company_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               department_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *     responses:
 *       201:
 *         description: Board created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               code: 201
 *               status: success
 *               message: Board created successfully
 *               data:
 *                 id: 123e4567-e89b-12d3-a456-426614174000
 *                 title: My Project Board
 *                 description: A board for managing project tasks
 *                 icon: 📋
 *                 is_public: 1
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
 *             example:
 *               code: 200
 *               status: success
 *               message: Board retrieved successfully
 *               data:
 *                 id: 123e4567-e89b-12d3-a456-426614174000
 *                 title: My Project Board
 *                 description: A board for managing project tasks
 *                 icon: 📋
 *                 is_public: 1
 *                 owner_id: 123e4567-e89b-12d3-a456-426614174002
 *                 company_id: 123e4567-e89b-12d3-a456-426614174003
 *                 department_id: 123e4567-e89b-12d3-a456-426614174004
 *                 created_at: 2024-01-01T00:00:00.000Z
 *                 updated_at: 2024-01-01T00:00:00.000Z
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
 *               is_public:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 0
 *               company_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               department_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *     responses:
 *       200:
 *         description: Board updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Note: API update board
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
 *               is_public:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 0
 *               company_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               department_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *     responses:
 *       200:
 *         description: Board updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Note: API update partial board
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
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Note: API delete board
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

// Router.route('/')
//   .get((req, res) => {
//     res.status(StatusCodes.OK).json({ message: 'Note: API get list post' })
//   })
// // .post(postValidation.createNew, postController.createNew)

// Router.route('/:id')
//   .get(postController.getDetails)
//   .put((req, res) => {
//     res.status(StatusCodes.OK).json({ message: 'Note: API update post' })
//   })
//   .delete((req, res) => {
//     res.status(StatusCodes.OK).json({ message: 'Note: API delete post' })
//   })

// get list route
Router.route('/')
  .get(verifyToken, boardController.getList) // get list board
  .post(verifyToken, boardController.createNew) // create new board

// get detail route
Router.route('/:id')
  .get(verifyToken, boardController.getDetail) // get detail board
  .put(verifyToken, boardController.update) // update board
  .patch(verifyToken, boardController.updatePartial) // update partial board
  .delete(verifyToken, boardController.deleteItem) // delete board

export const boardRoute = Router