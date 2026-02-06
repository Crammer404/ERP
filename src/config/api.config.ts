/** API Configuration for the API Endpoints **/
// NOTE: NEXT_PUBLIC_ prefix is REQUIRED for client-side access in Next.js
// Variables without NEXT_PUBLIC_ are only available server-side

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_LARAVEL_URL,
  TIMEOUT: 50000,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

// Supabase Configuration *booking system
export const SUPABASE_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  TIMEOUT: 50000,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

// API Endpoints (matching Laravel routes)
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
  },

  // Onboarding endpoints
  ONBOARDING: {
    COMPLETE: '/onboarding/complete',
    CHECK_EMAIL: '/onboarding/check-email',
    CHECK_TENANT_NAME: '/onboarding/check-tenant-name',
    SEND_OTP: '/onboarding/send-otp',
    VERIFY_OTP: '/onboarding/verify-otp',
  },
  
  // User endpoints (moved to management with tenant.context)
  USERS: {
    BASE: '/management/users',
    CREATE: '/management/users',
    UPDATE: '/management/users/{id}',
    DELETE: '/management/users/{id}',
  },

  // Address endpoints
  ADDRESSES: {
    BASE: '/management/user-info/addresses',
    CREATE: '/management/user-info/addresses',
    UPDATE: '/management/user-info/addresses/{id}',
    DELETE: '/management/user-info/addresses/{id}',
  },

  // Tenant endpoints (moved to management)
  TENANTS: {
    BASE: '/management/tenants',
    CREATE: '/management/tenants',
    UPDATE: '/management/tenants/{id}',
    DELETE: '/management/tenants/{id}',
    SETTINGS: '/management/tenants/{id}/settings',
    BRANCHES: '/management/tenants/{id}/branches',
    USERS: '/management/tenants/{id}/users',
  },
  
  // Branch endpoints (moved to management)
  BRANCHES: {
    BASE: '/management/branches',
    CREATE: '/management/branches',
    UPDATE: '/management/branches/{id}',
    DELETE: '/management/branches/{id}',
    EMPLOYEES: '/management/branches/{id}/users',
    INVENTORY: '/management/branches/{id}/inventory',
    SALES: '/management/branches/{id}/sales',
    DTR: '/management/branches/{id}/dtr',
    PAYROLL: '/management/branches/{id}/payroll',
  },
  
  // Role endpoints (moved to management)
  ROLES: {
    BASE: '/management/roles',
    CREATE: '/management/roles',
    UPDATE: '/management/roles/{id}',
    DELETE: '/management/roles/{id}',
    PERMISSIONS: '/management/roles/{id}/permissions',
  },
  
  // User Info endpoints (moved to management)
  USER_INFO: {
    BASE: '/management/user-info',
    CREATE: '/management/user-info',
    UPDATE: '/management/user-info/{id}',
    DELETE: '/management/user-info/{id}',
  },
  
  // DTR endpoints
  DTR: {
    BASE: '/hrms/dtr',
    CHECK_IN: '/hrms/dtr/check-in',
    CHECK_OUT: '/hrms/dtr/check-out',
    UPDATE: '/hrms/dtr/{id}',
    DELETE: '/hrms/dtr/{id}',
    EMPLOYEE_ID: '/hrms/dtr/employee_id',
    GENERATE_QR: '/hrms/dtr/employee_id/generateUserQrFromData',
    EXPORT_TIMESHEET: '/hrms/dtr/export-timesheet',
    CONFIGURATION: {
      GET: '/hrms/dtr/configuration/data',
      STORE: '/hrms/dtr/configuration/store',
      SCHEDULES: '/hrms/dtr/configuration/schedules',
      GET_SCHEDULE: '/hrms/dtr/configuration/schedules/{id}',
      UPDATE_SCHEDULE: '/hrms/dtr/configuration/schedules/{id}',
      UPDATE_SCHEDULE_EMPLOYEES: '/hrms/dtr/configuration/schedules/{id}/employees',
      DELETE_SCHEDULE: '/hrms/dtr/configuration/schedules/{id}',
      USERS: '/hrms/dtr/configuration/users',
    },
  },
  
  // Payroll endpoints
  PAYROLL: {
    BASE: '/hrms/payroll',
    CREATE: '/hrms/payroll',
    CALCULATE: '/hrms/payroll/calculate',
    UPDATE: '/hrms/payroll/{id}',
    DELETE: '/hrms/payroll/{id}',
    COMPUTATION: {
      DATA: '/hrms/payroll/computation/data',
      DYNAMIC_DATA: '/hrms/payroll/computation/dynamicData',
      UPDATE_PAY: '/hrms/payroll/computation/updatePay',
      UPDATE_RATE: '/hrms/payroll/computation/updateRate',
      UPDATE_COMPEN_OR_DEDUC: '/hrms/payroll/computation/updateCompenOrDeduc',
      DELETE_COMPONENT: '/hrms/payroll/computation/deleteComponent',
    },
    REPORTS: {
      DATA: '/hrms/payroll/reports/data',
      GENERATE: '/hrms/payroll/reports/generate',
      DELETE: '/hrms/payroll/reports/delete',
      VIEW: '/hrms/payroll/reports/view-json/{id}',
      USERS: '/hrms/payroll/reports/users',
    },
    PAYSLIP: {
      EMPLOYEE_PAYSLIPS: '/hrms/payroll/payslip/employeePayslips',
    },
  },
  
  // Inventory endpoints
  INVENTORY: {
    BASE: '/inventory',
    CREATE: '/inventory',
    UPDATE: '/inventory/{id}',
    DELETE: '/inventory/{id}',
    PRODUCTS: '/inventory/{id}/products',
    STOCK: '/inventory/{id}/stock',
  },
  
  // Sales endpoints
  SALES: {
    BASE: '/pos/sales',
    CREATE: '/pos/sales',
    UPDATE: '/pos/sales/{id}',
    DELETE: '/pos/sales/{id}',
    RECEIPTS: '/pos/sales/{id}/receipts',
  },
  
  // Reports endpoints
  REPORTS: {
    SALES: '/reports/sales',
    PAYROLL: '/reports/payroll',
    INVENTORY: '/reports/inventory',
    DTR: '/reports/dtr',
    DASHBOARD: '/reports/dashboard',
  },
  
  // Products endpoints (moved to pos)
  PRODUCTS: {
    BASE: '/inventory/products',
    CREATE: '/inventory/products',
    UPDATE: '/inventory/products/{id}',
    DELETE: '/inventory/products/{id}',
    GET: '/inventory/products/{id}',
  },

  // Categories endpoints
  CATEGORIES: {
    BASE: '/inventory/categories',
  },
  
  // Transactions endpoints (moved to pos)
  TRANSACTIONS: {
    BASE: '/pos/transactions',
    CREATE: '/pos/transactions',
    UPDATE: '/pos/transactions/{id}',
    DELETE: '/pos/transactions/{id}',
    HISTORY: '/pos/transactions/{id}/history',
  },

  TAXES: {
    BASE: '/pos/taxes',
    CREATE: '/pos/taxes',
    UPDATE: '/pos/taxes/{id}',
    DELETE: '/pos/taxes/{id}',
    ACTIVE: "/pos/taxes/active",
  },

  PAYMENT_METHODS: {
    ACTIVE: "/pos/payment-methods/active",
  },

  FLOATING_ORDERS: {
    BASE: '/pos/floating-orders',
    CREATE: '/pos/floating-orders',
    UPDATE: '/pos/floating-orders/{id}',
    DELETE: '/pos/floating-orders/{id}',
    GET: '/pos/floating-orders/{id}',
    ADD_ITEM: '/pos/floating-orders/{id}/items',
    UPDATE_ITEM: '/pos/floating-orders/{id}/items/{itemId}',
    REMOVE_ITEM: '/pos/floating-orders/{id}/items/{itemId}',
    ADD_TAXES: '/pos/floating-orders/{id}/taxes',
    BILL_OUT: '/pos/floating-orders/{id}/bill-out',
  },

  CASH_REGISTERS: {
    BASE: '/pos/cash-register/cash-registers',
    CREATE: '/pos/cash-register/cash-registers',
    UPDATE: '/pos/cash-register/cash-registers/{id}',
    DELETE: '/pos/cash-register/cash-registers/{id}',
    GET: '/pos/cash-register/cash-registers/{id}',
    ACTIVATE: '/pos/cash-register/cash-registers/{id}/activate',
    AVAILABLE: '/pos/cash-register/cash-registers/available/list',
    LEDGER: '/pos/cash-register/cash-registers/{id}/ledger',
    CURRENT_SESSION: '/pos/cash-register/sessions/current',
    PAYMENT_SUMMARY: '/pos/cash-register/sessions/{id}/payment-summary',
    EXPECTED_BALANCES: '/pos/cash-register/sessions/{id}/expected-balances',
    LEDGER_BREAKDOWN: '/pos/cash-register/sessions/{id}/ledger-breakdown',
    OPEN_SESSION: '/pos/cash-register/sessions/open',
    CLOSE_SESSION: '/pos/cash-register/sessions/{id}/close',
    CASH_IN: '/pos/cash-register/sessions/{id}/cash-in',
    CASH_OUT: '/pos/cash-register/sessions/{id}/cash-out',
  },
  
  // Settings endpoints
  SETTINGS: {
    SYSTEM: '/settings/system',
    BRANCH: '/settings/branch/{id}',
    BRANDING: '/settings/branding',
    MODULES: '/settings/modules',
    MODULE_GROUPS: '/settings/modules/module-groups',
    MODULE_SUBMENUS: '/settings/modules/module-submenus',
  },
  // discounts endpoints
  DISCOUNTS: {
    BASE: '/inventory/discounts',
    CREATE: '/inventory/discounts',
    UPDATE: '/inventory/discounts/{id}',
    DELETE: '/inventory/discounts/{id}',
    BULK_ASSIGN: '/inventory/discounts/bulk-assign',
  },

  // stock discounts endpoints
  STOCK_DISCOUNTS: {
    BASE: '/inventory/stocks/{stockId}/discounts',
    ASSIGN: '/inventory/stocks/{stockId}/discounts',
    UPDATE: '/inventory/stocks/{stockId}/discounts',
    SHOW: '/inventory/stocks/{stockId}/discounts/{discountId}',
    DELETE: '/inventory/stocks/{stockId}/discounts/{discountId}',
  },

  // ingredients endpoints
  INGREDIENTS: {
    BASE: '/inventory/ingredients',
    CREATE: '/inventory/ingredients',
    UPDATE: '/inventory/ingredients/{id}',
    DELETE: '/inventory/ingredients/{id}',
  },

  // stocks endpoints
  STOCKS: {
    BASE: '/inventory/stocks',
    GET: '/inventory/stocks/{id}',
    UPDATE: '/inventory/stocks/{id}',
    DELETE: '/inventory/stocks/{id}',
  },

  // measurements endpoints
  MEASUREMENTS: {
    BASE: '/inventory/measurements',
    CREATE: '/inventory/measurements',
    UPDATE: '/inventory/measurements/{id}',
    DELETE: '/inventory/measurements/{id}',
  },

  // Currencies endpoints
  CURRENCIES: {
    BASE: '/settings/currencies',
    CREATE: '/settings/currencies',
    UPDATE: '/settings/currencies/{id}',
    DELETE: '/settings/currencies/{id}',
  },

  // Expenses endpoints
  EXPENSES: {
    BASE: '/expenses',
    CREATE: '/expenses',
    UPDATE: '/expenses/{id}',
    DELETE: '/expenses/{id}',
  },
  // Suppliers endpoints
  SUPPLIERS: {
    BASE: '/suppliers',
    CREATE: '/suppliers',
    UPDATE: '/suppliers/{id}',
    DELETE: '/suppliers/{id}',
    CATEGORIES: '/suppliers/supplier-categories',
  },

  // Customers endpoints
  CUSTOMERS: {
    BASE: '/customers',
    CREATE: '/customers',
    UPDATE: '/customers/{id}',
    DELETE: '/customers/{id}',
  },

  // Activity Logs endpoints
  ACTIVITY_LOGS: {
    DISCOUNT_LOGS: '/activity-logs/discount-logs',
    CUSTOMER_LOGS: '/activity-logs/customer-logs',
    ALL: '/activity-logs',
  },

  // Purchases endpoints
  PURCHASES: {
    BASE: '/purchases',
  },
} as const;



// Frontend page routes (client navigation)
export const ROUTES = {
  POS: {
    SALES: '/pos/sales',
  },
  SETTINGS: {
    ACCOUNT: '/settings/account',
  },
} as const;