import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';

const apiUrl = environment.apiUrl;

export interface ApiUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface ApiTask {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  register(input: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${apiUrl}/auth/register`, input);
  }

  login(input: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${apiUrl}/auth/login`, input);
  }

  me() {
    return this.http.get<{ user: ApiUser }>(`${apiUrl}/auth/me`);
  }

  listTasks(query: { search?: string; status?: ApiTask['status'] }) {
    let params = new HttpParams();

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    return this.http.get<{ tasks: ApiTask[] }>(`${apiUrl}/tasks`, { params });
  }

  getTask(id: string) {
    return this.http.get<{ task: ApiTask }>(`${apiUrl}/tasks/${id}`);
  }

  createTask(input: TaskSaveInput) {
    return this.http.post<{ task: ApiTask }>(`${apiUrl}/tasks`, input);
  }

  updateTask(id: string, input: TaskSaveInput) {
    return this.http.patch<{ task: ApiTask }>(`${apiUrl}/tasks/${id}`, input);
  }

  deleteTask(id: string) {
    return this.http.delete<{ id: string }>(`${apiUrl}/tasks/${id}`);
  }

  reorderTasks(orderedTaskIds: string[]) {
    return this.http.patch<{ tasks: ApiTask[] }>(`${apiUrl}/tasks/reorder`, { orderedTaskIds });
  }
}

export interface TaskSaveInput {
  title: string;
  description?: string;
  status?: ApiTask['status'];
  dueDate?: string;
}
