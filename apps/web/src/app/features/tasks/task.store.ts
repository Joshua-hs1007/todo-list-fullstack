import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiClient, type ApiTask, type TaskSaveInput } from '../../core/api/api-client';
import { getApiErrorMessage } from '../../core/api/api-error';

export type TaskStatusFilter = ApiTask['status'] | '';

interface TaskState {
  tasks: ApiTask[];
  selectedTask: ApiTask | null;
  search: string;
  status: TaskStatusFilter;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  selectedTask: null,
  search: '',
  status: '',
  loading: false,
  saving: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly api = inject(ApiClient);
  private readonly state = signal<TaskState>(initialState);

  readonly tasks = computed(() => this.state().tasks);
  readonly selectedTask = computed(() => this.state().selectedTask);
  readonly search = computed(() => this.state().search);
  readonly status = computed(() => this.state().status);
  readonly loading = computed(() => this.state().loading);
  readonly saving = computed(() => this.state().saving);
  readonly error = computed(() => this.state().error);

  clearSelectedTask() {
    this.state.update((state) => ({ ...state, selectedTask: null, error: null }));
  }

  setQuery(query: { search: string; status: TaskStatusFilter }) {
    this.state.update((state) => ({
      ...state,
      search: query.search,
      status: query.status,
    }));
  }

  async loadTasks() {
    const { search, status } = this.state();
    this.state.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const response = await firstValueFrom(
        this.api.listTasks({ search, status: status || undefined }),
      );
      this.state.update((state) => ({ ...state, tasks: response.tasks, loading: false }));
    } catch (error) {
      this.state.update((state) => ({
        ...state,
        loading: false,
        error: getApiErrorMessage(error),
      }));
    }
  }

  async loadTask(id: string) {
    this.state.update((state) => ({ ...state, loading: true, error: null, selectedTask: null }));

    try {
      const response = await firstValueFrom(this.api.getTask(id));
      this.state.update((state) => ({
        ...state,
        selectedTask: response.task,
        loading: false,
      }));
    } catch (error) {
      this.state.update((state) => ({
        ...state,
        loading: false,
        error: getApiErrorMessage(error),
      }));
    }
  }

  async createTask(input: TaskSaveInput) {
    return this.save(() => this.api.createTask(input));
  }

  async updateTask(id: string, input: TaskSaveInput) {
    return this.save(() => this.api.updateTask(id, input));
  }

  async deleteTask(id: string) {
    this.state.update((state) => ({ ...state, saving: true, error: null }));

    try {
      await firstValueFrom(this.api.deleteTask(id));
      this.state.update((state) => ({
        ...state,
        tasks: state.tasks.filter((task) => task.id !== id),
        saving: false,
      }));
    } catch (error) {
      this.state.update((state) => ({
        ...state,
        saving: false,
        error: getApiErrorMessage(error),
      }));
    }
  }

  async reorderTasks(tasks: ApiTask[]) {
    this.state.update((state) => ({ ...state, tasks, saving: true, error: null }));

    try {
      const response = await firstValueFrom(this.api.reorderTasks(tasks.map((task) => task.id)));
      this.state.update((state) => ({ ...state, tasks: response.tasks, saving: false }));
    } catch (error) {
      this.state.update((state) => ({
        ...state,
        saving: false,
        error: getApiErrorMessage(error),
      }));
      await this.loadTasks();
    }
  }

  private async save(request: () => ReturnType<ApiClient['createTask'] | ApiClient['updateTask']>) {
    this.state.update((state) => ({ ...state, saving: true, error: null }));

    try {
      const response = await firstValueFrom(request());
      this.state.update((state) => ({
        ...state,
        selectedTask: response.task,
        saving: false,
      }));

      return response.task;
    } catch (error) {
      this.state.update((state) => ({
        ...state,
        saving: false,
        error: getApiErrorMessage(error),
      }));
      return null;
    }
  }
}
