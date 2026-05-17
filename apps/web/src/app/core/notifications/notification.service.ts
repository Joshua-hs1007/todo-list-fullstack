import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  message: string;
  tone: 'success';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

  readonly notification = signal<AppNotification | null>(null);

  showSuccess(message: string) {
    this.notification.set({ message, tone: 'success' });

    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
    }

    this.autoDismissTimer = setTimeout(() => {
      this.dismiss();
    }, 4500);
  }

  dismiss() {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }

    this.notification.set(null);
  }
}
