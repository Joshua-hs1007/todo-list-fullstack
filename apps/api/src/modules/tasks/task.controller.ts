import type { Request, Response } from 'express';

import { AppError } from '../../lib/errors.js';
import { taskService } from './task.service.js';
import type { TaskListQuery } from './task.schemas.js';

function getUserId(request: Request) {
  if (!request.user) {
    throw new AppError(401, 'Authentication is required.', 'UNAUTHORIZED');
  }

  return request.user.id;
}

function getTaskId(request: Request) {
  const id = request.params.id;

  if (typeof id !== 'string') {
    throw new AppError(400, 'Task ID is invalid.', 'VALIDATION_ERROR');
  }

  return id;
}

export async function listTasks(request: Request, response: Response) {
  const tasks = await taskService.list(getUserId(request), request.query as TaskListQuery);

  response.status(200).json({ tasks });
}

export async function createTask(request: Request, response: Response) {
  const task = await taskService.create(getUserId(request), request.body);

  response.status(201).json({ task });
}

export async function getTask(request: Request, response: Response) {
  const task = await taskService.get(getUserId(request), getTaskId(request));

  response.status(200).json({ task });
}

export async function updateTask(request: Request, response: Response) {
  const task = await taskService.update(getUserId(request), getTaskId(request), request.body);

  response.status(200).json({ task });
}

export async function deleteTask(request: Request, response: Response) {
  const id = getTaskId(request);

  await taskService.delete(getUserId(request), id);

  response.status(200).json({ id });
}

export async function reorderTasks(request: Request, response: Response) {
  const tasks = await taskService.reorder(getUserId(request), request.body);

  response.status(200).json({ tasks });
}
