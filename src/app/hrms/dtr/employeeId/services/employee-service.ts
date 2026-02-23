import { api } from '../../../../../services/api';
import { API_ENDPOINTS } from '../../../../../config/api.config';

export interface Employee {
  id: number;
  email: string;
  name: string | null;
  role: {
    id: number;
    name: string;
  } | string | null;
  branches?: Array<{
    id: number;
    name: string;
    tenant?: {
      id: number;
      name: string;
    };
  }>;
  user_info?: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    profile_pic?: string;
    address?: {
      country?: string;
      postal_code?: string;
      region?: string;
      province?: string;
      city?: string;
      block_lot?: string;
      street?: string;
    };
  };
}

export interface EmployeeQrRequest {
  id: number;
  name: string;
  email: string;
  role: string;
  branch: string;
}

export interface EmployeeQrResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  branch: string;
  qr_code: string; // SVG string
  generated_at: string;
}

class EmployeeService {
  /**
   * Fetch all employees/users with full details
   */
  async fetchAllEmployees(): Promise<Employee[]> {
    try {
      const response = await api('/management/users/all-details');
      return response.users || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  /**
   * Fetch employees with pagination
   */
  async fetchEmployees(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<{ users: Employee[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.search) queryParams.append('search', params.search);

      const url = `/management/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api(url);
      
      return {
        users: response.users || [],
        pagination: response.pagination || null,
      };
    } catch (error) {
      console.error('Error fetching employees:', error);
      return { users: [], pagination: null };
    }
  }

  /**
   * Get a specific employee by ID
   */
  async getEmployee(id: number): Promise<Employee | null> {
    try {
      const response = await api(`/management/users/${id}`);
      return response.user || null;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  }

  /**
   * Generate QR code for an employee
   */
  async generateEmployeeQr(data: EmployeeQrRequest): Promise<string> {
    try {
      const response = await api(API_ENDPOINTS.DTR.GENERATE_QR, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      console.log('QR Response:', response); // Debug log

      // If response is SVG string directly
      if (typeof response === 'string' && response.includes('<svg')) {
        return response;
      }

      // Laravel Resource might wrap in 'data'
      if (response.data && response.data.qr_code) {
        return response.data.qr_code;
      }

      // If response is wrapped in an object directly
      if (response.qr_code) {
        return response.qr_code;
      }

      throw new Error('Invalid QR code response: ' + JSON.stringify(response));
    } catch (error) {
      console.error('Error generating employee QR code:', error);
      throw error;
    }
  }

  /**
   * Format employee data for display
   */
  formatEmployeeForTable(employee: Employee) {
    const name = employee.name || 
                 (employee.user_info 
                   ? `${employee.user_info.first_name} ${employee.user_info.last_name}`.trim() 
                   : 'N/A');
    
    const role = typeof employee.role === 'string'
      ? employee.role
      : employee.role?.name || 'N/A';
    
    const branch = employee.branches && employee.branches.length > 0 
                   ? employee.branches[0].name 
                   : 'N/A';

    return {
      id: employee.id,
      user_id: employee.id,
      name,
      email: employee.email,
      role,
      branch,
      raw: employee, // Keep raw data for detailed operations
    };
  }
}

export const employeeService = new EmployeeService();

