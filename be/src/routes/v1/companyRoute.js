import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { companyController } from '../../controllers/companyController'
import { verifyToken } from '../../middlewares/verifyToken'
import { companyValidation } from '../../validations/companyValidation'

const Router = express.Router()

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Get all companies
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
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
 *         description: Search term for company name
 *     responses:
 *       200:
 *         description: List of companies retrieved successfully
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
 *     summary: Create a new company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 example: Acme Corporation
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: A leading technology company
 *               address:
 *                 type: string
 *                 nullable: true
 *                 example: 123 Business Street, City, Country
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: +1-555-0123
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 example: contact@acme.com
 *               website:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 example: https://www.acme.com
 *               industry:
 *                 type: string
 *                 nullable: true
 *                 example: Technology
 *               size:
 *                 type: string
 *                 enum: [startup, small, medium, large, enterprise]
 *                 nullable: true
 *                 example: medium
 *     responses:
 *       201:
 *         description: Company created successfully
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
  .get(verifyToken, companyController.getAllCompanies) // get all companies
  .post(verifyToken, companyValidation.createCompany, companyController.createCompany) // create new company

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company retrieved successfully
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
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update company by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 example: Acme Corporation Updated
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: An updated technology company
 *               address:
 *                 type: string
 *                 nullable: true
 *                 example: 456 New Business Street, City, Country
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: +1-555-0456
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 example: info@acme.com
 *               website:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 example: https://www.acme-updated.com
 *               industry:
 *                 type: string
 *                 nullable: true
 *                 example: Software Development
 *               size:
 *                 type: string
 *                 enum: [startup, small, medium, large, enterprise]
 *                 nullable: true
 *                 example: large
 *     responses:
 *       200:
 *         description: Company updated successfully
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
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete company by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company deleted successfully
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
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
Router.route('/:id')
  .get(verifyToken, companyController.getCompanyById) // get company by ID
  .put(verifyToken, companyValidation.updateCompany, companyController.updateCompany) // update company
  .delete(verifyToken, companyController.deleteCompany) // delete company

export const companyRoute = Router
