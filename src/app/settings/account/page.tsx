'use client';

import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';
import { accountManagementService, type AccountOverview, type AccountPaymentMethod } from './services/account-management-service';
import { AccountSettingsHeader } from './components/account-settings-header';
import { AccountSettingsSidebar } from './components/account-settings-sidebar';
import { ProfileSection } from './components/profile-section';
import { SubscriptionSection } from './components/subscription-section';
import { PaymentSection } from './components/payment-section';
import { BillingSection } from './components/billing-section';

export default function AccountManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [activeSection, setActiveSection] = useState<'profile' | 'subscription' | 'payment' | 'billing'>('profile');
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    address: {
      country: '',
      region: '',
      province: '',
      city: '',
      barangay: '',
      street: '',
      block_lot: '',
      postal_code: '',
    },
  });
  const [passwordForm, setPasswordForm] = useState({ password: '', password_confirmation: '' });
  const [paymentForm, setPaymentForm] = useState({
    type: 'credit_card',
    provider: '',
    token: '',
    last4: '',
    brand: '',
    exp_month: '',
    exp_year: '',
    holder_name: '',
    is_default: false,
  });
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const sectionItems: Array<{ key: 'profile' | 'subscription' | 'payment' | 'billing'; label: string }> = [
    { key: 'profile', label: 'My Profile' },
    { key: 'subscription', label: 'Subscription' },
    { key: 'payment', label: 'Payment Methods' },
    { key: 'billing', label: 'Billing' },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await accountManagementService.getOverview();
      setOverview(data);
      setProfileForm({
        first_name: data.profile.first_name || '',
        last_name: data.profile.last_name || '',
        email: data.profile.email || '',
        address: {
          country: data.profile.address_parts?.country || '',
          region: data.profile.address_parts?.region || '',
          province: data.profile.address_parts?.province || '',
          city: data.profile.address_parts?.city || '',
          barangay: data.profile.address_parts?.barangay || '',
          street: data.profile.address_parts?.street || '',
          block_lot: data.profile.address_parts?.block_lot || '',
          postal_code: data.profile.address_parts?.postal_code || '',
        },
      });
    } catch (error: any) {
      toast({
        title: 'Failed to load account management data',
        description: error?.response?.data?.message || error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statusVariant: 'default' | 'secondary' | 'destructive' | 'outline' = useMemo(() => {
    const status = overview?.subscription?.status;
    if (status === 'active') return 'default';
    if (status === 'trial') return 'secondary';
    if (status === 'cancelled' || status === 'expired') return 'destructive';
    return 'outline';
  }, [overview?.subscription?.status]);

  const subscriptionSummary = useMemo(() => {
    const subscription = overview?.subscription;
    if (!subscription) {
      return {
        planName: 'No Plan',
        statusLabel: 'No Subscription',
        statusVariant: 'outline' as const,
        remainingLabel: 'No active subscription',
      };
    }

    const status = (subscription.status || '').toLowerCase();
    const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    const now = new Date();

    if (status === 'trial') {
      return {
        planName: subscription.plan?.name || 'Trial Plan',
        statusLabel,
        statusVariant: 'secondary' as const,
        remainingLabel: 'Free Trial',
      };
    }

    if (status === 'expired') {
      return {
        planName: subscription.plan?.name || 'No Plan',
        statusLabel,
        statusVariant: 'destructive' as const,
        remainingLabel: 'Expired',
      };
    }

    if (status === 'cancelled') {
      return {
        planName: subscription.plan?.name || 'No Plan',
        statusLabel,
        statusVariant: 'destructive' as const,
        remainingLabel: 'Cancelled',
      };
    }

    const targetDateRaw = subscription.next_billing_date || subscription.ends_at;
    if (!targetDateRaw) {
      return {
        planName: subscription.plan?.name || 'No Plan',
        statusLabel,
        statusVariant: 'outline' as const,
        remainingLabel: 'No billing schedule',
      };
    }

    const targetDate = new Date(targetDateRaw);
    const msLeft = targetDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    return {
      planName: subscription.plan?.name || 'No Plan',
      statusLabel,
      statusVariant: daysLeft > 0 ? 'default' as const : 'destructive' as const,
      remainingLabel: daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : 'Expired',
    };
  }, [overview?.subscription]);

  const handleProfileUpdate = async () => {
    setSubmitting(true);
    try {
      const profile = await accountManagementService.updateProfile(profileForm);
      setOverview((prev) => (prev ? { ...prev, profile: { ...prev.profile, ...profile } } : prev));
      setProfileForm((prev) => ({
        ...prev,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        address: {
          country: profile.address_parts?.country || '',
          region: profile.address_parts?.region || '',
          province: profile.address_parts?.province || '',
          city: profile.address_parts?.city || '',
          barangay: profile.address_parts?.barangay || '',
          street: profile.address_parts?.street || '',
          block_lot: profile.address_parts?.block_lot || '',
          postal_code: profile.address_parts?.postal_code || '',
        },
      }));
      toast({ title: 'Profile updated successfully' });
    } catch (error: any) {
      toast({
        title: 'Failed to update profile',
        description: error?.response?.data?.message || error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setSubmitting(true);
    try {
      await accountManagementService.updatePassword(passwordForm);
      setPasswordForm({ password: '', password_confirmation: '' });
      toast({ title: 'Password updated successfully' });
    } catch (error: any) {
      toast({
        title: 'Failed to update password',
        description: error?.response?.data?.message || error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlanChange = async (planId: number) => {
    setSubmitting(true);
    try {
      const subscription = await accountManagementService.updateSubscriptionPlan({ plan_id: planId });
      setOverview((prev) => (prev ? { ...prev, subscription } : prev));
      toast({ title: 'Subscription plan updated successfully' });
    } catch (error: any) {
      toast({
        title: 'Failed to update subscription',
        description: error?.response?.data?.message || error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetPaymentForm = () => {
    setEditingPaymentId(null);
    setPaymentForm({
      type: 'credit_card',
      provider: '',
      token: '',
      last4: '',
      brand: '',
      exp_month: '',
      exp_year: '',
      holder_name: '',
      is_default: false,
    });
  };

  const onEditPaymentMethod = (method: AccountPaymentMethod) => {
    setEditingPaymentId(method.id);
    setPaymentForm({
      type: method.type || 'credit_card',
      provider: method.provider || '',
      token: method.token || '',
      last4: method.last4 || '',
      brand: method.brand || '',
      exp_month: method.exp_month ? String(method.exp_month) : '',
      exp_year: method.exp_year ? String(method.exp_year) : '',
      holder_name: method.holder_name || '',
      is_default: method.is_default,
    });
  };

  const handleSavePaymentMethod = async () => {
    setSubmitting(true);
    try {
      const payload = {
        type: paymentForm.type,
        provider: paymentForm.provider || undefined,
        token: paymentForm.token || undefined,
        last4: paymentForm.last4 || undefined,
        brand: paymentForm.brand || undefined,
        exp_month: paymentForm.exp_month ? Number(paymentForm.exp_month) : undefined,
        exp_year: paymentForm.exp_year ? Number(paymentForm.exp_year) : undefined,
        holder_name: paymentForm.holder_name || undefined,
        is_default: paymentForm.is_default,
      };

      if (editingPaymentId) {
        await accountManagementService.updatePaymentMethod(editingPaymentId, payload);
      } else {
        await accountManagementService.createPaymentMethod(payload);
      }

      await loadData();
      resetPaymentForm();
      toast({ title: 'Payment method saved successfully' });
    } catch (error: any) {
      toast({
        title: 'Failed to save payment method',
        description: error?.response?.data?.message || error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePaymentMethod = async (id: number) => {
    setSubmitting(true);
    try {
      await accountManagementService.deletePaymentMethod(id);
      await loadData();
      if (editingPaymentId === id) {
        resetPaymentForm();
      }
      toast({ title: 'Payment method removed successfully' });
    } catch (error: any) {
      toast({
        title: 'Failed to delete payment method',
        description: error?.response?.data?.message || error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefaultPaymentMethod = async (id: number) => {
    setSubmitting(true);
    try {
      await accountManagementService.setDefaultPaymentMethod(id);
      await loadData();
      toast({ title: 'Default payment method updated successfully' });
    } catch (error: any) {
      toast({
        title: 'Failed to set default payment method',
        description: error?.response?.data?.message || error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <AccountSettingsHeader />
      <div className="grid grid-cols-1 lg:grid-cols-[180px_1px_1fr] gap-0 min-h-[680px]">
        <AccountSettingsSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          sectionItems={sectionItems}
        />
        <div className="hidden lg:block bg-border min-h-full" />
        <div className="py-4 pl-4 md:pl-6">
          {activeSection === 'profile' && (
            <ProfileSection
              overview={overview}
              subscriptionSummary={subscriptionSummary}
              profileForm={profileForm}
              passwordForm={passwordForm}
              setProfileForm={setProfileForm}
              setPasswordForm={setPasswordForm}
              submitting={submitting}
              onSaveProfile={handleProfileUpdate}
              onUpdatePassword={handlePasswordUpdate}
            />
          )}
          {activeSection === 'subscription' && (
            <SubscriptionSection
              overview={overview}
              statusVariant={statusVariant}
              submitting={submitting}
              onPlanChange={handlePlanChange}
            />
          )}
          {activeSection === 'payment' && (
            <PaymentSection
              overview={overview}
              paymentForm={paymentForm}
              setPaymentForm={setPaymentForm}
              editingPaymentId={editingPaymentId}
              submitting={submitting}
              onSavePaymentMethod={handleSavePaymentMethod}
              onResetPaymentForm={resetPaymentForm}
              onEditPaymentMethod={onEditPaymentMethod}
              onSetDefaultPaymentMethod={handleSetDefaultPaymentMethod}
              onDeletePaymentMethod={handleDeletePaymentMethod}
            />
          )}
          {activeSection === 'billing' && <BillingSection overview={overview} />}
        </div>
      </div>
    </div>
  );
}
