'use client';

import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createErrorResponse, ErrorResponse } from '@/lib/error-handler';

export function useErrorHandler() {
  const router = useRouter();

  const handleError = (error: ErrorResponse | Error) => {
    // If it's an ErrorResponse with status code
    if ('status' in error) {
      switch (error.status) {
        case 401:
          // Redirect to login page for unauthorized access
          router.push('/login');
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
  };

  const handleApiError = (error: any) => {
    // Handle API errors from fetch requests
    if (error?.response?.status) {
      const errorResponse = createErrorResponse(
        error.response.status,
        error.response.data?.message || error.message || 'An error occurred'
      );
      handleError(errorResponse);
    } else if (error?.status) {
      handleError(error);
    } else {
      // Generic error
      handleError(createErrorResponse(500, error?.message || 'An unexpected error occurred'));
    }
  };

  return {
    handleError,
    handleApiError,
  };
}
