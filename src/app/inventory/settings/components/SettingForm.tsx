'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { inventoryService } from '../services/inventoryService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

export interface SettingFormValues {
  name: string;
  description?: string;
  branch_id?: number;
  tenant_id?: number;
  variations?: { id?: number; name: string }[];
}

const settingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  variations: z.array(z.object({ id: z.number().optional(), name: z.string().min(1, "Variation cannot be empty") })).default([]),
});

export type SettingFormData = z.infer<typeof settingSchema>;

interface SettingFormProps {
  type: 'brand' | 'category' | 'attribute' | 'measurement';
  setting?: any | null;
  onSave: (values: SettingFormValues) => Promise<void>;
  onCancel: () => void;
}

export function SettingForm({ type, setting, onSave, onCancel }: SettingFormProps) {
  const form = useForm<SettingFormData>({
    resolver: zodResolver(settingSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: setting?.name || '',
      description: setting?.description || '',
      variations: type === 'attribute' && setting?.fullData?.specifications
        ? setting.fullData.specifications.map((s: any) => ({ id: s.id, name: s.name }))
        : setting?.variations?.map((v: any) => ({ id: v.id, name: v.value })) || [],
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [pop, setPop] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<{ id: number; name: string } | null>(null);
  const [currentTenant, setCurrentTenant] = useState<{ id: number; name: string } | null>(null);
  const { toast } = useToast();

  const typeLabel = {
    brand: 'Brand',
    category: 'Category',
    attribute: 'Variant Attribute',
    measurement: 'Measurement',
  }[type];

  // ✅ Debounced async duplicate check
  const checkDuplicate = useCallback(async (name: string) => {
    if (!name.trim()) return false;
    setIsChecking(true);

    try {
      let list: any[] = [];

      if (type === 'brand') list = await inventoryService.getBrands(currentBranch?.id);
      else if (type === 'category') list = await inventoryService.getCategories(currentBranch?.id);
      else if (type === 'attribute') list = await inventoryService.getVariants(currentBranch?.id);
      else if (type === 'measurement') list = await inventoryService.getMeasurements(currentBranch?.id);

      const lower = name.trim().toLowerCase();
      const duplicate = list.some(
        (item) => item.name.toLowerCase() === lower && item.id !== setting?.id
      );

      if (duplicate) {
        form.setError('name', {
          type: 'manual',
          message: `${typeLabel} with this name already exists.`,
        });
      } else {
        form.clearErrors('name');
      }

      return duplicate;
    } finally {
      setIsChecking(false);
    }
  }, [type, setting, form, toast, typeLabel, currentBranch]);

  // Get stored tenant and branch context
  useEffect(() => {
    const storedTenant = tenantContextService.getStoredTenantContext();
    const storedBranch = tenantContextService.getStoredBranchContext();
    if (storedTenant) {
      setCurrentTenant(storedTenant);
    }
    if (storedBranch) {
      setCurrentBranch(storedBranch);
    }
  }, []);

  // ✅ Watch name input & debounce duplicate check
  useEffect(() => {
    const timeout = setTimeout(() => {
      const name = form.watch('name');
      if (name) checkDuplicate(name);
    }, 300); // debounce 600ms

    return () => clearTimeout(timeout);
  }, [form.watch('name')]);

  // ✅ Submit handler
  const onSubmit = async (data: SettingFormData) => {
    setIsSaving(true);
    try {
      // Final duplicate check before save
      const isDuplicate = await checkDuplicate(data.name);
      if (isDuplicate) return;

      const values: SettingFormValues = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        branch_id: currentBranch?.id,
        tenant_id: currentTenant?.id,
        variations:
          type === 'attribute'
            ? data.variations?.filter((v) => v.name.trim())
            : undefined,
      };

      // For variants, only send name if we're just updating the name
      // Don't send specifications if we're only editing the name
      if (type === 'attribute' && setting && !data.variations?.length) {
        const variantData = { name: values.name };
        await onSave(variantData);
        return;
      }

      await onSave(values);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      id="setting-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={type}
          animate={pop ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {typeLabel} Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  placeholder={`Enter ${typeLabel} name`}
                  {...form.register("name")}
                />
                {isChecking && (
                  <span className="absolute right-2 top-2 text-xs text-gray-400 animate-pulse">
                    ...
                  </span>
                )}
              </div>
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Branch - ReadOnly */}
            <div>
              <label className="block text-sm font-medium mb-1">Branch</label>
              <Input
                value={currentBranch?.name || 'Branch information not available'}
                readOnly
                className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                placeholder="Branch information"
              />
            </div>

            {/* Variations (for attributes only) */}
            {type === 'attribute' && (
              <div>
                <label className="block text-sm font-medium">Variations</label>

                {/* Scrollable variations list */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 rounded-md bg-gray-50 dark:bg-transparent p-2">
                  {form.watch("variations")?.map((variation, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex gap-2 items-center">
                        <Input
                          placeholder="e.g. Small, Red"
                          value={variation.name}
                          onChange={(e) => {
                            const updated = [...(form.getValues("variations") || [])];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            form.setValue("variations", updated, { shouldValidate: true });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (form.getValues("variations") || []).filter((_, i) => i !== idx);
                            form.setValue("variations", updated, { shouldValidate: true });
                          }}
                          className="p-2 rounded-md text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {form.formState.errors.variations?.[idx]?.name?.message && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.variations[idx]?.name?.message as string}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Variation Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const updated = [...(form.getValues("variations") || []), { name: '' }];
                    form.setValue("variations", updated, { shouldValidate: true });
                  }}
                  className="mt-2"
                >
                  + Add Variation
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </form>
  );
}
