import { CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ApiTask } from '../../core/api/api-client';
import { TaskCardComponent } from './task-card.component';
import { TaskSearchComponent } from './task-search.component';
import { TaskStore } from './task.store';
import type { TaskStatusFilter } from './task.store';

@Component({
  standalone: true,
  imports: [CdkDrag, CdkDropList, RouterLink, TaskCardComponent, TaskSearchComponent],
  template: `
    <section class="tasks-page">
      <header>
        <h1>Tasks</h1>
        <a routerLink="/tasks/new" class="button">New task</a>
      </header>

      <app-task-search (queryChange)="search($event)" />

      @if (store.error()) {
        <p class="error" role="alert">{{ store.error() }}</p>
      }

      @if (store.loading()) {
        <p>Loading tasks...</p>
      } @else {
        <div cdkDropList class="task-list" (cdkDropListDropped)="drop($event)">
          @for (task of store.tasks(); track task.id) {
            <div cdkDrag>
              <app-task-card [task]="task" (delete)="deleteTask($event)" />
            </div>
          } @empty {
            <p class="empty">No tasks yet.</p>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .tasks-page {
        display: grid;
        gap: 1rem;
      }

      header {
        align-items: center;
        display: flex;
        justify-content: space-between;
      }

      .task-list {
        display: grid;
        gap: 0.75rem;
      }

      .button {
        background: #315274;
        border-radius: 6px;
        color: #ffffff;
        padding: 0.6rem 0.85rem;
        text-decoration: none;
      }

      .empty {
        color: #52627a;
      }

      .error {
        color: #a4243b;
        margin: 0;
      }
    `,
  ],
})
export class TaskListPage implements OnInit {
  readonly store = inject(TaskStore);

  ngOnInit() {
    void this.store.loadTasks();
  }

  search(query: { search: string; status: TaskStatusFilter }) {
    this.store.setQuery(query);
    void this.store.loadTasks();
  }

  drop(event: CdkDragDrop<ApiTask[]>) {
    const tasks = [...this.store.tasks()];
    moveItemInArray(tasks, event.previousIndex, event.currentIndex);
    void this.store.reorderTasks(tasks);
  }

  deleteTask(id: string) {
    void this.store.deleteTask(id);
  }
}
