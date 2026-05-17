import '@angular/compiler';

import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { getApiErrorMessage } from './api-error';

describe('getApiErrorMessage', () => {
  it('reads the API error message shape', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error: {
          message: 'Validation failed',
        },
      },
    });

    expect(getApiErrorMessage(error)).toBe('Validation failed');
  });

  it('returns a network message when the API is unavailable', () => {
    expect(getApiErrorMessage(new HttpErrorResponse({ status: 0 }))).toBe(
      'The API is unavailable.',
    );
  });
});
