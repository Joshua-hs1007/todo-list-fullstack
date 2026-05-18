import { Injector, runInInjectionContext, signal } from '@angular/core';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { authGuard, guestGuard } from './auth.guard';

describe('authGuard', () => {
  it('allows authenticated users', () => {
    const router = { createUrlTree: vi.fn() };
    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: signal(true) } },
        { provide: Router, useValue: router },
      ],
    });

    const result = runInInjectionContext(injector, () =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to login', () => {
    const urlTree = { path: '/login' };
    const router = { createUrlTree: vi.fn().mockReturnValue(urlTree) };
    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: signal(false) } },
        { provide: Router, useValue: router },
      ],
    });

    const result = runInInjectionContext(injector, () =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(urlTree);
  });

  it('allows unauthenticated users to visit guest auth pages', () => {
    const router = { createUrlTree: vi.fn() };
    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: signal(false) } },
        { provide: Router, useValue: router },
      ],
    });

    const result = runInInjectionContext(injector, () =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects authenticated users away from guest auth pages', () => {
    const urlTree = { path: '/tasks' };
    const router = { createUrlTree: vi.fn().mockReturnValue(urlTree) };
    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: signal(true) } },
        { provide: Router, useValue: router },
      ],
    });

    const result = runInInjectionContext(injector, () =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/tasks']);
    expect(result).toBe(urlTree);
  });
});
