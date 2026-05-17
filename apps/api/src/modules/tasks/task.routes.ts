import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  reorderTasks,
  updateTask,
} from './task.controller.js';
import {
  createTaskSchema,
  taskIdParamsSchema,
  taskListQuerySchema,
  taskReorderSchema,
  updateTaskSchema,
} from './task.schemas.js';

export const taskRoutes: ExpressRouter = Router();

taskRoutes.use(requireAuth);
taskRoutes.get('/', validateRequest({ query: taskListQuerySchema }), listTasks);
taskRoutes.post('/', validateRequest({ body: createTaskSchema }), createTask);
taskRoutes.patch('/reorder', validateRequest({ body: taskReorderSchema }), reorderTasks);
taskRoutes.get('/:id', validateRequest({ params: taskIdParamsSchema }), getTask);
taskRoutes.patch(
  '/:id',
  validateRequest({ params: taskIdParamsSchema, body: updateTaskSchema }),
  updateTask,
);
taskRoutes.delete('/:id', validateRequest({ params: taskIdParamsSchema }), deleteTask);
