const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'RollMaster API',
      version: '1.0.0',
      description: 'Documentation for RollMaster API'
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Local Server'
      },
      {
        url: 'https://rollmaster.itsabacus.net/',
        description: 'ACS Server'
      }
    ]
  },
  apis: ['./server.js'] // Path to the API routes
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;