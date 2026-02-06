'use client';

import { useState, useEffect } from 'react';
import { Supplier } from '../services/supplierService';
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

export interface SupplierFormData {
  name: string;
  email: string;
  phone_number: string;
  description: string;
  supplier_category_id: string;
  branch_id: string;
  address: AddressData;
}

export function useSupplierForm() {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    email: '',
    phone_number: '',
    description: '',
    supplier_category_id: '',
    branch_id: '',
    address: {
      country: 'Philippines',
      zipcode: '',
      region: null,
      province: null,
      city: null,
      barangay: null,
      blockLot: '',
      street: '',
    },
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      description: '',
      supplier_category_id: '',
      branch_id: '',
      address: {
        country: 'Philippines',
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
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddressUpdate = (addressData: AddressData) => {
    setFormData(prev => ({
      ...prev,
      address: addressData
    }));

    // Clear address-related errors
    const addressErrors = Object.keys(errors).filter(key => key.startsWith('address.'));
    if (addressErrors.length > 0) {
      const newErrors = { ...errors };
      addressErrors.forEach(key => delete newErrors[key]);
      setErrors(newErrors);
    }
  };

  const populateFormForEdit = async (supplier: Supplier) => {
    console.log('populateFormForEdit - supplier:', supplier);
    console.log('populateFormForEdit - supplier address:', supplier.address);
    console.log('populateFormForEdit - supplier branch_id:', supplier.branch?.id);

    // First, set basic form data with null address objects
    setFormData({
      name: supplier.name,
      email: supplier.email,
      phone_number: supplier.phone_number,
      description: supplier.description || '',
      supplier_category_id: supplier.supplier_category?.id?.toString() || '',
      branch_id: supplier.branch?.id?.toString() || '',
      address: {
        country: supplier.address.country,
        zipcode: supplier.address.postal_code || '',
        region: null,
        province: null,
        city: null,
        barangay: null,
        blockLot: supplier.address.block_lot || '',
        street: supplier.address.street || '',
      },
    });
    setErrors({});

    // Small delay to ensure form is updated
    await new Promise(resolve => setTimeout(resolve, 100));

    // Now search for and populate address fields from PSGC
    try {
      let foundRegion: any = null;
      let foundProvince: any = null;
      let foundCity: any = null;
      let foundBarangay: any = null;

      // Search for region
      if (supplier.address.region) {
        foundRegion = await psgcService.searchRegion(supplier.address.region);
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
      if (supplier.address.province) {
        foundProvince = await psgcService.searchProvince(supplier.address.province, foundRegion?.name);
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
      if (supplier.address.city) {
        foundCity = await psgcService.searchCityMunicipality(supplier.address.city, foundProvince?.name);
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
      if (supplier.address.barangay) {
        foundBarangay = await psgcService.searchBarangay(supplier.address.barangay, foundCity?.name);
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
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.phone_number.trim()) newErrors.phone_number = "Phone number is required";

    // Address validation - PSGC format (matching backend requirements)
    if (!formData.address.country.trim()) newErrors['address.country'] = "Country is required";
    if (!formData.address.region) newErrors['address.region'] = "Region is required";
    if (!formData.address.province) newErrors['address.province'] = "Province is required";
    if (!formData.address.city) newErrors['address.city'] = "City is required";
    if (!formData.address.barangay) newErrors['address.barangay'] = "Barangay is required";
    // Note: postal_code is nullable in backend, so we won't require zipcode

    return newErrors;
  };

  const prepareSubmitData = (isEdit = false) => {
    // Ensure phone number includes the + prefix if not already present
    let phoneNumber = formData.phone_number.trim();
    if (phoneNumber && !phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber;
    }

    // Get selected branch from context
    const selectedBranch = tenantContextService.getStoredBranchContext();

    const submitData: any = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone_number: phoneNumber,
      branch_id: selectedBranch?.id || (formData.branch_id ? parseInt(formData.branch_id) : undefined), // Use selected branch or fallback to form data
      address: {
        country: formData.address.country.trim(),
        postal_code: formData.address.zipcode?.trim() || null,
        region: formData.address.region?.name || '',
        province: formData.address.province?.name || '',
        city: formData.address.city?.name || '',
        barangay: formData.address.barangay?.name || '',
        street: formData.address.street?.trim() || null,
        block_lot: formData.address.blockLot?.trim() || null,
      },
    };

    // Only include description if it has content
    if (formData.description?.trim()) {
      submitData.description = formData.description.trim();
    }

    // Only include supplier_category_id if it has a value
    if (formData.supplier_category_id) {
      submitData.supplier_category_id = parseInt(formData.supplier_category_id);
    }

    console.log('prepareSubmitData - submit data:', submitData);
    return submitData;
  };

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
    prepareSubmitData
  };
}