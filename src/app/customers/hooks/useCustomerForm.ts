import { useState, useCallback, useEffect } from 'react';
import { Customer } from '../services/customerService';
import { AddressData } from '@/services/address/psgc.service';
import psgcService from '@/services/address/psgc.service';
import { API_ENDPOINTS } from '@/config/api.config';
import { api } from '@/services/api';
import { tenantContextService } from '@/services/tenant/tenantContextService';

export interface Branch {
  id: number;
  name: string;
  email: string;
  contact_no: string;
}

export interface CustomerFormData {
  first_name: string;
  last_name: string;
  email: string;
  fb_name: string;
  phone_number: string;
  tin: string;
  branch_id: string;
  address: AddressData;
}

export interface FormErrors {
  [key: string]: string;
}

const initialFormData: CustomerFormData = {
  first_name: '',
  last_name: '',
  email: '',
  fb_name: '',
  phone_number: '',
  tin: '',
  branch_id: '',
  address: {
    country: '',
    zipcode: '',
    region: null,
    province: null,
    city: null,
    barangay: null,
    blockLot: '',
    street: '',
  },
};

export const useCustomerForm = () => {
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setIsLoadingBranches(true);
    try {
      const response = await api(API_ENDPOINTS.BRANCHES.BASE);
      setBranches(response.branches || []);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
  }, []);

  const handleInputChange = useCallback((field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  }, [errors]);

  const handleAddressUpdate = useCallback((addressData: AddressData) => {
    setFormData(prev => ({
      ...prev,
      address: addressData,
    }));
    // Clear address-related errors
    const addressErrors = Object.keys(errors).filter(key => key.startsWith('address.'));
    if (addressErrors.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        addressErrors.forEach(key => delete newErrors[key]);
        return newErrors;
      });
    }
  }, [errors]);

  const populateFormForEdit = useCallback(async (customer: Customer) => {
    console.log('populateFormForEdit - customer:', customer);
    console.log('populateFormForEdit - customer address:', customer.address);
    console.log('populateFormForEdit - customer branch_id:', customer.branch?.id);

    // First, set basic form data with null address objects
    setFormData({
      first_name: customer.first_name,
      last_name: customer.last_name || '',
      email: customer.email || '',
      fb_name: customer.fb_name || '',
      phone_number: customer.phone_number || '',
      tin: customer.tin || '',
      branch_id: customer.branch?.id?.toString() || '',
      address: customer.address ? {
        country: customer.address.country || '',
        zipcode: customer.address.postal_code || '',
        region: null,
        province: null,
        city: null,
        barangay: null,
        blockLot: customer.address.block_lot || '',
        street: customer.address.street || '',
      } : {
        country: '',
        zipcode: '',
        region: null,
        province: null,
        city: null,
        barangay: null,
        blockLot: '',
        street: '',
      },
    });
    setErrors({});

    // Small delay to ensure form is updated
    await new Promise(resolve => setTimeout(resolve, 100));

    // Now search for and populate address fields from PSGC (only if address exists)
    if (customer.address) {
      try {
        let foundRegion: any = null;
        let foundProvince: any = null;
        let foundCity: any = null;
        let foundBarangay: any = null;

        // Search for region
        if (customer.address.region) {
          foundRegion = await psgcService.searchRegion(customer.address.region);
          console.log('populateFormForEdit - found region:', foundRegion);
          if (foundRegion) {
            setFormData(prev => ({
              ...prev,
              address: {
                ...prev.address,
                region: foundRegion
              }
            }));
          }
        }

        // Search for province
        if (customer.address.province) {
          foundProvince = await psgcService.searchProvince(customer.address.province, foundRegion?.name);
          console.log('populateFormForEdit - found province:', foundProvince);
          if (foundProvince) {
            setFormData(prev => ({
              ...prev,
              address: {
                ...prev.address,
                province: foundProvince
              }
            }));
          }
        }

        // Search for city
        if (customer.address.city) {
          foundCity = await psgcService.searchCityMunicipality(customer.address.city, foundProvince?.name);
          console.log('populateFormForEdit - found city:', foundCity);
          if (foundCity) {
            setFormData(prev => ({
              ...prev,
              address: {
                ...prev.address,
                city: foundCity
              }
            }));
          }
        }

        // Search for barangay
        if (customer.address.barangay) {
          foundBarangay = await psgcService.searchBarangay(customer.address.barangay, foundCity?.name);
          console.log('populateFormForEdit - found barangay:', foundBarangay);
          if (foundBarangay) {
            setFormData(prev => ({
              ...prev,
              address: {
                ...prev.address,
                barangay: foundBarangay
              }
            }));
          }
        }

      } catch (error) {
        console.error('Error populating address fields:', error);
      }
    }
  }, []);

  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    // Validate email format if provided
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Address validation - address is now completely optional
    // Note: region, province, city, barangay, and country are all optional

    return newErrors;
  }, [formData]);

  const prepareSubmitData = useCallback((isEdit = false) => {
    // Ensure phone number includes the + prefix if not already present
    let phoneNumber = formData.phone_number.trim();
    if (phoneNumber && !phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber;
    }

    // Get selected branch from context
    const selectedBranch = tenantContextService.getStoredBranchContext();

    console.log('prepareSubmitData - barangay:', formData.address.barangay?.name);

    const submitData: any = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      phone_number: phoneNumber,
      branch_id: selectedBranch?.id || parseInt(formData.branch_id), // Use selected branch or fallback to form data
    };

    // Only include address if country is provided
    if (formData.address.country.trim()) {
      submitData.address = {
        country: formData.address.country.trim(),
        postal_code: formData.address.zipcode?.trim() || undefined,
        region: formData.address.region?.name || '',
        province: formData.address.province?.name || '',
        city: formData.address.city?.name || '',
        barangay: formData.address.barangay?.name || '',
        street: formData.address.street?.trim() || undefined,
        block_lot: formData.address.blockLot?.trim() || undefined,
      };
    }

    // Only include optional fields if they have values
    if (formData.fb_name.trim()) {
      submitData.fb_name = formData.fb_name.trim();
    }
    if (formData.tin.trim()) {
      submitData.tin = formData.tin.trim();
    }

    return submitData;
  }, [formData]);

  return {
    formData,
    branches,
    isLoadingBranches,
    errors,
    setErrors,
    resetForm,
    handleInputChange,
    handleAddressUpdate,
    populateFormForEdit,
    validateForm,
    prepareSubmitData,
  };
};