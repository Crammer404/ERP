'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';
import { products as initialProducts } from '@/lib/products';
import useLocalStorage from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, SlidersHorizontal, ChevronDown, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  cost: z.coerce.number().min(0.01, 'Cost must be greater than 0'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ProductFormValues = z.infer<typeof productSchema>;

const ProductDialog = ({
  product,
  onSave,
  children,
}: {
  product?: Product | null;
  onSave: (values: ProductFormValues, id?: number) => void;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? { ...product }
      : {
          name: '',
          category: '',
          price: 0,
          cost: 0,
          stock: 0,
          image: '',
        },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(
        product
          ? { ...product }
          : {
              name: '',
              category: '',
              price: 0,
              cost: 0,
              stock: 0,
              image: '',
            }
      );
    }
  }, [isOpen, product, form]);

  const onSubmit = (values: ProductFormValues) => {
    onSave(values, product?.id);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
          <DialogDescription>
            {product
              ? 'Update the details of your product.'
              : 'Add a new product to your inventory.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Organic Apples" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. produce" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://placehold.co/100x100.png"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit">Save Product</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const ROWS_PER_PAGE = 10;

export function ProductsClient() {
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useLocalStorage<Product[]>('products', initialProducts);
  const { toast } = useToast();
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const matchesStatus = selectedStatuses.length === 0 ||
                           (selectedStatuses.includes('In Stock') && product.stock > 0) ||
                           (selectedStatuses.includes('Out of Stock') && product.stock === 0);
      const matchesBranch = selectedBranches.length === 0 || selectedBranches.includes('Main Branch'); // TODO: Get actual branch from product
      return matchesSearch && matchesCategory && matchesStatus && matchesBranch;
    });
  }, [products, searchTerm, selectedCategories, selectedStatuses, selectedBranches]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ROWS_PER_PAGE));



  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSaveProduct = (values: ProductFormValues, id?: number) => {
    setProducts((currentProducts) => {
      const image = values.image || 'https://placehold.co/100x100.png';
      if (id) {
        toast({ title: 'Product Updated', description: `"${values.name}" has been updated.` });
        return currentProducts.map((p) =>
          p.id === id ? { ...p, ...values, image } : p
        );
      } else {
        const newId =
          currentProducts.length > 0
            ? Math.max(...currentProducts.map((p) => p.id)) + 1
            : 1;
        toast({ title: 'Product Added', description: `"${values.name}" has been added to inventory.` });
        return [...currentProducts, { ...values, id: newId, image }];
      }
    });
  };

  const handleDeleteProduct = (id: number) => {
    setProducts((currentProducts) => {
        const productToDelete = currentProducts.find(p => p.id === id);
        toast({ title: 'Product Deleted', description: `"${productToDelete?.name}" has been removed.`, variant: 'destructive' });
        return currentProducts.filter((p) => p.id !== id)
    });
  };

  const handleMassDelete = () => {
    setProducts(products.filter(p => !selectedProductIds.includes(p.id)));
    toast({
        title: `${selectedProductIds.length} Products Deleted`,
        description: 'The selected products have been removed from your inventory.',
        variant: 'destructive',
    });
    setSelectedProductIds([]);
  }

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
        setSelectedProductIds(paginatedProducts.map(p => p.id));
    } else {
        setSelectedProductIds([]);
    }
  }

  const handleCategoryFilter = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    setCurrentPage(1);
  }

  const handleStatusFilter = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    setCurrentPage(1);
  }

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedStatuses([]);
    setSelectedBranches([]);
    setCurrentPage(1);
  }

  const handleBranchFilter = (branch: string) => {
    setSelectedBranches(prev =>
      prev.includes(branch)
        ? prev.filter(b => b !== branch)
        : [...prev, branch]
    );
    setCurrentPage(1);
  }

  if (!isMounted) {
    return (
      <div className="text-center text-muted-foreground">
        <p>Loading products...</p>
      </div>
    );
  }

  const getStockBadgeVariant = (stock: number) => {
    if (stock === 0) return 'destructive';
    if (stock < 20) return 'secondary';
    return 'default';
  };

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category)));
  }, [products]);

  const uniqueBranches = useMemo(() => {
    return ['Main Branch']; // TODO: Get actual unique branches from products
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className='space-y-1.5'>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            Manage your inventory. Add, edit, or delete products.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
            {selectedProductIds.length > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedProductIds.length})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the {selectedProductIds.length} selected products.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleMassDelete}>
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <ProductDialog onSave={handleSaveProduct}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
            </Button>
            </ProductDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="h-8" onClick={clearFilters}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:bg-muted">
                    Category {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {uniqueCategories.map(category => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => handleCategoryFilter(category)}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:bg-muted">
                    Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatuses.includes('In Stock')}
                    onCheckedChange={() => handleStatusFilter('In Stock')}
                  >
                    In Stock
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatuses.includes('Out of Stock')}
                    onCheckedChange={() => handleStatusFilter('Out of Stock')}
                  >
                    Out of Stock
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:bg-muted">
                    Branch {selectedBranches.length > 0 && `(${selectedBranches.length})`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {uniqueBranches.map(branch => (
                    <DropdownMenuCheckboxItem
                      key={branch}
                      checked={selectedBranches.includes(branch)}
                      onCheckedChange={() => handleBranchFilter(branch)}
                    >
                      {branch}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                    checked={
                        selectedProductIds.length > 0 &&
                        selectedProductIds.length === paginatedProducts.length
                    }
                    onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-[50px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.map((product) => (
              <TableRow key={product.id} data-state={selectedProductIds.includes(product.id) && "selected"}>
                <TableCell>
                    <Checkbox
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={(checked) => {
                            setSelectedProductIds(prev => 
                                checked ? [...prev, product.id] : prev.filter(id => id !== product.id)
                            )
                        }}
                    />
                </TableCell>
                <TableCell>
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="rounded-md border object-cover"
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{product.category}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  ${product.price.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${(product.cost || 0).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={getStockBadgeVariant(product.stock)}>
                    {product.stock > 0 ? product.stock : 'Out of Stock'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <ProductDialog product={product} onSave={handleSaveProduct}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                        </ProductDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the product
                                "{product.name}".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
         {filteredProducts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
                <p>No products found matching your filters.</p>
            </div>
        )}
      </CardContent>
      {filteredProducts.length > ROWS_PER_PAGE && (
        <div className="flex items-center justify-end space-x-2 p-4 border-t">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </Card>
  );
}
