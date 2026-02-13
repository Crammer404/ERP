'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { WithAuthProtection } from '@/components/auth/with-auth-protection';
import { bookingService } from '@/app/booking/reservation/service/bookingService';
import { Loader2, CheckCircle2, AlertCircle, Database, Calendar, RefreshCw, Search, MoreVertical } from 'lucide-react';
import { FetchError } from '@/components/ui/fetch-error';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DataTable,
  DataTableHeader,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableCell,
  DataTableFooter,
} from '@/components/ui/data-table';
import CreateFloatingOrderDialog from '@/app/pos/sales/components/CreateFloatingOrderDialog';
import { createFloatingOrder } from '@/app/pos/sales/services/floatingOrderService';
import { useAuth } from '@/components/providers/auth-provider';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { useToast } from '@/hooks/use-toast';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

function BookingContent() {
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'hall' | 'table'>('all');
  const [isCreateFloatingOrderModalOpen, setIsCreateFloatingOrderModalOpen] = useState(false);
  const [initialTableNumber, setInitialTableNumber] = useState<string | undefined>(undefined);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getBookings();
      console.log('BookingContent.fetchBookings received:', Array.isArray(data) ? data.length : typeof data, data && data[0] ? data[0] : null);
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

  const handleBookAction = (booking: any) => {
    // Extract table number from booking and convert to string
    const tableNumber = booking.table_number;
    
    if (tableNumber === null || tableNumber === undefined || tableNumber === '') {
      console.error('No table number found for booking:', booking);
      toast({
        title: "Error",
        description: "No table number found for this booking. Cannot create floating order.",
        variant: "destructive",
      });
      return;
    }

    // Convert to string to ensure it's always a string type
    const tableNumberString = String(tableNumber);

    // Set the initial table number and open the dialog
    setInitialTableNumber(tableNumberString);
    setIsCreateFloatingOrderModalOpen(true);
  };

  const handleCreateFloatingOrder = async (data: {
    table_number: string;
    customer_id?: number;
    notes?: string;
  }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated. Please log in.",
        variant: "destructive",
      });
      return;
    }

    const branchContext = tenantContextService.getStoredBranchContext();
    if (!branchContext?.id) {
      toast({
        title: "Error",
        description: "No branch selected. Please select a branch first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await createFloatingOrder({
        branch_id: branchContext.id,
        created_by: Number(user.id),
        table_number: data.table_number,
        customer_id: data.customer_id,
        notes: data.notes,
      });

      if (!response || !response.data || !response.data.id) {
        throw new Error('Failed to create floating order: Invalid response');
      }

      const floatingOrder = response.data;
      const isExistingOrder = response.existing === true;

      toast({
        title: isExistingOrder ? "Order Consolidated" : "Order Created",
        description: isExistingOrder
          ? `Items will be added to existing order ${floatingOrder.reference_no} for Table ${data.table_number}.`
          : `Floating order ${floatingOrder.reference_no} created successfully for Table ${data.table_number}.`,
        variant: "default",
      });

      // Close the dialog
      setIsCreateFloatingOrderModalOpen(false);
      setInitialTableNumber(undefined);
    } catch (error: any) {
      console.error('Failed to create floating order:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create floating order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getColumns = () => {
    return ['arrival_datetime', 'reservation', 'guest_name', 'guest_email', 'guest_phone', 'booking_type', 'total_price', 'actions'];
  };
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return String(value);
      return value.toFixed(2);
    }
    return String(value);
  };

  const getReservation = (booking: any): string => {
    return booking.reservation_title || 'N/A';
  };

  const getColumnLabel = (column: string): string => {
    const labels: Record<string, string> = {
      'arrival_datetime': 'Date & Time',
      'reservation': 'Reservation',
      'guest_name': 'Guest Name',
      'guest_email': 'Email',
      'guest_phone': 'Phone',
      'booking_type': 'Booking Type',
      'total_price': 'Price',
    };
    return labels[column] || column.replace(/_/g, ' ').toUpperCase();
  };

  const getColumnValue = (booking: any, column: string): React.ReactNode => {
    const renderScrollable = (value: any) => (
      <div className="max-w-[180px] lg:max-w-[360px] overflow-x-auto whitespace-nowrap scrollbar-hide">{formatValue(value)}</div>
    );

    switch (column) {
      case 'arrival_datetime': {
        const date = booking.arrival_datetime;
        if (!date) return 'N/A';
        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) return 'N/A';
        return parsed.toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        });
      }
      case 'reservation':
        return renderScrollable(getReservation(booking));
      case 'guest_name':
        return renderScrollable(booking.guest_name);
      case 'guest_email':
        return renderScrollable(booking.guest_email);
      case 'guest_phone':
        return formatValue(booking.guest_phone);
      case 'booking_type':
        return formatValue(booking.booking_type);
      case 'total_price':
        return `₱${formatValue(booking.total_price)}`;
      case 'actions':
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleBookAction(booking)} className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Book</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      default:
        return 'N/A';
    }
  };

  // Apply client-side search and filter before pagination
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredBookings = bookings.filter((b) => {
    // Filter by type
    if (filterType === 'hall' && String(b.booking_type).toLowerCase() !== 'hall') return false;
    if (filterType === 'table' && String(b.booking_type).toLowerCase() !== 'table') return false;

    // Search across reservation title, guest name, and email
    if (!normalizedSearch) return true;
    const haystack = [b.reservation_title, b.guest_name, b.guest_email].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-headline text-primary">Reservations</h1>
              <p className="text-sm text-muted-foreground">
                View and manage all reservations.
              </p>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full gap-4">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reservations..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10 w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={fetchBookings} disabled={loading} variant="outline">
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                <Tabs defaultValue={filterType} onValueChange={(v) => { setFilterType(v as any); setCurrentPage(1); }}>
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="hall">Halls</TabsTrigger>
                    <TabsTrigger value="table">Tables</TabsTrigger>
                  </TabsList>
                </Tabs>
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
              <FetchError
                error={error}
                onRetry={fetchBookings}
              />
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No bookings found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <DataTable>
                  <DataTableHeader columns={getColumns().length}>
                    {getColumns().map((column) => (
                      <DataTableHead key={column} align={['arrival_datetime', 'reservation'].includes(column) ? 'left' : 'center'}>
                        {getColumnLabel(column)}
                      </DataTableHead>
                    ))}
                  </DataTableHeader>

                  <DataTableBody>
                    {paginatedBookings.map((booking, index) => (
                      <DataTableRow key={booking.id || index} columns={getColumns().length} isClickable={false}>
                        {getColumns().map((column) => (
                          <DataTableCell key={column} label={getColumnLabel(column)} align={['arrival_datetime', 'reservation'].includes(column) ? 'left' : 'center'}>
                            {getColumnValue(booking, column)}
                          </DataTableCell>
                        ))}
                      </DataTableRow>
                    ))}
                  </DataTableBody>

                  <DataTableFooter>
                    <div className="flex w-full items-center justify-between">
                      <PaginationInfos.Standard
                        from={(currentPage - 1) * itemsPerPage + 1}
                        to={Math.min(currentPage * itemsPerPage, bookings.length)}
                        total={bookings.length}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(v) => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}
                      />

                      <Pagination>
                        <PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} />
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationLink onClick={() => setCurrentPage(1)} isActive={currentPage === 1}>1</PaginationLink>
                          </PaginationItem>
                          {/* Simple previous/next - can be expanded to show page range */}
                        </PaginationContent>
                        <PaginationNext onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} />
                      </Pagination>
                    </div>
                  </DataTableFooter>
                </DataTable>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateFloatingOrderDialog
        isOpen={isCreateFloatingOrderModalOpen}
        onOpenChange={setIsCreateFloatingOrderModalOpen}
        onCreate={handleCreateFloatingOrder}
        initialTableNumber={initialTableNumber}
      />
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
