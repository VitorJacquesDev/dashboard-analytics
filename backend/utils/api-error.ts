import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type { ErrorResponse } from '@/lib/types';

type ApiErrorOptions = {
  status?: number;
  code?: string;
  details?: unknown;
  request?: NextRequest;
  requestId?: string;
};

const DEFAULT_ERROR_CODE_BY_STATUS: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  500: 'INTERNAL_SERVER_ERROR',
};

function resolveRequestId(request?: NextRequest, requestId?: string): string {
  if (requestId) {
    return requestId;
  }

  const headerRequestId = request?.headers.get('x-request-id');
  if (headerRequestId) {
    return headerRequestId;
  }

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function resolveErrorCode(status: number, code?: string): string {
  if (code) {
    return code;
  }

  return DEFAULT_ERROR_CODE_BY_STATUS[status] ?? 'INTERNAL_SERVER_ERROR';
}

export function getErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred'
): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error) {
    return error;
  }

  return fallback;
}

export function hasErrorMessage(error: unknown, expected: string): boolean {
  return getErrorMessage(error) === expected;
}

export function errorMessageIncludes(error: unknown, text: string): boolean {
  return getErrorMessage(error).includes(text);
}

export function buildErrorResponse(
  messageOrError: unknown,
  options: ApiErrorOptions = {}
): ErrorResponse {
  const status = options.status ?? 500;
  const isValidationError = messageOrError instanceof ZodError;
  const validationDetails = isValidationError
    ? messageOrError.issues.map((issue) => ({
        code: issue.code,
        path: issue.path.join('.'),
        message: issue.message,
      }))
    : undefined;
  const message = getErrorMessage(
    isValidationError ? 'Invalid request payload' : messageOrError,
    status >= 500 ? 'Internal server error' : 'Request failed'
  );

  return {
    error: {
      code: resolveErrorCode(status, options.code ?? (isValidationError ? 'VALIDATION_ERROR' : undefined)),
      message,
      ...((options.details ?? validationDetails) !== undefined
        ? { details: options.details ?? validationDetails }
        : {}),
      timestamp: new Date().toISOString(),
      requestId: resolveRequestId(options.request, options.requestId),
    },
  };
}

export function apiError(
  messageOrError: unknown,
  options: ApiErrorOptions = {}
) {
  const status = options.status ?? 500;
  return NextResponse.json(buildErrorResponse(messageOrError, { ...options, status }), { status });
}
