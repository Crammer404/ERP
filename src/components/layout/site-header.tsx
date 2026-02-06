
'use client';

import Link from 'next/link';
import { Menu, User, LogOut, Maximize, Minimize, ShoppingCart, ChevronDown, Bell, Check, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useSidebar } from '../providers/sidebar-provider';
import { ThemeToggle } from './theme-toggle';
import { useEffect, useState } from 'react';
import { useAccessControl } from '../providers/access-control-provider';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth } from '../providers/auth-provider';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { getBrandColors } from '@/config/brand.config';
import { ROUTES } from '@/config/api.config';
import { managementService, type Tenant, type Branch } from '@/services/management/managementService';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { productService } from '@/services/product/productService';
import { Badge } from '@/components/ui/badge';
import { stockMonitor, monitorProducts, clearStockStatuses } from '@/lib/stockMonitor';



const FullscreenToggle = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    return (
        <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            <span className="sr-only">Toggle Fullscreen</span>
        </Button>
    )
}


export function SiteHeader() {
  const { toggleSidebar, isCollapsed, isMobile, isOpen } = useSidebar();
  const { user: accessUser } = useAccessControl();
  const { user, logout } = useAuth();
  
  // State for tenant and branch selection
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  // State for stock notifications
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<any[]>([]);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  
  const isSuperAdmin = user?.role_name === 'Super Admin';
  
  // Load initial context from localStorage
  useEffect(() => {
    const storedTenant = tenantContextService.getStoredTenantContext();
    const storedBranch = tenantContextService.getStoredBranchContext();
    
    if (storedTenant) {
      setSelectedTenant(storedTenant.id.toString());
    }
    if (storedBranch) {
      setSelectedBranch(storedBranch.id.toString());
    }
  }, []);
  
  // Load tenants for Super Admin on mount
  useEffect(() => {
    if (isSuperAdmin) {
      loadTenants();
    }
  }, [isSuperAdmin]);

  // Load branches when component mounts or tenant changes
  useEffect(() => {
    if (isSuperAdmin && selectedTenant) {
      loadBranchesForTenant(parseInt(selectedTenant));
    } else if (!isSuperAdmin && user) {
      // For non-super admins, load their accessible branches
      loadUserBranches();
    }
  }, [selectedTenant, isSuperAdmin, user]);

  // Debug branches state
  useEffect(() => {
    console.log('🔍 Branches state updated:', branches);
  }, [branches]);

  // Listen for branch updates and refresh branches list
  useEffect(() => {
    const handleBranchUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const updatedBranch = customEvent.detail?.branch;
      const branchId = customEvent.detail?.branchId;

      if (updatedBranch && branchId) {
        // Update the branch in the branches state if it exists
        setBranches(prevBranches => 
          prevBranches.map(branch => 
            branch.id === branchId ? { ...branch, name: updatedBranch.name, email: updatedBranch.email, contact_no: updatedBranch.contact_no } : branch
          )
        );

        // If this is the currently selected branch, refresh the branches list to ensure consistency
        if (selectedBranch === branchId.toString()) {
          if (isSuperAdmin && selectedTenant) {
            await loadBranchesForTenant(parseInt(selectedTenant));
          } else if (!isSuperAdmin) {
            await loadUserBranches();
          }
        }
      }
    };

    window.addEventListener('branchChanged', handleBranchUpdate);

    return () => {
      window.removeEventListener('branchChanged', handleBranchUpdate);
    };
  }, [selectedBranch, selectedTenant, isSuperAdmin]);

  // Load stock notifications
  useEffect(() => {
    loadStockNotifications();

    // Listen for all stock-related events
    const handleStockEvent = () => loadStockNotifications();
    window.addEventListener('stockUpdated', handleStockEvent);
    window.addEventListener('branchChanged', handleStockEvent);
    window.addEventListener('productCreated', handleStockEvent);
    window.addEventListener('productUpdated', handleStockEvent);
    window.addEventListener('stockLevelChanged', handleStockEvent);

    return () => {
      window.removeEventListener('stockUpdated', handleStockEvent);
      window.removeEventListener('branchChanged', handleStockEvent);
      window.removeEventListener('productCreated', handleStockEvent);
      window.removeEventListener('productUpdated', handleStockEvent);
      window.removeEventListener('stockLevelChanged', handleStockEvent);
    };
  }, []);

  const loadStockNotifications = async () => {
    try {
      // Get current branch for filtering products
      const currentBranch = tenantContextService.getStoredBranchContext();
      const branchId = currentBranch?.id;

      const response = await productService.getAll({
        per_page: 10000,
        branch_id: branchId
      });
      const products = response.data;

      // Monitor products for stock level changes
      monitorProducts(products);

      // Get current stock alerts using the stock monitor
      const { lowStock, outOfStock } = stockMonitor.getStockAlerts(products);

      setLowStockProducts(lowStock);
      setOutOfStockProducts(outOfStock);

      console.log('📊 Stock notifications updated:', {
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        totalProducts: products.length,
        branchId: branchId
      });
    } catch (error) {
      console.error('Failed to load stock notifications:', error);
    }
  };
  
  const loadTenants = async () => {
    setIsLoadingTenants(true);
    try {
      const fetchedTenants = await managementService.fetchAllTenants();
      setTenants(fetchedTenants);

      // Check localStorage directly for stored tenant (avoid race condition with state)
      const storedTenant = tenantContextService.getStoredTenantContext();
      const storedTenantId = storedTenant?.id?.toString();
      
      // If there's a stored tenant and it exists in the fetched tenants, use it
      if (storedTenantId && fetchedTenants.some(t => t.id.toString() === storedTenantId)) {
        // Only update if not already selected (avoid unnecessary re-renders)
        // The useEffect for loading branches will handle the rest
        if (selectedTenant !== storedTenantId) {
          setSelectedTenant(storedTenantId);
        }
      } else if (fetchedTenants.length > 0 && !selectedTenant && !storedTenantId && isSuperAdmin) {
        // Only select first tenant if no stored tenant exists
        handleTenantChange(fetchedTenants[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setIsLoadingTenants(false);
    }
  };
  
  const loadBranchesForTenant = async (tenantId: number) => {
    setIsLoadingBranches(true);
    try {
      console.log(`🔄 Loading branches for tenant ID: ${tenantId}`);
      const fetchedBranches = await managementService.fetchTenantBranches(tenantId);
      console.log(`✅ Loaded ${fetchedBranches.length} branches:`, fetchedBranches);
      setBranches(fetchedBranches);

      // Check if there's a stored branch that belongs to this tenant
      const storedBranch = tenantContextService.getStoredBranchContext();
      if (storedBranch && fetchedBranches.some(b => b.id === storedBranch.id)) {
        // Restore the cached branch if it exists in the fetched branches
        console.log(`✅ Restoring cached branch: ${storedBranch.id} - ${storedBranch.name}`);
        setSelectedBranch(storedBranch.id.toString());
      } else {
        // Only clear branch selection if no valid cached branch exists
        console.log('⚠️ No valid cached branch found, clearing selection');
        setSelectedBranch('');
        // Clear only branch context, keep tenant context
        if (typeof window !== "undefined") {
          localStorage.removeItem("branch_context");
        }
      }
    } catch (error) {
      console.error('❌ Failed to load branches:', error);
    } finally {
      setIsLoadingBranches(false);
    }
  };
  
  const loadUserBranches = async () => {
    setIsLoadingBranches(true);
    try {
      const fetchedBranches = await managementService.fetchUserBranches();
      setBranches(fetchedBranches);

      // Check if there's a stored branch that matches the fetched branches
      const storedBranch = tenantContextService.getStoredBranchContext();
      if (storedBranch && fetchedBranches.some(b => b.id === storedBranch.id)) {
        // Restore the cached branch if it exists in the fetched branches
        console.log(`✅ Restoring cached branch: ${storedBranch.id} - ${storedBranch.name}`);
        setSelectedBranch(storedBranch.id.toString());
      } else {
        // Only clear branch selection if no valid cached branch exists
        console.log('⚠️ No valid cached branch found, clearing selection');
        setSelectedBranch('');
        // Clear only branch context, keep tenant context
        if (typeof window !== "undefined") {
          localStorage.removeItem("branch_context");
        }
      }
    } catch (error) {
      console.error('Failed to load user branches:', error);
    } finally {
      setIsLoadingBranches(false);
    }
  };
  
  const handleTenantChange = async (tenantId: string) => {
    setSelectedTenant(tenantId);
    
    // Update tenant context in localStorage
    const tenant = tenants.find(t => t.id.toString() === tenantId);
    if (tenant) {
      tenantContextService.storeTenantContext(tenant);
      
      // Dispatch custom event to notify other components about tenant change
      window.dispatchEvent(new CustomEvent('tenantChanged', {
        detail: { tenantId: parseInt(tenantId), tenant }
      }));
    }
    
    // Load branches for the selected tenant immediately
    // The loadBranchesForTenant function will check for cached branch
    if (isSuperAdmin) {
      await loadBranchesForTenant(parseInt(tenantId));
    }
  };
  
  const handleBranchChange = async (branchId: string) => {
    setSelectedBranch(branchId);

    // Clear previous stock statuses when switching branches
    clearStockStatuses();

    // Update branch context in localStorage
    const branch = branches.find(b => b.id.toString() === branchId);
    if (branch) {
      tenantContextService.storeBranchContext(branch);

      // Trigger a custom event to notify other components about branch change
      // This will also clear the cart globally
      window.dispatchEvent(new CustomEvent('branchChanged', {
        detail: { branchId: parseInt(branchId), branch }
      }));

      // Reload the entire page to fetch new branch data
      // This ensures all components re-initialize with the new branch context
      window.location.reload();
    }
  };
  
  const getRoleTitle = (roleName: string) => {
    // Return the role name directly since backend already provides the correct role name
    // This supports dynamic roles like "Cashier" and other custom roles
    return roleName || 'User';
  }

  // Get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  if (!user) {
    return null;
  }

  return (
    <header className="h-16 bg-background overflow-x-auto flex items-center">
        <div className="flex items-center justify-between px-4 min-w-max w-full">
            {/* Left Column - Navigation Items */}
            <div className="flex items-center gap-4">
                <div
                    onClick={toggleSidebar}
                    className={cn(
                      "p-2 cursor-pointer rounded-md hover:bg-accent transition-colors flex items-center justify-center",
                      // Mobile-specific styling
                      isMobile && "bg-accent/50"
                    )}
                    aria-label={isMobile ? "Open Menu" : "Toggle Sidebar"}
                >
                    <Menu className={cn(
                      "h-5 w-5 transition-transform duration-300",
                      // Desktop: rotate based on collapsed state
                      !isMobile && !isCollapsed && "rotate-180",
                      // Mobile: rotate based on open state
                      isMobile && isOpen && "rotate-90"
                    )} />
                </div>
                
                {/* Tenant and Branch Dropdowns */}
                <div className="flex items-center gap-2">
                  {/* Tenant Dropdown - Only for Super Admin */}
                  {isSuperAdmin && (
                    <Select value={selectedTenant} onValueChange={handleTenantChange} disabled={isLoadingTenants}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder={isLoadingTenants ? "Loading..." : "Select Tenant"} />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {tenants.map((tenant) => {
                          const tenantValue = tenant.id.toString();
                          return (
                            <SelectItem 
                              key={tenant.id} 
                              value={tenantValue}
                              className={cn(
                                selectedTenant === tenantValue && cn(
                                  "bg-primary/10 text-primary font-medium",
                                  getBrandColors().primary
                                )
                              )}
                            >
                              {tenant.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* Branch Dropdown - Show for all users */}
                  {/* For Super Admin: show when tenant is selected */}
                  {/* For others: always show their accessible branches */}
                  {((isSuperAdmin && selectedTenant) || !isSuperAdmin) && (
                    <Select value={selectedBranch} onValueChange={handleBranchChange} disabled={isLoadingBranches}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder={isLoadingBranches ? "Loading..." : "Select Branch"} />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {branches.length === 0 && !isLoadingBranches ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                            No branches available
                          </div>
                        ) : (
                          branches.map((branch) => {
                            const branchValue = branch.id.toString();
                            return (
                              <SelectItem 
                                key={branch.id} 
                                value={branchValue}
                                className={cn(
                                  selectedBranch === branchValue && cn(
                                    "bg-primary/10 text-primary font-medium",
                                    getBrandColors().primary
                                  )
                                )}
                              >
                                {branch.name}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <Button asChild className="px-8 flex items-center">
                    <Link href={ROUTES.POS.SALES} className="flex items-center">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        POS
                    </Link>
                </Button>
            </div>

            {/* Right Column - User Controls */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <ThemeToggle />
              <FullscreenToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {(lowStockProducts.length + outOfStockProducts.length) > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {lowStockProducts.length + outOfStockProducts.length}
                      </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 p-0">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Mark all as read functionality can be added here
                        }}
                      >
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Mark all as read</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsNotificationModalOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Settings</span>
                      </Button>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
                      <div className="px-4 py-8 text-sm text-muted-foreground text-center">
                        No stock alerts
                      </div>
                    ) : (
                      <>
                        {/* Combine and limit to 5 items */}
                        {[...lowStockProducts, ...outOfStockProducts]
                          .slice(0, 5)
                          .map((alert, index) => (
                            <div
                              key={`${alert.id}-${index}`}
                              className="px-4 py-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors cursor-pointer"
                              onClick={() => setIsNotificationModalOpen(true)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-foreground truncate">
                                      {alert.displayName}
                                    </span>
                                    <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {alert.quantity === 0 
                                      ? `Out of Stock ${alert.isVariant ? '(Variant)' : '(Product)'}`
                                      : `Low Stock ${alert.isVariant ? '(Variant)' : '(Product)'}`}
                                  </p>
                                </div>
                                <Badge 
                                  className={cn(
                                    "text-xs flex-shrink-0",
                                    alert.quantity === 0 
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" 
                                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                  )}
                                >
                                  {alert.quantity} left
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                  </div>

                  {/* Footer - See More */}
                  {lowStockProducts.length + outOfStockProducts.length > 5 && (
                    <div className="border-t px-4 py-3">
                      <button
                        onClick={() => setIsNotificationModalOpen(true)}
                        className="w-full text-center text-sm text-primary hover:underline"
                      >
                        See More &gt;
                      </button>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Dialog open={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen}>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Critical Stock Alert</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead>Threshold</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Selling Price</TableHead>
                          <TableHead>Total Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...lowStockProducts, ...outOfStockProducts].map((alert, index) => {
                          const totalValue = alert.quantity * alert.sellingPrice;
                          const branchName = branches.find(b => b.id === alert.branch_id)?.name || 'Unknown';

                          return (
                            <TableRow key={`${alert.id}-${index}`}>
                              <TableCell className="font-medium">{alert.displayName}</TableCell>
                              <TableCell>{branchName}</TableCell>
                              <TableCell>{alert.threshold}</TableCell>
                              <TableCell>
                                <Badge className={alert.quantity === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}>
                                  {alert.quantity}
                                </Badge>
                              </TableCell>
                              <TableCell>{alert.sellingPrice.toFixed(2)}</TableCell>
                              <TableCell>{totalValue.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
              <Separator orientation="vertical" className="h-6" />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 px-2 md:px-3 gap-2 flex items-center">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Show name and role only on medium screens and up */}
                    <div className="hidden md:flex flex-col items-start min-w-0">
                      <span className="text-sm font-medium leading-none truncate max-w-[120px]">
                        {user.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {getRoleTitle(user.role_name)}
                      </span>
                    </div>
                    <ChevronDown className="hidden md:block h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.SETTINGS.ACCOUNT}>
                      <User className="mr-2 h-4 w-4" />
                      <span>My profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </div>
    </header>
  );
}
