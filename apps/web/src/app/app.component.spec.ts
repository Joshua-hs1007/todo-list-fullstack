import { Injector, runInInjectionContext, signal } from '@angular/core';
import { Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { AppComponent } from './app.component';
import { AuthService } from './core/auth/auth.service';
import { NotificationService } from './core/notifications/notification.service';

describe('AppComponent', () => {
  it('logs out and navigates to login when signing out', async () => {
    const auth = {
      isAuthenticated: signal(true),
      user: signal({ id: 'user-1', email: 'user@example.com' }),
      logout: vi.fn(),
    };
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    const notifications = {
      notification: signal(null),
      dismiss: vi.fn(),
    };
    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    const component = runInInjectionContext(injector, () => new AppComponent());

    await component.signOut();

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('exposes the signed-in user email for the header', () => {
    const auth = {
      isAuthenticated: signal(true),
      user: signal({ id: 'user-1', email: 'user@example.com' }),
      logout: vi.fn(),
    };
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    const notifications = {
      notification: signal(null),
      dismiss: vi.fn(),
    };
    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    const component = runInInjectionContext(injector, () => new AppComponent());

    expect(component.signedInEmail()).toBe('user@example.com');

    auth.user.set(null);

    expect(component.signedInEmail()).toBeNull();
  });
});
