'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { MultiSelect } from '@/components/ui/multi-select';
import { Search, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import { OrderDialog } from './components/OrderDialog';
import type { OrderFormValues } from './components/OrderForm';
import { OrderTable } from './components/OrderTable';
import { useOrders } from './hooks/useOrders';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePaymentMethods } from '../../pos/sales/hooks/usePaymentMethods';
import { purchaseService } from './services/purchaseService';
import { authService } from '@/services/auth/authService';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { useToast } from '@/hooks/use-toast';

type TabKey = 'add-purchase' | 'purchase-approval' | 'purchase-history';

export function OrdersClient() {
  const [activeTab, setActiveTab] = React.useState<TabKey>('add-purchase');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingOrder, setEditingOrder] = React.useState<OrderFormValues | null>(null);
  const [selectedProducts, setSelectedProducts] = React.useState<string[]>([]);
  const [productData, setProductData] = React.useState<Record<string, { quantity: number; costPrice: number; discount: number }>>({});
  const [paymentMethod, setPaymentMethod] = React.useState<string>('');
  const [payableAmount, setPayableAmount] = React.useState<number>(0);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { defaultCurrency } = useCurrency();
  const { paymentMethods } = usePaymentMethods();
  const { toast } = useToast();

  // Debug payment methods
  React.useEffect(() => {
    console.log('Payment methods:', paymentMethods);
  }, [paymentMethods]);

  // Use the orders hook
  const {
    orders,
    suppliers,
    products,
    loading,
    searchTerm,
    selectedSupplier,
    currentBranch,
    setSearchTerm,
    setSelectedSupplier,
    handleSaveOrder,
    handleDeleteOrder,
    handleApproveOrder,
    handleRejectOrder,
    handleStatusChange,
    handleRefresh,
  } = useOrders();

  const handleAdd = () => setIsDialogOpen(true);

  const handleEdit = (item: any) => {
    setEditingOrder(item);
    setIsDialogOpen(true);
  };

  // ✅ Save (Create or Update)
  const handleSave = async (data: any, id?: number): Promise<void> => {
    await handleSaveOrder(data, id);
    setIsDialogOpen(false);
    setEditingOrder(null);
  };

  // ✅ Delete
  const handleDelete = async (id: number) => {
    await handleDeleteOrder(id);
  };

  // ✅ Approve
  const handleApprove = async (id: number) => {
    await handleApproveOrder(id);
  };

  // ✅ Reject
  const handleReject = async (id: number) => {
    await handleRejectOrder(id);
  };

  // ✅ Status Change
  const handleStatusChangeWrapper = async (id: number, status: string) => {
    await handleStatusChange(id, status);
  };

  // Get current user
  React.useEffect(() => {
    const cachedUser = authService.getCachedUserData();
    if (cachedUser) {
      setCurrentUser(cachedUser);
    }
  }, []);

  // Reset search term and selected products when supplier changes
  React.useEffect(() => {
    setSearchTerm('');
    setSelectedProducts([]);
    setProductData({});
  }, [selectedSupplier]);

  // Get available products from the current branch for the selected supplier
  const availableProducts = React.useMemo(() => {
    if (!selectedSupplier) return [];
    // Show all active products from the current branch when a supplier is selected
    return products
      .filter(product => product.status === 'active')
      .map(product => ({ value: product.name, label: product.name }));
  }, [products, selectedSupplier]);

  // Get selected products data
  const selectedProductsData = React.useMemo(() => {
    return products.filter(product => selectedProducts.includes(product.name));
  }, [products, selectedProducts]);

  // Calculate totals
  const totals = React.useMemo(() => {
    let totalSubtotal = 0;
    let totalDiscountAmount = 0;

    selectedProductsData.forEach(product => {
      const productKey = product.name;
      const currentData = productData[productKey] || {
        quantity: 1,
        costPrice: product.stocks?.[0]?.cost || 0,
        discount: 0
      };

      const subtotal = currentData.quantity * currentData.costPrice;
      const discountAmount = subtotal * (currentData.discount / 100);
      const finalAmount = subtotal - discountAmount;

      totalSubtotal += subtotal;
      totalDiscountAmount += discountAmount;
    });

    const grandTotal = totalSubtotal - totalDiscountAmount;
    const change = Math.max(0, payableAmount - grandTotal);

    return {
      totalSubtotal,
      totalDiscountAmount,
      grandTotal,
      change
    };
  }, [selectedProductsData, productData, payableAmount]);

  const getSingularLabel = (tab: TabKey) => {
    const map: Record<TabKey, string> = {
      'add-purchase': 'Purchase Order',
      'purchase-approval': 'Purchase Approval',
      'purchase-history': 'Purchase History',
    };
    return map[tab];
  };

  // Handle purchase submission
  const handleSubmitPurchase = async () => {
    if (!selectedSupplier || !paymentMethod || selectedProductsData.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a supplier, payment method, and at least one product.',
        variant: 'destructive',
      });
      return;
    }

    if (payableAmount < totals.grandTotal) {
      toast({
        title: 'Insufficient Payment',
        description: 'Payable amount must be at least equal to the grand total.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Find supplier and payment method IDs
      const supplier = suppliers.find(s => s.name === selectedSupplier);
      const paymentMethodObj = paymentMethods?.find(pm => pm.name === paymentMethod);

      console.log('Selected supplier:', selectedSupplier, 'Found:', supplier);
      console.log('Selected payment method:', paymentMethod, 'Found:', paymentMethodObj);
      console.log('Available suppliers:', suppliers);
      console.log('Available payment methods:', paymentMethods);

      if (!supplier) {
        throw new Error('Invalid supplier selected');
      }
      if (!paymentMethodObj) {
        throw new Error('Invalid payment method selected');
      }

      // Prepare purchase items
      const purchaseItems = selectedProductsData.map(product => {
        const productKey = product.name;
        const currentData = productData[productKey] || {
          quantity: 1,
          costPrice: product.stocks?.[0]?.cost || 0,
          discount: 0
        };

        const subtotal = currentData.quantity * currentData.costPrice;
        const discountAmount = subtotal * (currentData.discount / 100);

        return {
          product_id: product.id,
          quantity: currentData.quantity,
          discount: discountAmount, // Fixed: was missing discount in OrderForm
        };
      });

      console.log('Purchase items:', purchaseItems);

      const branchId = tenantContextService.getStoredBranchContext()?.id || null;

      const payload = {
        supplier_id: supplier.id,
        branch_id: branchId,
        payment_method_id: paymentMethodObj.id,
        created_by: currentUser?.id || null,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        purchase_items: purchaseItems,
        subtotal: totals.totalSubtotal,
        items_total_discount: totals.totalDiscountAmount,
        total_discount: totals.totalDiscountAmount, // Fixed: was missing in OrderForm
        grand_total: totals.grandTotal,
        paid_amount: payableAmount,
        due: Math.max(0, totals.grandTotal - payableAmount), // Ensure due is never negative
        change: totals.change,
      };

      console.log('Submitting purchase payload:', payload);
      try {
        await purchaseService.createOrder(payload);
      } catch (error: any) {
        console.error('Purchase creation error:', error);
        console.error('Error response:', error.response?.data);
        throw error;
      }

      toast({
        title: 'Purchase Order Created',
        description: 'The purchase order has been successfully created.',
        variant: 'success',
      });

      // Reset form
      setSelectedProducts([]);
      setProductData({});
      setPaymentMethod('');
      setPayableAmount(0);
      setSelectedSupplier('');

      // Refresh orders
      handleRefresh();

    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create purchase order',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabKey)}
          className="w-full"
        >
          {/* 🔹 Tabs Header */}
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add-purchase">New Purchase</TabsTrigger>
            <TabsTrigger value="purchase-approval">Purchase Approval</TabsTrigger>
            <TabsTrigger value="purchase-history">Purchase History</TabsTrigger>
          </TabsList>

          {/* 🔹 Search + Actions */}
          <div className="flex items-center gap-4 mt-6 mb-6">
            <Combobox
              options={suppliers.map((supplier) => ({
                value: supplier.name,
                label: supplier.name,
              }))}
              value={selectedSupplier}
              onChange={setSelectedSupplier}
              placeholder="Select supplier"
              searchPlaceholder="Search suppliers..."
              className="w-[200px]"
            />
            <div className="relative flex-1">
              {activeTab === 'add-purchase' ? (
                <MultiSelect
                  options={availableProducts}
                  value={selectedProducts}
                  onChange={setSelectedProducts}
                  placeholder="Select products..."
                  searchPlaceholder="Search products..."
                  emptyLabel="Select products"
                />
              ) : (
                <>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={`Search ${activeTab.replace('-', ' ')}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
              className="h-10 w-10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
{/* 🔹 Table Content */}
<TabsContent value="add-purchase">
  {selectedProductsData.length > 0 ? (
    <div className="flex gap-6">
      {/* Products Table */}
      <div className="flex-1 border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">Image</TableHead>
              <TableHead className="text-left">Name</TableHead>
              <TableHead className="text-left">Branch</TableHead>
              <TableHead className="text-left">Quantity</TableHead>
              <TableHead className="text-left">Cost Price</TableHead>
              <TableHead className="text-left">Discount</TableHead>
              <TableHead className="text-left">Subtotal</TableHead>
              <TableHead className="w-[50px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {selectedProductsData.map((product) => {
              const productKey = product.name;
              const currentData = productData[productKey] || {
                quantity: 1,
                costPrice: product.stocks?.[0]?.cost || 0,
                discount: 0
              };
              const total = (currentData.quantity * currentData.costPrice) * (1 - currentData.discount / 100);

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="aspect-square w-12 relative">
                      <Image
                        src={product.image || '/placeholder.png'}
                        alt={product.name}
                        fill
                        className="rounded-md border object-cover"
                        unoptimized
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{currentBranch?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={currentData.quantity}
                      onChange={(e) => {
                        const quantity = Math.max(1, parseInt(e.target.value) || 1);
                        setProductData(prev => ({
                          ...prev,
                          [productKey]: { ...currentData, quantity }
                        }));
                      }}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentData.costPrice}
                      onChange={(e) => {
                        const costPrice = Math.max(0, parseFloat(e.target.value) || 0);
                        setProductData(prev => ({
                          ...prev,
                          [productKey]: { ...currentData, costPrice }
                        }));
                      }}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={currentData.discount}
                        onChange={(e) => {
                          const discount = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                          setProductData(prev => ({
                            ...prev,
                            [productKey]: { ...currentData, discount }
                          }));
                        }}
                        className="w-20 pr-6"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {defaultCurrency?.symbol || '₱'}{total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProducts(prev => prev.filter(p => p !== product.name));
                        setProductData(prev => {
                          const newData = { ...prev };
                          delete newData[productKey];
                          return newData;
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Purchase Receipt */}
      <div className="w-80">
        <div className="border rounded-lg p-6 bg-muted/20">
          <h3 className="text-lg font-semibold mb-4 text-center">Purchase Receipt</h3>

          <div className="space-y-4">
            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total:</span>
              <span className="text-sm font-semibold">{defaultCurrency?.symbol || '₱'}{totals.totalSubtotal.toFixed(2)}</span>
            </div>

            {/* Discount Total */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Discount Total:</span>
              <span className="text-sm font-semibold text-red-600">-{defaultCurrency?.symbol || '₱'}{totals.totalDiscountAmount.toFixed(2)}</span>
            </div>

            <hr className="my-2" />

            {/* Grand Total */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Grand Total:</span>
              <span className="text-lg font-bold">{defaultCurrency?.symbol || '₱'}{totals.grandTotal.toFixed(2)}</span>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method:</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods?.map((method) => (
                    <SelectItem key={method.id} value={method.name}>
                      {method.name}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>

            {/* Payable Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payable Amount:</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={payableAmount || ''}
                onChange={(e) => setPayableAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            {/* Change Amount */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Change:</span>
              <span className="text-sm font-semibold">{defaultCurrency?.symbol || '₱'}{totals.change.toFixed(2)}</span>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full mt-4"
              disabled={!paymentMethod || payableAmount < totals.grandTotal || isSubmitting}
              onClick={handleSubmitPurchase}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Purchase'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="text-center text-muted-foreground border rounded-lg py-12">
      <p>Select products above to start creating a purchase order</p>
    </div>
  )}
</TabsContent>

          <TabsContent value="purchase-approval">
            <OrderTable
              orders={orders}
              searchTerm={searchTerm}
              selectedSupplier={selectedSupplier}
              loading={loading}
              onDelete={handleDelete}
              onEdit={handleEdit}
              statusFilter="pending"
              isApproval={true}
              onApprove={handleApprove}
              onReject={handleReject}
              onStatusChange={handleStatusChangeWrapper}
            />
          </TabsContent>

          <TabsContent value="purchase-history">
            <OrderTable
              orders={orders}
              searchTerm={searchTerm}
              selectedSupplier={selectedSupplier}
              loading={loading}
              onDelete={handleDelete}
              onEdit={handleEdit}
              statusFilter={['approved', 'rejected', 'for review', 'for returned', 'for recall']}
              onStatusChange={handleStatusChangeWrapper}
            />
          </TabsContent>
        </Tabs>

        {/* 🔹 Dialog for Add/Edit */}
        <OrderDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingOrder(null);
          }}
          title={editingOrder ? `Edit ${getSingularLabel(activeTab)}` : `Add ${getSingularLabel(activeTab)}`}
          order={editingOrder}
          onSave={handleSave}
          onRefresh={handleRefresh}
          currentBranch={currentBranch}
        />
      </CardContent>
    </Card>
  );
}