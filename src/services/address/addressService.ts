export interface Address {
  id?: number;
  country: string;
  postal_code: string;
  region: string;
  province: string;
  city: string;
  street: string;
  zipcode?: string;
  barangay?: string;
  block_lot?: string;
}

export interface AddressFormData {
  country: string;
  postal_code: string;
  region: string;
  province: string;
  city: string;
  street: string;
  zipcode?: string;
  barangay?: string;
  block_lot?: string;
}

export const addressService = {
  getDefaultAddress(): AddressFormData {
    return {
      country: 'Philippines',
      postal_code: '',
      region: '',
      province: '',
      city: '',
      street: '',
      zipcode: '',
      barangay: '',
      block_lot: ''
    };
  },

  getAddressFields() {
    return [
      { field: 'postal_code', placeholder: 'Enter postal code (e.g., 1234)' },
      { field: 'region', placeholder: 'Enter region (e.g., NCR, Region 7)' },
      { field: 'province', placeholder: 'Enter province (e.g., Metro Manila, Cebu)' },
      { field: 'city', placeholder: 'Enter city (e.g., Manila, Cebu City)' },
      { field: 'street', placeholder: 'Enter street address' }
    ];
  },

  formatAddressLabel(field: string): string {
    return field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  },

  validateAddress(address: AddressFormData): Record<string, string> {
    const errors: Record<string, string> = {};
    
    // Only validate required fields: postal_code, region, province, city
    // street and block_lot are optional
    const addressFields = ['postal_code', 'region', 'province', 'city'] as const;
    addressFields.forEach(field => {
      const value = address[field];
      if (!value || !value.trim()) {
        errors[field] = `${this.formatAddressLabel(field)} is required`;
      }
    });

    return errors;
  },

  createAddressFormData(data?: Partial<Address> | null): AddressFormData {
    return {
      country: data?.country || 'Philippines',
      postal_code: data?.postal_code || '',
      region: data?.region || '',
      province: data?.province || '',
      city: data?.city || '',
      street: data?.street || '',
      zipcode: data?.zipcode || data?.postal_code || '', // Use postal_code as fallback
      barangay: data?.barangay || '',
      block_lot: data?.block_lot || ''
    };
  }
};
