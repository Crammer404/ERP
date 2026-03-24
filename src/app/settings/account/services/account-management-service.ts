'use client'

import { API_ENDPOINTS } from '@/config/api.config'
import { api } from '@/services/api'

export interface AccountProfile {
  user_id: number
  first_name: string
  last_name: string
  name: string
  email: string
  address: string | null
  address_parts: {
    country: string | null
    region: string | null
    province: string | null
    city: string | null
    barangay: string | null
    street: string | null
    block_lot: string | null
    postal_code: string | null
  }
  role_name: string | null
  role_slug: string | null
}

export interface SubscriptionPlanFeature {
  name: string
  slug: string
  description: string
  type: string
  value: string
}

export interface SubscriptionPlan {
  id: number
  name: string
  slug: string
  description: string
  price: string
  billing_cycle: string
  max_users: number | null
  max_branches: number | null
  max_products: number | null
  max_transactions_per_month: number | null
  features: SubscriptionPlanFeature[]
}

export interface AccountSubscription {
  id: number
  status: string
  trial_ends_at: string | null
  starts_at: string | null
  ends_at: string | null
  next_billing_date: string | null
  amount: string
  billing_cycle: string
  plan: SubscriptionPlan | null
}

export interface AccountPaymentMethod {
  id: number
  type: string
  provider: string | null
  token: string | null
  last4: string | null
  brand: string | null
  exp_month: number | null
  exp_year: number | null
  holder_name: string | null
  is_default: boolean
  created_at: string
}

export interface BillingHistoryItem {
  id: number
  subscription_id: number
  transaction_id: string | null
  amount: string
  currency: string
  status: string
  payment_method: string | null
  reference_number: string
  paid_at: string | null
  created_at: string
  invoice_url: string | null
}

export interface AccountOverview {
  profile: AccountProfile
  subscription: AccountSubscription | null
  payment_methods: AccountPaymentMethod[]
  billing_history: BillingHistoryItem[]
}

export const accountManagementService = {
  async getOverview(): Promise<AccountOverview> {
    const response = await api(API_ENDPOINTS.ACCOUNT_MANAGEMENT.OVERVIEW)
    const payload = response?.data ?? response
    return {
      ...payload,
      profile: payload?.profile?.data ?? payload?.profile,
      subscription: payload?.subscription?.data ?? payload?.subscription,
      payment_methods: payload?.payment_methods?.data ?? payload?.payment_methods ?? [],
      billing_history: payload?.billing_history?.data ?? payload?.billing_history ?? [],
    }
  },

  async updateProfile(payload: {
    first_name: string
    last_name: string
    email: string
    address?: {
      country?: string
      region?: string
      province?: string
      city?: string
      barangay?: string
      street?: string
      block_lot?: string
      postal_code?: string
    }
  }) {
    const response = await api(API_ENDPOINTS.ACCOUNT_MANAGEMENT.PROFILE, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return response.data as AccountProfile
  },

  async updatePassword(payload: { password: string; password_confirmation: string }) {
    return api(API_ENDPOINTS.ACCOUNT_MANAGEMENT.PASSWORD, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  async updateSubscriptionPlan(payload: { plan_id: number; billing_cycle?: string }) {
    const response = await api(API_ENDPOINTS.ACCOUNT_MANAGEMENT.SUBSCRIPTION_PLAN, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return response.data as AccountSubscription
  },

  async createPaymentMethod(payload: {
    type: string
    provider?: string
    token?: string
    last4?: string
    brand?: string
    exp_month?: number
    exp_year?: number
    holder_name?: string
    is_default?: boolean
  }) {
    const response = await api(API_ENDPOINTS.ACCOUNT_MANAGEMENT.PAYMENT_METHODS, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return response.data as AccountPaymentMethod
  },

  async updatePaymentMethod(
    id: number,
    payload: {
      type?: string
      provider?: string
      token?: string
      last4?: string
      brand?: string
      exp_month?: number
      exp_year?: number
      holder_name?: string
    }
  ) {
    const response = await api(`${API_ENDPOINTS.ACCOUNT_MANAGEMENT.PAYMENT_METHODS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return response.data as AccountPaymentMethod
  },

  async deletePaymentMethod(id: number) {
    return api(`${API_ENDPOINTS.ACCOUNT_MANAGEMENT.PAYMENT_METHODS}/${id}`, {
      method: 'DELETE',
    })
  },

  async setDefaultPaymentMethod(id: number) {
    const endpoint = API_ENDPOINTS.ACCOUNT_MANAGEMENT.PAYMENT_METHOD_DEFAULT.replace('{id}', id.toString())
    const response = await api(endpoint, {
      method: 'PATCH',
    })
    return response.data as AccountPaymentMethod
  },

  async getBillingHistory(perPage: number = 20) {
    const response = await api(`${API_ENDPOINTS.ACCOUNT_MANAGEMENT.BILLING_HISTORY}?per_page=${perPage}`)
    return response.data as BillingHistoryItem[]
  },
}
