import { Building2, Users, BarChart3, Package, LucideIcon } from 'lucide-react'

export interface FeatureItem {
  icon: LucideIcon
  title: string
  description: string
  type: 'success' | 'info' | 'warning' | 'error'
}

export interface AlertStyles {
  bg: string
  border: string
  iconBg: string
  iconColor: string
  titleColor: string
  descColor: string
}

export const welcomeData = {
  badge: {
    text: 'WELCOME!',
  },
  heading: {
    before: "Let's set up your",
    highlight: 'ERP system',
  },
  subtitle: "We'll have your business management system up and running in no time.",
  keyFeatures: [
    {
      icon: Building2,
      title: 'Business Management',
      description: 'Complete business operations in one place',
      type: 'success' as const,
    },
    {
      icon: Package,
      title: 'Inventory Control',
      description: 'Track products, stock levels, and suppliers',
      type: 'info' as const,
    },
    {
      icon: Users,
      title: 'Employee Management',
      description: 'HR, payroll, and attendance tracking',
      type: 'warning' as const,
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Real-time insights and business intelligence',
      type: 'error' as const,
    },
  ] as FeatureItem[],
}

export function getAlertStyles(type: string): AlertStyles {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        iconBg: 'bg-green-100 dark:bg-green-800',
        iconColor: 'text-green-600 dark:text-green-400',
        titleColor: 'text-green-800 dark:text-green-200',
        descColor: 'text-green-600 dark:text-green-400',
      }
    case 'info':
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        iconBg: 'bg-blue-100 dark:bg-blue-800',
        iconColor: 'text-blue-600 dark:text-blue-400',
        titleColor: 'text-blue-800 dark:text-blue-200',
        descColor: 'text-blue-600 dark:text-blue-400',
      }
    case 'warning':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        iconBg: 'bg-yellow-100 dark:bg-yellow-800',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        titleColor: 'text-yellow-800 dark:text-yellow-200',
        descColor: 'text-yellow-600 dark:text-yellow-400',
      }
    case 'error':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        iconBg: 'bg-red-100 dark:bg-red-800',
        iconColor: 'text-red-600 dark:text-red-400',
        titleColor: 'text-red-800 dark:text-red-200',
        descColor: 'text-red-600 dark:text-red-400',
      }
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700',
        iconBg: 'bg-gray-100 dark:bg-gray-700',
        iconColor: 'text-gray-600 dark:text-gray-400',
        titleColor: 'text-gray-800 dark:text-gray-200',
        descColor: 'text-gray-600 dark:text-gray-400',
      }
  }
}

