'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function RolesPermissionsPage() {

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-8">
        <ShieldCheck className="h-10 w-10 text-primary" />
        <div>
            <h1 className="text-4xl font-bold font-headline text-primary">Roles & Permissions</h1>
            <p className="text-lg text-muted-foreground mt-1">
            Define roles and manage their access permissions.
            </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>This feature is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">The roles and permissions management interface will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
