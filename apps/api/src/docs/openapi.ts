const errorResponse = {
  description: 'Error response',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
};

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'To Do List API',
    version: '0.1.0',
  },
  servers: [{ url: 'http://localhost:3000' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': {
            description: 'API is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', example: 'ok' } },
                  required: ['status'],
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Register a user',
        requestBody: { $ref: '#/components/requestBodies/AuthCredentials' },
        responses: {
          '201': { $ref: '#/components/responses/AuthSuccess' },
          '400': errorResponse,
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Log in',
        requestBody: { $ref: '#/components/requestBodies/AuthCredentials' },
        responses: {
          '200': { $ref: '#/components/responses/AuthSuccess' },
          '400': errorResponse,
          '401': errorResponse,
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Authenticated user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/User' } },
                  required: ['user'],
                },
              },
            },
          },
          '401': errorResponse,
        },
      },
    },
    '/api/tasks': {
      get: {
        summary: 'List tasks',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/TaskStatus' } },
        ],
        responses: {
          '200': { $ref: '#/components/responses/TaskList' },
          '401': errorResponse,
        },
      },
      post: {
        summary: 'Create task',
        security: [{ bearerAuth: [] }],
        requestBody: { $ref: '#/components/requestBodies/TaskWrite' },
        responses: {
          '201': { $ref: '#/components/responses/TaskSingle' },
          '400': errorResponse,
          '401': errorResponse,
        },
      },
    },
    '/api/tasks/reorder': {
      patch: {
        summary: 'Reorder tasks',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  orderedTaskIds: {
                    type: 'array',
                    minItems: 1,
                    items: { type: 'string' },
                  },
                },
                required: ['orderedTaskIds'],
              },
            },
          },
        },
        responses: {
          '200': { $ref: '#/components/responses/TaskList' },
          '400': errorResponse,
          '401': errorResponse,
          '403': errorResponse,
          '404': errorResponse,
        },
      },
    },
    '/api/tasks/{id}': {
      get: {
        summary: 'Get task',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TaskId' }],
        responses: {
          '200': { $ref: '#/components/responses/TaskSingle' },
          '401': errorResponse,
          '403': errorResponse,
          '404': errorResponse,
        },
      },
      patch: {
        summary: 'Update task',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TaskId' }],
        requestBody: { $ref: '#/components/requestBodies/TaskWrite' },
        responses: {
          '200': { $ref: '#/components/responses/TaskSingle' },
          '400': errorResponse,
          '401': errorResponse,
          '403': errorResponse,
          '404': errorResponse,
        },
      },
      delete: {
        summary: 'Delete task',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TaskId' }],
        responses: {
          '200': {
            description: 'Task deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { id: { type: 'string' } },
                  required: ['id'],
                },
              },
            },
          },
          '401': errorResponse,
          '403': errorResponse,
          '404': errorResponse,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    parameters: {
      TaskId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    },
    requestBodies: {
      AuthCredentials: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 8 },
              },
              required: ['email', 'password'],
            },
          },
        },
      },
      TaskWrite: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string', minLength: 1 },
                description: { type: 'string' },
                status: { $ref: '#/components/schemas/TaskStatus' },
                dueDate: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
    responses: {
      AuthSuccess: {
        description: 'Authenticated session',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: { $ref: '#/components/schemas/User' },
              },
              required: ['token', 'user'],
            },
          },
        },
      },
      TaskSingle: {
        description: 'Task response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { task: { $ref: '#/components/schemas/Task' } },
              required: ['task'],
            },
          },
        },
      },
      TaskList: {
        description: 'Task list response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                tasks: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Task' },
                },
              },
              required: ['tasks'],
            },
          },
        },
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
        required: ['id', 'email'],
      },
      TaskStatus: {
        type: 'string',
        enum: ['TODO', 'IN_PROGRESS', 'DONE'],
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          title: { type: 'string' },
          description: { type: ['string', 'null'] },
          status: { $ref: '#/components/schemas/TaskStatus' },
          dueDate: { type: ['string', 'null'], format: 'date-time' },
          position: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'userId', 'title', 'status', 'position', 'createdAt', 'updatedAt'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
              details: {},
            },
            required: ['message', 'code'],
          },
        },
        required: ['error'],
      },
    },
  },
} as const;
