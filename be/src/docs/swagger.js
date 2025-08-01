/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated user ID
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password (will be hashed)
 *         name:
 *           type: string
 *           description: User's full name
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: User last update timestamp
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: User deletion timestamp
 *         status:
 *           type: string
 *           enum: [online, banned, disabled]
 *           description: User status
 *         avatar:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           description: User avatar
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
 *         ownerId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Board owner ID
 *         isPublic:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *           description: Board visibility (0 = private, 1 = public)
 *         companyId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Company ID
 *         departmentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Department ID
 *         createdBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: User who created the board
 *         updatedBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: User who last updated the board
 *         deletedBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: User who deleted the board
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Board creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Board last update timestamp
 *         deletedAt:
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
 * tags:
 *   - name: Authentication
 *     description: User authentication endpoints
 *   - name: Boards
 *     description: Board management endpoints
 *   - name: Test
 *     description: Test endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
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
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               code: 200
 *               status: success
 *               message: Login successfully
 *               data:
 *                 id: 1
 *                 email: user@example.com
 *                 name: John Doe
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               code: 200
 *               status: success
 *               message: List of boards retrieved successfully
 *               data:
 *                 - id: 1
 *                   title: My Project Board
 *                   description: A board for managing project tasks
 *                   icon: 📋
 *                   isPublic: 1
 *                 - id: 2
 *                   title: My Personal Board
 *                   description: A board for personal tasks
 *                   icon: 📝
 *                   isPublic: 0
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
 *               companyId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               departmentId:
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
 *                 isPublic: 1
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
 *                 isPublic: 1
 *                 ownerId: 123e4567-e89b-12d3-a456-426614174002
 *                 companyId: 123e4567-e89b-12d3-a456-426614174003
 *                 departmentId: 123e4567-e89b-12d3-a456-426614174004
 *                 createdAt: 2024-01-01T00:00:00.000Z
 *                 updatedAt: 2024-01-01T00:00:00.000Z
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
 *               companyId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *     responses:
 *       201:
 *         description: Board updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               code: 201
 *               status: success
 *               message: Board updated successfully
 *               data:
 *                 id: 123e4567-e89b-12d3-a456-426614174000
 *                 title: My Project Board
 *                 description: A board for managing project tasks
 *                 icon: 📋
 *                 isPublic: 1
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
 *               companyId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Board updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               code: 200
 *               status: success
 *               message: Board updated successfully
 *               data:
 *                 id: 123e4567-e89b-12d3-a456-426614174000
 *                 title: My Project Board
 *                 description: A board for managing project tasks
 *                 icon: 📋
 *                 isPublic: 1
 *                 ownerId: 123e4567-e89b-12d3-a456-426614174002
 *                 companyId: 123e4567-e89b-12d3-a456-426614174003
 *                 departmentId: 123e4567-e89b-12d3-a456-426614174004
 *                 createdAt: 2024-01-01T00:00:00.000Z
 *                 updatedAt: 2024-01-01T00:00:00.000Z
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
 *             example:
 *               code: 200
 *               status: success
 *               message: Board deleted successfully
 *               data:
 *                 id: 123e4567-e89b-12d3-a456-426614174000
 *                 title: My Project Board
 *                 description: A board for managing project tasks
 *                 icon: 📋
 *                 isPublic: 1
 *                 ownerId: 123e4567-e89b-12d3-a456-426614174002
 *                 companyId: 123e4567-e89b-12d3-a456-426614174003
 *                 departmentId: 123e4567-e89b-12d3-a456-426614174004
 *                 createdAt: 2024-01-01T00:00:00.000Z
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
