import { API_ENDPOINTS, API_CONFIG } from '../config/api.config';
import { ContactFormData, NewsletterData, DemoRequestData } from '../types/api.types';

class WebsiteApi {
  private baseUrl = API_CONFIG.BASE_URL;
  
  async contact(data: ContactFormData) {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CONTACT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit contact form');
    }
    
    return response.json();
  }
  
  async newsletter(data: NewsletterData) {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.NEWSLETTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to subscribe to newsletter');
    }
    
    return response.json();
  }
  
  async demoRequest(data: DemoRequestData) {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.DEMO_REQUEST}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit demo request');
    }
    
    return response.json();
  }
  
  async analytics(event: string, data?: Record<string, any>) {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.ANALYTICS}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data })
    });
    
    if (!response.ok) {
      throw new Error('Failed to track analytics');
    }
    
    return response.json();
  }
}

export const websiteApi = new WebsiteApi();
