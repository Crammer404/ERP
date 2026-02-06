'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { UserCog, MoreVertical, Plus, Trash2, Edit, Search, RefreshCw, IdCard, Download, Loader2, User } from 'lucide-react';
import { userService, employeeService } from '@/services';
import type { UserEntity } from '@/services';
import type { Role, PaginationResponse, UserInfo as UserInfoPayload } from '@/app/management/users/services/userService';
import type { Address as AddressPayload } from '@/services/address/addressService';
import { tenantContextService, type BranchContext } from '@/services/tenant/tenantContextService';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from "@/hooks/use-toast";
import { PermissionGuard } from '@/components/guards';
import { useModulePermissions } from '@/contexts/PermissionContext';
import { FullPageAccessDenied } from '@/components/error/error-page';
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { UserFormModal } from '@/app/management/users/components/UserFormModal';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FlipCard } from '@/components/ui/flip-card';
import html2canvas from 'html2canvas';

const getRoleName = (role: string | number | Role | null): string => {
  if (!role) return 'N/A';
  if (typeof role === 'string') return role;
  if (typeof role === 'number') return `Role #${role}`;
  return (role as Role).name || 'N/A';
};

const getDisplayName = (user: UserEntity): string => {
  const firstName = user.user_info?.first_name?.trim();
  const lastName = user.user_info?.last_name?.trim();
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ');
  }
  return user.email;
};

const getPrimaryBranchName = (user: UserEntity): string => {
  return user.branches && user.branches.length > 0 ? user.branches[0].name : 'N/A';
};

const ROLE_ORDER = ['Super Admin', 'Tenant Manager', 'Branch Manager', 'Employee'] as const;
type KnownRoleName = typeof ROLE_ORDER[number];


