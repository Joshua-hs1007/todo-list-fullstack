import { HttpEventType, HttpRequest } from '@angular/common/http';
import type { HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('forwards requests unchanged when there is no token', () => {
    const request = new HttpRequest('GET', '/api/tasks');
    const next = vi.fn<HttpHandlerFn>().mockReturnValue(of({ type: HttpEventType.Sent }));
    const injector = Injector.create({
      providers: [{ provide: AuthService, useValue: { token: signal(null) } }],
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
      providers: [{ provide: AuthService, useValue: { token: signal('token-1') } }],
    });

    runInInjectionContext(injector, () => authInterceptor(request, next));

    const forwarded = next.mock.calls[0]?.[0];
    expect(forwarded?.headers.get('Authorization')).toBe('Bearer token-1');
  });
});
