import { Injector, runInInjectionContext, signal } from '@angular/core';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

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
});
