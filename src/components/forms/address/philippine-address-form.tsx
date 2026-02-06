'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomSelect } from './custom-select';
import { Loader2 } from 'lucide-react';
import psgcService, { 
  PSGCRegion, 
  PSGCProvince, 
  PSCGCityMunicipality, 
  PSGCBarangay, 
  AddressData 
} from '@/services/address/psgc.service';
import { applyMaxLength, INPUT_LIMITS } from '@/app/onboarding/utils/input-limits';

interface PhilippineAddressFormProps {
  data: AddressData;
  onUpdate: (data: AddressData) => void;
  className?: string;
  errors?: Record<string, string>;
}

export function PhilippineAddressForm({ data, onUpdate, className = '', errors = {} }: PhilippineAddressFormProps) {
  // State for dropdown options
  const [regions, setRegions] = useState<PSGCRegion[]>([]);
  const [provinces, setProvinces] = useState<PSGCProvince[]>([]);
  const [cities, setCities] = useState<PSCGCityMunicipality[]>([]);
  const [barangays, setBarangays] = useState<PSGCBarangay[]>([]);
  
  // Reusable class for limiting dropdown height and enabling scroll
  const selectMenuClass = "max-h-64 overflow-y-auto";

  // State for loading
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  // State for error handling
  const [error, setError] = useState<string>('');
  const [limitCounters, setLimitCounters] = useState<Record<string, { counter: string, isAtLimit: boolean }>>({});

  // Track if we've already matched to prevent infinite loops
  const matchedRegionRef = useRef<string | null>(null);
  const matchedProvinceRef = useRef<string | null>(null);
  const matchedCityRef = useRef<string | null>(null);
  const matchedBarangayRef = useRef<string | null>(null);

  // Reset matching refs when data changes significantly (e.g., switching users in edit mode)
  useEffect(() => {
    // Reset refs when data changes to allow re-matching
    if (!data.region || (data.region.code && data.region.code !== data.region.name)) {
      matchedRegionRef.current = null;
    }
    if (!data.province || (data.province.code && data.province.code !== data.province.name)) {
      matchedProvinceRef.current = null;
    }
    if (!data.city || (data.city.code && data.city.code !== data.city.name)) {
      matchedCityRef.current = null;
    }
    if (!data.barangay || (data.barangay.code && data.barangay.code !== data.barangay.name)) {
      matchedBarangayRef.current = null;
    }
  }, [data.country, data.zipcode, data.street, data.blockLot]); // Reset when basic fields change (indicates new address)

  // Don't load regions on mount - only load when dropdown is opened
  // This allows edit mode to display saved data immediately without waiting for PSGC API

  // Handle data changes for edit mode - try to match when data is set from outside
  useEffect(() => {
    // Only try to match if regions are already loaded and we have temporary objects
    if (regions.length > 0 && data.region && (!data.region.code || data.region.code === data.region.name)) {
      const regionKey = data.region.name || data.region.code;
      // Only match if we haven't already matched this region
      if (matchedRegionRef.current !== regionKey) {
        const matchedRegion = regions.find(
          r => r.name === data.region?.name || r.code === data.region?.name
        );
        if (matchedRegion) {
          matchedRegionRef.current = regionKey;
          onUpdate({
            ...data,
            region: matchedRegion,
            // Clear dependent fields if region changed
            province: null,
            city: null,
            barangay: null
          });
        }
      }
    } else if (data.region && data.region.code && data.region.code !== data.region.name) {
      // Reset ref if we have a proper PSGC object
      matchedRegionRef.current = null;
    }
  }, [regions, data.region]);

  // Load provinces when region changes
  useEffect(() => {
    if (data.region) {
      // If we have a proper PSGC object (code !== name), load provinces immediately
      // This ensures dropdowns are ready when data is set in edit mode
      if (data.region.code && data.region.code !== data.region.name) {
        loadProvinces(data.region.code);
      } else {
        loadProvinces(data.region.code || data.region.name);
      }
    } else {
      setProvinces([]);
      setCities([]);
      setBarangays([]);
      // Clear dependent selections
      if (data.province || data.city || data.barangay) {
        onUpdate({
          ...data,
          province: null,
          city: null,
          barangay: null
        });
      }
    }
  }, [data.region]);

  // Handle province matching for edit mode
  useEffect(() => {
    console.log('[PhilippineAddressForm] Province matching effect:', {
      provincesCount: provinces.length,
      hasProvince: !!data.province,
      provinceName: data.province?.name,
      provinceCode: data.province?.code,
      isTemporary: data.province && (!data.province.code || data.province.code === data.province.name),
      alreadyMatched: matchedProvinceRef.current,
    });

    if (provinces.length > 0 && data.province && (!data.province.code || data.province.code === data.province.name)) {
      const provinceKey = data.province.name || data.province.code;
      // Only match if we haven't already matched this province
      if (matchedProvinceRef.current !== provinceKey) {
        // More flexible matching: case-insensitive, trim whitespace
        const provinceName = (data.province?.name || '').trim();
        const matchedProvince = provinces.find(
          p => p.name.trim().toLowerCase() === provinceName.toLowerCase() || 
               p.code === data.province?.name ||
               p.name.trim() === provinceName
        );
        
        console.log('[PhilippineAddressForm] Province matching result:', {
          searchingFor: provinceName,
          matched: !!matchedProvince,
          matchedName: matchedProvince?.name,
          matchedCode: matchedProvince?.code,
          hasCity: !!data.city,
          cityName: data.city?.name,
          hasBarangay: !!data.barangay,
          barangayName: data.barangay?.name,
        });

        if (matchedProvince) {
          matchedProvinceRef.current = provinceKey;
          // Update province but PRESERVE city and barangay from DB
          // The "Load cities when province changes" useEffect will handle loading cities
          console.log('[PhilippineAddressForm] Updating province, preserving city/barangay:', {
            city: data.city?.name,
            barangay: data.barangay?.name,
          });
          onUpdate({
            ...data,
            province: matchedProvince,
            // DON'T clear city and barangay - preserve DB data for matching
            // city: null,
            // barangay: null
          });
        }
      }
    } else if (data.province && data.province.code && data.province.code !== data.province.name) {
      // Reset ref if we have a proper PSGC object
      matchedProvinceRef.current = null;
      // Ensure cities are loaded when we have a proper province object
      if (cities.length === 0 && !loadingCities) {
        console.log('[PhilippineAddressForm] Province is proper object, ensuring cities are loaded');
        loadCities(data.province.code);
      }
    }
  }, [provinces, data.province]);

  // Load cities when province changes
  useEffect(() => {
    console.log('[PhilippineAddressForm] Load cities effect - province changed:', {
      hasProvince: !!data.province,
      provinceCode: data.province?.code,
      provinceName: data.province?.name,
      isProperObject: data.province?.code && data.province.code !== data.province.name,
      hasCity: !!data.city,
      cityName: data.city?.name,
    });

    if (data.province) {
      // If we have a proper PSGC object (code !== name), load cities immediately
      if (data.province.code && data.province.code !== data.province.name) {
        console.log('[PhilippineAddressForm] Loading cities with proper province code:', data.province.code);
        loadCities(data.province.code);
      } else if (data.province.code || data.province.name) {
        // For temporary objects, still try to load cities using the name
        // This allows city matching to happen even before province is fully matched
        const provinceIdentifier = data.province.code || data.province.name;
        console.log('[PhilippineAddressForm] Loading cities with temporary province identifier:', provinceIdentifier);
        loadCities(provinceIdentifier);
      }
    } else {
      setCities([]);
      setBarangays([]);
      // Clear dependent selections only if province is actually removed
      if (data.city || data.barangay) {
        onUpdate({
          ...data,
          city: null,
          barangay: null
        });
      }
    }
  }, [data.province]);

  // Handle city matching for edit mode
  useEffect(() => {
    console.log('[PhilippineAddressForm] City matching effect:', {
      citiesCount: cities.length,
      hasCity: !!data.city,
      cityName: data.city?.name,
      cityCode: data.city?.code,
      isTemporary: data.city && (!data.city.code || data.city.code === data.city.name),
      alreadyMatched: matchedCityRef.current,
    });

    if (cities.length > 0 && data.city && (!data.city.code || data.city.code === data.city.name)) {
      const cityKey = data.city.name || data.city.code;
      // Only match if we haven't already matched this city
      if (matchedCityRef.current !== cityKey) {
        // More flexible matching: case-insensitive, trim whitespace, handle name without type
        const cityName = (data.city?.name || '').trim();
        const matchedCity = cities.find(
          c => {
            const cName = c.name.trim();
            // Match by exact name
            if (cName.toLowerCase() === cityName.toLowerCase() || cName === cityName) {
              return true;
            }
            // Match by code
            if (c.code === cityName || c.code === data.city?.code) {
              return true;
            }
            // Match if stored name is part of city name (handles cases where type might be stored differently)
            if (cityName && cName.toLowerCase().includes(cityName.toLowerCase())) {
              return true;
            }
            return false;
          }
        );

        console.log('[PhilippineAddressForm] City matching result:', {
          searchingFor: cityName,
          matched: !!matchedCity,
          matchedName: matchedCity?.name,
          matchedCode: matchedCity?.code,
          matchedType: matchedCity?.type,
          hasBarangay: !!data.barangay,
          barangayName: data.barangay?.name,
        });

        if (matchedCity) {
          matchedCityRef.current = cityKey;
          // Update city but PRESERVE barangay from DB
          // The "Load barangays when city changes" useEffect will handle loading barangays
          console.log('[PhilippineAddressForm] Updating city, preserving barangay:', {
            barangay: data.barangay?.name,
          });
          onUpdate({
            ...data,
            city: matchedCity,
            // DON'T clear barangay - preserve DB data for matching
            // barangay: null
          });
        }
      }
    } else if (data.city && data.city.code && data.city.code !== data.city.name) {
      // Reset ref if we have a proper PSGC object
      matchedCityRef.current = null;
      // Ensure barangays are loaded when we have a proper city object
      if (barangays.length === 0 && !loadingBarangays) {
        console.log('[PhilippineAddressForm] City is proper object, ensuring barangays are loaded');
        loadBarangays(data.city.code);
      }
    }
  }, [cities, data.city]);

  // Load barangays when city changes
  useEffect(() => {
    console.log('[PhilippineAddressForm] Load barangays effect - city changed:', {
      hasCity: !!data.city,
      cityCode: data.city?.code,
      cityName: data.city?.name,
      isProperObject: data.city?.code && data.city.code !== data.city.name,
      hasBarangay: !!data.barangay,
      barangayName: data.barangay?.name,
    });

    if (data.city) {
      // If we have a proper PSGC object (code !== name), load barangays immediately
      if (data.city.code && data.city.code !== data.city.name) {
        console.log('[PhilippineAddressForm] Loading barangays with proper city code:', data.city.code);
        loadBarangays(data.city.code);
      } else if (data.city.code || data.city.name) {
        // For temporary objects, still try to load barangays using the name
        // This allows barangay matching to happen even before city is fully matched
        const cityIdentifier = data.city.code || data.city.name;
        console.log('[PhilippineAddressForm] Loading barangays with temporary city identifier:', cityIdentifier);
        loadBarangays(cityIdentifier);
      }
    } else {
      setBarangays([]);
      // Clear dependent selection only if city is actually removed
      if (data.barangay) {
        onUpdate({
          ...data,
          barangay: null
        });
      }
    }
  }, [data.city]);

  // Handle barangay matching for edit mode
  useEffect(() => {
    console.log('[PhilippineAddressForm] Barangay matching effect:', {
      barangaysCount: barangays.length,
      hasBarangay: !!data.barangay,
      barangayName: data.barangay?.name,
      barangayCode: data.barangay?.code,
      isTemporary: data.barangay && (!data.barangay.code || data.barangay.code === data.barangay.name),
      alreadyMatched: matchedBarangayRef.current,
    });

    if (barangays.length > 0 && data.barangay && (!data.barangay.code || data.barangay.code === data.barangay.name)) {
      const barangayKey = data.barangay.name || data.barangay.code;
      // Only match if we haven't already matched this barangay
      if (matchedBarangayRef.current !== barangayKey) {
        // More flexible matching: case-insensitive, trim whitespace
        const barangayName = (data.barangay?.name || '').trim();
        const matchedBarangay = barangays.find(
          b => {
            const bName = b.name.trim();
            return bName.toLowerCase() === barangayName.toLowerCase() || 
                   bName === barangayName ||
                   b.code === barangayName ||
                   b.code === data.barangay?.code;
          }
        );

        console.log('[PhilippineAddressForm] Barangay matching result:', {
          searchingFor: barangayName,
          matched: !!matchedBarangay,
          matchedName: matchedBarangay?.name,
          matchedCode: matchedBarangay?.code,
        });

        if (matchedBarangay) {
          matchedBarangayRef.current = barangayKey;
          onUpdate({
            ...data,
            barangay: matchedBarangay
          });
        }
      }
    } else if (data.barangay && data.barangay.code && data.barangay.code !== data.barangay.name) {
      // Reset ref if we have a proper PSGC object
      matchedBarangayRef.current = null;
    }
  }, [barangays, data.barangay]);

  const loadRegions = async () => {
    setLoadingRegions(true);
    setError('');
    try {
      const regionsData = await psgcService.getRegions();
      // Ensure regionsData is an array
      if (Array.isArray(regionsData)) {
        setRegions(regionsData);
        
        // Try to match stored region by name if we have a region with only name (not proper PSGC object)
        if (data.region && (!data.region.code || data.region.code === data.region.name)) {
          const matchedRegion = regionsData.find(
            r => r.name === data.region?.name || r.code === data.region?.name
          );
          if (matchedRegion) {
            onUpdate({
              ...data,
              region: matchedRegion,
              // Clear dependent fields if region changed
              province: null,
              city: null,
              barangay: null
            });
          }
        }
      } else {
        setError('Invalid data received from regions API.');
        setRegions([]);
      }
    } catch (err) {
      setError('Failed to load regions. Please try again.');
      console.error('Error loading regions:', err);
      setRegions([]);
    } finally {
      setLoadingRegions(false);
    }
  };

  const loadProvinces = async (regionCodeOrName: string) => {
    setLoadingProvinces(true);
    setError('');
    try {
      const provincesData = await psgcService.getProvincesByRegion(regionCodeOrName);
      if (Array.isArray(provincesData)) {
        setProvinces(provincesData);
        
        // Try to match stored province by name if we have a province with only name (not proper PSGC object)
        if (data.province && (!data.province.code || data.province.code === data.province.name)) {
          const provinceName = (data.province?.name || '').trim();
          const matchedProvince = provincesData.find(
            p => {
              const pName = p.name.trim();
              return pName.toLowerCase() === provinceName.toLowerCase() || 
                     pName === provinceName ||
                     p.code === provinceName ||
                     p.code === data.province?.code;
            }
          );
          if (matchedProvince) {
            // Update province - the "Load cities when province changes" useEffect will handle loading
            onUpdate({
              ...data,
              province: matchedProvince,
              // Clear dependent fields if province changed
              city: null,
              barangay: null
            });
          }
        }
      } else {
        setError('Invalid data received from provinces API.');
        setProvinces([]);
      }
    } catch (err) {
      setError('Failed to load provinces. Please try again.');
      console.error('Error loading provinces:', err);
      setProvinces([]);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadCities = async (provinceCodeOrName: string) => {
    console.log('[PhilippineAddressForm] loadCities called with:', provinceCodeOrName);
    setLoadingCities(true);
    setError('');
    try {
      const citiesData = await psgcService.getCitiesMunicipalitiesByProvince(provinceCodeOrName);
      console.log('[PhilippineAddressForm] Cities loaded:', {
        count: citiesData?.length || 0,
        sample: citiesData?.[0],
        currentCity: data.city?.name,
      });
      
      if (Array.isArray(citiesData)) {
        setCities(citiesData);
        
        // Try to match stored city by name if we have a city with only name (not proper PSGC object)
        if (data.city && (!data.city.code || data.city.code === data.city.name)) {
          const cityName = (data.city?.name || '').trim();
          const matchedCity = citiesData.find(
            c => {
              const cName = c.name.trim();
              // Match by exact name (case-insensitive)
              if (cName.toLowerCase() === cityName.toLowerCase() || cName === cityName) {
                return true;
              }
              // Match by code
              if (c.code === cityName || c.code === data.city?.code) {
                return true;
              }
              // Match if stored name is part of city name (handles cases where type might be stored differently)
              if (cityName && cName.toLowerCase().includes(cityName.toLowerCase())) {
                return true;
              }
              return false;
            }
          );
          
          console.log('[PhilippineAddressForm] City matching in loadCities:', {
            searchingFor: cityName,
            matched: !!matchedCity,
            matchedName: matchedCity?.name,
            matchedCode: matchedCity?.code,
          });
          
          if (matchedCity) {
            // Update city but PRESERVE barangay from DB
            // The "Load barangays when city changes" useEffect will handle loading barangays
            console.log('[PhilippineAddressForm] Updating city in loadCities, preserving barangay:', {
              barangay: data.barangay?.name,
            });
            onUpdate({
              ...data,
              city: matchedCity,
              // DON'T clear barangay - preserve DB data for matching
              // barangay: null
            });
          }
        }
      } else {
        setError('Invalid data received from cities API.');
        setCities([]);
      }
    } catch (err) {
      setError('Failed to load cities/municipalities. Please try again.');
      console.error('[PhilippineAddressForm] Error loading cities:', err);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadBarangays = async (cityMunicipalityCodeOrName: string) => {
    console.log('[PhilippineAddressForm] loadBarangays called with:', cityMunicipalityCodeOrName);
    setLoadingBarangays(true);
    setError('');
    try {
      const barangaysData = await psgcService.getBarangaysByCityMunicipality(cityMunicipalityCodeOrName);
      console.log('[PhilippineAddressForm] Barangays loaded:', {
        count: barangaysData?.length || 0,
        sample: barangaysData?.[0],
        currentBarangay: data.barangay?.name,
      });
      
      if (Array.isArray(barangaysData)) {
        setBarangays(barangaysData);
        
        // Try to match stored barangay by name if we have a barangay with only name (not proper PSGC object)
        if (data.barangay && (!data.barangay.code || data.barangay.code === data.barangay.name)) {
          const barangayName = (data.barangay?.name || '').trim();
          const matchedBarangay = barangaysData.find(
            b => {
              const bName = b.name.trim();
              return bName.toLowerCase() === barangayName.toLowerCase() || 
                     bName === barangayName ||
                     b.code === barangayName ||
                     b.code === data.barangay?.code;
            }
          );
          
          console.log('[PhilippineAddressForm] Barangay matching in loadBarangays:', {
            searchingFor: barangayName,
            matched: !!matchedBarangay,
            matchedName: matchedBarangay?.name,
            matchedCode: matchedBarangay?.code,
          });
          
          if (matchedBarangay) {
            onUpdate({
              ...data,
              barangay: matchedBarangay
            });
          }
        }
      } else {
        setError('Invalid data received from barangays API.');
        setBarangays([]);
      }
    } catch (err) {
      setError('Failed to load barangays. Please try again.');
      console.error('[PhilippineAddressForm] Error loading barangays:', err);
      setBarangays([]);
    } finally {
      setLoadingBarangays(false);
    }
  };

  const handleRegionChange = (value: string) => {
    const selectedRegion = regions.find(region => region.code === value);
    onUpdate({
      ...data,
      region: selectedRegion || null,
      province: null,
      city: null,
      barangay: null
    });
  };

  const handleProvinceChange = (value: string) => {
    const selectedProvince = provinces.find(province => province.code === value);
    onUpdate({
      ...data,
      province: selectedProvince || null,
      city: null,
      barangay: null
    });
  };

  const handleCityChange = (value: string) => {
    const selectedCity = cities.find(city => city.code === value);
    onUpdate({
      ...data,
      city: selectedCity || null,
      barangay: null
    });
  };

  const handleBarangayChange = (value: string) => {
    const selectedBarangay = barangays.find(barangay => barangay.code === value);
    onUpdate({
      ...data,
      barangay: selectedBarangay || null
    });
  };

  const handleBlockLotChange = (value: string) => {
    const { value: limited, counter, isAtLimit } = applyMaxLength(value || '', INPUT_LIMITS.blockLot);
    setLimitCounters(prev => ({ ...prev, blockLot: { counter, isAtLimit } }));
    onUpdate({
      ...data,
      blockLot: limited
    });
  };

  const handleStreetChange = (value: string) => {
    const { value: limited, counter, isAtLimit } = applyMaxLength(value || '', INPUT_LIMITS.street);
    setLimitCounters(prev => ({ ...prev, street: { counter, isAtLimit } }));
    onUpdate({
      ...data,
      street: limited
    });
  };

  const handleCountryChange = (value: string) => {
    const { value: limited, counter, isAtLimit } = applyMaxLength(value || '', INPUT_LIMITS.country);
    setLimitCounters(prev => ({ ...prev, country: { counter, isAtLimit } }));
    onUpdate({
      ...data,
      country: limited
    });
  };

  const handleZipcodeChange = (value: string) => {
    const { value: limited, counter, isAtLimit } = applyMaxLength(value || '', INPUT_LIMITS.zipcode);
    setLimitCounters(prev => ({ ...prev, zipcode: { counter, isAtLimit } }));
    onUpdate({
      ...data,
      zipcode: limited
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Country and Zipcode - Two Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            id="country"
            type="text"
            placeholder="Country *"
            value={data.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="flex justify-between items-center mt-1">
            <div className="flex-1">
              {errors['address.country'] && (
                <p className="text-xs text-red-600">{errors['address.country']}</p>
              )}
            </div>
            {limitCounters.country?.isAtLimit && (
              <p className="text-xs text-red-600">{limitCounters.country.counter}</p>
            )}
          </div>
        </div>
        <div>
          <Input
            id="zipcode"
            type="text"
            placeholder="Zipcode *"
            value={data.zipcode}
            onChange={(e) => handleZipcodeChange(e.target.value)}
            className="h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="flex justify-between items-center mt-1">
            <div className="flex-1">
              {(errors['address.zipcode'] || errors['address.postal_code']) && (
                <p className="text-xs text-red-600">{errors['address.zipcode'] || errors['address.postal_code']}</p>
              )}
            </div>
            {limitCounters.zipcode?.isAtLimit && (
              <p className="text-xs text-red-600">{limitCounters.zipcode.counter}</p>
            )}
          </div>
        </div>
      </div>

      {/* Region and Province - Two Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Region */}
        <div>
          <CustomSelect
            value={data.region?.code || ''}
            onValueChange={handleRegionChange}
            options={regions}
            placeholder={loadingRegions ? "Loading regions..." : "Select Region*"}
            loading={loadingRegions}
            displayValue={data.region?.name}
            className="h-9 text-sm"
            selectMenuClass={selectMenuClass}
            onOpenChange={(isOpen) => {
              // Load regions when dropdown opens for the first time
              if (isOpen && regions.length === 0 && !loadingRegions) {
                loadRegions();
              }
            }}
          />
          {errors['address.region'] && (
            <p className="text-xs mt-1 text-red-600">{errors['address.region']}</p>
          )}
        </div>

        {/* Province */}
        <div>
          <CustomSelect
            value={data.province?.code || ''}
            onValueChange={handleProvinceChange}
            options={provinces}
            placeholder={
              !data.region
                ? "Select Region first"
                : loadingProvinces
                ? "Loading provinces..."
                : "Select Province*"
            }
            disabled={!data.region || loadingProvinces}
            loading={loadingProvinces}
            displayValue={data.province?.name}
            className="h-9 text-sm"
            selectMenuClass={selectMenuClass}
            onOpenChange={(isOpen) => {
              // Load provinces when dropdown opens and region is selected
              if (isOpen && data.region && provinces.length === 0 && !loadingProvinces) {
                loadProvinces(data.region.code || data.region.name);
              }
            }}
          />
          {errors['address.province'] && (
            <p className="text-xs mt-1 text-red-600">{errors['address.province']}</p>
          )}
        </div>
      </div>

      {/* City/Municipality and Barangay - Two Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* City/Municipality */}
        <div>
          <CustomSelect
            value={data.city?.code || ''}
            onValueChange={handleCityChange}
            options={cities.map(city => ({ code: city.code, name: `${city.name} (${city.type})` }))}
            placeholder={
              !data.province
                ? "Select Province first"
                : loadingCities
                ? "Loading cities..."
                : "Select City/Municipality*"
            }
            disabled={!data.province || loadingCities}
            loading={loadingCities}
            displayValue={data.city ? `${data.city.name}${data.city.type ? ` (${data.city.type})` : ''}` : undefined}
            className="h-9 text-sm"
            selectMenuClass={selectMenuClass}
            onOpenChange={(isOpen) => {
              // Load cities when dropdown opens and province is selected
              if (isOpen && data.province && cities.length === 0 && !loadingCities) {
                loadCities(data.province.code || data.province.name);
              }
            }}
          />
          {errors['address.city'] && (
            <p className="text-xs mt-1 text-red-600">{errors['address.city']}</p>
          )}
        </div>

        {/* Barangay */}
        <div>
          <CustomSelect
            value={data.barangay?.code || ''}
            onValueChange={handleBarangayChange}
            options={barangays}
            placeholder={
              !data.city
                ? "Select City/Municipality first"
                : loadingBarangays
                ? "Loading barangays..."
                : "Select Barangay*"
            }
            disabled={!data.city || loadingBarangays}
            loading={loadingBarangays}
            displayValue={data.barangay?.name}
            className="h-9 text-sm"
            selectMenuClass={selectMenuClass}
            onOpenChange={(isOpen) => {
              // Load barangays when dropdown opens and city is selected
              if (isOpen && data.city && barangays.length === 0 && !loadingBarangays) {
                loadBarangays(data.city.code || data.city.name);
              }
            }}
          />
          {errors['address.barangay'] && (
            <p className="text-xs mt-1 text-red-600">{errors['address.barangay']}</p>
          )}
        </div>
      </div>

      {/* Block/Lot and Street Address - Two Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            id="blockLot"
            type="text"
            placeholder="Block/Lot no."
            value={data.blockLot}
            onChange={(e) => handleBlockLotChange(e.target.value)}
            className="h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
          {limitCounters.blockLot?.isAtLimit && (
            <p className="text-xs mt-1 text-right text-red-600">{limitCounters.blockLot.counter}</p>
          )}
        </div>
        <div>
          <Input
            id="street"
            type="text"
            placeholder="Street"
            value={data.street}
            onChange={(e) => handleStreetChange(e.target.value)}
            className="h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="flex justify-between items-center mt-1">
            <div className="flex-1">
              {errors['address.street'] && (
                <p className="text-xs text-red-600">{errors['address.street']}</p>
              )}
            </div>
            {limitCounters.street?.isAtLimit && (
              <p className="text-xs text-red-600">{limitCounters.street.counter}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhilippineAddressForm;
