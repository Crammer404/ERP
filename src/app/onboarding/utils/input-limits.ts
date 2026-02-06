export const INPUT_LIMITS = {
  firstName: 50,
  lastName: 50,
  email: 254,
  contactEmail: 254,
  businessEmail: 254,
  password: 128,
  confirmPassword: 128,
  storeName: 100,
  businessName: 100,
  blockLot: 50,
  street: 100,
  zipcode: 10,
  country: 100,
  phone: 20,
  receiptHeaderMessage: 32,
  receiptFooterMessage: 48,
  fullName: 100,
  cardNumber: 19,
  expDate: 5,
  cvv: 4,
} as const

export type InputLimitKey = keyof typeof INPUT_LIMITS

export function applyMaxLength(value: string, max: number) {
  const truncatedValue = (value || '').slice(0, max)
  const currentLength = truncatedValue.length
  const isAtLimit = currentLength >= max
  const counter = `${currentLength}/${max}`
  return { value: truncatedValue, isAtLimit, counter }
}


