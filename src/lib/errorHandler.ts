/**
 * Centralized error handling utility
 * In production, this could be extended to send errors to a logging service
 */

export function logError(error: unknown, context?: string) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  // Only log to console in development
  if (import.meta.env.DEV) {
    if (context) {
      console.error(`[${context}]`, errorMessage, errorStack || error);
    } else {
      console.error(errorMessage, errorStack || error);
    }
  }
  
  // In production, you could send to error tracking service
  // e.g., Sentry.captureException(error, { tags: { context } });
  
  return errorMessage;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}
