import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoute } from './boardRoute'
import { columnRoute } from './columnRoute'
import { cardRoute } from './cardRoute'
import { authRoute } from './authRoute'
import { userRoute } from './userRoute'

const Router = express.Router()

// Check APIs v1 status
Router.get('/status', (req, res) => {
    res.status(StatusCodes.OK).json({ message: 'APIs V1 is working' })
})

// Auth APIs
Router.use('/auth', authRoute)

// User APIs
Router.use('/users', userRoute)

// Board APIs
Router.use('/boards', boardRoute)

// Column APIs
Router.use('/columns', columnRoute)

// Card APIs
Router.use('/cards', cardRoute)


export const APIs_V1 = Router