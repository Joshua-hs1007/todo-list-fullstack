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
        @if (showStatus()) {
          <span [class]="statusClass">{{ statusLabel }}</span>
        }
        <a
          [routerLink]="['/tasks', task().id]"
          [queryParams]="{ edit: 'true' }"
          class="icon-action edit-action"
          aria-label="Edit task"
          title="Edit task"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 20h4l10.5-10.5-4-4L4 16v4Z" />
            <path d="m13.5 6.5 4 4" />
          </svg>
          <span>Edit</span>
        </a>
        <button
          type="button"
          class="icon-action danger-action"
          (click)="delete.emit(task().id)"
          aria-label="Delete task"
          title="Delete task"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 7h16" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M6 7l1 14h10l1-14" />
            <path d="M9 7V4h6v3" />
          </svg>
          <span>Delete</span>
        </button>
      </div>
    </article>
  `,
  styles: [
    `
      .task-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow-sm);
        display: grid;
        gap: 0.9rem;
        grid-template-columns: minmax(0, 1fr);
        min-height: 72px;
        padding: 0.95rem;
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
        display: grid;
        gap: 0.35rem;
        min-width: 0;
      }

      .task-main a {
        color: var(--text);
        display: inline-block;
        font-weight: 800;
        max-width: 100%;
        overflow-wrap: anywhere;
        text-decoration: none;
      }

      .task-main a:hover {
        color: var(--primary);
      }

      p,
      time {
        color: var(--muted);
        display: block;
        font-size: 0.92rem;
        line-height: 1.45;
        margin: 0;
        overflow-wrap: anywhere;
      }

      .actions {
        border-top: 1px solid var(--border);
        display: grid;
        gap: 0.5rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        min-width: 0;
        padding-top: 0.75rem;
      }

      .status {
        border: 1px solid var(--border);
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 800;
        grid-column: 1 / -1;
        justify-content: center;
        padding: 0.35rem 0.6rem;
        text-align: center;
        text-transform: capitalize;
        white-space: nowrap;
        width: 100%;
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

      .icon-action {
        align-items: center;
        background: #ffffff;
        border: 1px solid var(--border-strong);
        border-radius: 6px;
        cursor: pointer;
        display: inline-flex;
        gap: 0.4rem;
        justify-content: center;
        min-height: 2.4rem;
        padding: 0.45rem 0.65rem;
        text-decoration: none;
        width: 100%;
      }

      .icon-action svg {
        fill: none;
        height: 1rem;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 2;
        width: 1rem;
      }

      .edit-action {
        color: var(--primary);
        font-weight: 750;
      }

      .edit-action:hover {
        background: var(--surface-muted);
      }

      .danger-action {
        color: var(--danger);
        font-weight: 750;
      }

      .danger-action:hover {
        background: var(--danger-soft);
        border-color: #f3b6ae;
      }
    `,
  ],
})
export class TaskCardComponent {
  readonly task = input.required<ApiTask>();
  readonly showStatus = input(true);
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
