import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ratraco Task Management API',
      version: '1.0.0',
      description: 'API documentation for Ratraco Task Management Backend',
      contact: {
        name: 'Ratraco',
        url: 'https://ratraco.vn',
      },
    },
    servers: [
      {
        url: 'http://localhost:2001/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/v1/*.js', './src/controllers/*.js', './src/docs/*.js'], // Path to the API docs
}

const specs = swaggerJsdoc(options)

export { swaggerUi, specs } 