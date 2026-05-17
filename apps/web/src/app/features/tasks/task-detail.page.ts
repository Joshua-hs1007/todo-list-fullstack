import { Component, computed, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TaskFormComponent } from './task-form.component';
import { TaskStore } from './task.store';
import type { TaskSaveInput } from '../../core/api/api-client';

@Component({
  standalone: true,
  imports: [RouterLink, TaskFormComponent],
  template: `
    <section class="detail-page">
      <a routerLink="/tasks">Back to tasks</a>
      <h1>{{ isNew() ? 'New task' : 'Task detail' }}</h1>

      @if (store.loading()) {
        <p>Loading task...</p>
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
        gap: 1rem;
      }

      a {
        color: #315274;
      }

      .error {
        color: #a4243b;
        margin: 0;
      }
    `,
  ],
})
export class TaskDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
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
      await this.router.navigate(['/tasks', task.id]);
    }
  }
}
