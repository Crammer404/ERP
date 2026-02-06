'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  LucideIcon, 
  Users, 
  Shield, 
  Package, 
  Receipt, 
  BarChart3, 
  FileText,
  Store, 
  Building, 
  Inbox,
  FileCheck,
  ChefHat
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title = "No data found",
  description = "There are no items to display at the moment.",
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {Icon && (
        <div className="mb-4 p-3 rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
      
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}

// Predefined empty states for common use cases
export const EmptyStates = {
  Users: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Users}
      title="No users found"
      description="There are no users in the system yet. Create your first user to get started."
      {...props}
    />
  ),
  
  Roles: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Shield}
      title="No roles found"
      description="There are no roles defined yet. Create your first role to manage permissions."
      {...props}
    />
  ),
  
  Products: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Package}
      title="No products found"
      description="There are no products in your inventory yet. Add your first product to get started."
      {...props}
    />
  ),
  
  Transactions: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Receipt}
      title="No transactions found"
      description="There are no transactions recorded yet. Your transaction history will appear here."
      {...props}
    />
  ),
  
  Reports: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={BarChart3}
      title="No reports available"
      description="There are no reports generated yet. Generate your first report to view analytics."
      {...props}
    />
  ),
  
  PayrollReports: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={FileText}
      title="No payroll reports found"
      description="There are no payroll reports generated yet. Generate your first payroll report to get started."
      {...props}
    />
  ),
  
  Payslips: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={FileCheck}
      title="No payslips found"
      description="There are no payslips available yet. Payslips will appear here once payroll reports are generated."
      {...props}
    />
  ),
  
  Branches: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Store}
      title="No branches found"
      description="There are no branches in the system yet. Create your first branch to get started."
      {...props}
    />
  ),
  
  Tenants: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Building}
      title="No tenants found"
      description="There are no tenants in the system yet. Create your first tenant to get started."
      {...props}
    />
  ),
  
  Ingredients: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={ChefHat}
      title="No ingredients found"
      description="There are no ingredients in your inventory yet. Add your first ingredient to get started."
      {...props}
    />
  ),

  Generic: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Inbox}
      title="No data found"
      description="There are no items to display at the moment."
      {...props}
    />
  )
};
