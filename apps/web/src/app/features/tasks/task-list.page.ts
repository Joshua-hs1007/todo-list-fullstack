import { CdkDrag, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ApiTask, TaskSaveInput } from '../../core/api/api-client';
import { NotificationService } from '../../core/notifications/notification.service';
import { TaskCardComponent } from './task-card.component';
import { TaskSearchComponent } from './task-search.component';
import { TaskSummaryComponent } from './task-summary.component';
import { TaskStore } from './task.store';
import type { TaskStatusFilter } from './task.store';

type TaskStatus = ApiTask['status'];

const taskStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

@Component({
  standalone: true,
  imports: [
    CdkDrag,
    CdkDropList,
    RouterLink,
    TaskCardComponent,
    TaskSearchComponent,
    TaskSummaryComponent,
  ],
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

      <app-task-summary
        [total]="totalTasks()"
        [todo]="todoTaskCount()"
        [inProgress]="inProgressTasks()"
        [done]="doneTasks()"
      />

      <app-task-search (queryChange)="search($event)" />

      @if (store.error()) {
        <p class="error" role="alert">{{ store.error() }}</p>
      }

      @if (store.loading()) {
        <div class="state-panel" aria-live="polite">Loading tasks...</div>
      } @else {
        @if (store.tasks().length) {
          <div class="task-board" aria-label="Task board">
            <section class="task-column">
              <header class="column-header">
                <h2>To do</h2>
                <span>{{ todoTaskItems().length }}</span>
              </header>
              <div
                cdkDropList
                id="TODO"
                class="task-list"
                [cdkDropListData]="todoTaskItems()"
                [cdkDropListConnectedTo]="columnIds"
                (cdkDropListDropped)="drop($event, 'TODO')"
              >
                @for (task of todoTaskItems(); track task.id) {
                  <div cdkDrag [cdkDragData]="task">
                    <app-task-card
                      [task]="task"
                      [showStatus]="false"
                      (delete)="requestDelete($event)"
                    />
                  </div>
                } @empty {
                  <div class="column-empty">Drop to mark as to do.</div>
                }
              </div>
            </section>

            <section class="task-column">
              <header class="column-header">
                <h2>In progress</h2>
                <span>{{ inProgressTaskItems().length }}</span>
              </header>
              <div
                cdkDropList
                id="IN_PROGRESS"
                class="task-list"
                [cdkDropListData]="inProgressTaskItems()"
                [cdkDropListConnectedTo]="columnIds"
                (cdkDropListDropped)="drop($event, 'IN_PROGRESS')"
              >
                @for (task of inProgressTaskItems(); track task.id) {
                  <div cdkDrag [cdkDragData]="task">
                    <app-task-card
                      [task]="task"
                      [showStatus]="false"
                      (delete)="requestDelete($event)"
                    />
                  </div>
                } @empty {
                  <div class="column-empty">Drop to start work.</div>
                }
              </div>
            </section>

            <section class="task-column">
              <header class="column-header">
                <h2>Done</h2>
                <span>{{ doneTaskItems().length }}</span>
              </header>
              <div
                cdkDropList
                id="DONE"
                class="task-list"
                [cdkDropListData]="doneTaskItems()"
                [cdkDropListConnectedTo]="columnIds"
                (cdkDropListDropped)="drop($event, 'DONE')"
              >
                @for (task of doneTaskItems(); track task.id) {
                  <div cdkDrag [cdkDragData]="task">
                    <app-task-card
                      [task]="task"
                      [showStatus]="false"
                      (delete)="requestDelete($event)"
                    />
                  </div>
                } @empty {
                  <div class="column-empty">Drop when complete.</div>
                }
              </div>
            </section>
          </div>
        } @else {
          <div class="state-panel empty">
            <h2>No tasks found</h2>
            <p>Create a task or adjust the current search and status filters.</p>
            <a routerLink="/tasks/new" class="secondary-button">Create task</a>
          </div>
        }
      }
    </section>

    @if (pendingDeleteTask(); as task) {
      <div class="modal-backdrop" role="presentation" (click)="cancelDelete()">
        <section
          class="confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          (click)="$event.stopPropagation()"
        >
          <h2 id="delete-dialog-title">Delete task?</h2>
          <p>
            This will permanently remove <strong>{{ task.title }}</strong> from your task list.
          </p>
          <div class="modal-actions">
            <button type="button" class="secondary-action" (click)="cancelDelete()">Cancel</button>
            <button
              type="button"
              class="danger-action"
              [disabled]="store.saving()"
              (click)="confirmDelete()"
            >
              {{ store.saving() ? 'Deleting...' : 'Delete task' }}
            </button>
          </div>
        </section>
      </div>
    }
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

      .task-board {
        align-items: start;
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(3, minmax(240px, 1fr));
      }

      .task-column {
        background: var(--surface-muted);
        border: 1px solid var(--border);
        border-radius: 8px;
        display: grid;
        gap: 0.75rem;
        min-width: 0;
        padding: 0.75rem;
      }

      .column-header {
        align-items: center;
        display: flex;
        justify-content: space-between;
      }

      .column-header h2 {
        font-size: 1rem;
        margin: 0;
      }

      .column-header span {
        align-items: center;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 999px;
        color: var(--muted);
        display: inline-flex;
        font-size: 0.78rem;
        font-weight: 800;
        height: 1.65rem;
        justify-content: center;
        min-width: 1.65rem;
        padding: 0 0.45rem;
      }

      .task-list {
        display: grid;
        gap: 0.75rem;
        min-height: 8rem;
      }

      .column-empty {
        border: 1px dashed var(--border-strong);
        border-radius: 8px;
        color: var(--muted);
        font-size: 0.9rem;
        padding: 1rem;
        text-align: center;
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

      .modal-backdrop {
        align-items: center;
        background: rgb(15 23 42 / 46%);
        display: flex;
        inset: 0;
        justify-content: center;
        padding: 1rem;
        position: fixed;
        z-index: 30;
      }

      .confirm-modal {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow-md);
        max-width: 420px;
        padding: 1.25rem;
        width: 100%;
      }

      .confirm-modal h2 {
        font-size: 1.25rem;
        margin-bottom: 0.5rem;
      }

      .confirm-modal p {
        color: var(--muted);
        margin-bottom: 1.25rem;
      }

      .confirm-modal strong {
        color: var(--text);
      }

      .modal-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }

      .modal-actions button {
        border-radius: 6px;
        font-weight: 750;
        min-height: 2.5rem;
        padding: 0.55rem 0.85rem;
      }

      .secondary-action {
        background: #ffffff;
        border: 1px solid var(--border-strong);
        color: var(--text);
      }

      .danger-action {
        background: var(--danger);
        border: 1px solid var(--danger);
        color: #ffffff;
      }

      @media (max-width: 920px) {
        .page-header {
          align-items: flex-start;
          flex-direction: column;
        }

        .task-board {
          grid-template-columns: 1fr;
        }

        .modal-actions {
          flex-direction: column-reverse;
        }
      }
    `,
  ],
})
export class TaskListPage implements OnInit {
  readonly store = inject(TaskStore);
  private readonly notifications = inject(NotificationService);
  readonly columnIds = taskStatuses;
  readonly pendingDeleteTask = signal<ApiTask | null>(null);
  readonly totalTasks = computed(() => this.store.tasks().length);
  readonly todoTaskItems = computed(() => this.tasksByStatus('TODO'));
  readonly inProgressTaskItems = computed(() => this.tasksByStatus('IN_PROGRESS'));
  readonly doneTaskItems = computed(() => this.tasksByStatus('DONE'));
  readonly todoTaskCount = computed(
    () => this.store.tasks().filter((task) => task.status === 'TODO').length,
  );
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

  async drop(event: CdkDragDrop<ApiTask[]>, targetStatus: TaskStatus) {
    const task = event.item.data as ApiTask | undefined;

    if (!task) {
      return;
    }

    const columns = this.createColumns();
    const sourceTasks = columns[task.status];
    const targetTasks = columns[targetStatus];
    const sourceIndex = sourceTasks.findIndex((item) => item.id === task.id);

    if (sourceIndex === -1) {
      return;
    }

    if (task.status === targetStatus) {
      moveItemInArray(targetTasks, sourceIndex, event.currentIndex);
    } else {
      sourceTasks.splice(sourceIndex, 1);
      transferArrayItem(
        [{ ...task, status: targetStatus }],
        targetTasks,
        0,
        event.currentIndex,
      );

      const updated = await this.store.updateTask(
        task.id,
        this.statusUpdateInput(task, targetStatus),
      );

      if (!updated) {
        await this.store.loadTasks();
        return;
      }
    }

    await this.store.reorderTasks(this.flattenColumns(columns));
  }

  requestDelete(id: string) {
    const task = this.store.tasks().find((item) => item.id === id);

    if (task) {
      this.pendingDeleteTask.set(task);
    }
  }

  cancelDelete() {
    this.pendingDeleteTask.set(null);
  }

  async confirmDelete() {
    const task = this.pendingDeleteTask();

    if (!task) {
      return;
    }

    const deleted = await this.store.deleteTask(task.id);

    if (deleted) {
      this.pendingDeleteTask.set(null);
      this.notifications.showSuccess('Task deleted.');
    }
  }

  private tasksByStatus(status: TaskStatus) {
    return this.store.tasks().filter((task) => task.status === status);
  }

  private createColumns() {
    return {
      TODO: this.todoTaskItems().map((task) => ({ ...task })),
      IN_PROGRESS: this.inProgressTaskItems().map((task) => ({ ...task })),
      DONE: this.doneTaskItems().map((task) => ({ ...task })),
    } satisfies Record<TaskStatus, ApiTask[]>;
  }

  private flattenColumns(columns: Record<TaskStatus, ApiTask[]>) {
    return taskStatuses.flatMap((status) => columns[status]);
  }

  private statusUpdateInput(task: ApiTask, status: TaskStatus): TaskSaveInput {
    return {
      title: task.title,
      description: task.description ?? undefined,
      dueDate: task.dueDate ?? undefined,
      status,
    };
  }
}
