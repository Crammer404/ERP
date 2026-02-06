'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { purchaseService } from '../services/purchaseService';
import { supplierService, type Supplier } from '../../../suppliers/services/supplierService';
import { productService } from '@/services/product/productService';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { usePaymentMethods, type PaymentMethod } from '../../../pos/sales/hooks/usePaymentMethods';
import { authService } from '@/services/auth/authService';

export interface OrderFormValues {
  supplier: string;
  productName: string;
  stocks: number;
  cost: number;
  subtotal: number;
  discount: number;
  itemsDiscount: number;
  totalDiscount: number;
  total: number;
  status: string;
  paymentMethod: string;
  hasDiscount: boolean;
  paidAmount: number;
  due: number;
  change: number;
}

const orderSchema = z.object({
  supplier: z.string().min(1, "Supplier is required"),
  productName: z.string().min(1, "Product name is required"),
  stocks: z.number().min(1, "Stocks must be at least 1"),
  cost: z.number().min(0, "Cost must be positive"),
  subtotal: z.number().min(0, "Subtotal must be 0 or greater"),
  discount: z.number().min(0, "Discount must be 0 or greater").max(100, "Discount cannot exceed 100%"),
  itemsDiscount: z.number().min(0, "Items discount must be 0 or greater"),
  totalDiscount: z.number().min(0, "Total discount must be 0 or greater"),
  total: z.number().min(0, "Total must be positive"),
  status: z.literal("pending"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  hasDiscount: z.boolean(),
  paidAmount: z.number().min(0, "Paid amount must be 0 or greater"),
  due: z.number().min(0, "Due amount must be 0 or greater"),
  change: z.number().min(0, "Change must be 0 or greater"),
});

export type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  order?: any | null;
  onSave: (values: any) => Promise<void>;
  onCancel: () => void;
  currentBranch?: { id: number; name: string } | null;
}

