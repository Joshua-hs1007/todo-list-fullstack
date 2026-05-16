import { z } from 'zod';

export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

export const taskIdParamsSchema = z.object({
  id: z.string().min(1)
});

export const taskListQuerySchema = z.object({
  search: z.string().optional(),
  status: taskStatusSchema.optional()
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  status: taskStatusSchema.optional(),
  dueDate: z.string().datetime().optional()
});

export const updateTaskSchema = createTaskSchema.partial().refine((input) => Object.keys(input).length > 0, {
  message: 'At least one task field is required.'
});

export const taskReorderSchema = z.object({
  orderedTaskIds: z.array(z.string().min(1)).min(1)
}).refine((input) => new Set(input.orderedTaskIds).size === input.orderedTaskIds.length, {
  message: 'Task IDs must be unique.'
});

export type TaskStatusInput = z.infer<typeof taskStatusSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
export type TaskReorderInput = z.infer<typeof taskReorderSchema>;
