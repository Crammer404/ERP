'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { fetchStockLogs, IngredientStockLog } from '../../recipe/services/ingredient-stock-log-service';
import { Ingredient } from '../services/ingredient-service';
import { useCurrency } from '@/contexts/CurrencyContext';

interface IngredientLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
}

export function IngredientLogsModal({ isOpen, onClose, ingredient }: IngredientLogsModalProps) {
  const [logs, setLogs] = useState<IngredientStockLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceTypeFilter, setReferenceTypeFilter] = useState<'ALL' | string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const { defaultCurrency } = useCurrency();

  useEffect(() => {
    if (isOpen && ingredient) {
      loadLogs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ingredient?.id]);

  const loadLogs = async () => {
    if (!ingredient) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchStockLogs({ ingredient_id: ingredient.id });
      setLogs(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (referenceTypeFilter !== 'ALL' && log.reference_type !== referenceTypeFilter) {
      return false;
    }
    if (directionFilter !== 'ALL' && log.movement_direction !== directionFilter) {
      return false;
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toNumber = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numericAmount = toNumber(amount);
    if (numericAmount === null) return '—';
    return (defaultCurrency?.symbol || '₱') + numericAmount.toFixed(2);
  };

  const formatQuantity = (amount: number | string | null | undefined) => {
    const numericAmount = toNumber(amount);
    if (numericAmount === null) return '—';
    const formattedAmount = numericAmount.toLocaleString(undefined, { maximumFractionDigits: 3 });
    const measurementUnit = ingredient?.measurement?.symbol || ingredient?.measurement?.name || '';
    return measurementUnit ? `${formattedAmount} ${measurementUnit}` : formattedAmount;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Logs for {ingredient?.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            {error}
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex gap-4 mb-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="reference-type-filter">Reference Type</Label>
                <Select value={referenceTypeFilter} onValueChange={(value) => setReferenceTypeFilter(value as 'ALL' | string)}>
                  <SelectTrigger id="reference-type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="PURCHASE">Purchase</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                    <SelectItem value="PRODUCTION">Production</SelectItem>
                    <SelectItem value="POS_SALE">POS Sale</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="direction-filter">Direction</Label>
                <Select value={directionFilter} onValueChange={(value) => setDirectionFilter(value as 'ALL' | 'IN' | 'OUT')}>
                  <SelectTrigger id="direction-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Directions</SelectItem>
                    <SelectItem value="IN">IN</SelectItem>
                    <SelectItem value="OUT">OUT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {logs.length === 0
                  ? 'No stock logs found for this ingredient.'
                  : 'No logs match the selected filters.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="[&_th]:font-mono [&_th]:text-sm [&_td]:font-mono [&_td]:text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Bulk Cost</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.reference_code || '—'}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800">
                            {log.reference_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              log.movement_direction === 'IN'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {log.movement_direction}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              log.movement_direction === 'OUT' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }
                          >
                            {formatQuantity(log.quantity)}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(log.bulk_cost)}</TableCell>
                        <TableCell>{formatCurrency(log.unit_cost)}</TableCell>
                        <TableCell>{log.created_by?.name || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
