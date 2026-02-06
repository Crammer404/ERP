'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WithAuthProtection } from '@/components/auth/with-auth-protection';
import { bookingService } from '@/app/booking/reservation/service/bookingService';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Database, Calendar, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

function BookingContent() {
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getBookings();
      setBookings(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Testing Supabase connection...');

    try {
      await bookingService.testConnection();
      setTestStatus('success');
      setTestMessage('Connection test completed! Check the browser console for detailed results.');
    } catch (error: any) {
      setTestStatus('error');
      setTestMessage(error?.message || 'Connection test failed. Check the console for details.');
    }
  };

  // Get table columns dynamically from the first booking record
  const getColumns = () => {
    if (bookings.length === 0) return [];
    return Object.keys(bookings[0]);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
      // Try to format as date
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    return String(value);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-headline text-primary">Hair Salon Bookings</h1>
              <p className="text-sm text-muted-foreground">
                View and manage all salon bookings from Supabase.
              </p>
            </div>
          </div>
          <Button onClick={fetchBookings} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Bookings List</CardTitle>
                <CardDescription>
                  {bookings.length > 0 
                    ? `Showing ${bookings.length} booking${bookings.length !== 1 ? 's' : ''}`
                    : 'No bookings found'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading bookings...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No bookings found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getColumns().map((column) => (
                        <TableHead key={column} className="capitalize">
                          {column.replace(/_/g, ' ')}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking, index) => (
                      <TableRow key={booking.id || index}>
                        {getColumns().map((column) => (
                          <TableCell key={column} className="max-w-xs truncate">
                            {formatValue(booking[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Supabase Connection Test</CardTitle>
            <CardDescription>
              Test the connection to your Supabase database. Results will be displayed in the browser console.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="w-full sm:w-auto"
            >
              {testStatus === 'testing' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Test Supabase Connection
                </>
              )}
            </Button>

            {testStatus !== 'idle' && (
              <Alert
                variant={testStatus === 'success' ? 'default' : testStatus === 'error' ? 'destructive' : 'default'}
              >
                {testStatus === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {testStatus === 'error' && <XCircle className="h-4 w-4" />}
                {testStatus === 'testing' && <AlertCircle className="h-4 w-4" />}
                <AlertTitle>
                  {testStatus === 'success' && 'Test Completed'}
                  {testStatus === 'error' && 'Test Failed'}
                  {testStatus === 'testing' && 'Testing...'}
                </AlertTitle>
                <AlertDescription>{testMessage}</AlertDescription>
              </Alert>
            )}

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Open your browser's developer console (F12) to view detailed test results,
                including configuration status, connection details, and any errors.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <WithAuthProtection>
      <BookingContent />
    </WithAuthProtection>
  );
}
