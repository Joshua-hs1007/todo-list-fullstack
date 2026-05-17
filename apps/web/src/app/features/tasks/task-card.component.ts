import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ApiTask } from '../../core/api/api-client';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="task-card">
      <div>
        <a [routerLink]="['/tasks', task().id]">{{ task().title }}</a>
        @if (task().description) {
          <p>{{ task().description }}</p>
        }
      </div>
      <div class="actions">
        <span>{{ statusLabel }}</span>
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
        background: #ffffff;
        border: 1px solid #d8deea;
        border-radius: 8px;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        min-height: 56px;
        padding: 0.85rem 1rem;
      }

      a {
        color: #172033;
        font-weight: 600;
        text-decoration: none;
      }

      span {
        color: #52627a;
        font-size: 0.85rem;
      }

      p {
        color: #52627a;
        margin: 0.35rem 0 0;
      }

      .actions {
        align-items: center;
        display: flex;
        flex-shrink: 0;
        gap: 0.75rem;
      }

      button {
        background: #ffffff;
        border: 1px solid #c7d0df;
        border-radius: 6px;
        color: #a4243b;
        cursor: pointer;
        padding: 0.4rem 0.65rem;
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
}
