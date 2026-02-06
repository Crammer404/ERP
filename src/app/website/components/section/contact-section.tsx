'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin } from 'lucide-react';
import { websiteApi } from '../../services/api';
import { ContactFormData } from '../../types/api.types';
import { BRANDING_CONFIG } from '../../config/brand.config';
import { WEBSITE_CONFIG } from '../../utils/constants';

export function ContactSection() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    company: '',
    message: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await websiteApi.contact(formData);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', company: '', message: '', phone: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section className="py-16">
      <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Get in Touch</h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Have questions about {BRANDING_CONFIG.name}? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="border-0 shadow-lg bg-card">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="mt-1"
                  />
                </div>
                
                {submitStatus === 'success' && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-200">Thank you! Your message has been sent successfully.</p>
                  </div>
                )}
                
                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-200">Sorry, there was an error sending your message. Please try again.</p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-card">
              <CardContent className="p-5">
                <div className="flex items-start space-x-3">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${BRANDING_CONFIG.colors.primary}1A` }}
                  >
                    <Mail className="h-5 w-5" style={{ color: BRANDING_CONFIG.colors.primary }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-1 text-sm">Email Us</h3>
                    <p className="text-muted-foreground text-xs mb-1">Send us an email and we'll respond within 24 hours.</p>
                    <p className="font-medium text-sm" style={{ color: BRANDING_CONFIG.colors.primary }}>{WEBSITE_CONFIG.CONTACT_EMAIL}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-card">
              <CardContent className="p-5">
                <div className="flex items-start space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-1 text-sm">Call Us</h3>
                    <p className="text-muted-foreground text-xs mb-1">Speak with our sales team during business hours.</p>
                    <p className="text-green-600 dark:text-green-400 font-medium text-sm">{WEBSITE_CONFIG.PHONE}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-card">
              <CardContent className="p-5">
                <div className="flex items-start space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-1 text-sm">Visit Us</h3>
                    <p className="text-muted-foreground text-xs mb-1">Come visit our office for a personal consultation.</p>
                    <p className="text-purple-600 dark:text-purple-400 font-medium text-sm">{WEBSITE_CONFIG.ADDRESS}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </section>
  );
}
