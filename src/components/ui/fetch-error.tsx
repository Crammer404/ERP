'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FetchErrorProps {
  error: Error | string | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
  showIcon?: boolean;
}

const isNetworkError = (error: Error | string | null): boolean => {
  if (!error) return false;
  const errorMessage = typeof error === 'string' ? error : error.message;
  const networkErrorPatterns = [
    'Failed to fetch',
    'NetworkError',
    'Network request failed',
    'fetch failed',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_NETWORK_CHANGED',
    'ERR_CONNECTION_REFUSED',
    'ERR_CONNECTION_TIMED_OUT',
    'ERR_NAME_NOT_RESOLVED',
    'TypeError: Failed to fetch',
  ];
  return networkErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
};

const getErrorMessage = (error: Error | string | null): string => {
  if (!error) return 'An unknown error occurred';
  if (typeof error === 'string') return error;
  return error.message || 'An error occurred while fetching data';
};

const getErrorTitle = (error: Error | string | null): string => {
  if (isNetworkError(error)) {
    return 'Connection Error';
  }
  return 'Error';
};

const getErrorDescription = (error: Error | string | null): string => {
  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  return getErrorMessage(error);
};

export function FetchError({
  error,
  onRetry,
  title,
  description,
  className,
  variant = 'default',
  showIcon = true,
}: FetchErrorProps) {
  if (!error) return null;

  const errorTitle = title || getErrorTitle(error);
  const errorDescription = description || getErrorDescription(error);
  const isNetwork = isNetworkError(error);
  const Icon = isNetwork ? WifiOff : XCircle;

  if (variant === 'compact') {
    return (
      <Alert variant="destructive" className={cn('py-2', className)}>
        {showIcon && <Icon className="h-4 w-4" />}
        <AlertTitle className="text-sm">{errorTitle}</AlertTitle>
        <AlertDescription className="text-xs">{errorDescription}</AlertDescription>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </Alert>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
        {showIcon && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
        <span>{errorDescription}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-auto p-1 text-destructive hover:text-destructive"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert variant="destructive" className={cn(className)}>
      {showIcon && <Icon className="h-4 w-4" />}
      <AlertTitle>{errorTitle}</AlertTitle>
      <AlertDescription>{errorDescription}</AlertDescription>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={onRetry}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}
    </Alert>
  );
}
