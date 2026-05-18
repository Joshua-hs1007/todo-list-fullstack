import cors from 'cors';
import express from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { openApiDocument } from './docs/openapi.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { taskRoutes } from './modules/tasks/task.routes.js';

const healthResponse = {
  name: 'To Do List API',
  description: 'Express API for the full-stack To Do List application.',
  status: 'ok',
};

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json());

  app.get(['/', '/health'], (_request, response) => {
    response.status(200).json(healthResponse);
  });

  app.get('/api/openapi.json', (_request, response) => {
    response.status(200).json(openApiDocument);
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app: Express = createApp();
