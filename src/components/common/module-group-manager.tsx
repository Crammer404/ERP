'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Save, X, Edit2, Trash2 } from 'lucide-react';
import { moduleGroupService, type CreateModuleGroupRequest, type UpdateModuleGroupRequest } from '@/services';
import type { ModuleGroup } from '@/lib/types';
import { useModuleGroupRefresh } from '@/hooks/useModuleGroupRefresh';
import { toast } from 'sonner';

interface ModuleGroupManagerProps {
  onClose?: () => void;
}

export function ModuleGroupManager({ onClose }: ModuleGroupManagerProps) {
  const [moduleGroups, setModuleGroups] = useState<ModuleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModuleGroup | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateModuleGroupRequest>({
    display_name: '',
    icon_path: '',
    sort_order: 0,
  });
  const { refreshModuleGroups } = useModuleGroupRefresh();

  // Common icon options
  const iconOptions = [
    'layout-dashboard',
    'users',
    'warehouse',
    'shopping-cart',
    'bar-chart-3',
    'settings',
    'clock',
    'credit-card',
    'package',
    'file-text',
    'calendar',
    'building',
    'truck',
    'dollar-sign',
    'pie-chart',
    'shield',
    'user-check',
    'database',
    'server',
    'globe',
  ];

  useEffect(() => {
    loadModuleGroups();
  }, []);

  const loadModuleGroups = async () => {
    try {
      setLoading(true);
      const groups = await moduleGroupService.getModuleGroups();
      setModuleGroups(groups);
    } catch (error) {
      console.error('Error loading module groups:', error);
      toast.error('Failed to load module groups');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(moduleGroups);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));

    setModuleGroups(updatedItems);
  };

  const saveSortOrder = async () => {
    try {
      setSaving(true);
      const groups = moduleGroups.map((group, index) => ({
        id: group.id,
        sort_order: index + 1,
      }));

      await moduleGroupService.updateSortOrder({ groups });
      
      // Refresh the sidebar to show the new order
      await refreshModuleGroups();
      
      toast.success('Module group order updated successfully');
    } catch (error) {
      console.error('Error saving sort order:', error);
      toast.error('Failed to update module group order');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      const newGroup = await moduleGroupService.createModuleGroup(formData);
      setModuleGroups([...moduleGroups, newGroup]);
      setShowCreateForm(false);
      setFormData({ display_name: '', icon_path: '', sort_order: 0 });
      toast.success('Module group created successfully');
    } catch (error) {
      console.error('Error creating module group:', error);
      toast.error('Failed to create module group');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingGroup) return;

    try {
      setSaving(true);
      const updatedGroup = await moduleGroupService.updateModuleGroup(editingGroup.id, formData);
      setModuleGroups(moduleGroups.map(group => 
        group.id === editingGroup.id ? updatedGroup : group
      ));
      setEditingGroup(null);
      setFormData({ display_name: '', icon_path: '', sort_order: 0 });
      toast.success('Module group updated successfully');
    } catch (error) {
      console.error('Error updating module group:', error);
      toast.error('Failed to update module group');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this module group?')) return;

    try {
      setSaving(true);
      await moduleGroupService.deleteModuleGroup(id);
      setModuleGroups(moduleGroups.filter(group => group.id !== id));
      toast.success('Module group deleted successfully');
    } catch (error) {
      console.error('Error deleting module group:', error);
      toast.error('Failed to delete module group');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (group: ModuleGroup) => {
    setEditingGroup(group);
    setFormData({
      display_name: group.display_name,
      icon_path: group.icon_path,
      sort_order: group.sort_order,
    });
  };

  const cancelEdit = () => {
    setEditingGroup(null);
    setShowCreateForm(false);
    setFormData({ display_name: '', icon_path: '', sort_order: 0 });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Module Group Manager</CardTitle>
          <CardDescription>Loading module groups...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Module Group Manager</CardTitle>
            <CardDescription>
              Manage module groups and their display order
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create/Edit Form */}
        {(showCreateForm || editingGroup) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingGroup ? 'Edit Module Group' : 'Create New Module Group'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Enter display name"
                />
              </div>
              <div>
                <Label htmlFor="icon_path">Icon</Label>
                <Select
                  value={formData.icon_path}
                  onValueChange={(value) => setFormData({ ...formData, icon_path: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={editingGroup ? handleUpdate : handleCreate}
                  disabled={saving || !formData.display_name || !formData.icon_path}
                >
                  {saving ? 'Saving...' : (editingGroup ? 'Update' : 'Create')}
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Module Groups List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Module Groups</h3>
            <div className="flex gap-2">
              {!showCreateForm && !editingGroup && (
                <Button onClick={() => setShowCreateForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Group
                </Button>
              )}
              <Button
                onClick={saveSortOrder}
                disabled={saving}
                size="sm"
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Order'}
              </Button>
            </div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="module-groups">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {moduleGroups.map((group, index) => (
                    <Draggable key={group.id} draggableId={group.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-4 border rounded-lg bg-white ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>
                              <div>
                                <div className="font-medium">{group.display_name}</div>
                                <div className="text-sm text-gray-500">
                                  Icon: {group.icon_path}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                Order: {group.sort_order}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(group)}
                                disabled={editingGroup !== null}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(group.id)}
                                disabled={saving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </CardContent>
    </Card>
  );
}
