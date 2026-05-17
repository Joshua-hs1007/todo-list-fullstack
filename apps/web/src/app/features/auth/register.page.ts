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
      <h1>Register</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>
          Email
          <input type="email" formControlName="email" autocomplete="email" />
        </label>
        <label>
          Password
          <input type="password" formControlName="password" autocomplete="new-password" />
        </label>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Creating account...' : 'Create account' }}
        </button>
        <a routerLink="/login">Use an existing account</a>
      </form>
    </section>
  `,
  styles: [
    `
      .auth-page {
        max-width: 420px;
      }

      form {
        display: grid;
        gap: 1rem;
      }

      label {
        display: grid;
        gap: 0.35rem;
      }

      .error {
        color: #a4243b;
        margin: 0;
      }
    `,
  ],
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
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
      await firstValueFrom(this.auth.register(this.form.getRawValue()));
      await this.router.navigateByUrl('/tasks');
    } catch (error) {
      this.error.set(getApiErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
