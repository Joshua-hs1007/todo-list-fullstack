import type {
  CreateTaskInput,
  TaskListQuery,
  TaskReorderInput,
  UpdateTaskInput,
} from './task.schemas.js';
import type { Task } from '../../generated/prisma/index.js';

import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

export interface TaskService {
  list(userId: string, query: TaskListQuery): Promise<Task[]>;
  create(userId: string, input: CreateTaskInput): Promise<Task>;
  get(userId: string, taskId: string): Promise<Task>;
  update(userId: string, taskId: string, input: UpdateTaskInput): Promise<Task>;
  delete(userId: string, taskId: string): Promise<void>;
  reorder(userId: string, input: TaskReorderInput): Promise<Task[]>;
}

function parseOptionalDate(value: string | undefined) {
  return value ? new Date(value) : undefined;
}

export function createTaskService(database = prisma): TaskService {
  async function assertAccess(userId: string, taskId: string) {
    const task = await database.task.findUnique({ where: { id: taskId } });

    if (!task) {
      throw new AppError(404, 'Task was not found.', 'TASK_NOT_FOUND');
    }

    if (task.userId !== userId) {
      throw new AppError(403, 'You cannot access this task.', 'FORBIDDEN');
    }

    return task;
  }

  return {
    async list(userId, query) {
      return database.task.findMany({
        where: {
          userId,
          status: query.status,
          OR: query.search
            ? [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
              ]
            : undefined,
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      });
    },

    async create(userId, input) {
      const lastTask = await database.task.aggregate({
        where: { userId },
        _max: { position: true },
      });

      return database.task.create({
        data: {
          userId,
          title: input.title,
          description: input.description,
          status: input.status ?? 'TODO',
          dueDate: parseOptionalDate(input.dueDate),
          position: (lastTask._max.position ?? -1) + 1,
        },
      });
    },

    async get(userId, taskId) {
      return assertAccess(userId, taskId);
    },

    async update(userId, taskId, input) {
      await assertAccess(userId, taskId);

      return database.task.update({
        where: { id: taskId },
        data: {
          title: input.title,
          description: input.description,
          status: input.status,
          dueDate: parseOptionalDate(input.dueDate),
        },
      });
    },

    async delete(userId, taskId) {
      await assertAccess(userId, taskId);
      await database.task.delete({ where: { id: taskId } });
    },

    async reorder(userId, input) {
      const requestedIds = input.orderedTaskIds;
      const ownedTasks = await database.task.findMany({
        where: {
          userId,
          id: { in: requestedIds },
        },
        select: { id: true },
      });

      if (ownedTasks.length !== requestedIds.length) {
        const existingTasks = await database.task.findMany({
          where: { id: { in: requestedIds } },
          select: { id: true, userId: true },
        });

        const hasAnotherUsersTask = existingTasks.some((task) => task.userId !== userId);

        if (hasAnotherUsersTask) {
          throw new AppError(403, 'Reorder includes a task owned by another user.', 'FORBIDDEN');
        }

        throw new AppError(404, 'One or more tasks were not found.', 'TASK_NOT_FOUND');
      }

      await database.$transaction(
        requestedIds.map((id, position) =>
          database.task.update({
            where: { id },
            data: { position },
          }),
        ),
      );

      return database.task.findMany({
        where: { userId },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      });
    },
  };
}

export const taskService = createTaskService();
