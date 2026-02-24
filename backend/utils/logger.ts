import type { NextRequest } from 'next/server';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogMeta = Record<string, unknown>;

export function resolveLogRequestId(request?: NextRequest, requestId?: string): string {
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

export function getRequestLogContext(
  request: NextRequest,
  requestId?: string
): LogMeta {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;

  return {
    requestId: resolveLogRequestId(request, requestId),
    method: request.method,
    path: request.nextUrl.pathname,
    ...(ip ? { ip } : {}),
  };
}

export function errorToLogMeta(error: unknown): LogMeta {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      ...(process.env.NODE_ENV !== 'production' && error.stack
        ? { errorStack: error.stack }
        : {}),
    };
  }

  if (typeof error === 'string') {
    return { errorMessage: error };
  }

  return { errorMessage: 'Unknown error' };
}

function writeLog(level: LogLevel, scope: string, message: string, meta?: LogMeta): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    scope,
    message,
    ...(meta ?? {}),
  };
  const payload = JSON.stringify(entry);

  switch (level) {
    case 'debug':
      console.debug(payload);
      break;
    case 'info':
      console.info(payload);
      break;
    case 'warn':
      console.warn(payload);
      break;
    case 'error':
      console.error(payload);
      break;
    default:
      console.log(payload);
  }
}

export function createLogger(scope: string) {
  return {
    debug(message: string, meta?: LogMeta) {
      writeLog('debug', scope, message, meta);
    },
    info(message: string, meta?: LogMeta) {
      writeLog('info', scope, message, meta);
    },
    warn(message: string, meta?: LogMeta) {
      writeLog('warn', scope, message, meta);
    },
    error(message: string, meta?: LogMeta) {
      writeLog('error', scope, message, meta);
    },
  };
}

