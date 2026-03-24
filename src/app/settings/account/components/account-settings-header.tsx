'use client';

import { UserCog } from 'lucide-react';

export function AccountSettingsHeader() {
  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <UserCog className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Account Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings.
          </p>
        </div>
      </div>
    </>
  );
}
