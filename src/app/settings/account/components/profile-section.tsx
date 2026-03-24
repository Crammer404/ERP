'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, EyeOff, SquarePen } from 'lucide-react';
import { PhilippineAddressForm } from '@/components/forms/address/philippine-address-form';
import type { AddressData } from '@/services/address/psgc.service';
import type { Dispatch, SetStateAction } from 'react';
import type { AccountOverview } from '../services/account-management-service';

interface ProfileSectionProps {
  overview: AccountOverview | null;
  subscriptionSummary: {
    planName: string;
    statusLabel: string;
    statusVariant: 'default' | 'secondary' | 'destructive' | 'outline';
    remainingLabel: string;
  };
  profileForm: {
    first_name: string;
    last_name: string;
    email: string;
    address: {
      country: string;
      region: string;
      province: string;
      city: string;
      barangay: string;
      street: string;
      block_lot: string;
      postal_code: string;
    };
  };
  passwordForm: { password: string; password_confirmation: string };
  setProfileForm: Dispatch<SetStateAction<{
    first_name: string;
    last_name: string;
    email: string;
    address: {
      country: string;
      region: string;
      province: string;
      city: string;
      barangay: string;
      street: string;
      block_lot: string;
      postal_code: string;
    };
  }>>;
  setPasswordForm: Dispatch<SetStateAction<{ password: string; password_confirmation: string }>>;
  submitting: boolean;
  onSaveProfile: () => void;
  onUpdatePassword: () => void;
}

export function ProfileSection({
  overview,
  subscriptionSummary,
  profileForm,
  passwordForm,
  setProfileForm,
  setPasswordForm,
  submitting,
  onSaveProfile,
  onUpdatePassword,
}: ProfileSectionProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [addressData, setAddressData] = useState<AddressData>({
    country: 'Philippines',
    zipcode: '',
    region: null,
    province: null,
    city: null,
    barangay: null,
    street: '',
    blockLot: '',
  });

  const initials = (overview?.profile?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const fullAddress = [
    profileForm.address.block_lot,
    profileForm.address.street,
    profileForm.address.barangay,
    profileForm.address.city,
    profileForm.address.province,
    profileForm.address.region,
    profileForm.address.postal_code,
    profileForm.address.country,
  ]
    .filter((part) => part && part.trim() !== '')
    .join(', ');

  const rawBillingCycle = (overview?.subscription?.billing_cycle || overview?.subscription?.plan?.billing_cycle || '').toLowerCase();
  const billingSuffix = rawBillingCycle === 'month' || rawBillingCycle === 'monthly'
    ? '/mo'
    : rawBillingCycle === 'year' || rawBillingCycle === 'yearly'
      ? '/yr'
      : rawBillingCycle
        ? `/${rawBillingCycle}`
        : '';
  const subscriptionPrice = overview?.subscription?.amount || overview?.subscription?.plan?.price || '';
  const subscriptionPlanLine = [subscriptionSummary.planName, subscriptionPrice ? `${subscriptionPrice}${billingSuffix}` : '']
    .filter(Boolean)
    .join(' ');

  const mapAddressToAddressData = () => ({
    country: profileForm.address.country || 'Philippines',
    zipcode: profileForm.address.postal_code || '',
    region: profileForm.address.region
      ? { code: profileForm.address.region, name: profileForm.address.region }
      : null,
    province: profileForm.address.province
      ? { code: profileForm.address.province, name: profileForm.address.province, region: profileForm.address.region || '' }
      : null,
    city: profileForm.address.city
      ? {
          code: profileForm.address.city,
          name: profileForm.address.city,
          type: '',
          region: profileForm.address.region || '',
          province: profileForm.address.province || '',
        }
      : null,
    barangay: profileForm.address.barangay
      ? {
          code: profileForm.address.barangay,
          name: profileForm.address.barangay,
          status: '',
          region: profileForm.address.region || '',
          province: profileForm.address.province || '',
          city_municipality: profileForm.address.city || '',
        }
      : null,
    street: profileForm.address.street || '',
    blockLot: profileForm.address.block_lot || '',
  });

  useEffect(() => {
    if (isEditingProfile) {
      setAddressData(mapAddressToAddressData());
    }
  }, [isEditingProfile]);

  const handleAddressUpdate = (updatedAddressData: AddressData) => {
    setAddressData((prev) => {
      const prevSerialized = JSON.stringify(prev);
      const nextSerialized = JSON.stringify(updatedAddressData);
      return prevSerialized === nextSerialized ? prev : updatedAddressData;
    });

    const nextAddress = {
      country: updatedAddressData.country || 'Philippines',
      region: updatedAddressData.region?.name || updatedAddressData.region?.code || '',
      province: updatedAddressData.province?.name || updatedAddressData.province?.code || '',
      city: updatedAddressData.city?.name || updatedAddressData.city?.code || '',
      barangay: updatedAddressData.barangay?.name || updatedAddressData.barangay?.code || '',
      street: updatedAddressData.street || '',
      block_lot: updatedAddressData.blockLot || '',
      postal_code: updatedAddressData.zipcode || '',
    };

    setProfileForm((prev) => ({
      ...prev,
      address: JSON.stringify(prev.address) === JSON.stringify(nextAddress) ? prev.address : nextAddress,
    }));
  };

  const handleSaveProfile = async () => {
    await onSaveProfile();
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16 border">
                <AvatarFallback>{initials || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold leading-tight">{overview?.profile?.name || '-'}</p>
                  <span className="text-muted-foreground">-</span>
                  <Badge variant="secondary">{overview?.profile?.role_name || '-'}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{overview?.profile?.email || '-'}</p>
                <p className="text-sm text-muted-foreground">{overview?.profile?.address || 'No address set'}</p>
              </div>
            </div>
            <div className="w-full md:w-auto md:min-w-[190px] md:text-right">
              <p className="text-xs text-muted-foreground mt-1">Subscription:</p>
              <p className="text-sm font-semibold truncate mt-1">{subscriptionPlanLine}</p>
              <p className="text-xs text-muted-foreground">{subscriptionSummary.remainingLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>Update your personal account details.</CardDescription>
            </div>
            {!isEditingProfile ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                Edit
                <SquarePen className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveProfile} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditingProfile ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={profileForm.first_name} onChange={(e) => setProfileForm((prev) => ({ ...prev, first_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={profileForm.last_name} onChange={(e) => setProfileForm((prev) => ({ ...prev, last_name: e.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Email</Label>
                  <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-3">
                <Label>Address</Label>
                <PhilippineAddressForm
                  data={addressData}
                  onUpdate={handleAddressUpdate}
                  errors={{}}
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={profileForm.first_name} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={profileForm.last_name} readOnly />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Email</Label>
                <Input type="email" value={profileForm.email} readOnly />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Input value={fullAddress || 'No address set'} readOnly />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Security</CardTitle>
              <CardDescription>Update your password.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onUpdatePassword} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Password'}
              <SquarePen className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.password_confirmation}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, password_confirmation: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
