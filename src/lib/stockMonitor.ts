// Stock monitoring utility for real-time notifications
export interface StockStatus {
  productId: number;
  productName: string;
  totalQuantity: number;
  lowStockThreshold: number;
  isOutOfStock: boolean;
  isLowStock: boolean;
  previousStatus?: {
    isOutOfStock: boolean;
    isLowStock: boolean;
  };
}

class StockMonitor {
  private static instance: StockMonitor;
  private previousStockStatuses: Map<number, StockStatus> = new Map();

  private constructor() {}

  public static getInstance(): StockMonitor {
    if (!StockMonitor.instance) {
      StockMonitor.instance = new StockMonitor();
    }
    return StockMonitor.instance;
  }

  /**
   * Calculate stock status for a product
   */
  private calculateStockStatus(product: any): StockStatus {
    const totalQuantity = product.stocks?.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0) || 0;
    const lowStockThreshold = Math.max(
      ...(product.stocks?.map((s: any) => s.low_stock_threshold ?? 0) ?? [0])
    );

    const isOutOfStock = totalQuantity === 0;
    const isLowStock = totalQuantity > 0 && totalQuantity <= lowStockThreshold;

    return {
      productId: product.id,
      productName: product.name,
      totalQuantity,
      lowStockThreshold,
      isOutOfStock,
      isLowStock,
    };
  }

  /**
   * Monitor stock changes and dispatch events when thresholds are crossed
   */
  public monitorStockChange(product: any): void {
    const currentStatus = this.calculateStockStatus(product);
    const previousStatus = this.previousStockStatuses.get(product.id);

    // Store current status for future comparison
    this.previousStockStatuses.set(product.id, currentStatus);

    // Check if stock status changed
    const statusChanged =
      !previousStatus ||
      previousStatus.isOutOfStock !== currentStatus.isOutOfStock ||
      previousStatus.isLowStock !== currentStatus.isLowStock;

    if (statusChanged) {
      console.log('🔔 STOCK ALERT TRIGGERED for:', product.name, {
        previous: previousStatus,
        current: currentStatus,
        action: !previousStatus ? 'initial' :
                currentStatus.isOutOfStock ? 'became out of stock' :
                currentStatus.isLowStock ? 'became low stock' : 'returned to normal'
      });

      // Dispatch stock level change event
      window.dispatchEvent(new CustomEvent('stockLevelChanged', {
        detail: {
          productId: product.id,
          product: product,
          previousStatus: previousStatus ? {
            isOutOfStock: previousStatus.isOutOfStock,
            isLowStock: previousStatus.isLowStock,
          } : null,
          currentStatus: {
            isOutOfStock: currentStatus.isOutOfStock,
            isLowStock: currentStatus.isLowStock,
            totalQuantity: currentStatus.totalQuantity,
            lowStockThreshold: currentStatus.lowStockThreshold,
          }
        }
      }));

      // Also dispatch the general stock updated event
      window.dispatchEvent(new CustomEvent('stockUpdated'));
    }
  }

  /**
   * Monitor multiple products at once
   */
  public monitorProducts(products: any[]): void {
    products.forEach(product => this.monitorStockChange(product));
  }

  /**
   * Clear stored status for a specific product (useful when deleting products)
   */
  public clearProductStatus(productId: number): void {
    this.previousStockStatuses.delete(productId);
  }

  /**
   * Clear stored statuses (useful when switching branches or refreshing data)
   */
  public clearStatuses(): void {
    this.previousStockStatuses.clear();
  }

  /**
   * Get current stock alerts for individual variants
   */
  public getStockAlerts(products: any[]): { lowStock: any[], outOfStock: any[] } {
    const lowStock: any[] = [];
    const outOfStock: any[] = [];

    products.forEach(product => {
      // Check each individual stock variant
      product.stocks?.forEach((stock: any) => {
        const quantity = stock.quantity || 0;
        const threshold = stock.low_stock_threshold ?? 0;
        const isOutOfStock = quantity === 0;
        const isLowStock = quantity > 0 && quantity <= threshold;

        if (isOutOfStock || isLowStock) {
          // Create variant-specific alert item
          const variantAlert = {
            ...product,
            variantStock: stock,
            variantName: stock.variant_specification?.name || 'Default',
            displayName: stock.variant_specification
              ? `${product.name} (${stock.variant_specification.name})`
              : product.name,
            quantity: quantity,
            threshold: threshold,
            sellingPrice: Number(stock.selling_price || product.price || 0),
            isVariant: !!stock.variant_specification
          };

          if (isOutOfStock) {
            outOfStock.push(variantAlert);
          } else if (isLowStock) {
            lowStock.push(variantAlert);
          }
        }
      });

      // For single products (no variants), check total if not already covered
      if (!product.stocks || product.stocks.length === 0) {
        const status = this.calculateStockStatus(product);
        if (status.isOutOfStock) {
          outOfStock.push({
            ...product,
            displayName: product.name,
            quantity: 0,
            threshold: status.lowStockThreshold,
            sellingPrice: Number(product.price || 0),
            isVariant: false
          });
        } else if (status.isLowStock) {
          lowStock.push({
            ...product,
            displayName: product.name,
            quantity: status.totalQuantity,
            threshold: status.lowStockThreshold,
            sellingPrice: Number(product.price || 0),
            isVariant: false
          });
        }
      }
    });

    return { lowStock, outOfStock };
  }
}

// Export singleton instance
export const stockMonitor = StockMonitor.getInstance();

// Helper functions for easy use
export const monitorStockChange = (product: any) => stockMonitor.monitorStockChange(product);
export const monitorProducts = (products: any[]) => stockMonitor.monitorProducts(products);
export const clearProductStatus = (productId: number) => stockMonitor.clearProductStatus(productId);
export const clearStockStatuses = () => stockMonitor.clearStatuses();
export const getStockAlerts = (products: any[]) => stockMonitor.getStockAlerts(products);