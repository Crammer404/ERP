// src/services/activityLogService.ts
import { api } from "../../../../services/api";
import { API_ENDPOINTS } from "../../../../config/api.config";

export interface ActivityLog {
  module: string;
  activity: string;
  item_name: string;
  branch: string;
  created_by: string;
  created_at: string;
}

export interface ActivityLogsResponse {
  message: string;
  data: {
    current_page: number;
    data: ActivityLog[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      page: number | null;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
  };
}

// Fetch activity logs with pagination and search
export async function fetchActivityLogs(page: number = 1, perPage: number = 15, search: string = '') {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    if (search) {
      params.append('search', search);
    }

    const response = await api(`${API_ENDPOINTS.ACTIVITY_LOGS.ALL}?${params.toString()}`);
    return response; // { message, data: { current_page, data: [], ... } }
  } catch (error: any) {
    console.error("Failed to fetch activity logs:", error);
    throw error.response?.data || error;
  }
}

export const activityLogService = {
  fetchActivityLogs,
};