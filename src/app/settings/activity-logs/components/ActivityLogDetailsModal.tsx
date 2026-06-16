'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ActivityLog } from '../services/activityLogService';

interface ActivityLogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: ActivityLog | null;
}

export function ActivityLogDetailsModal({
  isOpen,
  onClose,
  log,
}: ActivityLogDetailsModalProps) {
  if (!log) return null;

  const getActivityBadgeVariant = (activity: string) => {
    switch (activity.toLowerCase()) {
      case 'added':
      case 'add':
        return 'default';
      case 'updated':
      case 'update':
        return 'secondary';
      case 'deleted':
      case 'delete':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getActivityIcon = (activity: string) => {
    switch (activity.toLowerCase()) {
      case 'added':
      case 'add':
        return <Plus className="h-4 w-4" />;
      case 'updated':
      case 'update':
        return <Edit className="h-4 w-4" />;
      case 'deleted':
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActivityLabel = (activity: string) => {
    switch (activity.toLowerCase()) {
      case 'added':
      case 'add':
        return 'Added';
      case 'updated':
      case 'update':
        return 'Edited';
      case 'deleted':
      case 'delete':
        return 'Deleted';
      default:
        return activity;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant={getActivityBadgeVariant(log.activity)} className="flex items-center gap-2">
              {getActivityIcon(log.activity)}
              {getActivityLabel(log.activity)}
            </Badge>
            Activity Log Details
          </DialogTitle>
          <DialogDescription>
            View complete information about this activity log entry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">ID</p>
                <p className="font-medium">{log.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Module</p>
                <div className="font-medium">
                  <Badge variant="outline">{log.module}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Activity</p>
                <div className="font-medium">
                  <Badge variant={getActivityBadgeVariant(log.activity)} className="flex items-center gap-2 w-fit">
                    {getActivityIcon(log.activity)}
                    {getActivityLabel(log.activity)}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Branch</p>
                <p className="font-medium">{log.branch}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Subject Information */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Subject Information</h3>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                <span className="inline-flex items-center gap-2">
                  {getActivityIcon(log.activity)}
                  {getActivityLabel(log.activity)} {log.subject_type || 'item'}: <strong>{log.item_name || 'Unknown'}</strong>
                </span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Item Name</p>
                <p className="font-medium">{log.item_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Subject Type</p>
                <p className="font-medium">{log.subject_type || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Subject ID</p>
                <p className="font-medium">{log.subject_id || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* User Information */}
          <div>
            <h3 className="font-semibold text-sm mb-4">User Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Created By</p>
                <p className="font-medium">{log.created_by || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created At</p>
                <p className="font-medium text-sm">{formatDateTime(log.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Properties/Changes */}
          {log.properties && Object.keys(log.properties).length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-sm mb-4">Changes/Properties</h3>
                <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                    {JSON.stringify(log.properties, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
