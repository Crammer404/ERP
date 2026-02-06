'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Image, File } from 'lucide-react';
import { ExpenseAttachment } from '../services/expenseService';

interface AttachmentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  attachments: ExpenseAttachment[];
}

export function AttachmentModal({
  isOpen,
  onOpenChange,
  attachments,
}: AttachmentModalProps) {
  const getFileIcon = (attachment: ExpenseAttachment) => {
    const url = attachment.attachment.toLowerCase();
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) {
      return <Image className="h-4 w-4" />;
    }
    if (url.includes('.pdf')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const isImage = (attachment: ExpenseAttachment) => {
    const url = attachment.attachment.toLowerCase();
    return url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Expense Attachments</DialogTitle>
          <DialogDescription>
            View and download attached files for this expense.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {attachments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No attachments found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {getFileIcon(attachment)}
                    <span className="font-medium text-sm truncate">
                      {attachment.file_name || `Attachment ${attachment.id}`}
                    </span>
                  </div>

                  {isImage(attachment) ? (
                    <div className="space-y-2">
                      <img
                        src={attachment.attachment}
                        alt={attachment.file_name || `Attachment ${attachment.id}`}
                        className="w-full h-48 object-cover rounded-md border"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.png'; // Fallback image
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(attachment.attachment, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(attachment.attachment, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  )}

                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Uploaded: {new Date(attachment.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}