export default function UserPage() {
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeBranch, setActiveBranch] = useState<BranchContext | null>(() => tenantContextService.getStoredBranchContext());
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationResponse>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
    has_more_pages: false,
  });

  const [userCache, setUserCache] = useState<Map<string, { users: UserEntity[], pagination: PaginationResponse }>>(new Map());
  const { canRead, canCreate, canUpdate, canDelete } = useModulePermissions('users');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  // Consolidated modal state
  const [modalState, setModalState] = useState<{
    type: 'add' | 'edit' | 'delete' | null;
    isOpen: boolean;
    user?: UserEntity | null;
  }>({ type: null, isOpen: false, user: null });
  
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Digital ID Card state
  const [idModalOpen, setIdModalOpen] = useState(false);
  const [selectedUserForId, setSelectedUserForId] = useState<UserEntity | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [generatingQr, setGeneratingQr] = useState(false);
  const [downloadingId, setDownloadingId] = useState(false);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  const filterRolesForCurrentUser = useCallback((availableRoles: Role[]): Role[] => {
    const currentRoleName = user?.role_name;
    if (!currentRoleName) {
      return availableRoles;
    }

    const currentIndex = ROLE_ORDER.indexOf(currentRoleName as KnownRoleName);
    if (currentIndex === -1) {
      return availableRoles;
    }

    return availableRoles.filter((role) => {
      const roleIndex = ROLE_ORDER.indexOf(role.name as KnownRoleName);
      if (roleIndex === -1) return true;
      return roleIndex >= currentIndex;
    }).sort((a, b) => {
      const indexA = ROLE_ORDER.indexOf(a.name as KnownRoleName);
      const indexB = ROLE_ORDER.indexOf(b.name as KnownRoleName);
      if (indexA === -1 && indexB === -1) {
        return a.name.localeCompare(b.name);
      }
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [user?.role_name]);

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    toast({
      title,
      description: message,
      variant:
        type === "error" ? "destructive" : type === "success" ? "success" : "default",
    });
  };

  // Consolidated error handler
  const handleApiError = (err: any, defaultMessage: string = "An error occurred") => {
    console.log('handleApiError called with:', err);
    console.log('err.response:', err.response);
    console.log('err.response?.data:', err.response?.data);
    console.log('err.response?.data?.errors:', err.response?.data?.errors);
    
    if (err.response?.data?.errors) {
      const apiErrors: Record<string, string> = {};
      for (const key in err.response.data.errors) {
        let fieldKey = key;
        if (key.startsWith("user_info.")) fieldKey = key;
        if (key.startsWith("address.")) fieldKey = key;
        if (key === 'branch_ids' || key.startsWith('branch_ids.')) fieldKey = 'branch_ids';
        apiErrors[fieldKey] = err.response.data.errors[key][0];
      }
      console.log('Setting field errors:', apiErrors);
      setErrors(apiErrors);
    } else {
      // Only set general error if there are no field-specific errors
      const message = err.response?.data?.message || defaultMessage;
      console.log('Setting general error:', message);
      setErrors({ general: message });
    }
  };

  // Clear specific error when user types
  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    branch_ids: activeBranch ? [activeBranch.id.toString()] : [],
    user_info: {
      first_name: '',
      middle_name: '',
      last_name: '',
      address: {
        street: '',
        city: '',
        province: '',
        region: '',
        postal_code: '',
        zipcode: '',
        barangay: '',
        block_lot: '',
        country: 'Philippines'
      }
    }
  });

  const getCacheKey = (page: number, perPage: number, search: string) => {
    return `${page}-${perPage}-${search}`;
  };

  const clearCache = () => {
    console.log('Clearing user cache...');
    setUserCache(new Map());
  };

  const fetchUsers = async (page: number = currentPage, perPage: number = itemsPerPage, search: string = searchTerm, forceRefresh: boolean = false) => {
    // Check if branch is selected before fetching
    const currentBranch = tenantContextService.getStoredBranchContext();
    if (!currentBranch) {
      // No branch selected, clear users and show empty state
      setUsers([]);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
        from: null,
        to: null,
        has_more_pages: false,
      });
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey(page, perPage, search);
    
    console.log('Fetching users with cache key:', cacheKey);
    console.log('Cache has key:', userCache.has(cacheKey));
    console.log('Force refresh:', forceRefresh);
    
    if (!forceRefresh && userCache.has(cacheKey)) {
      console.log('Using cached data');
      const cachedData = userCache.get(cacheKey)!;
      setUsers(cachedData.users);
      setPagination(cachedData.pagination);
      setLoading(false);
      return;
    }
    
    console.log('Fetching fresh data from API...');

    setLoading(true);
    try {
      const response = await userService.getAll(page, perPage, search);
      console.log('API response received:', response.users.length, 'users');
      setUsers(response.users);
      setPagination(response.pagination);
      
      setUserCache(prev => new Map(prev).set(cacheKey, {
        users: response.users,
        pagination: response.pagination
      }));
      console.log('Data cached with key:', cacheKey);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
        from: null,
        to: null,
        has_more_pages: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const rolesData = await userService.getRoles();
      const availableRoles = Array.isArray(rolesData) ? (rolesData as Role[]) : [];
      setRoles(filterRolesForCurrentUser(availableRoles));
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setRoles([]);
    }
  };

  useEffect(() => {
    const currentBranch = tenantContextService.getStoredBranchContext();
    setActiveBranch(currentBranch);
    
    // Only fetch users if branch is selected
    if (currentBranch) {
      fetchUsers(currentPage, itemsPerPage, searchTerm);
    } else {
      // Clear users if no branch selected
      setUsers([]);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: itemsPerPage,
        total: 0,
        from: null,
        to: null,
        has_more_pages: false,
      });
      setLoading(false);
    }
    fetchRoles();
  }, [currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    setRoles((prev) => filterRolesForCurrentUser(prev));
  }, [filterRolesForCurrentUser]);

  useEffect(() => {
    if (modalState.type === 'add') {
      setFormData(prev => ({
        ...prev,
        branch_ids: activeBranch ? [activeBranch.id.toString()] : [],
      }));
    }
  }, [activeBranch, modalState.type]);

  useEffect(() => {
    if (activeBranch) {
      setErrors(prev => {
        if (!prev.branch_ids) return prev;
        const { branch_ids, ...rest } = prev;
        return rest;
      });
    }
  }, [activeBranch]);

  // Listen for branch change events
  useEffect(() => {
    const handleBranchChange = () => {
      console.log('Branch changed, refreshing users data...');
      const currentBranch = tenantContextService.getStoredBranchContext();
      setActiveBranch(currentBranch);
      
      // Clear cache and refresh data
      setUserCache(new Map());
      setCurrentPage(1);
      
      // Only fetch if branch is selected
      if (currentBranch) {
        fetchUsers(1, itemsPerPage, searchTerm);
      } else {
        // Clear users if no branch selected
        setUsers([]);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: itemsPerPage,
          total: 0,
          from: null,
          to: null,
          has_more_pages: false,
        });
        setLoading(false);
      }
    };

    window.addEventListener('branchChanged', handleBranchChange);
    
    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, [itemsPerPage, searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    const perPage = parseInt(newItemsPerPage);
    setItemsPerPage(perPage);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    console.log('Refreshing users data...');
    // Clear cache and reset users state
    setUserCache(new Map());
    setUsers([]);
    // Force fresh fetch by bypassing cache
    setTimeout(() => {
      fetchUsers(currentPage, itemsPerPage, searchTerm, true);
    }, 100);
  };

  // Handle View ID
  const handleViewId = async (user: UserEntity) => {
    try {
      setSelectedUserForId(user);
      setIdModalOpen(true);
      setGeneratingQr(true);
      setQrCode('');

      const qrData = {
        id: user.id,
        name: getDisplayName(user),
        email: user.email,
        role: getRoleName(user.role),
        branch: getPrimaryBranchName(user),
      };

      const svgQrCode = await employeeService.generateEmployeeQr(qrData);
      setQrCode(svgQrCode);
      showToast('success', 'Success', 'Digital ID generated successfully');
    } catch (error) {
      console.error('Failed to generate Digital ID:', error);
      showToast('error', 'Error', 'Failed to generate Digital ID');
      setIdModalOpen(false);
    } finally {
      setGeneratingQr(false);
    }
  };

  // Handle Download Digital ID (front and back)
  const handleDownloadIdCards = async () => {
    if (!selectedUserForId || !frontCardRef.current || !backCardRef.current) return;

    try {
      setDownloadingId(true);

      const displayName = getDisplayName(selectedUserForId) || `User_${selectedUserForId.id}`;
      const fileName = displayName.replace(/\s+/g, '_');

      const downloadCanvasImage = async (canvas: HTMLCanvasElement, filename: string) => {
        return new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
            resolve();
          }, 'image/png');
        });
      };

      // Ensure hidden cards are fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const frontCanvas = await html2canvas(frontCardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      await downloadCanvasImage(frontCanvas, `${fileName}_ID_Front.png`);

      await new Promise(resolve => setTimeout(resolve, 300));

      const backCanvas = await html2canvas(backCardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      await downloadCanvasImage(backCanvas, `${fileName}_ID_Back.png`);

      showToast('success', 'Success', 'Digital ID downloaded successfully');
    } catch (error) {
      console.error('Failed to download ID cards:', error);
      showToast('error', 'Error', 'Failed to download Digital ID');
    } finally {
      setDownloadingId(false);
    }
  };

  // Force refresh function that completely bypasses cache
  const forceRefresh = async () => {
    console.log('Force refreshing users data...');
    setLoading(true);
    setUsers([]);
    setUserCache(new Map());
    
    try {
      const response = await userService.getAll(currentPage, itemsPerPage, searchTerm);
      console.log('Force refresh - API response received:', response.users.length, 'users');
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Force refresh failed:', error);
      setUsers([]);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: itemsPerPage,
        total: 0,
        from: null,
        to: null,
        has_more_pages: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      branch_ids: activeBranch ? [activeBranch.id.toString()] : [],
      user_info: {
        first_name: '',
        middle_name: '',
        last_name: '',
        address: {
          street: '',
          city: '',
          province: '',
          region: '',
          postal_code: '',
          zipcode: '',
          barangay: '',
          block_lot: '',
          country: 'Philippines'
        }
      }
    });
    setErrors({});
  };


  // Simplified form data handler
  const handleInputChange = (field: string, value: string) => {
    // Clear error for this field
    const errorKey = field.includes('.') ? field.split('.').pop() : field;
    if (errors[errorKey!]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey!];
        return newErrors;
      });
    }
    
    // Update form data using a more elegant approach
    setFormData(prev => {
      const newData = { ...prev };
      const keys = field.split('.');
      let current: any = newData;
      
      // Navigate to the nested property
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      // Set the final value
      current[keys[keys.length - 1]] = value;
      
      return newData;
    });
  };

  const validateForm = (isEdit = false, data = formData) => {
    const newErrors: Record<string, string> = {};


    if (!data.user_info.first_name.trim()) newErrors.first_name = "First name is required";
    if (!data.user_info.last_name.trim()) newErrors.last_name = "Last name is required";

    if (!data.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = "Invalid email format";

    if (!data.role) newErrors.role = "Role is required";
    if (!data.branch_ids || data.branch_ids.length === 0) newErrors.branch_ids = "Active branch is required";

    if (!isEdit || data.password) {
      if (!data.password) newErrors.password = "Password is required";
      else if (data.password.length < 8) newErrors.password = "Password must be at least 8 characters";
      if (data.password !== data.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }

    const requiredAddressFields = ['region', 'province', 'city', 'barangay'] as const;
    requiredAddressFields.forEach(field => {
      const value = data.user_info.address[field];
      if (!value || !value.trim()) {
        const label = field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        newErrors[`address.${field}`] = `${label} is required`;
      }
    });

    return newErrors;
  };

  const sanitizeAddressPayload = (address: Record<string, string>): Partial<AddressPayload> => {
    return Object.entries(address || {}).reduce((acc, [key, value]) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== '') {
          (acc as Record<string, string>)[key] = trimmed;
        }
      }
      return acc;
    }, {} as Partial<AddressPayload>);
  };

  const buildUserInfoPayload = (data: typeof formData): UserInfoPayload => {
    const userInfo: UserInfoPayload = {
      first_name: data.user_info.first_name.trim(),
      last_name: data.user_info.last_name.trim(),
    };

    if (data.user_info.middle_name.trim()) {
      userInfo.middle_name = data.user_info.middle_name.trim();
    }

    const cleanedAddress = sanitizeAddressPayload(data.user_info.address);
    if (Object.keys(cleanedAddress).length > 0) {
      userInfo.address = cleanedAddress;
    }

    return userInfo;
  };

  // Consolidated modal handlers
  const openModal = async (type: 'add' | 'edit' | 'delete', user?: UserEntity) => {
    setErrors({});

    if (type === 'add') {
      resetForm();
      setModalState({ type: 'add', isOpen: true, user: null });
    } else if (type === 'delete' && user) {
      setModalState({ type: 'delete', isOpen: true, user });
    } else if (type === 'edit' && user) {
      setFormLoading(true);
    try {
      const fullUser = await userService.getById(user.id);
      setFormData({
        email: fullUser.email || '',
        password: '',
        confirmPassword: '',
        role: fullUser.role
          ? (typeof fullUser.role === 'object' && fullUser.role.id ? fullUser.role.id.toString() : (typeof fullUser.role === 'string' || typeof fullUser.role === 'number' ? fullUser.role.toString() : ''))
          : '',
        branch_ids: Array.isArray(fullUser.branches) && fullUser.branches.length > 0
          ? fullUser.branches.map(branch => branch.id.toString())
          : (activeBranch ? [activeBranch.id.toString()] : []),
        user_info: {
          first_name: fullUser.user_info?.first_name || '',
          middle_name: fullUser.user_info?.middle_name || '',
          last_name: fullUser.user_info?.last_name || '',
          address: {
            ...(() => {
              const userAddress = fullUser.user_info?.address as Record<string, any> | undefined;
              return {
                street: userAddress?.street || '',
                city: userAddress?.city || '',
                province: userAddress?.province || '',
                region: userAddress?.region || '',
                postal_code: userAddress?.postal_code || userAddress?.zipcode || '',
                zipcode: userAddress?.zipcode || userAddress?.postal_code || '',
                barangay: userAddress?.barangay || '',
                block_lot: userAddress?.block_lot || '',
                country: userAddress?.country || 'Philippines',
              };
            })()
          }
        }
      });
        setModalState({ type: 'edit', isOpen: true, user });
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      setErrors({ general: 'Failed to load user details' });
    } finally {
      setFormLoading(false);
      }
    }
  };

  const closeModal = () => {
    setModalState({ type: null, isOpen: false, user: null });
  };

  const handleCreate = async (data: any) => {
    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm(false, data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    if (!activeBranch) {
      setErrors({ branch_ids: 'Active branch is required before creating a user.' });
      setFormLoading(false);
      return;
    }

    try {
      const userInfoPayload = buildUserInfoPayload(data);
      const payload = {
        email: data.email.trim(),
        password: data.password,
        password_confirmation: data.confirmPassword,
        role_id: data.role,
        branch_ids: [activeBranch.id],
        user_info: userInfoPayload,
      };

      console.log('Creating user with payload:', payload);
      await userService.create({
        ...payload,
      });

      closeModal();
      resetForm();
      forceRefresh();
      showToast("success", "User Created", "The user has been successfully created.");
    } catch (err: any) {
      console.error('Failed to create user:', err);
      handleApiError(err, "Failed to create user");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!modalState.user) return;

    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm(true, data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    try {
      const payload: any = {
        email: data.email.trim(),
        role_id: data.role,
        user_info: buildUserInfoPayload(data),
      };

      if (data.password) {
        payload.password = data.password;
        payload.password_confirmation = data.password;
      }

      await userService.update(modalState.user.id, payload);

      closeModal();
      resetForm();
      forceRefresh();
      showToast("success", "User Updated", "The user details were successfully updated.");
    } catch (err: any) {
      handleApiError(err, "Failed to update user");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!modalState.user) return;
    
    setFormLoading(true);
    setErrors({});

    try {
      await userService.delete(modalState.user.id);

      closeModal();
      forceRefresh();
      showToast("success", "User Deleted", "The user was successfully deleted.");
    } catch (err: any) {
      console.error('Delete error:', err);
      
      // Handle specific error cases
      if (err.response?.status === 404) {
        setErrors({ general: "User not found. It may have already been deleted." });
        showToast("warning", "User Not Found", "This user may have already been deleted.");
        // Still refresh to get the latest data
        forceRefresh();
      } else if (err.response?.status === 500 && err.response?.data?.error?.includes("No query results")) {
        setErrors({ general: "User not found in database." });
        showToast("warning", "User Not Found", "This user no longer exists.");
        // Still refresh to get the latest data
        forceRefresh();
      } else {
        handleApiError(err, "Failed to delete user");
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (!canRead) {
    return <FullPageAccessDenied moduleName="users" />;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <UserCog className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Employees</h1>
          <p className="text-sm text-muted-foreground">View, add, edit, and manage your employees.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <Button 
                onClick={forceRefresh}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <PermissionGuard module="users" action="create">
                <Button onClick={() => openModal('add')} className="flex items-center gap-2 flex-1 sm:flex-none">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </PermissionGuard>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader size="md" />
            </div>
          ) : !activeBranch ? (
            <EmptyStates.Generic
              icon={User}
              title="Select a Branch"
              description="Please select a branch from the dropdown in the header to view employees for that branch."
            />
          ) : users.length === 0 ? (
            <EmptyStates.Users/>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    {(canUpdate || canDelete) && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id} className="hover:bg-transparent">
                      <TableCell>
                        {user.user_info
                          ? `${user.user_info.first_name ?? ""} ${user.user_info.last_name ?? ""}`.trim() || "—"
                          : user.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        {user.branches && user.branches.length > 0
                          ? user.branches.map(branch => branch.name).join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.role 
                          ? (typeof user.role === "object" 
                            ? user.role.name 
                            : typeof user.role === "string"
                            ? user.role
                            : `Role #${user.role}`)
                          : "—"}
                      </TableCell>
                      {(canUpdate || canDelete) && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center">
                              <DropdownMenuItem onClick={() => handleViewId(user)}>
                                <IdCard className="h-4 w-4 mr-2" />
                                View ID
                              </DropdownMenuItem>
                              <PermissionGuard module="users" action="update">
                                <DropdownMenuItem onClick={() => openModal('edit', user)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              </PermissionGuard>
                              <PermissionGuard module="users" action="delete">
                                <DropdownMenuItem
                                  onClick={() => openModal('delete', user)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </PermissionGuard>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

               <div className="flex justify-between items-center mt-6">
                 <PaginationInfos.Standard
                   from={pagination.from}
                   to={pagination.to}
                   total={pagination.total}
                   itemsPerPage={itemsPerPage}
                   onItemsPerPageChange={handleItemsPerPageChange}
                 />

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                      .filter(page =>
                        page === 1 || page === pagination.last_page || (page >= currentPage - 1 && page <= currentPage + 1)
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
                                isActive={currentPage === page}
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
                        onClick={() => handlePageChange(Math.min(currentPage + 1, pagination.last_page))}
                        className={currentPage === pagination.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {modalState.type === 'add' && (
      <PermissionGuard module="users" action="create">
          <UserFormModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            mode="create"
            roles={roles}
            activeBranchId={activeBranch?.id}
            activeBranchName={activeBranch?.name}
            onSubmit={handleCreate}
            loading={formLoading}
            errors={errors}
            onClearError={clearError}
          />
        </PermissionGuard>
      )}

      {modalState.type === 'edit' && (
      <PermissionGuard module="users" action="update">
          <UserFormModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            mode="edit"
            roles={roles}
            activeBranchId={activeBranch?.id}
            activeBranchName={activeBranch?.name}
            initialData={formData}
            onSubmit={handleUpdate}
            loading={formLoading}
            errors={errors}
            onClearError={clearError}
          />
      </PermissionGuard>
      )}

      {modalState.type === 'delete' && (
        <PermissionGuard module="users" action="delete">
          <DeleteConfirmModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            onConfirm={handleDelete}
            loading={formLoading}
            title="Delete User"
            itemName={modalState.user?.user_info?.first_name && modalState.user?.user_info?.last_name 
              ? `${modalState.user.user_info.first_name} ${modalState.user.user_info.last_name}`
              : modalState.user?.email
            }
            errors={errors}
          />
      </PermissionGuard>
      )}

      {/* Digital ID Card Modal */}
      <Dialog open={idModalOpen} onOpenChange={setIdModalOpen}>
        <DialogContent className="w-[95vw] max-w-[340px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Digital Employee ID</DialogTitle>
            <DialogDescription>
              {selectedUserForId && `Hover over the card to view QR code`}
            </DialogDescription>
          </DialogHeader>
          
          {generatingQr ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Generating Digital ID...</p>
              </div>
            </div>
          ) : selectedUserForId && qrCode ? (
            (() => {
              const displayName = getDisplayName(selectedUserForId);
              const roleName = getRoleName(selectedUserForId.role);
              const branchName = getPrimaryBranchName(selectedUserForId);

              return (
                <>
                  {/* Hidden cards for high-quality downloads */}
                  <div className="fixed -left-[9999px] top-0">
                    <div
                      ref={frontCardRef}
                      className="w-[260px] h-[380px] bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-5 text-white"
                    >
                      <div className="flex flex-col items-center h-full">
                        <div className="text-center mb-4">
                          <h3 className="text-sm font-bold tracking-widest">THE NEST</h3>
                          <div className="h-0.5 w-12 bg-white/30 mx-auto mt-1.5 rounded-full"></div>
                        </div>
                        <div className="flex-shrink-0 mb-4">
                          <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-3 border-white/30">
                            <User className="w-12 h-12 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center text-center space-y-2.5 w-full">
                          <h2 className="text-xl font-bold leading-tight px-2">{displayName}</h2>
                          <div className="space-y-1.5 text-xs bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <span className="text-white/80">ID:</span>
                              <span className="font-semibold">{selectedUserForId.id}</span>
                            </div>
                            <div className="h-px bg-white/20"></div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/80">Role:</span>
                              <span className="font-semibold text-right ml-2">{roleName}</span>
                            </div>
                            <div className="h-px bg-white/20"></div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/80">Branch:</span>
                              <span className="font-semibold">{branchName}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      ref={backCardRef}
                      className="w-[260px] h-[380px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-2xl p-4"
                    >
                      <div className="flex flex-col items-center h-full">
                        <div className="text-center mb-2">
                          <h3 className="text-sm font-bold text-gray-800">Digital ID</h3>
                          <p className="text-[9px] text-gray-500 mt-0.5">Scan to Clock In/Out</p>
                        </div>
                        <div className="flex-1 flex items-center justify-center my-2">
                          <div
                            className="bg-white p-1.5 rounded-lg border border-gray-300 shadow-sm [&_svg]:w-[110px] [&_svg]:h-[110px]"
                            dangerouslySetInnerHTML={{ __html: qrCode }}
                          />
                        </div>
                        <div className="w-full bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                          <h4 className="text-[9px] font-bold text-gray-500 tracking-wider mb-1.5">EMPLOYEE INFORMATION</h4>
                          <div className="space-y-1 text-[10px]">
                            <div>
                              <span className="text-gray-500 text-[8px] block leading-tight">Name</span>
                              <span className="font-medium text-gray-800 text-[10px]">{displayName}</span>
                            </div>
                            <div className="h-px bg-gray-200"></div>
                            <div>
                              <span className="text-gray-500 text-[8px] block leading-tight">Employee ID</span>
                              <span className="font-medium text-gray-800 text-[10px]">{selectedUserForId.id}</span>
                            </div>
                            <div className="h-px bg-gray-200"></div>
                            <div>
                              <span className="text-gray-500 text-[8px] block leading-tight">Branch</span>
                              <span className="font-medium text-gray-800 text-[10px]">{branchName}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visible flip card */}
                  <div className="w-[260px] h-[380px] mx-auto">
                    <FlipCard
                      front={
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-5 text-white">
                          <div className="flex flex-col items-center h-full">
                            <div className="text-center mb-4">
                              <h3 className="text-sm font-bold tracking-widest">THE NEST</h3>
                              <div className="h-0.5 w-12 bg-white/30 mx-auto mt-1.5 rounded-full"></div>
                            </div>
                            <div className="flex-shrink-0 mb-4">
                              <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-3 border-white/30">
                                <User className="w-12 h-12 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-center text-center space-y-2.5 w-full">
                              <h2 className="text-xl font-bold leading-tight px-2">{displayName}</h2>
                              <div className="space-y-1.5 text-xs bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-white/80">ID:</span>
                                  <span className="font-semibold">{selectedUserForId.id}</span>
                                </div>
                                <div className="h-px bg-white/20"></div>
                                <div className="flex justify-between items-center">
                                  <span className="text-white/80">Role:</span>
                                  <span className="font-semibold text-right ml-2">{roleName}</span>
                                </div>
                                <div className="h-px bg-white/20"></div>
                                <div className="flex justify-between items-center">
                                  <span className="text-white/80">Branch:</span>
                                  <span className="font-semibold">{branchName}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                      back={
                        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-2xl p-4">
                          <div className="flex flex-col items-center h-full">
                            <div className="text-center mb-2">
                              <h3 className="text-sm font-bold text-gray-800">Digital ID</h3>
                              <p className="text-[9px] text-gray-500 mt-0.5">Scan to Clock In/Out</p>
                            </div>
                            <div className="flex-1 flex items-center justify-center my-2">
                              <div
                                className="bg-white p-1.5 rounded-lg border border-gray-300 shadow-sm [&_svg]:w-[110px] [&_svg]:h-[110px]"
                                dangerouslySetInnerHTML={{ __html: qrCode }}
                              />
                            </div>
                            <div className="w-full bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                              <h4 className="text-[9px] font-bold text-gray-500 tracking-wider mb-1.5">EMPLOYEE INFORMATION</h4>
                              <div className="space-y-1 text-[10px]">
                                <div>
                                  <span className="text-gray-500 text-[8px] block leading-tight">Name</span>
                                  <span className="font-medium text-gray-800 text-[10px]">{displayName}</span>
                                </div>
                                <div className="h-px bg-gray-200"></div>
                                <div>
                                  <span className="text-gray-500 text-[8px] block leading-tight">Employee ID</span>
                                  <span className="font-medium text-gray-800 text-[10px]">{selectedUserForId.id}</span>
                                </div>
                                <div className="h-px bg-gray-200"></div>
                                <div>
                                  <span className="text-gray-500 text-[8px] block leading-tight">Branch</span>
                                  <span className="font-medium text-gray-800 text-[10px]">{branchName}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </div>

                  {/* Download Button */}
                  <div className="flex justify-center mt-6">
                    <Button onClick={handleDownloadIdCards} size="lg" disabled={downloadingId}>
                      {downloadingId ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download ID Card
                        </>
                      )}
                    </Button>
                  </div>
                </>
              );
            })()
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}