import express from 'express'
import { columnValidation } from '../../validations/columnValidation'
import { columnController } from '../../controllers/columnController'
import { StatusCodes } from 'http-status-codes'

const Router = express.Router()

Router.route('/')
    .post(columnValidation.createNew, columnController.createNew)

Router.route('/:id')
    .put((req, res) => {
        res.status(StatusCodes.OK).json({ message: 'Note: API update board' })
    })
   
export const columnRoute = Router