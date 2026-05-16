import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, signal } from '@angular/core';

import type { ApiTask } from '../../core/api/api-client';
import { TaskCardComponent } from './task-card.component';
import { TaskSearchComponent } from './task-search.component';

@Component({
  standalone: true,
  imports: [CdkDrag, CdkDropList, TaskCardComponent, TaskSearchComponent],
  template: `
    <section class="tasks-page">
      <header>
        <h1>Tasks</h1>
        <button type="button">New task</button>
      </header>

      <app-task-search />

      <div cdkDropList class="task-list">
        @for (task of tasks(); track task.id) {
          <div cdkDrag>
            <app-task-card [task]="task" />
          </div>
        } @empty {
          <p class="empty">No tasks yet.</p>
        }
      </div>
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

      .empty {
        color: #52627a;
      }
    `
  ]
})
export class TaskListPage {
  readonly tasks = signal<ApiTask[]>([]);
}
