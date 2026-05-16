import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

const apiUrl = '/api';

export interface ApiTask {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string;
  position: number;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  listTasks(query: { search?: string; status?: ApiTask['status'] }) {
    let params = new HttpParams();

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    return this.http.get<ApiTask[]>(`${apiUrl}/tasks`, { params });
  }

  getTask(id: string) {
    return this.http.get<ApiTask>(`${apiUrl}/tasks/${id}`);
  }

  createTask(input: Partial<ApiTask>) {
    return this.http.post<ApiTask>(`${apiUrl}/tasks`, input);
  }

  updateTask(id: string, input: Partial<ApiTask>) {
    return this.http.patch<ApiTask>(`${apiUrl}/tasks/${id}`, input);
  }

  deleteTask(id: string) {
    return this.http.delete<{ id: string }>(`${apiUrl}/tasks/${id}`);
  }

  reorderTasks(orderedTaskIds: string[]) {
    return this.http.patch<ApiTask[]>(`${apiUrl}/tasks/reorder`, { orderedTaskIds });
  }
}
