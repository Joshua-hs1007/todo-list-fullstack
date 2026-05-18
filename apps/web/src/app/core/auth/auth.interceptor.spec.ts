import { HttpEventType, HttpRequest } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import type { HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('forwards requests unchanged when there is no token', () => {
    const request = new HttpRequest('GET', '/api/tasks');
    const next = vi.fn<HttpHandlerFn>().mockReturnValue(of({ type: HttpEventType.Sent }));
    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: { token: signal(null), logout: vi.fn() } },
        { provide: Router, useValue: { url: '/tasks', navigate: vi.fn() } },
      ],
    });

    runInInjectionContext(injector, () => authInterceptor(request, next));

    expect(next).toHaveBeenCalledWith(request);
  });

  it('attaches the bearer token when present', () => {
    const request = new HttpRequest('GET', '/api/tasks');
    const next = vi
      .fn<HttpHandlerFn>()
      .mockReturnValue(of({ type: HttpEventType.Sent } as HttpEvent<unknown>));
    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: { token: signal('token-1'), logout: vi.fn() } },
        { provide: Router, useValue: { url: '/tasks', navigate: vi.fn() } },
      ],
    });

    runInInjectionContext(injector, () => authInterceptor(request, next));

    const forwarded = next.mock.calls[0]?.[0];
    expect(forwarded?.headers.get('Authorization')).toBe('Bearer token-1');
  });

  it('logs out and redirects to login on unauthorized API responses', () => {
    const request = new HttpRequest('GET', '/api/tasks');
    const auth = { token: signal('token-1'), logout: vi.fn() };
    const router = { url: '/tasks', navigate: vi.fn().mockResolvedValue(true) };
    const next = vi.fn<HttpHandlerFn>().mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { error: { message: 'Unauthorized.' } },
          }),
      ),
    );
    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    runInInjectionContext(injector, () => {
      authInterceptor(request, next).subscribe({ error: () => undefined });
    });

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not redirect again when unauthorized on the login page', () => {
    const request = new HttpRequest('GET', '/api/tasks');
    const auth = { token: signal('token-1'), logout: vi.fn() };
    const router = { url: '/login', navigate: vi.fn().mockResolvedValue(true) };
    const next = vi.fn<HttpHandlerFn>().mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { error: { message: 'Unauthorized.' } },
          }),
      ),
    );
    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    runInInjectionContext(injector, () => {
      authInterceptor(request, next).subscribe({ error: () => undefined });
    });

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('passes through non-unauthorized errors without logging out', () => {
    const request = new HttpRequest('GET', '/api/tasks');
    const auth = { token: signal('token-1'), logout: vi.fn() };
    const router = { url: '/tasks', navigate: vi.fn().mockResolvedValue(true) };
    const error = new HttpErrorResponse({
      status: 500,
      error: { error: { message: 'Unexpected failure.' } },
    });
    const next = vi.fn<HttpHandlerFn>().mockReturnValue(throwError(() => error));
    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    let receivedError: unknown;

    runInInjectionContext(injector, () => {
      authInterceptor(request, next).subscribe({ error: (caught) => (receivedError = caught) });
    });

    expect(receivedError).toBe(error);
    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
