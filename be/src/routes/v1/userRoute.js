import express from 'express'
import { StatusCodes } from 'http-status-codes'
// import { postValidation } from '.src/validations/postValidation'
import { userController } from '../../controllers/userController'
import { verifyToken } from '~/middlewares'

const Router = express.Router()

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

// register route
Router.route('/me')
  .get(verifyToken, userController.getMe)


export const userRoute = Router