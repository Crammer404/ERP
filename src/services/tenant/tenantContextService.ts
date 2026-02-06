import { api } from '../api';

export interface TenantContext {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export interface BranchContext {
  id: number;
  name: string;
  email?: string;
  contact_no?: string;
}

export interface SubscriptionContext {
  id: number;
  plan_name: string;
  status: string;
  trial_ends_at?: string;
}

export interface TenantContextData {
  tenant: TenantContext;
  branch: BranchContext;
  subscription?: SubscriptionContext;
  accessibleBranches: BranchContext[];
}

class TenantContextService {
  private static instance: TenantContextService;
  private tenantContext: TenantContextData | null = null;

  private constructor() {}

  public static getInstance(): TenantContextService {
    if (!TenantContextService.instance) {
      TenantContextService.instance = new TenantContextService();
    }
    return TenantContextService.instance;
  }

  /**
   * Get tenant context from localStorage
   */
  public getStoredTenantContext(): TenantContext | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("tenant_context");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting stored tenant context:', error);
      return null;
    }
  }

  /**
   * Get branch context from localStorage
   */
  public getStoredBranchContext(): BranchContext | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("branch_context");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting stored branch context:', error);
      return null;
    }
  }

  /**
   * Store tenant context in localStorage
   */
  public storeTenantContext(tenant: TenantContext): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("tenant_context", JSON.stringify(tenant));
  }

  /**
   * Store branch context in localStorage
   */
  public storeBranchContext(branch: BranchContext): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("branch_context", JSON.stringify(branch));
  }

  /**
   * Clear all tenant context from localStorage
   */
  public clearTenantContext(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("tenant_context");
    localStorage.removeItem("branch_context");
    this.tenantContext = null;
  }

  /**
   * Fetch current tenant context from API
   */
  public async fetchTenantContext(): Promise<TenantContextData | null> {
    try {
      const response = await api('/auth/users/context');
      this.tenantContext = response;

      // Update localStorage with fresh data
      if (response.tenant) {
        this.storeTenantContext(response.tenant);
      }
      if (response.branch) {
        this.storeBranchContext(response.branch);
      }

      return response;
    } catch (error: any) {
      // Handle 404 (no tenant context) as a normal case, not an error
      if (error?.status === 404) {
        console.log('Tenant context not available (no tenant/branch setup)');
        return null;
      }

      // Log other errors
      console.error('Error fetching tenant context:', error);
      return null;
    }
  }

  /**
   * Get current tenant context (from memory or localStorage)
   */
  public getCurrentTenantContext(): TenantContextData | null {
    if (this.tenantContext) {
      return this.tenantContext;
    }

    const tenant = this.getStoredTenantContext();
    const branch = this.getStoredBranchContext();

    if (tenant && branch) {
      return {
        tenant,
        branch,
        accessibleBranches: [branch] // Default to current branch
      };
    }

    return null;
  }

  /**
   * Switch to a different branch
   */
  public async switchBranch(branchId: number): Promise<boolean> {
    try {
      const response = await api(`/management/branches/${branchId}`);
      if (response) {
        this.storeBranchContext(response);
        // Refresh tenant context to get updated branch info
        await this.fetchTenantContext();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error switching branch:', error);
      return false;
    }
  }

  /**
   * Check if user has access to a specific feature based on subscription
   */
  public hasFeatureAccess(featureSlug: string): boolean {
    const context = this.getCurrentTenantContext();
    if (!context?.subscription) {
      return false;
    }

    // For now, return true if subscription is active or trial
    // This can be enhanced with actual feature checking
    return ['active', 'trial'].includes(context.subscription.status);
  }

  /**
   * Check if tenant is on trial
   */
  public isOnTrial(): boolean {
    const context = this.getCurrentTenantContext();
    return context?.subscription?.status === 'trial';
  }

  /**
   * Get trial end date
   */
  public getTrialEndDate(): Date | null {
    const context = this.getCurrentTenantContext();
    if (context?.subscription?.trial_ends_at) {
      return new Date(context.subscription.trial_ends_at);
    }
    return null;
  }
}

export const tenantContextService = TenantContextService.getInstance();
