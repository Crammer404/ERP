// Base API client
export { api, setToken, getToken, clearToken, isAuthenticated } from './api';

// Auth service
export { authService } from './auth/authService';
export type { LoginRequest, LoginResponse } from './auth/authService';

// User service
export { userService } from '../app/management/users/services/userService';
export type { UserEntity, CreateUserRequest, UpdateUserRequest } from '../app/management/users/services/userService';

// Tenant service
export { tenantService } from '../app/management/tenants/services/tenantService';
export type { Tenant, CreateTenantRequest, UpdateTenantRequest, TenantSettings, TenantAddress } from '../app/management/tenants/services/tenantService';

// Branch service
export { branchService } from '../app/management/branches/services/branch-service';
export type { Branch, CreateBranchRequest, UpdateBranchRequest } from '../app/management/branches/services/branch-service';

// Role service
export { roleService } from '../app/management/roles/services/roleService';
export type { Role, CreateRoleRequest, UpdateRoleRequest } from '../app/management/roles/services/roleService';

// User Info service
export { userInfoService } from './user-info/userInfoService';
export type { UserInfo, CreateUserInfoRequest, UpdateUserInfoRequest } from './user-info/userInfoService';

// Address service
export { addressService } from './user-info/addressService';
export type { Address, CreateAddressRequest, UpdateAddressRequest } from './user-info/addressService';


// DTR service
export { dtrService } from './dtr/dtrService';
export type { DTR, CheckInRequest, CheckOutRequest, CreateDTRRequest, UpdateDTRRequest } from './dtr/dtrService';

// Employee service
export { employeeService } from '../app/hrms/dtr/employeeId/services/employee-service';
export type { Employee, EmployeeQrRequest, EmployeeQrResponse } from '../app/hrms/dtr/employeeId/services/employee-service';

// Payroll service
export { payrollService } from './payroll/payrollService';
export type { Payroll, CreatePayrollRequest, UpdatePayrollRequest, CalculatePayrollRequest } from './payroll/payrollService';

// Inventory service
export { inventoryService } from './inventory/inventoryService';
export type { Inventory, CreateInventoryRequest, UpdateInventoryRequest } from './inventory/inventoryService';

// Sales service
export { salesService } from './sales/salesService';
export type { SalesTransaction, CreateSaleRequest, UpdateSaleRequest, CreateSalesTransactionRequest } from './sales/salesService';

// Reports service
export { reportsService } from './reports/reportsService';
export type { SalesReport, PayrollReport, InventoryReport, DTRReport, DashboardReport } from './reports/reportsService';

// Product service
export { productService } from './product/productService';
export type { Product, CreateProductRequest, UpdateProductRequest, ProductCategory, ProductStock } from './product/productService';

// Transaction service
export { transactionService } from './transaction/transactionService';
export type { Transaction, CreateTransactionRequest, UpdateTransactionRequest, TransactionHistory } from './transaction/transactionService';

// Settings service
export { settingsService } from './settings/settingsService';
export type { SystemSettings, BranchSettings, UpdateSettingsRequest } from './settings/settingsService';

// Discount service
export { discountService } from '../app/inventory/discounts/services/discountService';
export type { Discount, CreateDiscountRequest, UpdateDiscountRequest } from '../app/inventory/discounts/services/discountService';

// Module Group service
export { moduleGroupService } from './module/moduleGroupService';
export type { UpdateSortOrderRequest, CreateModuleGroupRequest, UpdateModuleGroupRequest } from './module/moduleGroupService';

// Module Submenu service
export { moduleSubmenuService } from './module/moduleSubmenuService';
export type { ModuleSubmenu, RolePermission, ModuleSubmenuWithPermissions } from './module/moduleSubmenuService';
