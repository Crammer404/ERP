'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchDiscountLogs } from '../services/discountService';
import { Discount } from '../services/discountService';

interface DiscountLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  discount: Discount | null;
}

interface LogEntry {
  id: number;
  activity: string;
  item_name: string | null;
  item: any;
  branch: {
    id: number;
    name: string;
    email: string;
    contact_no: string;
  };
  created_by: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export function DiscountLogsModal({ isOpen, onClose, discount }: DiscountLogsModalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && discount) {
      fetchLogs();
    }
  }, [isOpen, discount]);

  const fetchLogs = async () => {
    if (!discount) return;

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching logs for discount:', discount.id);
      const response = await fetchDiscountLogs(discount.id);
      console.log('Logs API response:', response);
      console.log('Logs data:', response.data);
      setLogs(response.data || []);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activity Logs for {discount?.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No activity logs found for this discount.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.activity}</TableCell>
                  <TableCell>
                    {log.activity === 'Used' ? (
                      <span className="text-red-500">-{log.quanity}</span>
                    ) : (
                      log.quanity || '-'
                    )}
                  </TableCell>
                  <TableCell>{log.branch?.name || '-'}</TableCell>
                  <TableCell>{log.created_by?.name || '-'}</TableCell>
                  <TableCell>{new Date(log.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}