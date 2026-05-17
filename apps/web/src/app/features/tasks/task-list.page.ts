import { CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, computed, inject } from '@angular/core';
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
      <header class="page-header">
        <div>
          <p class="eyebrow">Personal workflow</p>
          <h1>Tasks</h1>
          <p class="subtitle">Plan, prioritize, and reorder work without leaving the list.</p>
        </div>
        <a routerLink="/tasks/new" class="button">New task</a>
      </header>

      <div class="summary-grid" aria-label="Task summary">
        <div>
          <span>Total</span>
          <strong>{{ totalTasks() }}</strong>
        </div>
        <div>
          <span>In progress</span>
          <strong>{{ inProgressTasks() }}</strong>
        </div>
        <div>
          <span>Done</span>
          <strong>{{ doneTasks() }}</strong>
        </div>
      </div>

      <app-task-search (queryChange)="search($event)" />

      @if (store.error()) {
        <p class="error" role="alert">{{ store.error() }}</p>
      }

      @if (store.loading()) {
        <div class="state-panel" aria-live="polite">Loading tasks...</div>
      } @else {
        <div cdkDropList class="task-list" (cdkDropListDropped)="drop($event)">
          @for (task of store.tasks(); track task.id) {
            <div cdkDrag>
              <app-task-card [task]="task" (delete)="deleteTask($event)" />
            </div>
          } @empty {
            <div class="state-panel empty">
              <h2>No tasks found</h2>
              <p>Create a task or adjust the current search and status filters.</p>
              <a routerLink="/tasks/new" class="secondary-button">Create task</a>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .tasks-page {
        display: grid;
        gap: 1.1rem;
      }

      .page-header {
        align-items: center;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
      }

      .eyebrow {
        color: var(--primary);
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        margin-bottom: 0.35rem;
        text-transform: uppercase;
      }

      h1 {
        font-size: clamp(2rem, 5vw, 3.25rem);
        line-height: 1.05;
        margin-bottom: 0.4rem;
      }

      .subtitle {
        color: var(--muted);
        margin-bottom: 0;
      }

      .summary-grid {
        display: grid;
        gap: 0.8rem;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .summary-grid div {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow-sm);
        display: grid;
        gap: 0.2rem;
        padding: 1rem;
      }

      .summary-grid span {
        color: var(--muted);
        font-size: 0.8rem;
        font-weight: 750;
      }

      .summary-grid strong {
        color: var(--text);
        font-size: 1.7rem;
        line-height: 1;
      }

      .task-list {
        display: grid;
        gap: 0.75rem;
      }

      .button,
      .secondary-button {
        align-items: center;
        border-radius: 6px;
        display: inline-flex;
        font-weight: 750;
        justify-content: center;
        min-height: 2.5rem;
        text-decoration: none;
      }

      .button {
        background: var(--primary);
        border: 1px solid var(--primary);
        border-radius: 6px;
        color: #ffffff;
        padding: 0.62rem 0.95rem;
        white-space: nowrap;
      }

      .button:hover {
        background: var(--primary-strong);
      }

      .secondary-button {
        border: 1px solid var(--border-strong);
        color: var(--primary);
        padding: 0.5rem 0.85rem;
        width: fit-content;
      }

      .error {
        background: var(--danger-soft);
        border: 1px solid #ffd1cc;
        border-radius: 6px;
        color: var(--danger);
        margin: 0;
        padding: 0.75rem;
      }

      .state-panel {
        background: var(--surface);
        border: 1px dashed var(--border-strong);
        border-radius: 8px;
        color: var(--muted);
        padding: 2rem;
      }

      .state-panel h2 {
        color: var(--text);
        font-size: 1.2rem;
        margin-bottom: 0.35rem;
      }

      .state-panel p {
        margin-bottom: 1rem;
      }

      .cdk-drag-preview {
        box-shadow: var(--shadow-md);
      }

      .cdk-drag-placeholder {
        opacity: 0.35;
      }

      .cdk-drag-animating {
        transition: transform 180ms ease;
      }

      @media (max-width: 720px) {
        .page-header {
          align-items: flex-start;
          flex-direction: column;
        }

        .summary-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TaskListPage implements OnInit {
  readonly store = inject(TaskStore);
  readonly totalTasks = computed(() => this.store.tasks().length);
  readonly inProgressTasks = computed(
    () => this.store.tasks().filter((task) => task.status === 'IN_PROGRESS').length,
  );
  readonly doneTasks = computed(
    () => this.store.tasks().filter((task) => task.status === 'DONE').length,
  );

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
