'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { GripVertical, Info, MoreVertical } from 'lucide-react';
import type { RateItem } from './types';

interface PayrollItemsCardProps {
  rateItems: RateItem[];
  rateGroupOrder: string[];
  ratesSaving: boolean;
  saving: boolean;
  onOpenInfo: () => void;
  onAddItem: () => void;
  onDragEnd: (result: DropResult) => void;
  onEditItem: (code: string, group: string) => void;
  onDeleteItem: (target: { code: string; label: string; group: string }) => void;
  formatGroupLabel: (groupKey: string) => string;
  formatRatePreview: (item: { code: string; value: number; is_rate: 0 | 1 }) => string;
  reconcileOrder: (keys: string[], saved: string[]) => string[];
}

export function PayrollItemsCard({
  rateItems,
  rateGroupOrder,
  ratesSaving,
  saving,
  onOpenInfo,
  onAddItem,
  onDragEnd,
  onEditItem,
  onDeleteItem,
  formatGroupLabel,
  formatRatePreview,
  reconcileOrder,
}: PayrollItemsCardProps) {
  const groups = rateItems.reduce<Record<string, RateItem[]>>((acc, item) => {
    const key = item.group || 'work_rate';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const unorderedEntries = Object.entries(groups);
  const currentKeys = unorderedEntries.map(([k]) => k);
  const orderedKeys = reconcileOrder(currentKeys, rateGroupOrder);
  const entries = orderedKeys.map((k) => [k, groups[k] ?? []] as const);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 md:gap-6">
          <div className="flex items-center gap-2">
            <CardTitle className="italic md:text-lg font-semibold">Payroll Items</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={onOpenInfo}
              aria-label="Payroll items information"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
          <Button type="button" size="sm" onClick={onAddItem} disabled={ratesSaving || saving}>
            Add Item
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payroll variable rates configured yet.</p>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="payroll-config-rate-groups" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-flow-col auto-cols-[minmax(180px,1fr)] gap-6 overflow-x-auto pb-2"
                >
                  {entries.map(([groupKey, items], index) => (
                    <Draggable key={groupKey} draggableId={groupKey} index={index}>
                      {(dragProvided) => (
                        <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-grab"
                              {...dragProvided.dragHandleProps}
                              title="Drag to reorder columns"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <h3 className="font-semibold capitalize">{formatGroupLabel(groupKey)}</h3>
                          </div>

                          {items
                            .slice()
                            .sort((a, b) => a.label.localeCompare(b.label))
                            .map((item) => (
                              <div key={item.code} className="space-y-2">
                                <Label>{item.label}</Label>
                                <div className="flex items-center gap-0">
                                  <Input
                                    className="flex-1 rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                                    type="text"
                                    value={formatRatePreview(item)}
                                    readOnly
                                  />
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 rounded-l-none border-l-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                                        disabled={ratesSaving || saving}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => onEditItem(item.code, item.group)}>
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          onDeleteItem({
                                            code: item.code,
                                            label: item.label,
                                            group: item.group,
                                          })
                                        }
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </CardContent>
    </Card>
  );
}
