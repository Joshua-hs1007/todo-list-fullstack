import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="auth-page">
      <h1>Sign in</h1>
      <form [formGroup]="form">
        <label>
          Email
          <input type="email" formControlName="email" autocomplete="email" />
        </label>
        <label>
          Password
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>
        <button type="submit" [disabled]="form.invalid">Sign in</button>
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
    `
  ]
})
export class SignInPage {
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
}
