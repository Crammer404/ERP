export const DEFAULT_BRANDING_DATA = {
  primaryColor: '#3B82F6',
  logo: null,
  receiptHeaderMessage: 'Sale Complete',
  receiptFooterMessage: 'Thank you for your purchase!'
}

export const PRESET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' }
]

export const SAMPLE_RECEIPT_DATA = {
  // Store Information
  storeName: 'MAMA\'S KITCHEN',
  address: 'Legazpi City',
  vatTin: '000-000-000-0000',
  
  // Transaction Details
  transactionType: 'CASH SALES',
  posTerminal: 'POS 001',
  customerType: 'WALK-IN',
  customerName: 'Juan Dela Cruz',
  
  // Items
  items: [
    {
      name: 'Chicken Adobo',
      quantity: 1,
      price: 120.00,
      total: 120.00,
      vat: true
    },
    {
      name: 'Rice',
      quantity: 2,
      price: 15.00,
      total: 30.00,
      vat: true
    },
    {
      name: 'Coke 500ml',
      quantity: 1,
      price: 25.00,
      total: 25.00,
      vat: true
    },
    {
      name: 'Leche Flan',
      quantity: 1,
      price: 45.00,
      total: 45.00,
      vat: true
    }
  ],
  
  // Totals
  subtotal: 220.00,
  vatAmount: 26.40,
  discount: 20.00,
  total: 226.40,
  paymentReceived: 250.00,
  change: 23.60,
  
  // Transaction Info
  transactionNumber: '0000001',
  date: '12/15/2024',
  time: '14:30:15',
  
  // Messages
  headerMessage: 'Order Complete',
  footerMessages: [
    'Thank you for your purchase!'
  ],
  
  // Styling
  primaryColor: '#3B82F6',
  showLogo: true
}
