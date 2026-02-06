'use client';

import { notFound } from 'next/navigation';

export interface ErrorResponse {
  status: number;
  message: string;
  code?: string;
}

/**
 * Handle different types of errors and redirect to appropriate error pages
 */
export function handleError(error: ErrorResponse | Error) {
  // If it's an ErrorResponse with status code
  if ('status' in error) {
    switch (error.status) {
      case 401:
        // Redirect to login page for unauthorized access
        window.location.href = '/login';
        break;
      case 403:
        // Use Next.js error boundary for 403 errors
        throw new Error('Access denied');
        break;
      case 404:
        // Use Next.js notFound() for 404 errors
        notFound();
        break;
      case 500:
        // Use Next.js error boundary for 500 errors
        throw new Error('Server error occurred');
        break;
      default:
        // For other errors, use Next.js error boundary
        throw new Error('An unexpected error occurred');
    }
  } else {
    // For generic errors, use Next.js error boundary
    throw new Error('An unexpected error occurred');
  }
}

/**
 * Create an error response object
 */
export function createErrorResponse(status: number, message: string, code?: string): ErrorResponse {
  return {
    status,
    message,
    code,
  };
}

/**
 * Check if an error is a specific HTTP status code
 */
export function isHttpError(error: any, status: number): boolean {
  return error?.status === status || error?.response?.status === status;
}
