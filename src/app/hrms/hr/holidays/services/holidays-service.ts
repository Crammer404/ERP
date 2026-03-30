import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api.config';

export interface PayrollHolidayItem {
  id: number;
  holiday_date: string;
  holiday_name: string;
  holiday_type: 'regular' | 'special_non_working' | null;
  source: 'api' | 'manual';
  is_active: boolean;
}

export interface HolidayPreviewItem {
  holiday_date: string;
  holiday_name: string;
  holiday_type: 'regular' | 'special_non_working' | null;
  source: 'api' | 'manual';
  is_active: boolean;
}

export const holidaysService = {
  async list(year: number): Promise<{ year: number; holidays: PayrollHolidayItem[] }> {
    const endpoint = `${API_ENDPOINTS.HR.HOLIDAYS_LIST}?year=${year}`;
    return await api(endpoint);
  },

  async sync(year: number): Promise<{ message: string; year: number; total: number; holidays: HolidayPreviewItem[] }> {
    const endpoint = `${API_ENDPOINTS.HR.HOLIDAYS_SYNC}?year=${year}`;
    return await api(endpoint, {
      method: 'POST',
    });
  },

  async updateDb(
    year: number,
    holidays: Array<Pick<HolidayPreviewItem, 'holiday_date' | 'holiday_name' | 'holiday_type'>>
  ): Promise<{ message: string; year: number; deleted: number; seeded: number; total: number }> {
    const endpoint = `${API_ENDPOINTS.HR.HOLIDAYS_UPDATE_DB}?year=${year}`;
    return await api(endpoint, {
      method: 'POST',
      body: JSON.stringify({ holidays }),
    });
  },

  async create(payload: {
    holiday_date: string;
    holiday_name: string;
    holiday_type: 'regular' | 'special_non_working';
    is_active?: boolean;
  }): Promise<PayrollHolidayItem> {
    return await api(API_ENDPOINTS.HR.HOLIDAYS_CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id: number, payload: Partial<{
    holiday_date: string;
    holiday_name: string;
    holiday_type: 'regular' | 'special_non_working' | null;
    is_active: boolean;
  }>): Promise<PayrollHolidayItem> {
    const endpoint = API_ENDPOINTS.HR.HOLIDAYS_UPDATE.replace('{id}', String(id));
    return await api(endpoint, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async delete(id: number): Promise<{ success: boolean }> {
    const endpoint = API_ENDPOINTS.HR.HOLIDAYS_DELETE.replace('{id}', String(id));
    return await api(endpoint, {
      method: 'DELETE',
    });
  },
};

