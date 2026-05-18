import { Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TaskFormComponent } from './task-form.component';
import { TaskStore } from './task.store';
import type { TaskSaveInput } from '../../core/api/api-client';
import { NotificationService } from '../../core/notifications/notification.service';

@Component({
  standalone: true,
  imports: [RouterLink, TaskFormComponent],
  template: `
    <section class="detail-page">
      <a routerLink="/tasks" class="back-link">Back to tasks</a>
      <header>
        <div>
          <p class="eyebrow">{{ isNew() ? 'Create' : isEditing() ? 'Edit' : 'View' }}</p>
          <h1>{{ isNew() ? 'New task' : 'Task detail' }}</h1>
          <p>Keep the title crisp, add useful context, and update status as work moves.</p>
        </div>
        @if (!isNew() && !store.loading() && store.selectedTask(); as task) {
          <div class="header-actions">
            @if (!isEditing()) {
              <button
                type="button"
                class="icon-action edit-action"
                (click)="startEditing()"
                aria-label="Edit task"
                title="Edit task"
              >
                <span aria-hidden="true">✎</span>
                <span>Edit</span>
              </button>
            }
            <button
              type="button"
              class="icon-action danger-action"
              [disabled]="store.saving()"
              (click)="requestDelete(task.id)"
              aria-label="Delete task"
              title="Delete task"
            >
              <span aria-hidden="true">×</span>
              <span>Delete</span>
            </button>
          </div>
        }
      </header>

      @if (store.loading()) {
        <div class="state-panel" aria-live="polite">Loading task...</div>
      } @else {
        @if (store.error()) {
          <p class="error" role="alert">{{ store.error() }}</p>
        }
        @if (isEditing()) {
          <app-task-form
            [task]="store.selectedTask()"
            [saving]="store.saving()"
            (save)="save($event)"
          />
        } @else {
          @if (store.selectedTask(); as task) {
            <article class="task-detail-card">
              <div>
                <span [class]="statusClass(task.status)">{{ statusLabel(task.status) }}</span>
                <h2>{{ task.title }}</h2>
              </div>
              @if (task.description) {
                <p>{{ task.description }}</p>
              } @else {
                <p class="muted">No description added.</p>
              }
              @if (task.dueDate) {
                <time [dateTime]="task.dueDate">Due {{ formatDueDate(task.dueDate) }}</time>
              }
            </article>
          }
        }
      }
    </section>

    @if (pendingDeleteTaskId()) {
      <div class="modal-backdrop" role="presentation" (click)="cancelDelete()">
        <section
          class="confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          (click)="$event.stopPropagation()"
        >
          <h2 id="delete-dialog-title">Delete task?</h2>
          <p>This will permanently remove this task from your task list.</p>
          <div class="modal-actions">
            <button type="button" class="secondary-action" (click)="cancelDelete()">Cancel</button>
            <button
              type="button"
              class="danger-action solid"
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
      .detail-page {
        display: grid;
        gap: 1.1rem;
      }

      .back-link {
        color: var(--primary);
        font-weight: 750;
        text-decoration: none;
        width: fit-content;
      }

      header {
        align-items: flex-start;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        max-width: 720px;
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
        margin-bottom: 0.5rem;
      }

      header p:not(.eyebrow) {
        color: var(--muted);
        margin-bottom: 0;
      }

      .header-actions {
        align-items: center;
        display: flex;
        flex-shrink: 0;
        gap: 0.6rem;
        padding-top: 0.25rem;
      }

      .icon-action {
        align-items: center;
        background: #ffffff;
        border: 1px solid var(--border-strong);
        border-radius: 6px;
        cursor: pointer;
        display: inline-flex;
        gap: 0.35rem;
        font-weight: 750;
        min-height: 2.4rem;
        padding: 0.5rem 0.75rem;
      }

      .edit-action {
        color: var(--primary);
      }

      .edit-action:hover {
        background: var(--surface-muted);
      }

      .danger-action {
        color: var(--danger);
      }

      .danger-action:hover:not(:disabled) {
        background: var(--danger-soft);
        border-color: #f3b6ae;
      }

      .task-detail-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow-sm);
        display: grid;
        gap: 1rem;
        max-width: 760px;
        padding: clamp(1rem, 3vw, 1.5rem);
      }

      .task-detail-card h2 {
        font-size: 1.6rem;
        margin-top: 0.65rem;
      }

      .task-detail-card p,
      .task-detail-card time,
      .muted {
        color: var(--muted);
      }

      .status {
        border: 1px solid var(--border);
        border-radius: 999px;
        display: inline-flex;
        font-size: 0.78rem;
        font-weight: 800;
        padding: 0.28rem 0.6rem;
        text-transform: capitalize;
        width: fit-content;
      }

      .status-todo {
        background: var(--surface-muted);
        color: var(--muted);
      }

      .status-in-progress {
        background: var(--warning-soft);
        border-color: #f1d081;
        color: var(--warning);
      }

      .status-done {
        background: var(--success-soft);
        border-color: #abd9bf;
        color: var(--success);
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

      .solid {
        background: var(--danger);
        border: 1px solid var(--danger);
        color: #ffffff;
      }

      @media (max-width: 640px) {
        header,
        .header-actions,
        .modal-actions {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class TaskDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  readonly store = inject(TaskStore);
  readonly isNew = computed(() => this.route.snapshot.paramMap.get('id') === null);
  readonly editing = signal(false);
  readonly pendingDeleteTaskId = signal<string | null>(null);
  readonly isEditing = computed(() => this.isNew() || this.editing());

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.editing.set(this.route.snapshot.queryParamMap.get('edit') === 'true');
      void this.store.loadTask(id);
    } else {
      this.editing.set(true);
      this.store.clearSelectedTask();
    }
  }

  startEditing() {
    this.editing.set(true);
  }

  async save(input: TaskSaveInput) {
    const id = this.route.snapshot.paramMap.get('id');
    const task = id ? await this.store.updateTask(id, input) : await this.store.createTask(input);

    if (task) {
      this.notifications.showSuccess(id ? 'Task updated.' : 'Task created.');
      if (id) {
        this.editing.set(false);
      } else {
        await this.router.navigate(['/tasks']);
      }
    }
  }

  requestDelete(id: string) {
    this.pendingDeleteTaskId.set(id);
  }

  cancelDelete() {
    this.pendingDeleteTaskId.set(null);
  }

  async confirmDelete() {
    const id = this.pendingDeleteTaskId();

    if (!id) {
      return;
    }

    const deleted = await this.store.deleteTask(id);

    if (deleted) {
      this.pendingDeleteTaskId.set(null);
      this.notifications.showSuccess('Task deleted.');
      await this.router.navigate(['/tasks']);
    }
  }

  statusLabel(status: string) {
    return status.replace('_', ' ').toLowerCase();
  }

  statusClass(status: string) {
    return `status status-${status.toLowerCase().replace('_', '-')}`;
  }

  formatDueDate(dueDate: string) {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
      new Date(dueDate),
    );
  }
}