export function OrderForm({ order, onSave, onCancel, currentBranch: propCurrentBranch }: OrderFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [currentBranch, setCurrentBranch] = useState<{ id: number; name: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pop, setPop] = useState(false);
  const { toast } = useToast();

  // Fetch payment methods
  const { paymentMethods } = usePaymentMethods();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      supplier: order?.supplier || '',
      productName: order?.productName || '',
      stocks: order?.stocks || 1,
      cost: order?.cost || 0,
      subtotal: order?.subtotal || 0,
      discount: order?.discount || 0,
      itemsDiscount: order?.itemsDiscount || 0,
      totalDiscount: order?.totalDiscount || 0,
      total: order?.total || 0,
      status: 'pending',
      paymentMethod: order?.paymentMethod || '',
      hasDiscount: order?.hasDiscount || false,
      paidAmount: order?.paidAmount || 0,
      due: order?.due || 0,
      change: order?.change || 0,
    },
  });

  // Get stored branch context or use prop
  useEffect(() => {
    if (propCurrentBranch) {
      setCurrentBranch(propCurrentBranch);
    } else {
      const storedBranch = tenantContextService.getStoredBranchContext();
      if (storedBranch) {
        setCurrentBranch(storedBranch);
      }
    }
  }, [propCurrentBranch]);

  // Get current user
  useEffect(() => {
    const cachedUser = authService.getCachedUserData();
    if (cachedUser) {
      setCurrentUser(cachedUser);
    }
  }, []);

  // Load suppliers (similar to ProductForm)
  const loadSuppliers = async (branchOverride?: { id: number; name: string } | null) => {
    try {
      const suppliersResponse = await supplierService.fetchSuppliers();
      const suppliersData = suppliersResponse.suppliers || suppliersResponse.data || [];

      // Use provided branch or current branch
      const branchToUse = branchOverride !== undefined ? branchOverride : currentBranch;

      // Filter suppliers by branch if available
      let filteredSuppliers = suppliersData;
      if (branchToUse) {
        filteredSuppliers = suppliersData.filter(
          (supplier: any) => !supplier.branch || supplier.branch?.id === branchToUse.id
        );
      }

      // Transform suppliers to match expected format (similar to ProductForm)
      const transformedSuppliers = filteredSuppliers.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }));

      setSuppliers(transformedSuppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
    }
  };

  // Load products
  const loadProducts = async () => {
    try {
      const params = currentBranch?.id ? { branch_id: currentBranch.id } : {};
      const productsResponse = await productService.getAll(params);
      const productsData = productsResponse.data || [];
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  // Initial load
  useEffect(() => {
    loadSuppliers();
  }, []);

  // Show all products from the current branch
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  // Reload suppliers and products when branch changes
  useEffect(() => {
    if (currentBranch) {
      loadSuppliers();
      loadProducts();
    }
  }, [currentBranch?.id]);

  // Listen for branch/tenant change events
  useEffect(() => {
    const handleContextChange = async () => {
      // Get updated branch context
      const updatedBranch = tenantContextService.getStoredBranchContext();
      setCurrentBranch(updatedBranch);

      // Reload suppliers with new branch
      await loadSuppliers(updatedBranch);
    };
    window.addEventListener('branchChanged', handleContextChange);
    window.addEventListener('tenantChanged', handleContextChange);

    return () => {
      window.removeEventListener('branchChanged', handleContextChange);
      window.removeEventListener('tenantChanged', handleContextChange);
    };
  }, []);

  // Calculate Grand Total when subtotal or totalDiscount changes
  useEffect(() => {
    const subtotal = (form.watch("stocks") || 0) * (form.watch("cost") || 0);
    const totalDiscount = (
      (((form.watch("stocks") || 0) * (form.watch("cost") || 0)) * ((form.watch("discount") || 0) / 100))
    );
    const grandTotal = Math.max(0, subtotal - totalDiscount);
    form.setValue("total", grandTotal, { shouldValidate: true });
  }, [form.watch("stocks"), form.watch("cost"), form.watch("discount")]);

  // Calculate Due and Change when total or paidAmount changes
  useEffect(() => {
    const total = form.watch("total") || 0;
    const paidAmount = form.watch("paidAmount") || 0;
    const due = Math.max(0, total - paidAmount);
    const change = Math.max(0, paidAmount - total);
    form.setValue("due", due, { shouldValidate: true });
    form.setValue("change", change, { shouldValidate: true });
  }, [form.watch("total"), form.watch("paidAmount")]);

  // Reset pricing fields when product changes
  useEffect(() => {
    const productName = form.watch("productName");
    if (productName) {
      // Reset pricing-related fields to defaults
      form.setValue("stocks", 1);
      form.setValue("cost", 0);
      form.setValue("discount", 0);
      form.setValue("paymentMethod", "");
      form.setValue("hasDiscount", false);
      form.setValue("paidAmount", 0);
      form.setValue("due", 0);
      form.setValue("change", 0);
      form.setValue("total", 0);
      form.setValue("subtotal", 0);
      form.setValue("itemsDiscount", 0);
      form.setValue("totalDiscount", 0);
    }
  }, [form.watch("productName")]);

  // ✅ Submit handler
  const onSubmit = async (data: OrderFormData) => {
    setIsSaving(true);
    try {
      // Find IDs from names
      const supplier = suppliers.find(s => s.name === data.supplier);
      const product = products.find(p => p.name === data.productName);
      const paymentMethod = paymentMethods.find(pm => pm.name === data.paymentMethod);

      if (!supplier || !product || !paymentMethod) {
        throw new Error('Invalid supplier, product, or payment method selected');
      }

      const branchId = tenantContextService.getStoredBranchContext()?.id || null;
      const payload = {
        supplier_id: supplier.id,
        branch_id: branchId,
        payment_method_id: paymentMethod.id,
        created_by: currentUser?.id || null,
        date: new Date().toISOString().split('T')[0],
        status: data.status,
        purchase_items: [{
          product_id: product.id,
          quantity: data.stocks,
          discount: data.cost * (data.discount / 100),
        }],
        subtotal: data.subtotal,
        items_total_discount: data.itemsDiscount,
        total_discount: data.totalDiscount,
        grand_total: data.total,
        paid_amount: data.paidAmount,
        due: data.due,
        change: data.change,
      };

      await onSave(payload);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      id="order-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 min-h-0 max-h-[60vh] overflow-y-auto"
    >
      <AnimatePresence mode="wait">
        <motion.div
          animate={pop ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="space-y-6 pb-6 px-2">
            {/* 🏢 Basic Information Section - Always Visible */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h3 className="text-base font-semibold text-primary">Basic Information</h3>
              </div>

              {/* Supplier and Branch Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.watch("supplier")}
                    onValueChange={(value) => form.setValue("supplier", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.name}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.supplier && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.supplier.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Branch</label>
                  <Input
                    value={currentBranch?.name || 'Branch information not available'}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    placeholder="Branch information"
                  />
                </div>
              </div>

              {/* Product Name and Status Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.watch("productName")}
                    onValueChange={(value) => form.setValue("productName", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProducts.map((product) => (
                        <SelectItem key={product.id} value={product.name}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.productName && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.productName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Input
                    value="pending"
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* 💰 Pricing & Payment Section - Show when product is selected */}
            {form.watch("supplier") && form.watch("productName") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400">Pricing & Payment</h3>
                </div>

                {/* Quantity, Price/Unit, and Subtotal Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      {...form.register("stocks", { valueAsNumber: true })}
                      onChange={(e) => {
                        let raw = e.target.value;
                        // Remove leading zero if followed by digit
                        if (raw.startsWith("0") && raw.length > 1) {
                          raw = raw.substring(1);
                          e.target.value = raw;
                        }
                        const stocks = raw === "" ? 1 : parseInt(raw);
                        form.setValue("stocks", stocks, { shouldValidate: true });
                      }}
                    />
                    {form.formState.errors.stocks && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.stocks.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Price/Unit <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter price per unit"
                      {...form.register("cost", { valueAsNumber: true })}
                      onChange={(e) => {
                        let raw = e.target.value;
                        // Remove leading zero if followed by digit
                        if (raw.startsWith("0") && raw.length > 1 && raw[1] !== ".") {
                          raw = raw.substring(1);
                          e.target.value = raw;
                        }
                        const cost = raw === "" ? undefined : parseFloat(raw);
                        form.setValue("cost", cost ?? 0, { shouldValidate: true });
                      }}
                    />
                    {form.formState.errors.cost && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.cost.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Subtotal
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Auto-calculated"
                      value={((form.watch("stocks") || 0) * (form.watch("cost") || 0)).toFixed(2)}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed font-medium"
                      {...form.register("subtotal", { valueAsNumber: true })}
                    />
                    {form.formState.errors.subtotal && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.subtotal.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Method and Has Discount - 2 Column Layout */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={form.watch("paymentMethod")}
                      onValueChange={(value) => form.setValue("paymentMethod", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...paymentMethods].sort((a, b) => a.id - b.id).map((method) => (
                          <SelectItem key={method.id} value={method.name}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.paymentMethod && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.paymentMethod.message}
                      </p>
                    )}
                  </div>

                  {/* Has Discount Radio Buttons */}
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium mb-2">
                      Purchase Discount
                    </label>
                    <RadioGroup
                      value={form.watch("hasDiscount") ? "yes" : "no"}
                      onValueChange={(value) => form.setValue("hasDiscount", value === "yes")}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="discount-yes" className="w-5 h-5" />
                        <Label htmlFor="discount-yes" className="text-sm font-medium">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="discount-no" className="w-5 h-5" />
                        <Label htmlFor="discount-no" className="text-sm font-medium">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 💸 Discounts Section - Show when product and payment method is selected AND has discount is true */}
            {form.watch("supplier") && form.watch("productName") && form.watch("paymentMethod") && form.watch("hasDiscount") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                  <h3 className="text-base font-semibold text-orange-600 dark:text-orange-400">Discounts</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Discount (%) - Editable */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Discount (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      {...form.register("discount", { valueAsNumber: true })}
                      onChange={(e) => {
                        let raw = e.target.value;
                        // Remove leading zero if followed by digit
                        if (raw.startsWith("0") && raw.length > 1 && raw[1] !== ".") {
                          raw = raw.substring(1);
                          e.target.value = raw;
                        }
                        const discount = raw === "" ? 0 : parseFloat(raw);
                        form.setValue("discount", discount, { shouldValidate: true });
                      }}
                    />
                    {form.formState.errors.discount && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.discount.message}
                      </p>
                    )}
                  </div>


                  {/* Discount/Unit - ReadOnly (calculated from price/unit * discount%) */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Discount/Unit
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Auto-calculated"
                      value={((form.watch("cost") || 0) * ((form.watch("discount") || 0) / 100)).toFixed(2)}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed font-medium"
                      {...form.register("itemsDiscount", { valueAsNumber: true })}
                    />
                    {form.formState.errors.itemsDiscount && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.itemsDiscount.message}
                      </p>
                    )}
                  </div>

                  {/* Total Discount - ReadOnly (itemsDiscount + invoiceDiscount) */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Total Discount
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Auto-calculated"
                      value={(
                        (((form.watch("stocks") || 0) * (form.watch("cost") || 0)) * ((form.watch("discount") || 0) / 100))
                      ).toFixed(2)}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed font-medium"
                      {...form.register("totalDiscount", { valueAsNumber: true })}
                    />
                    {form.formState.errors.totalDiscount && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.totalDiscount.message}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 💳 Payment Summary & Final Total - Show when product and payment method is selected */}
            {form.watch("supplier") && form.watch("productName") && form.watch("paymentMethod") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* 💳 Payment Summary Section - Now includes Grand Total */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                    <h3 className="text-base font-semibold text-purple-600 dark:text-purple-400">Payment Summary</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Paid Amount
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...form.register("paidAmount", { valueAsNumber: true })}
                        onChange={(e) => {
                          let raw = e.target.value;
                          // Remove leading zero if followed by digit
                          if (raw.startsWith("0") && raw.length > 1 && raw[1] !== ".") {
                            raw = raw.substring(1);
                            e.target.value = raw;
                          }
                          const paidAmount = raw === "" ? 0 : parseFloat(raw);
                          form.setValue("paidAmount", paidAmount, { shouldValidate: true });
                        }}
                      />
                      {form.formState.errors.paidAmount && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.paidAmount.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Balance
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Auto-calculated"
                        value={Math.max(0, (form.watch("total") || 0) - (form.watch("paidAmount") || 0))}
                        readOnly
                        className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed font-medium"
                        {...form.register("due", { valueAsNumber: true })}
                      />
                      {form.formState.errors.due && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.due.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Change
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Auto-calculated"
                        value={Math.max(0, (form.watch("paidAmount") || 0) - (form.watch("total") || 0))}
                        readOnly
                        className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed font-medium"
                        {...form.register("change", { valueAsNumber: true })}
                      />
                      {form.formState.errors.change && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.change.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Grand Total <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Auto-calculated"
                        value={(form.watch("total") || 0).toFixed(2)}
                        readOnly
                        className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed text-lg font-semibold"
                        {...form.register("total", { valueAsNumber: true })}
                      />
                      {form.formState.errors.total && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.total.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </form>
  );
}
