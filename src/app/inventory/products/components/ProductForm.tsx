'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import type { Product } from '@/services/product/productService';
import { productService, ProductCategory } from '@/services/product/productService';
import { inventoryService } from '@/app/inventory/settings/services/inventoryService';
import { supplierService, createSupplier } from '@/app/suppliers/services/supplierService';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { authService } from '@/services/auth/authService';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { SupplierFormModal } from '@/app/suppliers/components/SupplierFormModal';
import { useSupplierForm } from '@/app/suppliers/hooks/useSupplierForm';
import { useSupplierCategoriesCRUD } from '@/app/suppliers/hooks/useSupplierCategoriesCRUD';
import { invalidateSuppliersCache } from '@/app/suppliers/hooks/useSuppliers';
import { useAccessControl } from '@/components/providers/access-control-provider';


interface ProductFormProps {
  product?: Product | null;
  onSave: (payload: any) => void;
  onCancel: () => void;
}

const createExtendedProductSchema = (isEditMode: boolean) => z
  .object({
    name: z.string().min(1, "Product name is required"),
    category: z.string().min(1, "Category is required"),
    supplier: z.string().min(1, "Supplier is required"),
    price: z.coerce.number().optional(),
    cost: z.coerce.number().optional(),
    stock: z.coerce.number().optional(),
    image: z.union([z.instanceof(File), z.string()]).optional(),
    brand: z.string().optional(),
    variant: z.enum(["single", "variant"], {
      required_error: "Variant type is required",
      invalid_type_error: "Variant type of product is required",
    }),
    costPrice: z.coerce.number().optional(),
    sellingPrice: z.coerce.number().optional(),
    profitMargin: z.coerce.number().optional(),
    description: z.string().min(1, "Description is required"),
    variantAttribute: z.string().optional(),
    lowStockThreshold: z.coerce.number().min(0, "Low stock threshold must be 0 or greater").optional(),
    branch_id: z.number().int().optional(),
    tenant_id: z.number().int().optional(),
    stocks: z
      .array(
        z.object({
          cost: z.number(),
          profit_margin: z.number().optional(),
          selling_price: z.number(),
          quantity: z.number(),
          low_stock_threshold: z.number().optional(),
          variant_specification_id: z.number().nullable().optional(),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    // --- For Single Product ---
    if (data.variant === "single") {
      // Skip cost and selling price validation in edit mode
      if (!isEditMode) {
        if (data.costPrice === undefined || data.costPrice === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Cost is required",
            path: ["costPrice"],
          });
        }

        if (data.sellingPrice === undefined || data.sellingPrice === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Selling Price is required",
            path: ["sellingPrice"],
          });
        }
      }

      // Stock validation removed - allow 0 or any value
      // No restrictions on stock quantity

      // ✅ Low Stock Threshold validation - allow 0 or greater

      if (data.lowStockThreshold !== undefined && data.lowStockThreshold < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Low stock threshold must be 0 or greater",
          path: ["lowStockThreshold"],
        });
      }

      // ✅ Profit Margin validation
      if (data.profitMargin !== undefined) {
        if (data.profitMargin < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Profit margin cannot be negative",
            path: ["profitMargin"],
          });
        }

        if (data.profitMargin == 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Profit margin cannot be 0",
            path: ["profitMargin"],
          });
        }
      }
    }

    // --- For Variant Product ---
    if (data.variant === "variant") {
      // ✅ Low Stock Threshold validation for variants (allow 0 or greater)
      if (data.lowStockThreshold !== undefined && data.lowStockThreshold < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Low stock threshold must be 0 or greater",
          path: ["lowStockThreshold"],
        });
      }

      // ✅ Validate stocks array for variant products
      if (data.stocks && data.stocks.length > 0) {
        data.stocks.forEach((stock, index) => {
          // Cost validation
          if (!stock.cost || stock.cost <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Cost is required for variant ${index + 1}`,
              path: ["stocks", index, "cost"],
            });
          }

          // Selling Price validation
          if (!stock.selling_price || stock.selling_price <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Selling Price is required for variant ${index + 1}`,
              path: ["stocks", index, "selling_price"],
            });
          }
        });
      }
    }
  });

