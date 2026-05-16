import type {
  CreateTaskInput,
  TaskListQuery,
  TaskReorderInput,
  UpdateTaskInput
} from './task.schemas.js';

export interface TaskService {
  list(userId: string, query: TaskListQuery): Promise<unknown[]>;
  create(userId: string, input: CreateTaskInput): Promise<unknown>;
  get(userId: string, taskId: string): Promise<unknown>;
  update(userId: string, taskId: string, input: UpdateTaskInput): Promise<unknown>;
  delete(userId: string, taskId: string): Promise<void>;
  reorder(userId: string, input: TaskReorderInput): Promise<unknown[]>;
}
