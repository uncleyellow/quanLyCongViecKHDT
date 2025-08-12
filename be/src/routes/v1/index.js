import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoute } from './boardRoute'
import { listRoute } from './listRoute'
import { cardRoute } from './cardRoute'
import { authRoute } from './authRoute'
import { userRoute } from './userRoute'
import { companyRoute } from './companyRoute.js'
import { departmentRoute } from './departmentRoute.js'
import cardTimeTrackingRoute from './cardTimeTrackingRoute'

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

// List APIs
Router.use('/lists', listRoute)

// Card APIs
Router.use('/cards', cardRoute)

// Card Time Tracking APIs
Router.use('/cards', cardTimeTrackingRoute)

// Company APIs
Router.use('/companies', companyRoute)

// Department APIs
Router.use('/departments', departmentRoute)

export const APIs_V1 = Router