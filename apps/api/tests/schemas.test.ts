import { loginSchema, registerSchema } from '../src/modules/auth/auth.schemas.js';
import {
  createTaskSchema,
  taskIdParamsSchema,
  taskListQuerySchema,
  taskReorderSchema,
  updateTaskSchema,
} from '../src/modules/tasks/task.schemas.js';

describe('request schemas', () => {
  it('validates auth payloads', () => {
    expect(
      registerSchema.safeParse({ email: 'user@example.com', password: 'password123' }).success,
    ).toBe(true);
    expect(loginSchema.safeParse({ email: 'not-email', password: '' }).success).toBe(false);
  });

  it('rejects empty updates and duplicate reorder IDs', () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(false);
    expect(taskReorderSchema.safeParse({ orderedTaskIds: ['task-1', 'task-1'] }).success).toBe(
      false,
    );
  });

  it('validates task params, filters, and write payloads', () => {
    expect(taskIdParamsSchema.safeParse({ id: 'task-1' }).success).toBe(true);
    expect(taskListQuerySchema.safeParse({ search: 'invoice', status: 'DONE' }).success).toBe(
      true,
    );
    expect(
      createTaskSchema.safeParse({
        title: 'Task',
        status: 'IN_PROGRESS',
        dueDate: '2026-06-01T00:00:00.000Z',
      }).success,
    ).toBe(true);
    expect(createTaskSchema.safeParse({ title: '   ' }).success).toBe(false);
    expect(taskListQuerySchema.safeParse({ status: 'INVALID' }).success).toBe(false);
  });
});
