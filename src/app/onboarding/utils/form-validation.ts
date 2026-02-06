import { API_CONFIG, API_ENDPOINTS } from '@/config/api.config'

export function isValidEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string, minLength: number = 8): boolean {
  return password.length >= minLength
}

export function doPasswordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword && password.length > 0
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false
  const phoneRegex = /^\d{10,15}$/
  return phoneRegex.test(phone)
}

export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0
}

export async function checkEmailAvailability(
  email: string
): Promise<{ available: boolean; message: string }> {
  if (!isValidEmail(email)) {
    return { available: false, message: 'Invalid email format' }
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ONBOARDING.CHECK_EMAIL}`, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify({ email }),
    })

    const data = await response.json()
    return {
      available: data.available,
      message: data.message || (data.available ? 'Email is available' : 'Email is not available'),
    }
  } catch (error) {
    console.error('Error checking email availability:', error)
    return {
      available: false,
      message: 'Unable to verify email availability',
    }
  }
}

export async function checkTenantNameAvailability(
  tenantName: string
): Promise<{ available: boolean; message: string }> {
  if (!isNotEmpty(tenantName)) {
    return { available: false, message: 'Store name is required' }
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ONBOARDING.CHECK_TENANT_NAME}`, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify({ tenant_name: tenantName }),
    })

    const data = await response.json()
    return {
      available: data.available,
      message: data.message || (data.available ? 'Store name is available' : 'Store name is already registered'),
    }
  } catch (error) {
    console.error('Error checking tenant name availability:', error)
    return {
      available: false,
      message: 'Unable to verify store name availability',
    }
  }
}

export function getPasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong'
  message: string
  isValid: boolean
} {
  if (password.length === 0) {
    return { strength: 'weak', message: 'Password is required', isValid: false }
  }

  if (password.length < 8) {
    return { strength: 'weak', message: 'Password must be at least 8 characters', isValid: false }
  }

  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const score = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length

  if (score >= 3 && password.length >= 12) {
    return { strength: 'strong', message: 'Strong password', isValid: true }
  }

  if (score >= 2 && password.length >= 8) {
    return { strength: 'medium', message: 'Medium strength password', isValid: true }
  }

  return { strength: 'weak', message: 'Password is too weak', isValid: true }
}

export interface CreateAccountFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
  agreeToMarketing?: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateCreateAccountForm(data: CreateAccountFormData): ValidationResult {
  const errors: Record<string, string> = {}

  if (!isNotEmpty(data.firstName)) {
    errors.firstName = 'First name is required'
  }

  if (!isNotEmpty(data.lastName)) {
    errors.lastName = 'Last name is required'
  }

  if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!isValidPassword(data.password)) {
    errors.password = 'Password must be at least 8 characters'
  }

  if (!doPasswordsMatch(data.password, data.confirmPassword)) {
    errors.confirmPassword = 'Passwords do not match'
  }

  if (!data.agreeToTerms) {
    errors.agreeToTerms = 'You must agree to the terms and conditions'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export interface CompanyDetailsFormData {
  storeName: string
  street: string
  brgy: string
  city: string
  province: string
  country: string
  zipcode: string
  contactEmail: string
  contactPhone: string
}

export function isValidPostalCode(postalCode: string): boolean {
  if (!postalCode) return false
  const postalRegex = /^[a-zA-Z0-9\s-]{3,10}$/
  return postalRegex.test(postalCode)
}

export function validateCompanyDetailsForm(data: CompanyDetailsFormData): ValidationResult {
  const errors: Record<string, string> = {}

  if (!isNotEmpty(data.storeName)) {
    errors.storeName = 'Store name is required'
  }

  if (!isNotEmpty(data.street)) {
    errors.street = 'Street is required'
  }

  if (!isNotEmpty(data.brgy)) {
    errors.brgy = 'Barangay is required'
  }

  if (!isNotEmpty(data.city)) {
    errors.city = 'City is required'
  }

  if (!isNotEmpty(data.province)) {
    errors.province = 'Province is required'
  }

  if (!isNotEmpty(data.country)) {
    errors.country = 'Country is required'
  }

  if (!isValidPostalCode(data.zipcode)) {
    errors.zipcode = 'Valid zipcode is required'
  }

  if (!isValidEmail(data.contactEmail)) {
    errors.contactEmail = 'Please enter a valid email address'
  }

  if (!isValidPhone(data.contactPhone)) {
    errors.contactPhone = 'Please enter a valid phone number'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}