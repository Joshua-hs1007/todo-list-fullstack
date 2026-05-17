import { Component, computed, inject } from '@angular/core';
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
        <p class="eyebrow">{{ isNew() ? 'Create' : 'Edit' }}</p>
        <h1>{{ isNew() ? 'New task' : 'Task detail' }}</h1>
        <p>Keep the title crisp, add useful context, and update status as work moves.</p>
      </header>

      @if (store.loading()) {
        <div class="state-panel" aria-live="polite">Loading task...</div>
      } @else {
        @if (store.error()) {
          <p class="error" role="alert">{{ store.error() }}</p>
        }
        <app-task-form
          [task]="store.selectedTask()"
          [saving]="store.saving()"
          (save)="save($event)"
        />
      }
    </section>
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
    `,
  ],
})
export class TaskDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  readonly store = inject(TaskStore);
  readonly isNew = computed(() => this.route.snapshot.paramMap.get('id') === null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      void this.store.loadTask(id);
    } else {
      this.store.clearSelectedTask();
    }
  }

  async save(input: TaskSaveInput) {
    const id = this.route.snapshot.paramMap.get('id');
    const task = id ? await this.store.updateTask(id, input) : await this.store.createTask(input);

    if (task) {
      this.notifications.showSuccess(id ? 'Task updated.' : 'Task created.');
      await this.router.navigate(['/tasks']);
    }
  }
}
