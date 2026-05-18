import { afterEach, describe, expect, it, vi } from 'vitest';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows and dismisses success notifications', () => {
    const service = new NotificationService();

    service.showSuccess('Task created.');
    expect(service.notification()).toEqual({ message: 'Task created.', tone: 'success' });

    service.dismiss();
    expect(service.notification()).toBeNull();
  });

  it('auto-dismisses notifications', () => {
    vi.useFakeTimers();
    const service = new NotificationService();

    service.showSuccess('Task updated.');
    vi.advanceTimersByTime(4500);

    expect(service.notification()).toBeNull();
  });

  it('replaces the previous auto-dismiss timer when showing a new notification', () => {
    vi.useFakeTimers();
    const service = new NotificationService();

    service.showSuccess('First task saved.');
    vi.advanceTimersByTime(3000);
    service.showSuccess('Second task saved.');
    vi.advanceTimersByTime(1499);

    expect(service.notification()).toEqual({ message: 'Second task saved.', tone: 'success' });

    vi.advanceTimersByTime(3001);
    expect(service.notification()).toBeNull();
  });
});
