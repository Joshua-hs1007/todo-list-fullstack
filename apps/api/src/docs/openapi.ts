export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'To Do List API',
    version: '0.1.0'
  },
  servers: [{ url: 'http://localhost:3000' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': { description: 'API is running' }
        }
      }
    },
    '/api/auth/register': {
      post: {
        summary: 'Register a user',
        responses: {
          '201': { description: 'User registered' },
          '400': { description: 'Validation error' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Log in',
        responses: {
          '200': { description: 'Authenticated session' },
          '401': { description: 'Invalid credentials' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Authenticated user' },
          '401': { description: 'Missing or invalid token' }
        }
      }
    },
    '/api/tasks': {
      get: {
        summary: 'List tasks',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Task list' }
        }
      },
      post: {
        summary: 'Create task',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Task created' },
          '400': { description: 'Validation error' }
        }
      }
    },
    '/api/tasks/{id}': {
      get: {
        summary: 'Get task',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Task detail' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' }
        }
      },
      patch: {
        summary: 'Update task',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Task updated' },
          '400': { description: 'Validation error' }
        }
      },
      delete: {
        summary: 'Delete task',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Task deleted' }
        }
      }
    },
    '/api/tasks/reorder': {
      patch: {
        summary: 'Reorder tasks',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Tasks reordered' },
          '400': { description: 'Validation error' },
          '403': { description: 'Forbidden' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
} as const;
