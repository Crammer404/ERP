'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useCustomers as usePosCustomers } from '../hooks/useCustomers';
import { useCustomers as useCustomersFull } from '@/app/customers/hooks/useCustomers';
import { useCustomerForm } from '@/app/customers/hooks/useCustomerForm';
import { CustomerFormModal } from '@/app/customers/components/CustomerFormModal';

type CreateFloatingOrderDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (data: {
    table_number: string;
    customer_id?: number;
    notes?: string;
  }) => Promise<void>;
  initialTableNumber?: string;
};

export default function CreateFloatingOrderDialog({
  isOpen,
  onOpenChange,
  onCreate,
  initialTableNumber,
}: CreateFloatingOrderDialogProps) {
  const { customers, loading: customersLoading, refetch } = usePosCustomers();
  const { handleCreate: createCustomer } = useCustomersFull();
  const { formData, errors, setErrors, resetForm, handleInputChange, handleAddressUpdate, validateForm, prepareSubmitData } = useCustomerForm();
  const [tableNumber, setTableNumber] = useState('');
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [tableNumberError, setTableNumberError] = useState('');

  // Update table number when dialog opens or initialTableNumber changes
  useEffect(() => {
    if (isOpen && initialTableNumber) {
      // Ensure initialTableNumber is converted to string (handles number types from database)
      setTableNumber(String(initialTableNumber));
    } else if (!isOpen) {
      // Reset when dialog closes
      setTableNumber('');
      setCustomerId(undefined);
      setNotes('');
      setTableNumberError('');
    }
  }, [isOpen, initialTableNumber]);

  const onCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    const submitData = prepareSubmitData(false);

    try {
      const response = await createCustomer(submitData);
      setAddCustomerModalOpen(false);
      resetForm();
      refetch(); // Refresh the POS customers list
      // Auto-select the newly created customer
      const newCustomerId = response?.customer?.id || response?.data?.id;
      if (newCustomerId) {
        setCustomerId(newCustomerId);
      }
    } catch (apiErrors: any) {
      setErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateFloatingOrder = async () => {
    let hasError = false;

    // Ensure tableNumber is a string before calling trim()
    const tableNumberStr = String(tableNumber || '').trim();

    if (!tableNumberStr) {
      setTableNumberError('Table number is required.');
      hasError = true;
    } else {
      setTableNumberError('');
    }

    if (hasError) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreate({
        table_number: tableNumberStr,
        customer_id: customerId,
        notes: notes || undefined,
      });
      setTableNumber('');
      setCustomerId(undefined);
      setNotes('');
      setTableNumberError('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create floating order:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Floating Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table-number">Table Number</Label>
            <Input
              id="table-number"
              value={tableNumber}
              onChange={(e) => {
                setTableNumber(e.target.value);
                if (tableNumberError) setTableNumberError('');
              }}
              placeholder="e.g., Table 5"
              required
              className={tableNumberError ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {tableNumberError && (
              <p className="text-xs text-destructive">{tableNumberError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Customer (Optional)</Label>
            {customersLoading ? (
              <p className="text-sm text-muted-foreground">Loading customers...</p>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={customerId?.toString() || undefined}
                    onValueChange={(value) => {
                      setCustomerId(parseInt(value));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.first_name} {customer.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    resetForm();
                    setAddCustomerModalOpen(true);
                  }}
                  className="h-10 w-10 flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreateFloatingOrder} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Order'}
          </Button>
        </DialogFooter>
      </DialogContent>

      <CustomerFormModal
        isOpen={addCustomerModalOpen}
        onOpenChange={setAddCustomerModalOpen}
        isEdit={false}
        formData={formData}
        onInputChange={handleInputChange}
        onAddressUpdate={handleAddressUpdate}
        errors={errors}
        isLoading={formLoading}
        onSubmit={onCreateCustomer}
      />
    </Dialog>
  );
}

