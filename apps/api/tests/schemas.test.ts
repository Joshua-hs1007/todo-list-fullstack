import { loginSchema, registerSchema } from '../src/modules/auth/auth.schemas.js';
import { taskReorderSchema, updateTaskSchema } from '../src/modules/tasks/task.schemas.js';

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
});