export type ProductFormValues = z.infer<ReturnType<typeof createExtendedProductSchema>>;

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  
  const [variantAttributes, setVariantAttributes] = useState<Array<{ name: string; variations: { id: number; value: string }[] }>>([]);
  const [newAttribute, setNewAttribute] = useState("");
  const [newVariations, setNewVariations] = useState<string[]>([]);
  const [selectedVariations, setSelectedVariations] = useState<Array<{ id: number; name: string; costPrice: number; sellingPrice: number; profitMargin: number | undefined; stock: number }>>([]);
  const [variantErrors, setVariantErrors] = useState<Array<{ cost?: string; sellingPrice?: string; profitMargin?: string }>>([]);
  const [validationTrigger, setValidationTrigger] = useState(0); // Force re-render when validation occurs
  const isValidationInProgress = useRef(false);
  const [popVariant, setPopVariant] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [popCategory, setPopCategory] = useState(false);
  const [isCheckingCategory, setIsCheckingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [categoryRequiredError, setCategoryRequiredError] = useState('');
  const [newlyCreatedCategoryId, setNewlyCreatedCategoryId] = useState<number | null>(null);
  const [brands, setBrands] = useState<ProductCategory[]>([]);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDescription, setNewBrandDescription] = useState('');
  const [popBrand, setPopBrand] = useState(false);
  const [isCheckingBrand, setIsCheckingBrand] = useState(false);
  const [brandError, setBrandError] = useState('');
  const [brandRequiredError, setBrandRequiredError] = useState('');
  const [newlyCreatedBrandId, setNewlyCreatedBrandId] = useState<number | null>(null);
  const [suppliers, setSuppliers] = useState<ProductCategory[]>([]);
  const [newlyCreatedSupplierId, setNewlyCreatedSupplierId] = useState<number | null>(null);
  const [newlyCreatedVariantName, setNewlyCreatedVariantName] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCheckingVariant, setIsCheckingVariant] = useState(false);
  const [variantError, setVariantError] = useState('');
  const [variantRequiredError, setVariantRequiredError] = useState('');

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierFormLoading, setSupplierFormLoading] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<{ id: number; name: string } | null>(null);
  const [currentTenant, setCurrentTenant] = useState<{ id: number; name: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Access control for permissions
  const { getUserModules } = useAccessControl();

  // Get permissions for categories, brands, and suppliers
  const categoryPermissions = (() => {
    try {
      const modules = getUserModules();
      const mod = modules.find((m) => m.module_path === '/inventory/settings');
      return mod?.permissions || { create: 0, read: 0, update: 0, delete: 0 };
    } catch {
      return { create: 0, read: 0, update: 0, delete: 0 };
    }
  })();

  const brandPermissions = categoryPermissions; // Same module as categories

  const supplierPermissions = (() => {
    try {
      const modules = getUserModules();
      const mod = modules.find((m) => m.module_path === '/suppliers');
      return mod?.permissions || { create: 0, read: 0, update: 0, delete: 0 };
    } catch {
      return { create: 0, read: 0, update: 0, delete: 0 };
    }
  })();

  const canCreateCategory = Boolean(categoryPermissions.create);
  const canCreateBrand = Boolean(brandPermissions.create);
  const canCreateSupplier = Boolean(supplierPermissions.create);
  const canReadSupplier = Boolean(supplierPermissions.read);

  // Supplier form and categories hooks
  const { 
    formData: supplierFormData, 
    errors: supplierFormErrors, 
    setErrors: setSupplierFormErrors, 
    resetForm: resetSupplierForm, 
    handleInputChange: handleSupplierInputChange, 
    handleAddressUpdate: handleSupplierAddressUpdate, 
    validateForm: validateSupplierForm, 
    prepareSubmitData: prepareSupplierSubmitData 
  } = useSupplierForm();
  
  const { categories: supplierCategories, loading: supplierCategoriesLoading, refreshCategories } = useSupplierCategoriesCRUD();

  // Supplier service functions
  const getSuppliers = async () => {
    // Check if user has read permission for inventory/POS modules or suppliers
    // Backend allows supplier read access for users with any module read permission
    const hasReadPermission = (() => {
      try {
        const modules = getUserModules();
        // Check for supplier module permission
        const supplierMod = modules.find((m) => m.module_path === '/suppliers');
        if (supplierMod?.permissions?.read) {
          return true;
        }
        // Check for inventory module permissions
        const inventoryMod = modules.find((m) => m.module_path?.startsWith('/inventory/'));
        if (inventoryMod?.permissions?.read) {
          return true;
        }
        // Check for POS module permissions
        const posMod = modules.find((m) => m.module_path?.startsWith('/pos/'));
        if (posMod?.permissions?.read) {
          return true;
        }
        // Check for any module read permission (backend bypass allows this)
        const hasAnyModuleRead = modules.some((m) => m.permissions?.read);
        return hasAnyModuleRead;
      } catch {
        return false;
      }
    })();
    
    if (!hasReadPermission) {
      console.log('ProductForm: User does not have read permission for any module, skipping supplier fetch');
      return [];
    }
    
    try {
      const suppliers = await supplierService.fetchSuppliers();
      console.log('Fetched suppliers:', suppliers); // Debug log
      return suppliers.suppliers || suppliers.data || [];
    } catch (error: any) {
      // Handle 403 permission errors gracefully
      if (error?.response?.status === 403) {
        console.warn('ProductForm: Permission denied when fetching suppliers (403). User may not have read access to suppliers module.');
        return [];
      }
      console.error('Error fetching suppliers:', error);
      return [];
    }
  };

  const { toast } = useToast();

  const isEditMode = !!product;

  const extendedProductSchema = createExtendedProductSchema(isEditMode);

  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role_name?.toLowerCase() === 'super admin';

  // Reusable toast helpers
  function showSuccessToast(title: string, name: string) {
    toast({
      title,
      description: `"${name}" has been added successfully.`,
      variant: "success",
    });
  }

  function showErrorToast(title: string) {
    toast({
      title,
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    });
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(extendedProductSchema),
    mode: "onChange", // ✅ instant validation while typing
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      branch_id: currentBranch?.id || 1,
      tenant_id: currentTenant?.id || 1,
      category: "",
      brand: "",
      supplier: "",
      image: undefined,
      stocks: [],
      lowStockThreshold: 10,
    },
  });

  // ✅ Debounced async duplicate check for product name
  const checkDuplicateProduct = useCallback(async (name: string) => {
    if (!name.trim()) return false;
    setIsChecking(true);

    try {
      const { data: products } = await productService.getAll();
      const lower = name.trim().toLowerCase();
      const duplicate = products.some(
        (p) => p.name.toLowerCase() === lower && p.id !== product?.id
      );

      if (duplicate) {
        form.setError('name', {
          type: 'manual',
          message: 'Product with this name already exists.',
        });
      } else {
        form.clearErrors('name');
      }

      return duplicate;
    } finally {
      setIsChecking(false);
    }
  }, [product, form, toast]);

  // ✅ Debounced async duplicate check for category name
  const checkDuplicateCategory = useCallback(async (name: string) => {
    if (!name.trim()) {
      setCategoryError('');
      return false;
    }
    setIsCheckingCategory(true);
    setCategoryError('');

    try {
      const categories = await productService.getCategories(currentBranch?.id);
      const lower = name.trim().toLowerCase();
      const duplicate = categories.some(
        (cat) => cat.name.toLowerCase() === lower
      );

      if (duplicate) {
        setCategoryError('Category with this name already exists.');
        toast({
          title: 'Duplicate Entry',
          description: 'Category with this name already exists.',
          variant: 'destructive',
        });
      }

      return duplicate;
    } finally {
      setIsCheckingCategory(false);
    }
  }, [toast, currentBranch?.id]);

  // ✅ Debounced async duplicate check for brand name
  const checkDuplicateBrand = useCallback(async (name: string) => {
    if (!name.trim()) {
      setBrandError('');
      return false;
    }
    setIsCheckingBrand(true);
    setBrandError('');

    try {
      const brands = await productService.getBrands(currentBranch?.id);
      const lower = name.trim().toLowerCase();
      const duplicate = brands.some(
        (brand) => brand.name.toLowerCase() === lower
      );

      if (duplicate) {
        setBrandError('Brand with this name already exists.');
        toast({
          title: 'Duplicate Entry',
          description: 'Brand with this name already exists.',
          variant: 'destructive',
        });
      }

      return duplicate;
    } finally {
      setIsCheckingBrand(false);
    }
  }, [toast, currentBranch?.id]);

  // ✅ Debounced async duplicate check for variant attribute name
  const checkDuplicateVariant = useCallback(async (name: string) => {
    if (!name.trim()) {
      setVariantError('');
      return false;
    }
    setIsCheckingVariant(true);
    setVariantError('');

    try {
      const variants = await productService.getVariants(currentBranch?.id);
      const lower = name.trim().toLowerCase();
      const duplicate = variants.some(
        (variant) => variant.name.toLowerCase() === lower
      );

      if (duplicate) {
        setVariantError('Variant Attribute with this name already exists.');
        toast({
          title: 'Duplicate Entry',
          description: 'Variant Attribute with this name already exists.',
          variant: 'destructive',
        });
      }

      return duplicate;
    } finally {
      setIsCheckingVariant(false);
    }
  }, [toast, currentBranch?.id]);

  // Fetch categories, brands, suppliers, and variants using productService
  useEffect(() => {
    if (!currentBranch) return;

    async function fetchOptions() {
      try {
        // Fetch categories, brands, and variants in parallel, filtered by current branch
        const [categories, brands, variants] = await Promise.all([
          productService.getCategories(currentBranch!.id),
          productService.getBrands(currentBranch!.id),
          inventoryService.getVariants(currentBranch!.id),
        ]);

        // Categories
        setCategories(categories);

        // Brands
        setBrands(brands);

        // Variants → transform to { name, variations[] }
        const formattedVariants = variants.map(v => ({
          name: v.name,
          variations: v.specifications.map(s => ({
            id: s.id,
            value: s.name,
          })),
        }));
        setVariantAttributes(formattedVariants);

        // Fetch suppliers separately to avoid blocking other fetches
        const suppliers = await getSuppliers();
        console.log('Setting suppliers in component:', suppliers); // Debug log
        setSuppliers(suppliers.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        })));
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    }

    fetchOptions();
  }, [currentBranch]);

  // Get stored user and branch context (no API calls) and listen for changes
  useEffect(() => {
    // Load function to get fresh context
    const loadContext = () => {
      // Get stored user data
      const cachedUser = authService.getCachedUserData();
      if (cachedUser) {
        setCurrentUser(cachedUser);
      }

      // Get stored branch context
      const storedBranch = tenantContextService.getStoredBranchContext();
      if (storedBranch) {
        setCurrentBranch(storedBranch);
      }

      // Get stored tenant context
      const storedTenant = tenantContextService.getStoredTenantContext();
      if (storedTenant) {
        setCurrentTenant(storedTenant);
      }
    };

    // Initial load
    loadContext();

    // Listen for branch changes (from localStorage updates or custom events)
    const handleBranchChange = () => {
      loadContext();
    };

    // Listen to custom branchChanged event
    window.addEventListener('branchChanged', handleBranchChange);
    
    // Listen to storage events (for cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'branch_context' || e.key === 'tenant_context') {
        loadContext();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  // Reset form when product is loaded and options are ready
  useEffect(() => {
    if (!product) {
      console.log('ProductForm: No product provided');
      return;
    }
    // Only require categories and brands to be loaded (variantAttributes can be empty for single products)
    // Suppliers should also be loaded to properly set the supplier field
    if (!categories.length || !brands.length) {
      console.log('ProductForm: Waiting for categories or brands to load', { 
        categories: categories.length, 
        brands: brands.length,
        suppliers: suppliers.length 
      });
      return;
    }

    console.log('ProductForm: Populating form with product data', {
      productId: product.id,
      productName: product.name,
      hasStocks: !!product.stocks,
      stocksCount: product.stocks?.length || 0,
      hasCategory: !!product.category,
      categoryId: product.category?.id,
      hasBrand: !!product.brand,
      brandId: product.brand?.id,
      hasSupplier: !!product.supplier,
      supplierId: product.supplier?.id,
      suppliersListLength: suppliers.length,
      supplierInList: product.supplier?.id ? suppliers.some(s => s.id === product.supplier?.id) : false,
      displayImage: product.display_image,
      description: product.description,
    });

    // Determine if this is a variant product or single product
    // A product is variant if it has multiple stocks with variant specifications
    const isVariantProduct = product.stocks && product.stocks.length > 1 && product.stocks.some(stock => stock.variant_specification_id);

    // Load existing variant data if it's a variant product
    if (isVariantProduct && product.stocks) {
      const existingVariations = product.stocks
        .filter(stock => stock.variant_specification_id)
        .map(stock => ({
          id: stock.variant_specification_id!,
          name: (stock as any).variantSpecification?.name || '',
          costPrice: stock.cost || 0,
          sellingPrice: stock.selling_price || 0,
          profitMargin: stock.profit_margin || 0,
          stock: stock.quantity || 0,
        }));

      setSelectedVariations(existingVariations);

      // Set the variant attribute if we have variations
      if (existingVariations.length > 0) {
        const firstVariant = existingVariations[0];
        const variantAttribute = variantAttributes.find(attr =>
          attr.variations.some(v => v.id === firstVariant.id)
        );
        if (variantAttribute) {
          form.setValue("variantAttribute", variantAttribute.name);
        }
      }
    } else {
      // For single product, set selectedVariations to the single stock
      setSelectedVariations([{
        id: 0,
        name: 'Single Product',
        costPrice: product.stocks?.[0]?.cost || 0,
        sellingPrice: product.stocks?.[0]?.selling_price || 0,
        profitMargin: product.stocks?.[0]?.profit_margin || 0,
        stock: product.stocks?.[0]?.quantity || 0,
      }]);
    }

    // Get low stock threshold from stocks (similar to ProductTable logic)
    const lowStockThreshold = Math.max(
      ...(product.stocks?.map((s) => s.low_stock_threshold ?? 0) ?? [10])
    );

    // Check if supplier exists in the suppliers list
    const supplierId = product.supplier?.id;
    const supplierExists = supplierId && suppliers.some(s => s.id === supplierId);
    const supplierValue = supplierExists ? supplierId.toString() : "";

    console.log('ProductForm: Setting supplier value', {
      supplierId,
      supplierExists,
      supplierValue,
      suppliersIds: suppliers.map(s => s.id),
    });

    form.reset({
      name: product.name,
      category: product.category?.id?.toString() || "",
      brand: product.brand?.id?.toString() || "",
      supplier: supplierValue,
      price: product.stocks?.[0]?.selling_price || 0,
      cost: product.stocks?.[0]?.cost || 0,
      stock: product.stocks?.[0]?.quantity || 0,
      image: product.display_image || undefined,
      variant: isVariantProduct ? "variant" : "single",
      costPrice: product.stocks?.[0]?.cost || 0, // Set to existing values to prevent any override
      sellingPrice: product.stocks?.[0]?.selling_price || 0,
      profitMargin: product.stocks?.[0]?.profit_margin || 0,
      description: product.description || "",
      variantAttribute: "",
      lowStockThreshold: lowStockThreshold,
      tenant_id: product.tenant_id || currentTenant?.id || 1,
      branch_id: product.branch_id || currentBranch?.id || 1,
    });

    // If supplier was set but not found in list, try to set it again after a short delay
    // This handles the case where suppliers are still loading
    if (supplierId && !supplierExists && suppliers.length === 0) {
      console.log('ProductForm: Supplier ID exists but suppliers list is empty, will retry after suppliers load');
    }

    // Clear validation errors for pricing fields in edit mode since they're hidden
    form.clearErrors("costPrice");
    form.clearErrors("sellingPrice");
    form.clearErrors("profitMargin");
  }, [product, categories, brands, suppliers, variantAttributes, form, currentTenant, currentBranch]);

  // Update supplier field if it wasn't set initially (suppliers loaded after form reset)
  useEffect(() => {
    if (!product || !suppliers.length) return;
    
    const currentSupplierValue = form.getValues('supplier');
    const productSupplierId = product.supplier?.id;
    
    // If supplier field is empty but product has a supplier, and suppliers are now loaded, set it
    if (!currentSupplierValue && productSupplierId) {
      const supplierExists = suppliers.some(s => s.id === productSupplierId);
      if (supplierExists) {
        console.log('ProductForm: Setting supplier field after suppliers loaded', {
          supplierId: productSupplierId,
        });
        form.setValue('supplier', productSupplierId.toString(), { shouldValidate: false });
      } else {
        console.warn('ProductForm: Supplier ID from product not found in suppliers list', {
          supplierId: productSupplierId,
          availableSupplierIds: suppliers.map(s => s.id),
        });
      }
    }
  }, [product, suppliers, form]);

  // ✅ Watch name input & debounce duplicate check
  useEffect(() => {
    const timeout = setTimeout(() => {
      const name = form.watch('name');
      if (name && name !== product?.name) checkDuplicateProduct(name);
    }, 500); // debounce 600ms

    return () => clearTimeout(timeout);
  }, [form.watch('name'), checkDuplicateProduct, product?.name]);

  // ✅ Watch category name input & debounce duplicate check
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (newCategoryName) checkDuplicateCategory(newCategoryName);
    }, 500); // debounce 600ms

    return () => clearTimeout(timeout);
  }, [newCategoryName, checkDuplicateCategory]);

  // ✅ Watch brand name input & debounce duplicate check
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (newBrandName) checkDuplicateBrand(newBrandName);
    }, 500); // debounce 600ms

    return () => clearTimeout(timeout);
  }, [newBrandName, checkDuplicateBrand]);

  // ✅ Watch variant name input & debounce duplicate check
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (newAttribute) checkDuplicateVariant(newAttribute);
    }, 500); // debounce 600ms

    return () => clearTimeout(timeout);
  }, [newAttribute, checkDuplicateVariant]);

  // Reset selectedVariations when variant type changes
  useEffect(() => {
    if (isEditMode) return; // Don't reset in edit mode
    
    const variantType = form.watch("variant");
    
    if (variantType === "single") {
      // For single product, ensure only one item exists
      if (selectedVariations.length === 0) {
        setSelectedVariations([{ id: 0, name: 'Single Product', costPrice: 0, sellingPrice: 0, profitMargin: 0, stock: 0 }]);
      } else if (selectedVariations.length > 1) {
        // If multiple items exist, keep only the first one
        setSelectedVariations([selectedVariations[0]]);
      } else if (selectedVariations[0]?.name !== 'Single Product') {
        // Ensure the name is "Single Product"
        setSelectedVariations([{ ...selectedVariations[0], name: 'Single Product' }]);
      }
    } else if (variantType === "variant") {
      // For variant product, clear selectedVariations if switching from single
      // This allows user to select new variations
      if (selectedVariations.length === 1 && selectedVariations[0]?.name === 'Single Product') {
        setSelectedVariations([]);
      }
    }
  }, [form.watch("variant"), isEditMode]);

  // Initialize selectedVariations for new single products (fallback)
  useEffect(() => {
    if (form.watch("variant") === "single" && !product && selectedVariations.length === 0) {
      setSelectedVariations([{ id: 0, name: 'Single Product', costPrice: 0, sellingPrice: 0, profitMargin: 0, stock: 0 }]);
    }
  }, [form.watch("variant"), product, selectedVariations.length]);

  // Automatically select newly created category
  useEffect(() => {
    if (newlyCreatedCategoryId !== null) {
      const categoryExists = categories.some(cat => cat.id === newlyCreatedCategoryId);
      if (categoryExists) {
        form.setValue("category", String(newlyCreatedCategoryId), { shouldValidate: true });
        form.clearErrors("category");
        setNewlyCreatedCategoryId(null); // Reset after setting
      }
    }
  }, [newlyCreatedCategoryId, categories, form]);

  // Automatically select newly created brand
  useEffect(() => {
    if (newlyCreatedBrandId !== null) {
      const brandExists = brands.some(b => b.id === newlyCreatedBrandId);
      if (brandExists) {
        form.setValue("brand", String(newlyCreatedBrandId), { shouldValidate: true });
        form.clearErrors("brand");
        setNewlyCreatedBrandId(null); // Reset after setting
      }
    }
  }, [newlyCreatedBrandId, brands, form]);

  // Automatically select newly created supplier
  useEffect(() => {
    if (newlyCreatedSupplierId !== null) {
      const supplierExists = suppliers.some(s => s.id === newlyCreatedSupplierId);
      if (supplierExists) {
        form.setValue("supplier", String(newlyCreatedSupplierId), { shouldValidate: true });
        form.clearErrors("supplier");
        setNewlyCreatedSupplierId(null); // Reset after setting
      }
    }
  }, [newlyCreatedSupplierId, suppliers, form]);

  // Automatically select newly created variant attribute
  useEffect(() => {
    if (newlyCreatedVariantName !== null) {
      const variantExists = variantAttributes.some(v => v.name === newlyCreatedVariantName);
      if (variantExists) {
        form.setValue("variantAttribute", newlyCreatedVariantName, { shouldValidate: true });
        form.clearErrors("variantAttribute");
        if (!isEditMode) setSelectedVariations([]);
        setNewlyCreatedVariantName(null); // Reset after setting
      }
    }
  }, [newlyCreatedVariantName, variantAttributes, form, isEditMode]);

  // Sync variantErrors array with selectedVariations length
  // Only update length, preserve existing errors - but don't run if errors already exist
  useEffect(() => {
    // Don't run if validation is in progress
    if (isValidationInProgress.current) {
      return;
    }
    
    if (form.watch("variant") === "variant") {
      setVariantErrors((prev) => {
        // Only adjust length if needed, preserve existing errors
        // Don't overwrite if errors already exist (from validation)
        const hasExistingErrors = prev.some(err => err.cost || err.sellingPrice || err.profitMargin);
        if (hasExistingErrors && prev.length === selectedVariations.length) {
          // Don't modify if errors exist and length matches
          return prev;
        }
        
        // Only initialize empty errors if we don't have any errors yet
        if (!hasExistingErrors) {
          const newErrors: Array<{ cost?: string; sellingPrice?: string; profitMargin?: string }> = [];
          // Ensure errors array matches selectedVariations length
          for (let i = 0; i < selectedVariations.length; i++) {
            newErrors.push({});
          }
          return newErrors;
        }
        
        // If we have errors, just adjust length without clearing them
        const newErrors = [...prev];
        while (newErrors.length < selectedVariations.length) {
          newErrors.push({});
        }
        while (newErrors.length > selectedVariations.length) {
          newErrors.pop();
        }
        return newErrors;
      });
    } else {
      // Clear errors when switching to single product
      setVariantErrors([]);
      setValidationTrigger(0);
    }
  }, [selectedVariations.length, form.watch("variant")]);

  // Sync form values with selectedVariations for single products
  useEffect(() => {
    if (form.watch("variant") === "single" && selectedVariations.length > 0) {
      const v = selectedVariations[0];
      // Only update if values have changed to avoid clearing validation errors
      const currentCostPrice = form.getValues("costPrice");
      const currentSellingPrice = form.getValues("sellingPrice");
      const currentProfitMargin = form.getValues("profitMargin");
      const currentStock = form.getValues("stock");
      
      if (currentCostPrice !== v.costPrice) {
        form.setValue("costPrice", v.costPrice, { shouldValidate: false });
      }
      if (currentSellingPrice !== v.sellingPrice) {
        form.setValue("sellingPrice", v.sellingPrice, { shouldValidate: false });
      }
      if (currentProfitMargin !== v.profitMargin) {
        form.setValue("profitMargin", v.profitMargin, { shouldValidate: false });
        // Clear profit margin error if it has a valid value
        if (v.profitMargin !== undefined && v.profitMargin > 0) {
          form.clearErrors("profitMargin");
        }
      }
      if (currentStock !== v.stock) {
        form.setValue("stock", v.stock, { shouldValidate: false });
      }
    }
  }, [selectedVariations, form.watch("variant")]);

  // Validate variant products before submission
  const validateVariantProducts = (): boolean => {
    if (form.watch("variant") !== "variant") return true;

    const errors: Array<{ cost?: string; sellingPrice?: string; profitMargin?: string }> = [];
    let isValid = true;

    selectedVariations.forEach((v, idx) => {
      const variantError: { cost?: string; sellingPrice?: string; profitMargin?: string } = {};

      // Validate Cost - check for undefined, null, 0, or empty
      const costValue = v.costPrice;
      if (costValue === undefined || costValue === null || costValue === 0 || isNaN(costValue)) {
        variantError.cost = "Cost is required";
        isValid = false;
      }

      // Validate Selling Price - check for undefined, null, 0, or empty
      const sellingValue = v.sellingPrice;
      if (sellingValue === undefined || sellingValue === null || sellingValue === 0 || isNaN(sellingValue)) {
        variantError.sellingPrice = "Selling Price is required";
        isValid = false;
      }

      errors.push(variantError);
    });

    // Always set errors to ensure UI updates (even if empty errors for valid fields)
    // Use a new array to force React to detect the change
    setVariantErrors([...errors]);
    return isValid;
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (isSubmitting) return; // Prevent multiple submissions

    console.log("🚀 Form submitted with values:", values);
    console.log("🚀 Product exists:", !!product);
    console.log("🚀 Form errors:", form.formState.errors);
    
    // For variant products, validate BEFORE form submission
    if (form.watch("variant") === "variant") {
      // Run custom validation first to set UI errors
      const isValid = validateVariantProducts();
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Cost, Selling Price, Profit Margin) for all variants",
          variant: "destructive",
        });
        return;
      }
    }

    // Ensure form values are synced from selectedVariations before validation
    if (form.watch("variant") === "single" && selectedVariations.length > 0) {
      const v = selectedVariations[0];
      form.setValue("costPrice", v.costPrice || 0, { shouldValidate: true });
      form.setValue("sellingPrice", v.sellingPrice || 0, { shouldValidate: true });
      form.setValue("profitMargin", v.profitMargin || 0, { shouldValidate: true });
      form.setValue("stock", v.stock || 0, { shouldValidate: true });
      
      // Trigger validation after setting values
      const isValid = await form.trigger(['costPrice', 'sellingPrice', 'profitMargin', 'stock']);
      if (!isValid) {
        console.log("🚀 Validation failed after sync:", form.formState.errors);
        return;
      }
    }

    // Validate variant products
    if (form.watch("variant") === "variant") {
      if (selectedVariations.length === 0) {
        toast({
          title: "Validation Error",
          description: "At least one variant is required for variant products",
          variant: "destructive",
        });
        return;
      }

      // Always validate and set errors (this will display errors in the UI)
      // Validate and get errors synchronously
      isValidationInProgress.current = true;
      
      const errors: Array<{ cost?: string; sellingPrice?: string; profitMargin?: string }> = [];
      let isValid = true;

      selectedVariations.forEach((v, idx) => {
        const variantError: { cost?: string; sellingPrice?: string; profitMargin?: string } = {};

        // Validate Cost - check for undefined, null, 0, or empty
        const costValue = v.costPrice;
        if (costValue === undefined || costValue === null || costValue === 0 || isNaN(costValue)) {
          variantError.cost = "Cost is required";
          isValid = false;
        }

        // Validate Selling Price - check for undefined, null, 0, or empty
        const sellingValue = v.sellingPrice;
        if (sellingValue === undefined || sellingValue === null || sellingValue === 0 || isNaN(sellingValue)) {
          variantError.sellingPrice = "Selling Price is required";
          isValid = false;
        }

        errors.push(variantError);
      });

      // Set errors immediately - use functional update to ensure we're setting the latest
      // Create a completely new array to force React to detect the change
      const newErrors = errors.map(err => ({ ...err }));
      setVariantErrors(newErrors);
      
      // Force a re-render by updating validation trigger
      setValidationTrigger(prev => prev + 1);
      
      console.log("🔍 Setting variant errors:", newErrors);
      console.log("🔍 Selected variations:", selectedVariations);
      
      // Reset validation flag after a short delay to allow render
      setTimeout(() => {
        isValidationInProgress.current = false;
      }, 300);
      
      if (!isValid) {
        // Wait for React to re-render with errors, then scroll to first error field
        setTimeout(() => {
          const firstErrorField = document.querySelector('.border-red-500');
          if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 200);
        
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Cost, Selling Price, Profit Margin) for all variants",
          variant: "destructive",
        });
        return;
      }

      // Sync selectedVariations to form.stocks for validation
      form.setValue("stocks", selectedVariations.map(v => ({
        cost: Number(v.costPrice) || 0,
        profit_margin: Number(v.profitMargin) || 0,
        selling_price: Number(v.sellingPrice) || 0,
        quantity: Number(v.stock) ?? 0,
        low_stock_threshold: values.lowStockThreshold || 0,
        variant_specification_id: v.id,
      })), { shouldValidate: true });

      // Trigger validation
      const stocksValid = await form.trigger("stocks");
      if (!stocksValid) {
        console.log("🚀 Stocks validation failed:", form.formState.errors);
        
        // Extract errors from form.formState.errors.stocks and map to variantErrors
        const schemaErrors: Array<{ cost?: string; sellingPrice?: string; profitMargin?: string }> = [];
        
        // Initialize errors array for all variants
        for (let i = 0; i < selectedVariations.length; i++) {
          schemaErrors.push({});
        }
        
        // Check if stocks errors exist in form state
        const stocksErrors = form.formState.errors.stocks;
        if (stocksErrors) {
          // Handle array of errors
          if (Array.isArray(stocksErrors)) {
            stocksErrors.forEach((stockError: any, idx: number) => {
              if (stockError && typeof stockError === 'object') {
                if (stockError.cost) {
                  schemaErrors[idx] = { ...schemaErrors[idx], cost: stockError.cost.message || "Cost is required" };
                }
                if (stockError.selling_price) {
                  schemaErrors[idx] = { ...schemaErrors[idx], sellingPrice: stockError.selling_price.message || "Selling Price is required" };
                }
                if (stockError.profit_margin) {
                  schemaErrors[idx] = { ...schemaErrors[idx], profitMargin: stockError.profit_margin.message || "Profit Margin is required" };
                }
              }
            });
          } else {
            // Handle root level stocks error (when stocks array itself has an error)
            // This could be a FieldError object with a message
            const rootError = stocksErrors as any;
            if (rootError && rootError.message) {
              console.log("Root stocks error:", rootError.message);
            }
          }
        }
        
        // Merge with any existing custom validation errors
        setVariantErrors((prev) => {
          const merged = schemaErrors.map((schemaErr, idx) => {
            const customErr = prev[idx] || {};
            return {
              cost: schemaErr.cost || customErr.cost,
              sellingPrice: schemaErr.sellingPrice || customErr.sellingPrice,
              profitMargin: schemaErr.profitMargin || customErr.profitMargin,
            };
          });
          return merged;
        });
        
        setValidationTrigger(prev => prev + 1);
        
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Cost, Selling Price, Profit Margin) for all variants",
          variant: "destructive",
        });
        
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Final duplicate check before save
      const isDuplicate = await checkDuplicateProduct(values.name);
      if (isDuplicate) return;

    let payload = { ...values };

    // Add product-level attributes to payload
    (payload as any).tenant_id = currentTenant?.id || 1;
    (payload as any).branch_id = currentBranch?.id || 1;
    if (values.category && values.category !== "") {
      (payload as any).category_id = Number(values.category);
    }
    if (values.brand && values.brand !== "") {
      (payload as any).brand_id = Number(values.brand);
    }
    if (values.supplier && values.supplier !== "") {
      (payload as any).supplier_id = Number(values.supplier);
    }
    if (values.lowStockThreshold !== undefined) {
      (payload as any).low_stock_threshold = values.lowStockThreshold;
    }

    if (product) {
      // Editing existing product - preserve existing stock structure and variant_specification_id
      payload.stocks = product.stocks?.map(stock => ({
        ...stock,
        // Only update low_stock_threshold for all stocks, preserve individual stock attributes
        low_stock_threshold: values.lowStockThreshold !== undefined ? values.lowStockThreshold : stock.low_stock_threshold,
        // Preserve variant_specification_id - never set to null
      })) || [];
    } else {
      // Creating new product
      if (values.variant === "variant") {
        // build stocks from your selectedVariations state
        // Use individual stock per variation and product-level lowStockThreshold for all variants
        if (selectedVariations.length === 0) {
          throw new Error("At least one variant is required for variant products");
        }
        payload.stocks = selectedVariations.map(v => ({
          cost: Number(v.costPrice) || 0,
          profit_margin: Number(v.profitMargin) || 0,
          selling_price: Number(v.sellingPrice) || 0,
          quantity: Number(v.stock) ?? 0, // Allow 0 or any value for variant products (no restrictions)
          low_stock_threshold: values.lowStockThreshold || 0, // Apply product-level threshold to each variant
          variant_specification_id: v.id, // 👈 critical link to the variation
        }));
      } else {
        // single product case - use selectedVariations[0]
        if (selectedVariations.length === 0) {
          throw new Error("Single product requires pricing information");
        }
        payload.stocks = [
          {
            cost: Number(selectedVariations[0].costPrice) || 0,
            profit_margin: Number(selectedVariations[0].profitMargin) || 0,
            selling_price: Number(selectedVariations[0].sellingPrice) || 0,
            quantity: Number(selectedVariations[0].stock) || 0,
            low_stock_threshold: values.lowStockThreshold || 0,
          },
        ];
      }
    }

    console.log("✅ Final payload:", payload);

    // Add product ID for updates
    if (product) {
      (payload as any).id = product.id;
    }

    onSave(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form
        id="product-form" onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.log('Form validation errors:', errors);
          // Force form to show errors by triggering validation
          form.trigger(['costPrice', 'sellingPrice', 'profitMargin', 'stock']);
        })} className="space-y-8" onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}>
          <div className="grid grid-cols-2 gap-8">
            {/* Product Information */}
            <div className=" bg-card border border-border rounded-lg p-4 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">Product Information</h3>

              {/* Product Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Input
                    placeholder="e.g. Caramel Latte"
                    className="bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600"
                    {...form.register("name")}
                  />
                  {isChecking && (
                    <span className="absolute right-2 top-2 text-xs text-gray-400 animate-pulse">
                      ...
                    </span>
                  )}
                </div>
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description <span className="text-red-500">*</span></label>
                <textarea
                  placeholder="Additional info..."
                  {...form.register("description")}
                  className="w-full rounded border px-2 py-1 h-24 resize-none"
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                )}
              </div>

              {/* Product Image */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Image</label>

                <div className="relative w-[200px] h-[200px] border rounded-md flex items-center justify-center overflow-hidden bg-gray-50">
                  {form.watch("image") ? (
                    <img
                      src={
                        (() => {
                          const img = form.watch("image");
                          if (typeof img === "string") return img;
                          if (img instanceof File) return URL.createObjectURL(img);
                          return "";
                        })()
                      }
                      alt="Preview"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">Upload file</span>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) form.setValue("image", file as any);
                    }}
                  />

                  {/* Action buttons */}
                  {form.watch("image") && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          form.setValue("image", undefined);
                          if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
                        }}
                        className="p-1 rounded-md bg-black/50 text-white hover:bg-black/70"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  (Recommended type .jpg / .png) Square image — 200×200px, Max 5MB
                </p>
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-6">
              {/* --- Category + Brand Card --- */}
              <div className="bg-white dark:bg-transparent p-4 rounded-xl shadow-sm border space-y-4">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Product Specifications</h3>

                {/* Branch - ReadOnly */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch</label>
                  <Input
                    value={currentBranch?.name || 'Branch information not available'}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    placeholder="Branch information"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <Select
                      value={form.watch("category") || ""}
                      onValueChange={(value) => {
                        form.setValue("category", value, { shouldValidate: true });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                      {categories.length === 0 ? (
                        <div className="px-2 py-6 text-sm text-center text-gray-500 dark:text-gray-400">
                          No data available
                        </div>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                      </SelectContent>
                    </Select>
                    {canCreateCategory && (
                      <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(true)}>
                        +
                      </Button>
                    )}
                  </div>
                  {form.formState.errors.category && (
                    <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                  )}
                </div>

                {/* Brand */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Brand</label>
                  <div className="flex gap-2">
                    <Select
                      value={form.watch('brand') || ""}
                      onValueChange={(value) => {
                        form.setValue('brand', value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent>
                      {brands.length === 0 ? (
                        <div className="px-2 py-6 text-sm text-center text-gray-500 dark:text-gray-400">
                          No data available
                        </div>
                      ) : (
                        brands.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </SelectItem>
                        ))
                      )}
                      </SelectContent>
                    </Select>
                    {canCreateBrand && (
                      <Button type="button" variant="outline" onClick={() => setIsBrandModalOpen(true)}>
                        +
                      </Button>
                    )}
                  </div>
                  {form.formState.errors.brand && (
                    <p className="text-sm text-red-500">{form.formState.errors.brand.message}</p>
                  )}
                </div>

                {/* Supplier */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <Select
                      value={form.watch('supplier') || ""}
                      onValueChange={(value) => {
                        form.setValue('supplier', value, { shouldValidate: true });
                        // Clear error immediately when supplier is selected
                        if (value) {
                          form.clearErrors('supplier');
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Supplier" />
                      </SelectTrigger>
                      <SelectContent>
                      {suppliers.length === 0 ? (
                        <div className="px-2 py-6 text-sm text-center text-gray-500 dark:text-gray-400">
                          No data available
                        </div>
                      ) : (
                        suppliers.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))
                      )}
                      </SelectContent>
                    </Select>
                    {canCreateSupplier && (
                      <Button type="button" variant="outline" onClick={() => {
                        resetSupplierForm();
                        setIsSupplierModalOpen(true);
                      }}>
                        +
                      </Button>
                    )}
                  </div>
                  {form.formState.errors.supplier && (
                    <p className="text-sm text-red-500">{form.formState.errors.supplier.message}</p>
                  )}
                </div>

                {/* Low Stock Threshold */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Low Stock Threshold</label>
                  {(() => {
                    const { onChange, ...rest } = form.register("lowStockThreshold");
                    return (
                      <Input
                        type="number"
                        placeholder="e.g. 10"
                        min={0}
                        {...rest}
                        onChange={(e) => {
                          onChange(e); // ✅ keep RHF sync
                          const raw = e.target.value;
                          let threshold = raw === "" ? 0 : parseInt(raw);
                          if (threshold < 0) threshold = 0;

                          form.setValue("lowStockThreshold", threshold, { shouldValidate: true });
                        }}
                      />
                    );
                  })()}
                  {form.formState.errors.lowStockThreshold && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.lowStockThreshold.message}
                    </p>
                  )}
                </div>
              </div>

              {/* --- Variant Type Card --- */}
              {!isEditMode && (
                <div className="bg-white dark:bg-transparent p-4 rounded-xl shadow-sm border space-y-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Variant Type <span className="text-red-500">*</span></h3>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="single"
                        {...form.register("variant")}
                        disabled={isEditMode}
                      />
                      Single Product
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="variant"
                        {...form.register("variant")}
                        disabled={isEditMode}
                      />
                      Variant Product
                    </label>
                  </div>

                  {/* Error Message */}
                  {form.formState.errors.variant && (
                    <p className="text-red-500 text-sm">{form.formState.errors.variant.message}</p>
                  )}
                </div>
              )}


                {/* Conditional Fields for Variant Product Section */}
                {!isEditMode && form.watch("variant") === "variant" && (
                  <div className="bg-white dark:bg-transparent p-4 rounded-xl shadow-sm border space-y-6 overflow-visible">

                    {/* Attribute Definition */}
                    <div className="w-full space-y-4">
                      <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                        Attribute Definition
                      </h3>

                      <div className="max-h-[60vh] overflow-y-auto space-y-4 px-2 py-1">
                        <div className="flex gap-4">
                          {/* Variant Attribute Selector */}
                          <div className="w-1/2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Variant <span className="text-red-500">*</span></label>
                              <div className="flex gap-2">
                                <div className="flex-1 min-w-0 p-[2px]">
                                  <Select
                                  value={form.watch("variantAttribute") || ""}
                                    onValueChange={(value) => {
                                      form.setValue("variantAttribute", value, { shouldValidate: true });
                                    if (!isEditMode) setSelectedVariations([]);
                                  }}
                                >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select Variant Attribute" />
                                    </SelectTrigger>
                                    <SelectContent>
                                  {variantAttributes.map((attr, idx) => (
                                        <SelectItem key={idx} value={attr.name}>
                                      {attr.name}
                                        </SelectItem>
                                  ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {!isEditMode && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsVariantModalOpen(true)}
                                  >
                                    +
                                  </Button>
                                )}
                              </div>

                            </div>
                          </div>

                          {/* Specification Selector (only shown for new variants) */}
                          {!isEditMode && form.watch("variantAttribute") && (
                            <div className="w-1/2">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Specification</label>
                                <div className="w-full min-w-0 p-[2px]">
                                  <Select
                                    onValueChange={(value) => {
                                      const selectedId = Number(value);
                                    const selectedVariation = variantAttributes
                                      .find((attr) => attr.name === form.watch("variantAttribute"))
                                      ?.variations.find((v) => v.id === selectedId);

                                    if (
                                      selectedVariation &&
                                      !selectedVariations.find((v) => v.id === selectedVariation.id)
                                    ) {
                                      setSelectedVariations((prev) => [
                                        ...prev,
                                        {
                                          id: selectedVariation.id,
                                          name: selectedVariation.value,
                                          costPrice: 0,
                                          sellingPrice: 0,
                                          profitMargin: 0,
                                          stock: 0,
                                        },
                                      ]);
                                        // Initialize error state for new variant - ensure it's a new object
                                        setVariantErrors((prev) => {
                                          const newErrors = [...prev];
                                          newErrors.push({ cost: undefined, sellingPrice: undefined, profitMargin: undefined });
                                          return newErrors;
                                        });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select Variation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                  {variantAttributes
                                    .find((attr) => attr.name === form.watch("variantAttribute"))
                                    ?.variations.map((v) => (
                                          <SelectItem key={v.id} value={String(v.id)}>
                                        {v.value}
                                          </SelectItem>
                                    ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
          {/* Single Product Pricing Table - Hide in edit mode */}
          {!isEditMode && form.watch("variant") === "single" && selectedVariations.length > 0 && (
            <div className="w-full bg-white dark:bg-transparent p-4 rounded-xl shadow-sm border space-y-4">
              <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                {/* Table Header */}
                <div className="flex gap-2 font-semibold text-gray-700 dark:text-gray-200 items-center">
                  <span className="w-1/5">Item</span>
                  <span className="w-1/5">Cost</span>
                  <span className="w-1/5">Selling Price</span>
                  <span className="w-1/5">Profit Margin (%)</span>
                  <span className="w-1/5">Stock</span>
                </div>

                {/* Only show the first item for single product */}
                {selectedVariations.slice(0, 1).map((v, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex gap-2 items-center">
                      {/* Item Name - Single Product */}
                      <span className="w-1/5 font-medium text-gray-700 dark:text-gray-200">Single Product</span>

                      {/* Cost Price */}
                      <Input
                        type="number"
                        placeholder="0.00"
                        className={`w-1/5 ${form.formState.errors.costPrice ? "border-red-500" : ""}`}
                        value={v.costPrice !== undefined ? String(v.costPrice) : ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const cost = raw === "" ? undefined : parseFloat(raw);
                          const costValue = cost && cost > 0 ? cost : 0;

                          setSelectedVariations((prev) => {
                            const updated = [...prev];
                            updated[idx].costPrice = costValue;

                            // If profit margin exists → recalc selling price
                            if (updated[idx].profitMargin !== undefined && cost) {
                              const selling = cost + (cost * updated[idx].profitMargin) / 100;
                              updated[idx].sellingPrice = Number.isFinite(selling) ? +selling.toFixed(2) : 0;
                            } else {
                              // If no profit margin → default selling = cost
                              updated[idx].sellingPrice = costValue;
                            }

                            return updated;
                          });
                          
                          // Update form value and trigger validation
                          form.setValue("costPrice", costValue, { shouldValidate: true });
                          
                          // Clear selling price error when cost is entered (since selling price is auto-calculated)
                          if (costValue > 0 && form.formState.errors.sellingPrice) {
                            form.clearErrors("sellingPrice");
                          }
                          
                          // Clear profit margin error if it was auto-calculated
                          if (costValue > 0 && form.formState.errors.profitMargin) {
                            form.clearErrors("profitMargin");
                          }
                        }}
                      />

                      {/* Selling Price */}
                      <Input
                        type="number"
                        placeholder="0.00"
                        className={`w-1/5 ${form.formState.errors.sellingPrice ? "border-red-500" : ""}`}
                        value={v.sellingPrice !== undefined ? String(v.sellingPrice) : ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const selling = raw === "" ? undefined : parseFloat(raw);
                          const sellingValue = selling && selling > 0 ? selling : 0;

                          setSelectedVariations((prev) => {
                            const updated = [...prev];
                            updated[idx].sellingPrice = sellingValue;

                            // Always recalc profit margin if cost exists
                            const cost = updated[idx].costPrice;
                            let calculatedMargin: number | undefined = undefined;
                            if (cost && cost > 0 && sellingValue > 0) {
                              const margin = ((updated[idx].sellingPrice - cost) / cost) * 100;
                              calculatedMargin = Number.isFinite(margin)
                                ? +margin.toFixed(2)
                                : undefined;
                              updated[idx].profitMargin = calculatedMargin;
                            } else {
                              updated[idx].profitMargin = undefined;
                            }

                            // Update profit margin form value when auto-calculated and clear errors
                            if (calculatedMargin !== undefined && calculatedMargin > 0) {
                              form.setValue("profitMargin", calculatedMargin, { shouldValidate: true });
                              // Clear profit margin error when it's auto-calculated
                              form.clearErrors("profitMargin");
                            }

                            return updated;
                          });
                          
                          // Update form value and trigger validation
                          form.setValue("sellingPrice", sellingValue, { shouldValidate: true });
                        }}
                      />

                      {/* Profit Margin */}
                      <div className="relative w-1/5">
                        <Input
                          type="text"
                          placeholder="0%"
                          className={`w-full pr-6 ${form.formState.errors.profitMargin ? "border-red-500" : ""}`}
                          value={v.profitMargin !== undefined ? `${v.profitMargin}%` : ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace("%", "").trim();
                            const margin = Number(raw);
                            const marginValue = isNaN(margin) ? undefined : Math.max(0, margin);

                            setSelectedVariations((prev) => {
                              const updated = [...prev];
                              updated[idx].profitMargin = marginValue;

                              // Recalculate selling price
                              const cost = updated[idx].costPrice;
                              if (cost !== undefined && updated[idx].profitMargin !== undefined) {
                                const selling = cost + (cost * updated[idx].profitMargin) / 100;
                                updated[idx].sellingPrice = Number.isFinite(selling) ? +selling.toFixed(2) : 0;
                              }
                              return updated;
                            });
                            
                            // Update form value and trigger validation
                            form.setValue("profitMargin", marginValue || 0, { shouldValidate: true });
                            
                            // Clear error when a valid profit margin is entered
                            if (marginValue !== undefined && marginValue > 0) {
                              form.clearErrors("profitMargin");
                            }
                          }}
                        />
                      </div>

                      {/* Stock */}
                      <Input
                        type="number"
                        placeholder="0"
                        className={`w-1/5 ${form.formState.errors.stock ? "border-red-500" : ""}`}
                        value={v.stock !== undefined ? String(v.stock) : ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const stock = raw === "" ? 0 : parseInt(raw);
                          const stockValue = stock >= 0 ? stock : 0;

                          setSelectedVariations((prev) => {
                            const updated = [...prev];
                            updated[idx].stock = stockValue;
                            return updated;
                          });
                          
                          form.setValue("stock", stockValue, { shouldValidate: true });
                        }}
                      />
                    </div>
                    {/* Error messages for pricing fields - only show for single product and first row */}
                    {(form.formState.errors.costPrice || form.formState.errors.sellingPrice || form.formState.errors.profitMargin || form.formState.errors.stock) && idx === 0 && (
                      <div className="flex gap-2">
                        {/* Item column placeholder */}
                        <div className="w-1/5"></div>
                        {/* Cost Price Error */}
                        <div className="w-1/5">
                          {form.formState.errors.costPrice && (
                            <p className="text-red-500 text-xs">{form.formState.errors.costPrice.message}</p>
                          )}
                        </div>
                        {/* Selling Price Error */}
                        <div className="w-1/5">
                          {form.formState.errors.sellingPrice && (
                            <p className="text-red-500 text-xs">{form.formState.errors.sellingPrice.message}</p>
                          )}
                        </div>
                        {/* Profit Margin Error */}
                        <div className="w-1/5">
                          {form.formState.errors.profitMargin && (
                            <p className="text-red-500 text-xs">{form.formState.errors.profitMargin.message}</p>
                          )}
                        </div>
                        {/* Stock Error */}
                        <div className="w-1/5">
                          {form.formState.errors.stock && (
                            <p className="text-red-500 text-xs">{form.formState.errors.stock.message}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variant Product Pricing Table - Hide in edit mode */}
          {!isEditMode && form.watch("variant") === "variant" && selectedVariations.length > 0 && (
            <div className="w-full bg-white dark:bg-transparent p-4 rounded-xl shadow-sm border space-y-4">
              <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                {/* Table Header */}
                <div className="flex gap-2 font-semibold text-gray-700 dark:text-gray-200 items-center">
                  <span className="w-1/6">Item</span>
                  <span className="w-1/6">Cost</span>
                  <span className="w-1/6">Selling Price</span>
                  <span className="w-1/6">Profit Margin (%)</span>
                  <span className="w-1/6">Stock</span>
                  <span className="w-1/6 text-center">Actions</span>
                </div>

                {selectedVariations.map((v, idx) => {
                  // Debug: Log errors for this row
                  const rowErrors = variantErrors[idx];
                  if (rowErrors && (rowErrors.cost || rowErrors.sellingPrice || rowErrors.profitMargin)) {
                    console.log(`🔍 Rendering row ${idx} with errors:`, rowErrors);
                  }
                  
                  return (
                  <div key={`variant-row-${idx}-${validationTrigger}`} className="space-y-1">
                    <div className="flex gap-2 items-center">
                      {/* Item Name */}
                      <span className="w-1/6">{v.name}</span>

                      {/* Cost Price */}
                      <Input
                        type="number"
                        placeholder="0.00"
                        className={`w-1/6 ${variantErrors[idx]?.cost ? "border-red-500" : ""}`}
                        value={v.costPrice !== undefined ? String(v.costPrice) : ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const cost = raw === "" ? undefined : parseFloat(raw);
                          const costValue = cost && cost > 0 ? cost : 0;

                          setSelectedVariations((prev) => {
                            const updated = [...prev];
                            updated[idx].costPrice = costValue;

                            // If profit margin exists → recalc selling price
                            if (updated[idx].profitMargin !== undefined && cost) {
                              const selling = cost + (cost * updated[idx].profitMargin) / 100;
                              updated[idx].sellingPrice = Number.isFinite(selling) ? +selling.toFixed(2) : 0;
                            } else {
                              // If no profit margin → default selling = cost
                              updated[idx].sellingPrice = costValue;
                            }

                            return updated;
                          });

                          // Clear error if valid
                          if (costValue > 0) {
                            setVariantErrors((prev) => {
                              const updated = [...prev];
                              if (!updated[idx]) updated[idx] = {};
                              updated[idx].cost = undefined;
                              return updated;
                            });
                          }
                          
                          // Update form value
                          form.setValue("costPrice", costValue, { shouldValidate: false });
                        }}
                      />

                      {/* Selling Price */}
                      <Input
                        type="number"
                        placeholder="0.00"
                        className={`w-1/6 ${variantErrors[idx]?.sellingPrice ? "border-red-500" : ""}`}
                        value={v.sellingPrice !== undefined ? String(v.sellingPrice) : ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const selling = raw === "" ? undefined : parseFloat(raw);
                          const sellingValue = selling && selling > 0 ? selling : 0;

                          setSelectedVariations((prev) => {
                            const updated = [...prev];
                            updated[idx].sellingPrice = sellingValue;

                            // Always recalc profit margin if cost exists
                            const cost = updated[idx].costPrice;
                            let calculatedMargin: number | undefined = undefined;
                            if (cost && cost > 0 && sellingValue > 0) {
                              const margin = ((updated[idx].sellingPrice - cost) / cost) * 100;
                              calculatedMargin = Number.isFinite(margin)
                                ? +margin.toFixed(2)
                                : undefined;
                              updated[idx].profitMargin = calculatedMargin;
                            } else {
                              updated[idx].profitMargin = undefined;
                            }

                            // Update profit margin form value when auto-calculated
                            if (calculatedMargin !== undefined && calculatedMargin > 0) {
                              form.setValue("profitMargin", calculatedMargin, { shouldValidate: false });
                            }

                            return updated;
                          });

                          // Clear error if valid
                          if (sellingValue > 0) {
                            setVariantErrors((prev) => {
                              const updated = [...prev];
                              if (!updated[idx]) updated[idx] = {};
                              updated[idx].sellingPrice = undefined;
                              return updated;
                            });
                          }
                          
                          // Update form value
                          form.setValue("sellingPrice", sellingValue, { shouldValidate: false });
                        }}
                      />

                      {/* Profit Margin */}
                      <div className="relative w-1/6">
                        <Input
                          type="text"
                          placeholder="0%"
                          className={`w-full pr-6 ${variantErrors[idx]?.profitMargin ? "border-red-500" : ""}`}
                          value={v.profitMargin !== undefined ? `${v.profitMargin}%` : ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace("%", "").trim();
                            const margin = Number(raw);
                            const marginValue = isNaN(margin) ? undefined : Math.max(0, margin);

                            setSelectedVariations((prev) => {
                              const updated = [...prev];
                              updated[idx].profitMargin = marginValue;

                              // Recalculate selling price
                              const cost = updated[idx].costPrice;
                              if (cost !== undefined && updated[idx].profitMargin !== undefined) {
                                const selling = cost + (cost * updated[idx].profitMargin) / 100;
                                updated[idx].sellingPrice = Number.isFinite(selling) ? +selling.toFixed(2) : 0;
                              }
                              return updated;
                            });

                            // Clear error if valid
                            if (marginValue !== undefined && marginValue > 0) {
                              setVariantErrors((prev) => {
                                const updated = [...prev];
                                if (!updated[idx]) updated[idx] = {};
                                updated[idx].profitMargin = undefined;
                                return updated;
                              });
                            }
                            
                            // Update form value
                            form.setValue("profitMargin", marginValue || 0, { shouldValidate: false });
                          }}
                        />
                      </div>

                      {/* Stock */}
                      <Input
                        type="number"
                        placeholder="0"
                        className="w-1/6"
                        value={v.stock !== undefined ? String(v.stock) : ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const stock = raw === "" ? 0 : parseInt(raw);
                          const stockValue = stock;

                          setSelectedVariations((prev) => {
                            const updated = [...prev];
                            updated[idx].stock = stockValue;
                            return updated;
                          });
                          
                          // Update form value
                          form.setValue("stock", stockValue, { shouldValidate: false });
                        }}
                      />

                      {/* Delete button */}
                      <div className="w-1/6 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVariations((prev) => prev.filter((_, i) => i !== idx));
                            setVariantErrors((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="p-2 rounded-md text-red-600 hover:bg-red-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {/* Error messages for variant product fields - similar to single product */}
                    {/* Use validationTrigger to force re-render check */}
                    {(() => {
                      // Force evaluation by accessing validationTrigger
                      const _ = validationTrigger;
                      const rowErrors = variantErrors[idx];
                      const hasCostError = rowErrors?.cost;
                      const hasSellingError = rowErrors?.sellingPrice;
                      const hasMarginError = rowErrors?.profitMargin;
                      const hasAnyError = hasCostError || hasSellingError || hasMarginError;
                      
                      if (hasAnyError) {
                        console.log(`🔍 Row ${idx} has errors:`, { cost: hasCostError, selling: hasSellingError, margin: hasMarginError });
                      }
                      
                      return hasAnyError;
                    })() && (
                      <div className="flex gap-2" key={`errors-${idx}-${validationTrigger}`}>
                        {/* Item column placeholder */}
                        <div className="w-1/6"></div>
                        {/* Cost Price Error */}
                        <div className="w-1/6">
                          {variantErrors[idx]?.cost && (
                            <p className="text-red-500 text-xs">{variantErrors[idx].cost}</p>
                          )}
                  </div>
                        {/* Selling Price Error */}
                        <div className="w-1/6">
                          {variantErrors[idx]?.sellingPrice && (
                            <p className="text-red-500 text-xs">{variantErrors[idx].sellingPrice}</p>
                          )}
                        </div>
                        {/* Profit Margin Error */}
                        <div className="w-1/6">
                          {variantErrors[idx]?.profitMargin && (
                            <p className="text-red-500 text-xs">{variantErrors[idx].profitMargin}</p>
                          )}
                        </div>
                        {/* Stock column placeholder */}
                        <div className="w-1/6"></div>
                        {/* Actions column placeholder */}
                        <div className="w-1/6"></div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hidden inputs for form validation */}
          <input type="hidden" {...form.register("costPrice")} />
          <input type="hidden" {...form.register("sellingPrice")} />
          <input type="hidden" {...form.register("profitMargin")} />
          <input type="hidden" {...form.register("stock")} />
        </form>
      </Form>

      {/* Category Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent
          onInteractOutside={(e) => {
            e.preventDefault();
            setPopCategory(true);
            setTimeout(() => setPopCategory(false), 300);
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isCategoryModalOpen ? "open" : "closed"}
              animate={popCategory ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Branch - ReadOnly */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch</label>
                  <Input
                    value={currentBranch?.name || 'Branch information not available'}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    placeholder="Branch information"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Input
                      placeholder="Category Name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    {isCheckingCategory && (
                      <span className="absolute right-2 top-2 text-xs text-gray-400 animate-pulse">
                        ...
                      </span>
                    )}
                  </div>
                  {categoryRequiredError && (
                    <p className="text-sm text-red-500">{categoryRequiredError}</p>
                  )}
                  {categoryError && (
                    <p className="text-sm text-red-500">{categoryError}</p>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      // Clear previous errors
                      setCategoryRequiredError('');
                      setCategoryError('');

                      if (!newCategoryName.trim()) {
                        setCategoryRequiredError('Category name is required.');
                        return;
                      }

                      // Check for duplicates
                      const isDuplicate = await checkDuplicateCategory(newCategoryName);
                      if (isDuplicate) {
                        toast({
                          title: 'Duplicate Entry',
                          description: 'Category with this name already exists.',
                          variant: 'destructive',
                        });
                        return;
                      }

                      try {
                        const created = await inventoryService.createCategory({
                          name: newCategoryName.trim(),
                          description: newCategoryDescription.trim() || undefined,
                          branch_id: currentBranch?.id,
                        });
                        // Add the new category to the list
                        setCategories((prev) => [...prev, created]);
                        // Clear form fields
                        setNewCategoryName("");
                        setNewCategoryDescription("");
                        // Close modal
                        setIsCategoryModalOpen(false);
                        // Set the newly created category ID to trigger auto-selection
                        setNewlyCreatedCategoryId(created.id);
                        // Show success message
                        showSuccessToast("Category created", created.name);
                      } catch (err) {
                        console.error("Failed to create category:", err);
                        showErrorToast("Category creation failed");
                      }
                    }}
                  >
                    Save
                  </Button>
                </DialogFooter>
              </div>
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>


      {/* Brand Modal */}
      <Dialog open={isBrandModalOpen} onOpenChange={setIsBrandModalOpen}>
        <DialogContent
          onInteractOutside={(e) => {
            e.preventDefault();
            setPopBrand(true);
            setTimeout(() => setPopBrand(false), 300);
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isBrandModalOpen ? "open" : "closed"}
              animate={popBrand ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <DialogHeader>
                <DialogTitle>Add Brand</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Branch - ReadOnly */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch</label>
                  <Input
                    value={currentBranch?.name || 'Branch information not available'}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    placeholder="Branch information"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Brand Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Input
                      placeholder="Brand Name"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                    />
                    {isCheckingBrand && (
                      <span className="absolute right-2 top-2 text-xs text-gray-400 animate-pulse">
                        ...
                      </span>
                    )}
                  </div>
                  {brandRequiredError && (
                    <p className="text-sm text-red-500">{brandRequiredError}</p>
                  )}
                  {brandError && (
                    <p className="text-sm text-red-500">{brandError}</p>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsBrandModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      // Clear previous errors
                      setBrandRequiredError('');
                      setBrandError('');

                      if (!newBrandName.trim()) {
                        setBrandRequiredError('Brand name is required.');
                        return;
                      }

                      // Check for duplicates
                      const isDuplicate = await checkDuplicateBrand(newBrandName);
                      if (isDuplicate) {
                        toast({
                          title: 'Duplicate Entry',
                          description: 'Brand with this name already exists.',
                          variant: 'destructive',
                        });
                        return;
                      }

                      try {
                        const created = await inventoryService.createBrand({
                          name: newBrandName.trim(),
                          description: newBrandDescription.trim() || undefined,
                          branch_id: currentBranch?.id,
                        });
                        setBrands((prev) => [...prev, created]);
                        setNewBrandName("");
                        setNewBrandDescription("");
                        setIsBrandModalOpen(false);
                        // Set the newly created brand ID to trigger auto-selection
                        setNewlyCreatedBrandId(created.id);
                        showSuccessToast("Brand created", created.name);
                      } catch (err) {
                        console.error("Failed to create brand:", err);
                        showErrorToast("Brand creation failed");
                      }
                    }}
                  >
                    Save
                  </Button>
                </DialogFooter>
              </div>
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Variant Attribute Modal */}
      <Dialog open={isVariantModalOpen} onOpenChange={setIsVariantModalOpen}>
        <DialogContent
          onInteractOutside={(e) => {
            e.preventDefault();
            setPopVariant(true);
            setTimeout(() => setPopVariant(false), 300);
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isVariantModalOpen ? "open" : "closed"}
              animate={popVariant ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <DialogHeader>
                <DialogTitle>Add Variant Attribute</DialogTitle>
              </DialogHeader>

              {/* Added margin-top for spacing between header and inputs */}
              <div className="space-y-4 mt-4">
                {/* Branch - ReadOnly */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch</label>
                  <Input
                    value={currentBranch?.name || 'Branch information not available'}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    placeholder="Branch information"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Attribute Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Input
                      placeholder="e.g. Size, Color"
                      value={newAttribute}
                      onChange={(e) => setNewAttribute(e.target.value)}
                    />
                    {isCheckingVariant && (
                      <span className="absolute right-2 top-2 text-xs text-gray-400 animate-pulse">
                        ...
                      </span>
                    )}
                  </div>
                  {variantRequiredError && (
                    <p className="text-sm text-red-500">{variantRequiredError}</p>
                  )}
                  {variantError && (
                    <p className="text-sm text-red-500">{variantError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium">Variations</label>

                  {/* Scrollable variations list */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 rounded-md bg-gray-50 dark:bg-transparent p-2">
                    {newVariations.map((variation, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          placeholder="e.g. Small"
                          value={variation}
                          onChange={(e) => {
                            const updated = [...newVariations];
                            updated[idx] = e.target.value;
                            setNewVariations(updated);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewVariations((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-2 rounded-md text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setNewVariations((prev) => [...prev, ""])}
                    className="mt-2"
                  >
                    + Add Variation
                  </Button>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button variant="ghost" onClick={() => setIsVariantModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    // Clear previous errors
                    setVariantRequiredError('');
                    setVariantError('');

                    if (!newAttribute.trim()) {
                      setVariantRequiredError('Attribute name is required.');
                      return;
                    }

                    // Check for duplicates
                    const isDuplicate = await checkDuplicateVariant(newAttribute);
                    if (isDuplicate) {
                      toast({
                        title: 'Duplicate Entry',
                        description: 'Variant Attribute with this name already exists.',
                        variant: 'destructive',
                      });
                      return;
                    }

                    try {
                      const variant = await inventoryService.createVariant({
                        name: newAttribute,
                        tenant_id: currentTenant?.id || 1,
                        branch_id: currentBranch?.id,
                        specifications: newVariations.map((v) => ({ name: v })),
                      });

                      setVariantAttributes((prev) => [
                        ...prev,
                        {
                          name: variant.name,
                          variations: variant.specifications.map((s) => ({
                            id: s.id,
                            value: s.name,
                          })),
                        },
                      ]);

                      // Set the newly created variant name to trigger auto-selection
                      setNewlyCreatedVariantName(variant.name);

                      setNewAttribute("");
                      setNewVariations([]);
                      setIsVariantModalOpen(false);

                      showSuccessToast("Variant created", variant.name);
                    } catch (err) {
                      console.error("Failed to create variant:", err);
                    }
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Supplier Modal */}
      <SupplierFormModal
        isOpen={isSupplierModalOpen}
        onOpenChange={setIsSupplierModalOpen}
        isEdit={false}
        formData={supplierFormData}
        onInputChange={handleSupplierInputChange}
        onAddressUpdate={handleSupplierAddressUpdate}
        errors={supplierFormErrors}
        isLoading={supplierFormLoading}
        onSubmit={async (e) => {
          e.preventDefault();
          setSupplierFormLoading(true);
          setSupplierFormErrors({});

          const validationErrors = validateSupplierForm();
          if (Object.keys(validationErrors).length > 0) {
            setSupplierFormErrors(validationErrors);
            setSupplierFormLoading(false);
            return;
          }

          const submitData = prepareSupplierSubmitData(false);
          console.log('Creating supplier from ProductForm:', submitData);

          try {
            // Create supplier directly to get the response with the new supplier
            const response = await createSupplier(submitData);
            const newSupplier = response.supplier;
            
            // Invalidate cache to ensure fresh data
            invalidateSuppliersCache();
            
            // Refresh suppliers list
            const updatedSuppliers = await getSuppliers();
            setSuppliers(updatedSuppliers.map((s: any) => ({
              id: s.id,
              name: s.name,
              description: s.description || '',
              createdAt: s.created_at,
              updatedAt: s.updated_at,
            })));
            
            // Set the newly created supplier ID to trigger auto-selection
            if (newSupplier && newSupplier.id) {
              setNewlyCreatedSupplierId(newSupplier.id);
            }
            
            setIsSupplierModalOpen(false);
            resetSupplierForm();
            showSuccessToast("Supplier created", newSupplier.name || submitData.name);
          } catch (err: any) {
            console.error('Supplier creation error:', err.response?.data || err);
            let apiErrors: Record<string, string> = {};
            
            if (err.response?.data?.errors) {
              for (const key in err.response.data.errors) {
                apiErrors[key] = err.response.data.errors[key][0];
              }
            } else {
              const message = err.response?.data?.message || "Failed to create supplier.";
              apiErrors.general = message;
            }
            
            if (apiErrors.general) {
              toast({
                title: "Supplier Creation Failed",
                description: apiErrors.general,
                variant: "destructive",
              });
            }
            setSupplierFormErrors(apiErrors);
          } finally {
            setSupplierFormLoading(false);
          }
        }}
        categories={supplierCategories}
        categoriesLoading={supplierCategoriesLoading}
        onCategoryCreated={async () => {
          // Refresh categories after creation
          await refreshCategories();
        }}
      />
    </>
  );
}