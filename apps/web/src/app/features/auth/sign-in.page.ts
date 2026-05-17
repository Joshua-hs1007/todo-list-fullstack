import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { getApiErrorMessage } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <div class="auth-copy">
        <p class="eyebrow">Workspace access</p>
        <h1>Sign in to manage your task queue.</h1>
        <p>Track work, adjust priority, and keep every task tied to your account.</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="auth-card">
        <div class="form-header">
          <h2>Welcome back</h2>
          <p>Use your email and password to continue.</p>
        </div>

        <label>
          <span>Email</span>
          <input
            type="email"
            formControlName="email"
            autocomplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label>
          <span>Password</span>
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Signing in...' : 'Sign in' }}
        </button>
        <p class="switch-link">New here? <a routerLink="/register">Create an account</a></p>
      </form>
    </section>
  `,
  styles: [
    `
      .auth-page {
        align-items: center;
        display: grid;
        gap: clamp(1.5rem, 5vw, 4rem);
        grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
        min-height: calc(100vh - 150px);
      }

      .auth-copy {
        max-width: 560px;
      }

      .eyebrow {
        color: var(--primary);
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        margin-bottom: 0.75rem;
        text-transform: uppercase;
      }

      h1 {
        color: var(--text);
        font-size: clamp(2rem, 5vw, 4rem);
        line-height: 1.02;
        margin-bottom: 1rem;
      }

      .auth-copy p:not(.eyebrow),
      .form-header p,
      .switch-link {
        color: var(--muted);
      }

      .auth-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow-md);
        display: grid;
        gap: 1rem;
        padding: clamp(1.25rem, 4vw, 2rem);
      }

      form {
        display: grid;
        gap: 1rem;
      }

      .form-header h2 {
        font-size: 1.25rem;
        margin-bottom: 0.25rem;
      }

      .form-header p,
      .switch-link {
        margin-bottom: 0;
      }

      label {
        color: var(--text);
        display: grid;
        gap: 0.35rem;
        font-weight: 650;
      }

      .error {
        background: var(--danger-soft);
        border: 1px solid #ffd1cc;
        border-radius: 6px;
        color: var(--danger);
        margin: 0;
        padding: 0.75rem;
      }

      button {
        background: var(--primary);
        border: 1px solid var(--primary);
        color: #ffffff;
        font-weight: 700;
        min-height: 2.75rem;
        padding: 0.7rem 1rem;
      }

      button:hover:not(:disabled) {
        background: var(--primary-strong);
      }

      @media (max-width: 800px) {
        .auth-page {
          align-items: stretch;
          grid-template-columns: 1fr;
          min-height: auto;
        }
      }
    `,
  ],
})
export class SignInPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(this.auth.login(this.form.getRawValue()));
      await this.router.navigateByUrl('/tasks');
    } catch (error) {
      this.error.set(getApiErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
