import { Component, input } from '@angular/core';

@Component({
  selector: 'app-task-summary',
  standalone: true,
  template: `
    <div class="summary-grid" aria-label="Task summary">
      <div>
        <span>Total</span>
        <strong>{{ total() }}</strong>
      </div>
      <div>
        <span>To do</span>
        <strong>{{ todo() }}</strong>
      </div>
      <div>
        <span>In progress</span>
        <strong>{{ inProgress() }}</strong>
      </div>
      <div>
        <span>Done</span>
        <strong>{{ done() }}</strong>
      </div>
    </div>
  `,
  styles: [
    `
      .summary-grid {
        display: grid;
        gap: 0.8rem;
        grid-template-columns: repeat(4, minmax(0, 1fr));
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

      @media (max-width: 720px) {
        .summary-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TaskSummaryComponent {
  readonly total = input.required<number>();
  readonly todo = input.required<number>();
  readonly inProgress = input.required<number>();
  readonly done = input.required<number>();
}
