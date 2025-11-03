import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJson, apiUrl } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Calendar,
  Image as ImageIcon,
  Hash
} from 'lucide-react';
import { DynamicTableProvider, useDynamicTable, TableConfig } from '@/contexts/DynamicTableContext';
import { DynamicTable } from '@/components/DynamicTable';

// Categories Configuration
const categoriesConfig: TableConfig = {
  id: 'categories',
  title: 'Categories',
  description: 'Manage product categories and subcategories',
  apiEndpoint: '/categories',
  
  columns: [
    {
      id: 'name',
      label: 'Name',
      type: 'text',
      sortable: true,
      filterable: true,
      accessor: 'name',
    },
    {
      id: 'subcategories',
      label: 'Subcategories',
      type: 'badge',
      sortable: true,
      accessor: (row) => row.subsCount || 0,
    },
    {
      id: 'createdAt',
      label: 'Created',
      type: 'date',
      sortable: true,
      accessor: 'createdAt',
    },
    {
      id: 'image',
      label: 'Image',
      type: 'image',
      accessor: 'image',
    },
    {
      id: 'actions',
      label: 'Actions',
      type: 'actions',
      align: 'right',
    },
  ],
  
  filters: [
    {
      id: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by name...',
      accessor: 'name',
    },
    {
      id: 'minSubcategories',
      label: 'Min Subcategories',
      type: 'number',
      placeholder: 'Minimum subcategories',
      accessor: (row) => row.subsCount || 0,
    },
  ],
  
  actions: [
    {
      id: 'add',
      label: 'Add Category',
      icon: 'Plus',
      type: 'button',
      onClick: async () => {
        // Handle add category
        console.log('Add category clicked');
      },
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: 'Edit',
      type: 'button',
      variant: 'outline',
      onClick: async (row) => {
        console.log('Edit category:', row);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'Trash2',
      type: 'button',
      variant: 'destructive',
      onClick: async (row) => {
        if (confirm(`Are you sure you want to delete "${row.name}"?`)) {
          try {
            const res = await fetch(apiUrl(`/categories/${row._id || row.id}`), { 
              method: 'DELETE' 
            });
            if (!res.ok) throw new Error('Delete failed');
            toast({ title: 'Success', description: 'Category deleted' });
            // Refresh data would be handled by the context
          } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
          }
        }
      },
    },
  ],
  
  bulkActions: [
    {
      id: 'bulkDelete',
      label: 'Delete Selected',
      icon: 'Trash2',
      type: 'bulk',
      variant: 'destructive',
      onClick: async (_, selectedRows) => {
        if (selectedRows && confirm(`Are you sure you want to delete ${selectedRows.length} categories?`)) {
          try {
            const promises = selectedRows.map(row => 
              fetch(apiUrl(`/categories/${row._id || row.id}`), { method: 'DELETE' })
            );
            await Promise.all(promises);
            toast({ title: 'Success', description: `${selectedRows.length} categories deleted` });
          } catch (error: any) {
            toast({ title: 'Error', description: 'Bulk delete failed', variant: 'destructive' });
          }
        }
      },
    },
    {
      id: 'export',
      label: 'Export CSV',
      icon: 'Download',
      type: 'bulk',
      variant: 'outline',
      onClick: async (_, selectedRows) => {
        if (selectedRows) {
          const csvData = selectedRows.map(row => ({
            Name: row.name,
            'Subcategories Count': row.subsCount || 0,
            'Created At': new Date(row.createdAt).toLocaleDateString()
          }));
          
          const csvContent = [
            Object.keys(csvData[0] || {}).join(','),
            ...csvData.map(row => Object.values(row).join(','))
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `categories_${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          
          toast({ title: 'Exported', description: 'Categories exported to CSV' });
        }
      },
    },
  ],
  
  pagination: {
    enabled: true,
    itemsPerPage: 10,
    itemsPerPageOptions: [5, 10, 25, 50],
  },
  
  sorting: {
    enabled: true,
    defaultSort: { column: 'name', direction: 'asc' },
  },
  
  search: {
    enabled: true,
    placeholder: 'Search categories...',
    searchFields: ['name'],
  },
  
  export: {
    enabled: true,
    formats: ['csv', 'excel'],
  },
  
  audit: {
    enabled: true,
    trackActions: true,
  },
  
  permissions: {
    create: ['admin', 'manager'],
    read: ['admin', 'manager', 'user'],
    update: ['admin', 'manager'],
    delete: ['admin'],
  },
};

// Categories Data Loader Component
const CategoriesDataLoader: React.FC = () => {
  const { setConfig, setData, refreshData } = useDynamicTable();
  
  const { data: catData, isLoading, error, refetch: catRefetch } = useQuery({ 
    queryKey: ["/categories"], 
    queryFn: () => getJson<any>("/categories") 
  });
  
  const { data: subData } = useQuery({ 
    queryKey: ["/subCategories"], 
    queryFn: () => getJson<any>("/subCategories") 
  });

  // Set configuration on mount
  useEffect(() => {
    setConfig(categoriesConfig);
  }, [setConfig]);

  // Process and set data when it loads
  useEffect(() => {
    if (catData?.success && Array.isArray(catData.data)) {
      const categories = catData.data;
      const subcategories = subData?.success && Array.isArray(subData.data) ? subData.data : [];
      
      // Map category id to subcategories count
      const categoryIdToSubs: Record<string, any[]> = {};
      subcategories.forEach((sub: any) => {
        const cid = sub.categoryId?._id || sub.categoryId || sub.category_id;
        if (!cid) return;
        if (!categoryIdToSubs[cid]) categoryIdToSubs[cid] = [];
        categoryIdToSubs[cid].push(sub);
      });

      // Enhance categories with subcategory counts
      const enhancedCategories = categories.map((cat: any) => ({
        ...cat,
        subsCount: (categoryIdToSubs[cat._id || cat.id] || []).length,
        createdAt: cat.createdAt || '2025-01-01',
      }));

      setData(enhancedCategories);
    }
  }, [catData, subData, setData]);

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="text-center text-gray-500">Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="text-center text-red-500">Error loading categories: {error.message}</div>
      </div>
    );
  }

  return <DynamicTable />;
};

// Main Categories Component
export default function Categories() {
  return (
    <DynamicTableProvider>
      <div className="h-full overflow-y-auto p-6">
        <CategoriesDataLoader />
      </div>
    </DynamicTableProvider>
  );
}
