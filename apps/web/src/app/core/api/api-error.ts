import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(error: unknown) {
  if (error instanceof HttpErrorResponse) {
    const message = error.error?.error?.message;

    if (typeof message === 'string') {
      return message;
    }

    if (error.status === 0) {
      return 'The API is unavailable.';
    }
  }

  return 'Something went wrong.';
}
