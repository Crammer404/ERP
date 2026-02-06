'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, RefreshCw, ArrowLeft, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ErrorPageProps {
  title?: string;
  message?: string;
  errorCode?: string | number;
  showRetry?: boolean;
  showGoBack?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function ErrorPage({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  errorCode,
  showRetry = true,
  showGoBack = true,
  showHome = true,
  onRetry,
  className = ""
}: ErrorPageProps) {
  const router = useRouter();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className={`min-h-[400px] flex items-center justify-center p-4 ${className}`}>
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
          {errorCode && (
            <div className="text-sm text-muted-foreground mt-2">
              Error Code: {errorCode}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Here are some things you can try:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {showRetry && <li>Try refreshing or retrying the action</li>}
              {showGoBack && <li>Go back to the previous page</li>}
              {showHome && <li>Return to the dashboard</li>}
              <li>Check your internet connection</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {showRetry && (
              <Button 
                onClick={handleRetry}
                variant="outline" 
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            {showGoBack && (
              <Button 
                onClick={handleGoBack}
                variant="outline" 
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}
            {showHome && (
              <Button 
                onClick={handleGoHome}
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Specific error page variants
export function NetworkErrorPage({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorPage
      title="Network Error"
      message="Unable to connect to the server. Please check your internet connection."
      errorCode="NETWORK_ERROR"
      showRetry={true}
      showGoBack={true}
      showHome={true}
      onRetry={onRetry}
    />
  );
}

export function ServerErrorPage({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorPage
      title="Server Error"
      message="The server encountered an error and couldn't complete your request."
      errorCode="500"
      showRetry={true}
      showGoBack={true}
      showHome={true}
      onRetry={onRetry}
    />
  );
}

export function UnauthorizedErrorPage() {
  return (
    <ErrorPage
      title="Access Denied"
      message="You don't have permission to access this resource."
      errorCode="403"
      showRetry={false}
      showGoBack={true}
      showHome={true}
    />
  );
}

export function PermissionDeniedErrorPage({ moduleName }: { moduleName?: string }) {
  return (
    <ErrorPage
      title="Access Denied"
      message={`You don't have permission to access ${moduleName ? `${moduleName}` : 'this resource'}.`}
      errorCode="403"
      showRetry={false}
      showGoBack={true}
      showHome={true}
    />
  );
}

// Full-page access denied component (like /app/error pages)
export function FullPageAccessDenied({ moduleName }: { moduleName?: string }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Error Icon */}
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-6xl font-bold text-foreground mb-2">403</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access {moduleName ? `${moduleName}` : 'this resource'}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button asChild className="flex-1">
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NotFoundErrorPage() {
  return (
    <ErrorPage
      title="Not Found"
      message="The requested resource could not be found."
      errorCode="404"
      showRetry={false}
      showGoBack={true}
      showHome={true}
    />
  );
}
