'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { inventoryService } from '@/app/inventory/settings/services/inventoryService';
import { Settings2 } from 'lucide-react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { SettingDialog } from './components/SettingDialog';
import { SettingTable } from './components/SettingTable';
import type { SettingFormValues } from './components/SettingForm';

type TabKey = 'brands' | 'categories' | 'variant-attributes' | 'measurements';
type SettingType = 'brand' | 'category' | 'attribute' | 'measurement';

const tabToSettingType: Record<TabKey, SettingType> = {
  brands: 'brand',
  categories: 'category',
  'variant-attributes': 'attribute',
  measurements: 'measurement',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<TabKey>('brands');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [editingSetting, setEditingSetting] = React.useState<SettingFormValues | null>(null);
  const [currentBranch, setCurrentBranch] = React.useState<{ id: number; name: string } | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const storedBranch = tenantContextService.getStoredBranchContext();
    if (storedBranch) {
      setCurrentBranch(storedBranch);
    }
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRefreshKey((k) => k + 1);
    }, 800);
  };

  const handleAdd = () => setIsDialogOpen(true);

  const handleEdit = (item: any) => {
    setEditingSetting(item);
    setIsDialogOpen(true);
  };

  const handleSave = async (data: SettingFormValues, id?: number): Promise<void> => {
    const type = tabToSettingType[activeTab];
    try {
      if (type === 'brand') {
        if (id) {
          await inventoryService.updateBrand(id, { name: data.name, description: data.description });
          toast({
            title: 'Brand Updated',
            description: 'The brand has been updated successfully.',
            variant: 'success',
          });
        } else {
          await inventoryService.createBrand({
            name: data.name,
            description: data.description,
            branch_id: data.branch_id,
            tenant_id: data.tenant_id,
          });
          toast({
            title: 'Brand Added',
            description: 'A new brand has been created.',
            variant: 'success',
          });
        }
      }

      if (type === 'category') {
        if (id) {
          await inventoryService.updateCategory(id, { name: data.name, description: data.description });
          toast({
            title: 'Category Updated',
            description: 'The category has been updated successfully.',
            variant: 'success',
          });
        } else {
          await inventoryService.createCategory({
            name: data.name,
            description: data.description,
            branch_id: data.branch_id,
            tenant_id: data.tenant_id,
          });
          toast({
            title: 'Category Added',
            description: 'A new category has been created.',
            variant: 'success',
          });
        }
      }

      if (type === 'attribute') {
        if (id) {
          await inventoryService.updateVariant(id, {
            name: data.name,
            specifications: data.variations?.map((v) => ({ id: v.id, name: v.name })) ?? [],
          });
          toast({
            title: 'Variant Updated',
            description: 'The variant attribute has been updated successfully.',
            variant: 'success',
          });
        } else {
          await inventoryService.createVariant({
            name: data.name,
            tenant_id: data.tenant_id!,
            branch_id: data.branch_id,
            specifications: data.variations?.map((v) => ({ name: v.name })) ?? [],
          });
          toast({
            title: 'Variant Added',
            description: 'A new variant attribute has been created.',
            variant: 'success',
          });
        }
      }

      if (type === 'measurement') {
        if (id) {
          await inventoryService.updateMeasurement(id, {
            name: data.name,
            description: data.description,
          });
          toast({
            title: 'Measurement Updated',
            description: 'The measurement has been updated successfully.',
            variant: 'success',
          });
        } else {
          await inventoryService.createMeasurement({
            name: data.name,
            description: data.description,
            unit_type: 'weight',
            symbol: 'g',
            multiplier_to_base: 1,
          });
          toast({
            title: 'Measurement Added',
            description: 'A new measurement has been created.',
            variant: 'success',
          });
        }
      }

      setIsDialogOpen(false);
      setEditingSetting(null);
      handleRefresh();
    } catch (error: any) {
      console.error(`Error saving ${type}:`, error);
      toast({
        title: 'Error',
        description: `Failed to save ${type}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    const type = tabToSettingType[activeTab];
    try {
      if (type === 'brand') await inventoryService.deleteBrand(id);
      if (type === 'category') await inventoryService.deleteCategory(id);
      if (type === 'attribute') await inventoryService.deleteVariant(id);
      if (type === 'measurement') await inventoryService.deleteMeasurement(id);

      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Deleted`,
        description: `The ${type} has been removed.`,
        variant: 'success',
      });
      handleRefresh();
    } catch (error: any) {
      console.error(`Error deleting ${type}:`, error);
      toast({
        title: 'Error',
        description: `Failed to delete ${type}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const getSingularLabel = (tab: TabKey) => {
    const map: Record<TabKey, string> = {
      brands: 'Brand',
      categories: 'Category',
      'variant-attributes': 'Variant Attribute',
      measurements: 'Measurement',
    };
    return map[tab];
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Settings2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Inventory Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your inventory settings and preferences.
          </p>
        </div>
      </div>
      <Card className="bg-transparent border-none shadow-none">
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabKey)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="brands">Brands</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="variant-attributes">Variant Attributes</TabsTrigger>
              <TabsTrigger value="measurements">Measurements</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4 mt-6 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={`Search ${activeTab.replace('-', ' ')}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {activeTab !== 'measurements' && (
                <Button onClick={handleAdd} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add {getSingularLabel(activeTab)}
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={loading}
                className="h-10 w-10"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <TabsContent value="brands">
              <SettingTable
                key={`brand-${refreshKey}`}
                type="brand"
                searchTerm={searchTerm}
                loading={loading}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </TabsContent>

            <TabsContent value="categories">
              <SettingTable
                key={`category-${refreshKey}`}
                type="category"
                searchTerm={searchTerm}
                loading={loading}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </TabsContent>

            <TabsContent value="variant-attributes">
              <SettingTable
                key={`attribute-${refreshKey}`}
                type="attribute"
                searchTerm={searchTerm}
                loading={loading}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </TabsContent>

            <TabsContent value="measurements">
              <SettingTable
                key={`measurement-${refreshKey}`}
                type="measurement"
                searchTerm={searchTerm}
                loading={loading}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </TabsContent>
          </Tabs>

          <SettingDialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingSetting(null);
            }}
            title={editingSetting ? `Edit ${getSingularLabel(activeTab)}` : `Add ${getSingularLabel(activeTab)}`}
            type={tabToSettingType[activeTab]}
            setting={editingSetting}
            onSave={handleSave}
            onRefresh={handleRefresh}
          />
        </CardContent>
      </Card>
    </div>
  );
}
