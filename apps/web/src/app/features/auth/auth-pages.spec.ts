import { HttpErrorResponse } from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../core/auth/auth.service';
import { RegisterPage } from './register.page';
import { SignInPage } from './sign-in.page';

describe('auth pages', () => {
  function setup(auth: Partial<AuthService>) {
    const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
    const injector = Injector.create({
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    return { injector, router };
  }

  it('does not submit invalid sign-in forms', async () => {
    const auth = { login: vi.fn() };
    const { injector } = setup(auth as Partial<AuthService>);
    const page = runInInjectionContext(injector, () => new SignInPage());

    await page.submit();

    expect(page.form.invalid).toBe(true);
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('logs in and navigates to tasks', async () => {
    const auth = { login: vi.fn().mockReturnValue(of({})) };
    const { injector, router } = setup(auth as Partial<AuthService>);
    const page = runInInjectionContext(injector, () => new SignInPage());

    page.form.setValue({ email: 'user@example.com', password: 'password123' });
    await page.submit();

    expect(auth.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tasks');
    expect(page.loading()).toBe(false);
  });

  it('shows sign-in errors', async () => {
    const auth = {
      login: vi.fn().mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 401,
              error: { error: { message: 'Invalid email or password.' } },
            }),
        ),
      ),
    };
    const { injector } = setup(auth as Partial<AuthService>);
    const page = runInInjectionContext(injector, () => new SignInPage());

    page.form.setValue({ email: 'user@example.com', password: 'wrong' });
    await page.submit();

    expect(page.error()).toBe('Invalid email or password.');
    expect(page.loading()).toBe(false);
  });

  it('requires a long enough registration password', async () => {
    const auth = { register: vi.fn() };
    const { injector } = setup(auth as Partial<AuthService>);
    const page = runInInjectionContext(injector, () => new RegisterPage());

    page.form.setValue({ email: 'user@example.com', password: 'short' });
    await page.submit();

    expect(page.form.invalid).toBe(true);
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('registers and navigates to tasks', async () => {
    const auth = { register: vi.fn().mockReturnValue(of({})) };
    const { injector, router } = setup(auth as Partial<AuthService>);
    const page = runInInjectionContext(injector, () => new RegisterPage());

    page.form.setValue({ email: 'user@example.com', password: 'password123' });
    await page.submit();

    expect(auth.register).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tasks');
  });

  it('shows registration errors', async () => {
    const auth = {
      register: vi.fn().mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { error: { message: 'Email is already registered.' } },
            }),
        ),
      ),
    };
    const { injector } = setup(auth as Partial<AuthService>);
    const page = runInInjectionContext(injector, () => new RegisterPage());

    page.form.setValue({ email: 'user@example.com', password: 'password123' });
    await page.submit();

    expect(page.error()).toBe('Email is already registered.');
    expect(page.loading()).toBe(false);
  });
});
