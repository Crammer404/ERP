'use client';

import { ActivityLogsClient } from './activity-logs-client';
import { FileText } from 'lucide-react';

export default function ActivityLogsPage() {
  console.log('Activity Logs page loaded at /settings/activity-logs');
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Activity Logs</h1>
          <p className="text-sm text-muted-foreground">
            View and monitor all activity logs in the system.
          </p>
        </div>
      </div>
      <ActivityLogsClient />
    </div>
  );
}