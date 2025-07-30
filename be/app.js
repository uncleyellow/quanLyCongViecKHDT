import express from 'express'
import exitHook from 'async-exit-hook'
import cors from 'cors'
import { env } from './src/config/environment'
import { APIs_V1 } from './src/routes/v1'
import { errorHandlingMiddleware } from './src/middlewares/errorHandlingMiddleware'
import { corsOptions } from './src/config/cors'
import { swaggerUi, specs } from './src/config/swagger'

const START_SERVER = () => {
  const app = express()

  app.use(cors(corsOptions))

  // Enable req.body json data
  app.use(express.json())

  // Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

  // Use APIs V1
  app.use('/v1', APIs_V1)

  // Middleware xử lý lỗi tập trung
  app.use(errorHandlingMiddleware)

  if (env.BUILD_MODE === 'production') {
    app.listen(process.env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Production: Hello Salad Le, I am running at port: ${process.env.PORT}`)
    })
  } else {
    app.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
      // eslint-disable-next-line no-console
      console.log(`Dev: Hello Salad Le, I am running at http://${env.LOCAL_DEV_APP_HOST}:${env.LOCAL_DEV_APP_PORT}/`)
    })
  }

  exitHook(() => {
    console.log('Closing MongoDB connection...')
  })
}

// Immediately Invoked Function Expression (IIFE)
// Anonymous function that is executed immediately after its creation
(async () => {
  try {
    // console.log('Connecting to MongoDB Cloud Atlas...')
    // await CONNECT_DB()
    // console.log('Connected to MongoDB Cloud Atlas successfully!')
    START_SERVER()
  } catch (error) {
    console.error('Connect to MongoDB Cloud Atlas failure', error)
    process.exit(0)
  }
})()