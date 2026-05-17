import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ApiTask } from '../../core/api/api-client';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="task-card">
      <div class="task-main">
        <a [routerLink]="['/tasks', task().id]">{{ task().title }}</a>
        @if (task().description) {
          <p>{{ task().description }}</p>
        }
        @if (task().dueDate) {
          <time [dateTime]="task().dueDate">Due {{ formattedDueDate }}</time>
        }
      </div>
      <div class="actions">
        <span [class]="statusClass">{{ statusLabel }}</span>
        <button type="button" (click)="delete.emit(task().id)" aria-label="Delete task">
          Delete
        </button>
      </div>
    </article>
  `,
  styles: [
    `
      .task-card {
        align-items: center;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow-sm);
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        min-height: 72px;
        padding: 1rem;
        transition:
          border-color 160ms ease,
          box-shadow 160ms ease,
          transform 160ms ease;
      }

      .task-card:hover {
        border-color: var(--border-strong);
        box-shadow: 0 10px 26px rgb(15 23 42 / 9%);
        transform: translateY(-1px);
      }

      .task-main {
        min-width: 0;
      }

      a {
        color: var(--text);
        font-weight: 750;
        text-decoration: none;
      }

      a:hover {
        color: var(--primary);
      }

      p,
      time {
        color: var(--muted);
        display: block;
        font-size: 0.92rem;
        margin: 0.35rem 0 0;
      }

      .actions {
        align-items: center;
        display: flex;
        flex-shrink: 0;
        gap: 0.75rem;
      }

      .status {
        border: 1px solid var(--border);
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 800;
        padding: 0.28rem 0.6rem;
        text-transform: capitalize;
        white-space: nowrap;
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

      button {
        background: #ffffff;
        border: 1px solid var(--border-strong);
        border-radius: 6px;
        color: var(--danger);
        cursor: pointer;
        font-weight: 700;
        padding: 0.4rem 0.65rem;
      }

      button:hover {
        background: var(--danger-soft);
        border-color: #f3b6ae;
      }

      @media (max-width: 640px) {
        .task-card,
        .actions {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class TaskCardComponent {
  readonly task = input.required<ApiTask>();
  readonly delete = output<string>();

  get statusLabel() {
    return this.task().status.replace('_', ' ').toLowerCase();
  }

  get statusClass() {
    return `status status-${this.task().status.toLowerCase().replace('_', '-')}`;
  }

  get formattedDueDate() {
    const dueDate = this.task().dueDate;
    return dueDate
      ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
          new Date(dueDate),
        )
      : '';
  }
}
