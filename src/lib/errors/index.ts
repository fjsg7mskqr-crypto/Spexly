/**
 * Secure Error Handling Library
 *
 * Provides custom error classes and utilities for secure error handling.
 * - Server-side: Logs detailed errors, throws generic errors to clients
 * - Client-side: Formats safe, user-friendly error messages
 */

/**
 * Base class for all application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation errors - safe to show to users
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400, true);
  }
}

/**
 * Database errors - generic message to client, detailed logging server-side
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message, 'DATABASE_ERROR', 500, true);
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401, true);
  }
}

/**
 * Authorization errors (user authenticated but not authorized)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message, 'RATE_LIMIT_ERROR', 429, true);
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404, true);
  }
}

/**
 * Error logging context
 */
export interface ErrorContext {
  action?: string;
  userId?: string;
  projectId?: string;
  [key: string]: unknown;
}

function serializeUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      return '[unserializable-object]';
    }
  }

  return String(error);
}

/**
 * Logs an error with context (server-side only)
 * In production, this should integrate with error tracking service (Sentry, etc.)
 */
export function logError(error: unknown, context?: ErrorContext): void {
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', {
      error: serializeUnknownError(error),
      rawError: error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // In production, send to error tracking service
  // TODO: Integrate with Sentry or similar service
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { contexts: { custom: context } });
  // }
}

/**
 * Formats an error for safe display to users (client-side)
 * Prevents leaking sensitive information
 */
export function formatErrorForClient(error: unknown): string {
  // If it's one of our custom errors, use the message (already safe)
  if (error instanceof AppError) {
    return error.message;
  }

  // If it's a standard Error, check if message is safe
  if (error instanceof Error) {
    // Don't expose internal error messages
    const safeMessages = [
      'Not authenticated',
      'Authentication required',
      'Session expired',
      'Invalid credentials',
    ];

    if (safeMessages.some(msg => error.message.includes(msg))) {
      return error.message;
    }

    // For other errors, return generic message
    return 'An unexpected error occurred. Please try again.';
  }

  // For unknown error types, return generic message
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Wraps a server action with error handling
 * Usage: export const myAction = withErrorHandling(async () => { ... })
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  action: T,
  actionName?: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await action(...args) as ReturnType<T>;
    } catch (error) {
      // Log the error with context
      logError(error, {
        action: actionName || action.name,
        args: process.env.NODE_ENV === 'development' ? args : undefined,
      });

      // If it's already an AppError, rethrow it
      if (error instanceof AppError) {
        throw error;
      }

      // If it's a Supabase auth error, convert to AuthenticationError
      if (error instanceof Error && error.message.includes('not authenticated')) {
        throw new AuthenticationError();
      }

      // For all other errors, throw generic DatabaseError
      throw new DatabaseError(
        'An error occurred while processing your request',
        error
      );
    }
  }) as T;
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Gets a safe error message for server actions
 * Use this when catching errors in server actions
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Check for specific known error patterns
    if (error.message.includes('not authenticated')) {
      return 'Please sign in to continue';
    }

    if (error.message.includes('JWT')) {
      return 'Your session has expired. Please sign in again.';
    }

    if (error.message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
  }

  // Default safe message
  return 'An unexpected error occurred. Please try again.';
}
