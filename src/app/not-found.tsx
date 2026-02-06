'use client';

import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    // Set document title
    document.title = '404 - Page Not Found | SalesStox';
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-6">
              {/* Logo */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-10 h-10 text-primary">
                    <path d="M48,216a23.9,23.9,0,0,1-24-24V88A23.9,23.9,0,0,1,48,64H208a23.9,23.9,0,0,1,24,24v16M24,144H224a8,8,0,0,1,8,8v40a8,8,0,0,1-8,8H24a8,8,0,0,1,0-16ZM168,104V64M128,104V64a40,40,0,0,1,80,0v40" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                  </svg>
                  <h2 className="font-bold text-primary text-2xl">SalesStox</h2>
                </div>
              </div>

              {/* Error Icon & Code */}
              <div className="text-center">
                <div className="mx-auto w-24 h-24 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
                <h2 className="text-2xl font-semibold text-foreground mb-2">Page Not Found</h2>
                <p className="text-muted-foreground mb-6">
                  The page you're looking for doesn't exist or has been moved.
                </p>
              </div>

              {/* Suggestions */}
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm font-medium text-foreground mb-2">Here's what you can try:</p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Check the URL for typos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Go back to the previous page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Return to the dashboard</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => window.history.back()}
                  variant="outline" 
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground">
          Need help? <Link href="/contact" className="text-primary hover:underline font-medium">Contact Support</Link>
        </p>
      </div>
    </div>
  );
}