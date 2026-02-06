'use client';

import { ModuleGroupManager } from '@/components/common';

export default function ModuleGroupsPage() {

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Module Group Management</h1>
        <p className="text-gray-600 mt-2">
          Manage the display order and properties of module groups in the sidebar navigation.
        </p>
      </div>
      
      <ModuleGroupManager />
    </div>
  );
}
