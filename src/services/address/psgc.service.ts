/**
 * PSGC API Service
 * Handles all interactions with the Philippine Standard Geographic Code API
 * Documentation: https://psgc.cloud/api/v2
 */

const PSGC_BASE_URL = 'https://psgc.cloud/api/v2';

// Types for PSGC API responses
export interface PSGCRegion {
  code: string;
  name: string;
}

export interface PSGCProvince {
  code: string;
  name: string;
  region: string;
}

export interface PSCGCityMunicipality {
  code: string;
  name: string;
  type: string;
  region: string;
  province: string;
}

export interface PSGCBarangay {
  code: string;
  name: string;
  status: string;
  region: string;
  province: string;
  city_municipality: string;
}

export interface AddressData {
  blockLot: string;
  street: string;
  barangay: PSGCBarangay | null;
  city: PSCGCityMunicipality | null;
  province: PSGCProvince | null;
  region: PSGCRegion | null;
  country: string;
  zipcode: string;
}

class PSGCService {
  private cache = new Map<string, any>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fix double-encoded UTF-8 strings (e.g., "Ã±" -> "ñ")
   * This handles cases where UTF-8 bytes are incorrectly interpreted as Latin-1
   */
  private fixEncoding(text: string): string {
    try {
      // Check if the string contains common double-encoding patterns
      if (text.includes('Ã±') || text.includes('Ã¡') || text.includes('Ã©') || 
          text.includes('Ã­') || text.includes('Ã³') || text.includes('Ãº')) {
        // Convert string to Latin-1 bytes, then decode as UTF-8
        const latin1Bytes = new Uint8Array(
          text.split('').map(char => char.charCodeAt(0))
        );
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(latin1Bytes);
      }
      return text;
    } catch (error) {
      console.warn('Error fixing encoding:', error);
      return text;
    }
  }

  /**
   * Recursively fix encoding in objects and arrays
   */
  private fixEncodingInData(data: any): any {
    if (typeof data === 'string') {
      return this.fixEncoding(data);
    } else if (Array.isArray(data)) {
      return data.map(item => this.fixEncodingInData(item));
    } else if (data !== null && typeof data === 'object') {
      const fixed: any = {};
      for (const key in data) {
        fixed[key] = this.fixEncodingInData(data[key]);
      }
      return fixed;
    }
    return data;
  }

  private async fetchWithCache<T>(url: string): Promise<T> {
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json; charset=utf-8',
          'Content-Type': 'application/json; charset=utf-8',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Explicitly handle UTF-8 decoding to prevent character encoding issues
      const arrayBuffer = await response.arrayBuffer();
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(arrayBuffer);
      const responseData = JSON.parse(text);
      
      // PSGC API returns { data: [...] } format, so we need to extract the data property
      let data: any;
      if (responseData && typeof responseData === 'object' && Array.isArray(responseData.data)) {
        data = responseData.data;
      } else if (Array.isArray(responseData)) {
        data = responseData;
      } else {
        throw new Error('Invalid response format: expected array or object with data property');
      }
      
      // Fix any encoding issues in the data
      data = this.fixEncodingInData(data);
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data as T;
    } catch (error) {
      console.error(`Error fetching from PSGC API: ${url}`, error);
      throw error;
    }
  }

  /**
   * Get all regions
   */
  async getRegions(): Promise<PSGCRegion[]> {
    return this.fetchWithCache<PSGCRegion[]>(`${PSGC_BASE_URL}/regions`);
  }

  /**
   * Get provinces by region
   */
  async getProvincesByRegion(regionCodeOrName: string): Promise<PSGCProvince[]> {
    return this.fetchWithCache<PSGCProvince[]>(`${PSGC_BASE_URL}/regions/${encodeURIComponent(regionCodeOrName)}/provinces`);
  }

  /**
   * Get cities and municipalities by province
   */
  async getCitiesMunicipalitiesByProvince(provinceCodeOrName: string): Promise<PSCGCityMunicipality[]> {
    return this.fetchWithCache<PSCGCityMunicipality[]>(`${PSGC_BASE_URL}/provinces/${encodeURIComponent(provinceCodeOrName)}/cities-municipalities`);
  }

  /**
   * Get barangays by city/municipality
   */
  async getBarangaysByCityMunicipality(cityMunicipalityCodeOrName: string): Promise<PSGCBarangay[]> {
    return this.fetchWithCache<PSGCBarangay[]>(`${PSGC_BASE_URL}/cities-municipalities/${encodeURIComponent(cityMunicipalityCodeOrName)}/barangays`);
  }

  /**
   * Get all provinces (without region filter)
   */
  async getAllProvinces(): Promise<PSGCProvince[]> {
    return this.fetchWithCache<PSGCProvince[]>(`${PSGC_BASE_URL}/provinces`);
  }

  /**
   * Get all cities and municipalities (without province filter)
   */
  async getAllCitiesMunicipalities(): Promise<PSCGCityMunicipality[]> {
    return this.fetchWithCache<PSCGCityMunicipality[]>(`${PSGC_BASE_URL}/cities-municipalities`);
  }

  /**
   * Get all barangays (without city/municipality filter)
   */
  async getAllBarangays(): Promise<PSGCBarangay[]> {
    return this.fetchWithCache<PSGCBarangay[]>(`${PSGC_BASE_URL}/barangays`);
  }

  /**
   * Search for a specific region by name or code
   */
  async searchRegion(query: string): Promise<PSGCRegion | null> {
    const regions = await this.getRegions();
    const normalizedQuery = query.toLowerCase().trim();
    
    return regions.find(region => 
      region.name.toLowerCase().includes(normalizedQuery) ||
      region.code.toLowerCase().includes(normalizedQuery)
    ) || null;
  }

  /**
   * Search for a specific province by name or code
   */
  async searchProvince(query: string, regionName?: string): Promise<PSGCProvince | null> {
    let provinces: PSGCProvince[];
    
    if (regionName) {
      provinces = await this.getProvincesByRegion(regionName);
    } else {
      provinces = await this.getAllProvinces();
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return provinces.find(province => 
      province.name.toLowerCase().includes(normalizedQuery) ||
      province.code.toLowerCase().includes(normalizedQuery)
    ) || null;
  }

  /**
   * Search for a specific city/municipality by name or code
   */
  async searchCityMunicipality(query: string, provinceName?: string): Promise<PSCGCityMunicipality | null> {
    let cities: PSCGCityMunicipality[];
    
    if (provinceName) {
      cities = await this.getCitiesMunicipalitiesByProvince(provinceName);
    } else {
      cities = await this.getAllCitiesMunicipalities();
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return cities.find(city => 
      city.name.toLowerCase().includes(normalizedQuery) ||
      city.code.toLowerCase().includes(normalizedQuery)
    ) || null;
  }

  /**
   * Search for a specific barangay by name or code
   */
  async searchBarangay(query: string, cityMunicipalityName?: string): Promise<PSGCBarangay | null> {
    let barangays: PSGCBarangay[];
    
    if (cityMunicipalityName) {
      barangays = await this.getBarangaysByCityMunicipality(cityMunicipalityName);
    } else {
      barangays = await this.getAllBarangays();
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return barangays.find(barangay => 
      barangay.name.toLowerCase().includes(normalizedQuery) ||
      barangay.code.toLowerCase().includes(normalizedQuery)
    ) || null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const psgcService = new PSGCService();
export default psgcService;
