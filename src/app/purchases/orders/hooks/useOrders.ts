'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { purchaseService, type PurchaseOrder } from '../services/purchaseService';
import { supplierService, type Supplier } from '../../../suppliers/services/supplierService';
import { productService } from '@/services/product/productService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

export function useOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [currentBranch, setCurrentBranch] = useState<{ id: number; name: string } | null>(null);
  const { toast } = useToast();

  // Get stored branch context
  useEffect(() => {
    const storedBranch = tenantContextService.getStoredBranchContext();
    if (storedBranch) {
      setCurrentBranch(storedBranch);
    }
  }, []);

  // Load orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load orders
      const ordersData = await purchaseService.getOrders();
      setOrders(ordersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
    loadOrders();
    loadSuppliers(); // Load suppliers initially
    loadProducts(); // Load products initially
  }, []);

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

      // Reload orders
      await loadOrders();
      setSelectedSupplier(''); // Clear supplier filter on context change
    };
    window.addEventListener('branchChanged', handleContextChange);
    window.addEventListener('tenantChanged', handleContextChange);

    return () => {
      window.removeEventListener('branchChanged', handleContextChange);
      window.removeEventListener('tenantChanged', handleContextChange);
    };
  }, []);

  // Filter orders based on search term and selected supplier
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some(item => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSupplier = !selectedSupplier || order.supplier === selectedSupplier;

      return matchesSearch && matchesSupplier;
    });
  }, [orders, searchTerm, selectedSupplier]);

  // CRUD operations
  const handleSaveOrder = async (data: any, id?: number) => {
    try {
      if (id) {
        await purchaseService.updateOrder(id, data);
        toast({
          title: 'Order Updated',
          description: 'The purchase order has been updated successfully.',
          variant: 'success',
        });
      } else {
        await purchaseService.createOrder(data);
        toast({
          title: 'Order Added',
          description: 'A new purchase order has been created.',
          variant: 'success',
        });
      }
      await loadOrders();
    } catch (err) {
      console.error('Error saving order:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save order',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOrder = async (id: number) => {
    try {
      await purchaseService.deleteOrder(id);
      toast({
        title: 'Order Deleted',
        description: 'The purchase order has been removed.',
        variant: 'success',
      });
      await loadOrders();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete order',
        variant: 'destructive',
      });
    }
  };

  const handleApproveOrder = async (id: number) => {
    try {
      await purchaseService.approveOrder(id);
      toast({
        title: 'Order Approved',
        description: 'The purchase order has been approved.',
        variant: 'success',
      });
      await loadOrders();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve order',
        variant: 'destructive',
      });
    }
  };

  const handleRejectOrder = async (id: number) => {
    try {
      await purchaseService.rejectOrder(id);
      toast({
        title: 'Order Rejected',
        description: 'The purchase order has been rejected.',
        variant: 'success',
      });
      await loadOrders();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject order',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await purchaseService.updateOrder(id, { status });
      toast({
        title: 'Status Updated',
        description: `The purchase order status has been changed to ${status}.`,
        variant: 'success',
      });
      await loadOrders();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    loadOrders();
  };

  return {
    // State
    orders: filteredOrders,
    suppliers,
    products,
    loading,
    error,
    searchTerm,
    selectedSupplier,
    currentBranch,

    // Actions
    setSearchTerm,
    setSelectedSupplier,
    handleSaveOrder,
    handleDeleteOrder,
    handleApproveOrder,
    handleRejectOrder,
    handleStatusChange,
    handleRefresh,
    loadOrders,
  };
}