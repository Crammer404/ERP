export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  message: string;
  phone?: string;
}

export interface NewsletterData {
  email: string;
  source?: string;
}

export interface DemoRequestData {
  name: string;
  email: string;
  company: string;
  phone?: string;
  message?: string;
  preferredDate?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ContactResponse extends ApiResponse {
  data?: {
    id: string;
    submittedAt: string;
  };
}

export interface NewsletterResponse extends ApiResponse {
  data?: {
    id: string;
    subscribedAt: string;
  };
}

export interface DemoRequestResponse extends ApiResponse {
  data?: {
    id: string;
    requestedAt: string;
  };
}
