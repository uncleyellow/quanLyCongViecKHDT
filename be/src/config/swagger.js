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
      {
        url: 'https://ratraco-task-management.salution.site/v1',
        description: 'Production server',
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
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Boards',
        description: 'Board management endpoints',
      },
      {
        name: 'Columns',
        description: 'Column management endpoints',
      },
      {
        name: 'Cards',
        description: 'Card management endpoints',
      },
    ],
  },
  apis: ['./src/routes/v1/*.js', './src/controllers/*.js', './src/docs/*.js'], // Path to the API docs
}

const specs = swaggerJsdoc(options)

// Cấu hình Swagger UI với CDN
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Ratraco Task Management API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
  // Sử dụng CDN thay vì serve files từ node_modules
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
  ],
  customCssUrl: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
  ],
}

// HTML tùy chỉnh cho Swagger UI
const customSwaggerHtml = (specs) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ratraco Task Management API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css" />
        <style>
            html {
                box-sizing: border-box;
                overflow: -moz-scrollbars-vertical;
                overflow-y: scroll;
            }
            *, *:before, *:after {
                box-sizing: inherit;
            }
            body {
                margin:0;
                background: #fafafa;
            }
            .swagger-ui .topbar {
                display: none;
            }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js"></script>
        <script>
            window.onload = function() {
                const ui = SwaggerUIBundle({
                    spec: ${JSON.stringify(specs)},
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    plugins: [
                        SwaggerUIBundle.plugins.DownloadUrl
                    ],
                    layout: "StandaloneLayout",
                    persistAuthorization: true,
                    displayRequestDuration: true,
                    filter: true,
                    showExtensions: true,
                    showCommonExtensions: true
                });
            };
        </script>
    </body>
    </html>
  `;
};

export { swaggerUi, specs, swaggerOptions, customSwaggerHtml } 