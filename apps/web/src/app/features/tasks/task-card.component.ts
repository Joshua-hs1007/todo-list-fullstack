import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ApiTask } from '../../core/api/api-client';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="task-card">
      <a [routerLink]="['/tasks', task().id]">{{ task().title }}</a>
      <span>{{ task().status }}</span>
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
    `
  ]
})
export class TaskCardComponent {
  readonly task = input.required<ApiTask>();
}
