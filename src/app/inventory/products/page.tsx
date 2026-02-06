'use client';

import { ProductFilters } from './components/ProductFilters';
import { ProductTable } from './components/ProductTable';
import { useProducts } from './hooks/useProducts';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Boxes } from 'lucide-react';

export default function ProductsPage() {
  const {
    products,
    paginatedProducts,
    selectedProductIds,
    currentPage,
    totalPages,
    itemsPerPage,
    searchTerm,
    sortDirection,
    isMounted,
    loading,
    error,
    selectedCategories,
    selectedStatuses,
    selectedBranches,
    selectedVariantTypes,
    uniqueCategories,
    uniqueBranches,
    handleSaveProduct,
    handleDeleteProduct,
    handleMassDelete,
    handleSortByName,
    handleSelectionChange,
    handleSearchChange,
    handlePageChange,
    handleItemsPerPageChange,
    loadProducts,
    handleDeleteStock,
    handleCategoryFilter,
    handleStatusFilter,
    handleBranchFilter,
    handleVariantTypeFilter,
    clearFilters,
  } = useProducts();


  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Boxes className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h1 className="text-2xl font-bold font-headline">Inventory</h1>
            <p className="text-sm text-muted-foreground">
                View, add, edit, and manage your product inventory.
            </p>
        </div>
      </div>

      <div className="space-y-6">
        <ProductFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          selectedProductIds={selectedProductIds}
          onMassDelete={handleMassDelete}
          onSaveProduct={handleSaveProduct}
          onRefresh={loadProducts}
          selectedCategories={selectedCategories}
          selectedStatuses={selectedStatuses}
          selectedBranches={selectedBranches}
          selectedVariantTypes={selectedVariantTypes}
          onCategoryFilter={handleCategoryFilter}
          onStatusFilter={handleStatusFilter}
          onBranchFilter={handleBranchFilter}
          onVariantTypeFilter={handleVariantTypeFilter}
          onClearFilters={clearFilters}
          uniqueCategories={uniqueCategories}
          uniqueBranches={uniqueBranches}
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader size="md" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <>
            {products.length === 0 ? (
              // No products at all
              <EmptyStates.Products />
            ) : (
              // Filters applied but no match
              <EmptyStates.Products
                title="No products match your filters"
                description="Try adjusting your search or filter criteria to find products."
                action={
                  <Button onClick={clearFilters}>
                    Clear Filters
                  </Button>
                }
              />
            )}
          </>
        ) : (
          <>
            <ProductTable
              products={paginatedProducts}
              selectedProductIds={selectedProductIds}
              onSelectionChange={handleSelectionChange}
              onDeleteProduct={handleDeleteProduct}
              onSaveProduct={handleSaveProduct}
              onRefresh={loadProducts}
              onSortByName={handleSortByName}
              sortDirection={sortDirection}
              isMounted={isMounted}
              searchTerm={searchTerm}
              onDeleteStock={handleDeleteStock}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
              <PaginationInfos.Standard
                from={(currentPage - 1) * itemsPerPage + 1}
                to={Math.min(currentPage * itemsPerPage, products.length)}
                total={products.length}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
              />

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page =>
                        page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && page - prev > 1;
                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsis && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={page === currentPage}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          </div>
                        );
                      })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
