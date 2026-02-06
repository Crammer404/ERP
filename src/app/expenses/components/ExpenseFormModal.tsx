'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileText, Image, File, Eye } from 'lucide-react';
import { ExpenseFormData } from '../hooks/useExpenseForm';
import { ExpenseAttachment } from '../services/expenseService';
import { tenantContextService, BranchContext } from '@/services/tenant/tenantContextService';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit?: boolean;
  formData: ExpenseFormData;
  onInputChange: (field: string, value: string | File[] | number[] | ExpenseAttachment[]) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ExpenseFormModal({
  isOpen,
  onOpenChange,
  isEdit = false,
  formData,
  onInputChange,
  errors,
  isLoading,
  onSubmit,
}: ExpenseFormModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchContext | null>(null);

  // Get selected branch from header context and listen for changes
  useEffect(() => {
    // Initial load
    const loadBranch = () => {
      const branch = tenantContextService.getStoredBranchContext();
      setSelectedBranch(branch);
    };
    
    loadBranch();

    // Listen for branch changes (from localStorage updates or custom events)
    const handleBranchChange = () => {
      loadBranch();
    };

    // Listen to custom branchChanged event
    window.addEventListener('branchChanged', handleBranchChange);
    
    // Listen to storage events (for cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'branch_context') {
        loadBranch();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isOpen]); // Re-run when modal opens

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      onInputChange("attachments", [...formData.attachments, ...files]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onInputChange("attachments", [...formData.attachments, ...files]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = formData.attachments.filter((_, i) => i !== index);
    onInputChange("attachments", newFiles);
  };

  const removeExistingAttachment = (attachmentId: number) => {
    const newIdsToKeep = formData.attachment_ids_to_keep.filter(id => id !== attachmentId);
    const newExistingAttachments = formData.existing_attachments.filter(att => att.id !== attachmentId);
    onInputChange("attachment_ids_to_keep", newIdsToKeep);
    onInputChange("existing_attachments", newExistingAttachments);
  };

  const getExistingFileIcon = (attachment: ExpenseAttachment) => {
    const fileName = attachment.file_name.toLowerCase();
    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) return <Image className="h-4 w-4" />;
    if (fileName.endsWith('.pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatExistingFileSize = (attachment: ExpenseAttachment) => {
    // Since we don't have file size in ExpenseAttachment, we'll just return empty string
    // The filename is already displayed separately
    return '';
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update expense details below."
              : "Enter expense details below. All fields marked with * are required."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-name" : "name"}>Expense Name <span className="text-red-500">*</span></Label>
              <Input
                id={isEdit ? "edit-name" : "name"}
                type="text"
                disabled={isLoading}
                value={formData.name}
                onChange={(e) => onInputChange("name", e.target.value)}
                placeholder="e.g. Office Supplies"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            {/* Branch Display */}
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                type="text"
                value={selectedBranch?.name || 'No branch selected'}
                disabled={true}
                className="bg-muted"
              />
            </div>

            {/* Area of Expense */}
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-area" : "area"}>Area of Expense <span className="text-red-500">*</span></Label>
              <Input
                id={isEdit ? "edit-area" : "area"}
                type="text"
                disabled={isLoading}
                value={formData.area_of_expense}
                onChange={(e) => onInputChange("area_of_expense", e.target.value)}
                placeholder="e.g. Office Maintenance"
              />
              {errors.area_of_expense && <p className="text-red-500 text-sm">{errors.area_of_expense}</p>}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-amount" : "amount"}>Amount <span className="text-red-500">*</span></Label>
              <Input
                id={isEdit ? "edit-amount" : "amount"}
                type="number"
                step="0.01"
                min="0"
                disabled={isLoading}
                value={formData.amount}
                onChange={(e) => onInputChange("amount", e.target.value)}
                placeholder="0.00"
              />
              {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
            </div>

            {/* Expense Date */}
             <div className="space-y-2">
               <Label htmlFor={isEdit ? "edit-date" : "date"}>Expense Date <span className="text-red-500">*</span></Label>
               <Input
                 id={isEdit ? "edit-date" : "date"}
                 type="date"
                 disabled={isLoading}
                 value={formData.expense_date}
                 max={new Date().toISOString().split('T')[0]}
                 onChange={(e) => onInputChange("expense_date", e.target.value)}
               />
               {errors.expense_date && <p className="text-red-500 text-sm">{errors.expense_date}</p>}
             </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor={isEdit ? "edit-description" : "description"}>Description</Label>
            <Textarea
              id={isEdit ? "edit-description" : "description"}
              disabled={isLoading}
              value={formData.description || ''}
              onChange={(e) => onInputChange("description", e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-sm text-gray-600 mb-2">
                Drag and drop files here, or click to select files
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Supported format: PDF
              </p>
              <Input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isLoading}
              >
                Choose Files
              </Button>
            </div>

            {/* Existing Attachments (for edit mode) */}
            {isEdit && formData.existing_attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Attachments:</Label>
                <div className="space-y-2">
                  {formData.existing_attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        {getExistingFileIcon(attachment)}
                        <span className="text-sm font-medium">{attachment.file_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(attachment.attachment, '_blank')}
                          disabled={isLoading}
                          title="View attachment"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExistingAttachment(attachment.id)}
                          disabled={isLoading}
                          title="Remove attachment"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Files */}
            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files:</Label>
                <div className="space-y-2">
                  {formData.attachments.map((file, index) => (
                     <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                       <div className="flex items-center gap-2">
                         {getFileIcon(file)}
                         <span className="text-sm font-medium">{file.name}</span>
                         <Badge variant="secondary" className="text-xs">
                           {formatFileSize(file.size)}
                         </Badge>
                       </div>
                       <Button
                         type="button"
                         variant="ghost"
                         size="sm"
                         onClick={() => removeFile(index)}
                         disabled={isLoading}
                       >
                         <X className="h-4 w-4" />
                       </Button>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {errors.attachments && <p className="text-red-500 text-sm">{errors.attachments}</p>}
          </div>

          {errors.general && <p className="text-red-500 text-sm">{errors.general}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                ? "Update Expense"
                : "Create Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}