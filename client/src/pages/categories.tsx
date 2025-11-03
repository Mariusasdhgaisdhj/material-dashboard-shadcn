import React, { useEffect, useState, useMemo } from 'react';
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
  Hash,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Building2,
  Tag
} from 'lucide-react';
import { DynamicTableProvider, useDynamicTable, TableConfig } from '@/contexts/DynamicTableContext';
import { DynamicTable } from '@/components/DynamicTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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
        // This will be handled by the component
      },
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: 'Edit',
      type: 'button',
      variant: 'outline',
      onClick: async (row) => {
        // This will be handled by the component
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'Trash2',
      type: 'button',
      variant: 'destructive',
      onClick: async (row) => {
        // This will be handled by the component
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

// Helper for safe message extraction
async function safeMessage(res: Response): Promise<string | undefined> {
  try {
    const data = await res.json();
    return (data && typeof data === 'object') ? (data.message || data.error) : undefined;
  } catch {
    return undefined;
  }
}

// Categories Data Loader Component
const CategoriesDataLoader: React.FC = () => {
  const { setConfig, setData, refreshData, addRow, updateRow, deleteRow } = useDynamicTable();
  
  const { data: catData, isLoading, error, refetch: catRefetch } = useQuery({ 
    queryKey: ["/categories"], 
    queryFn: () => getJson<any>("/categories") 
  });
  
  const { data: subData, refetch: subRefetch } = useQuery({ 
    queryKey: ["/subCategories"], 
    queryFn: () => getJson<any>("/subCategories") 
  });
  
  // Dialog states
  const [open, setOpen] = useState<{ 
    type: "addCat" | "editCat" | "delCat" | "addSub" | "editSub" | "delSub"; 
    id?: string; 
    parentId?: string 
  } | null>(null);
  
  const [imageViewer, setImageViewer] = useState<{ url: string; name?: string } | null>(null);
  const [form, setForm] = useState<{ 
    name: string; 
    file?: File | null; 
    imageUrl?: string; 
    categoryId?: string 
  }>({ name: "" });
  const [chartAnimations, setChartAnimations] = useState({
    categoryBars: false,
    circularCharts: false,
    statCards: false
  });
  const [showCharts, setShowCharts] = useState(false);

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

      // Hide charts and reset animations
      setShowCharts(false);
      setChartAnimations({
        categoryBars: false,
        circularCharts: false,
        statCards: false
      });

      setData(enhancedCategories);
      
      // Show charts first, then animate
      setTimeout(() => {
        setShowCharts(true);
        
        // Animate progress bars first
        setTimeout(() => {
          setChartAnimations(prev => ({ ...prev, categoryBars: true }));
        }, 300);
        
        // Animate stat cards second
        setTimeout(() => {
          setChartAnimations(prev => ({ ...prev, statCards: true }));
        }, 600);
        
        // Animate circular charts last
        setTimeout(() => {
          setChartAnimations(prev => ({ ...prev, circularCharts: true }));
        }, 900);
        
      }, 100);
    }
  }, [catData, subData, setData]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setForm({ name: "" });
    }
  }, [open]);

  // Dialog handlers
  const startAddCategory = () => setOpen({ type: "addCat" });
  const startEditCategory = (cat: any) => {
    setForm({ name: cat.name, file: null, imageUrl: cat.image });
    setOpen({ type: "editCat", id: cat._id || cat.id });
  };
  const startDeleteCategory = (cat: any) => setOpen({ type: "delCat", id: cat._id || cat.id });

  const startAddSub = (cat: any) => {
    setForm({ name: "", categoryId: cat._id || cat.id });
    setOpen({ type: "addSub", parentId: cat._id || cat.id });
  };
  const startEditSub = (sub: any) => {
    setForm({ name: sub.name, categoryId: sub.categoryId?._id || sub.categoryId });
    setOpen({ type: "editSub", id: sub._id || sub.id, parentId: sub.categoryId?._id || sub.categoryId });
  };
  const startDeleteSub = (sub: any) => setOpen({ type: "delSub", id: sub._id || sub.id });

  // Submit handler
  const submit = async () => {
    if (!open) return;
    let success = false;
    
    try {
      if (open.type === "addCat") {
        const fd = new FormData();
        fd.append("name", form.name.trim());
        if (form.file) fd.append("img", form.file);
        const res = await fetch(apiUrl("/categories"), { method: "POST", body: fd });
        if (!res.ok) {
          const msg = await safeMessage(res);
          throw new Error(msg || `Add category failed: ${res.status}`);
        }
        success = true;
        toast({ title: 'Success', description: 'Category added' });
      }
      
      if (open.type === "editCat" && open.id) {
        const fd = new FormData();
        fd.append("name", form.name.trim());
        if (form.file) {
          fd.append("img", form.file);
        } else if (form.imageUrl) {
          fd.append("image", form.imageUrl);
        }
        const res = await fetch(apiUrl(`/categories/${open.id}`), { method: "PUT", body: fd });
        if (!res.ok) {
          const msg = await safeMessage(res);
          throw new Error(msg || `Edit category failed: ${res.status}`);
        }
        success = true;
        toast({ title: 'Success', description: 'Category updated' });
      }
      
      if (open.type === "delCat" && open.id) {
        const res = await fetch(apiUrl(`/categories/${open.id}`), { method: "DELETE" });
        if (!res.ok) {
          const msg = await safeMessage(res);
          throw new Error(msg || `Delete category failed: ${res.status}`);
        }
        success = true;
        toast({ title: 'Success', description: 'Category deleted' });
      }
      
      if (open.type === "addSub" && (form.categoryId || open.parentId)) {
        const res = await fetch(apiUrl("/subCategories"), { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name.trim(), categoryId: form.categoryId || open.parentId })
        });
        if (!res.ok) {
          const msg = await safeMessage(res);
          throw new Error(msg || `Add subcategory failed: ${res.status}`);
        }
        success = true;
        toast({ title: 'Success', description: 'Subcategory added' });
      }
      
      if (open.type === "editSub" && open.id) {
        const res = await fetch(apiUrl(`/subCategories/${open.id}`), { 
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name.trim(), categoryId: form.categoryId || open.parentId })
        });
        if (!res.ok) {
          const msg = await safeMessage(res);
          throw new Error(msg || `Edit subcategory failed: ${res.status}`);
        }
        success = true;
        toast({ title: 'Success', description: 'Subcategory updated' });
      }
      
      if (open.type === "delSub" && open.id) {
        const res = await fetch(apiUrl(`/subCategories/${open.id}`), { method: "DELETE" });
        if (!res.ok) {
          const msg = await safeMessage(res);
          throw new Error(msg || `Delete subcategory failed: ${res.status}`);
        }
        success = true;
        toast({ title: 'Success', description: 'Subcategory deleted' });
      }
    } catch (e: any) {
      console.error('Mutation failed:', e);
      toast({ title: 'Error', description: e?.message || 'Action failed', variant: 'destructive' });
    } finally {
      if (success) {
        setOpen(null);
        await Promise.all([catRefetch(), subRefetch()]);
      }
    }
  };

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

  // Create a custom table component with dialog integration
  const CustomCategoriesTable = () => {
    const { state, setSearchTerm, clearFilters, setSorting, setPagination, selectAll, deselectAll, toggleRowSelection, executeBulkAction, paginatedData, totalPages, hasSelection, isAllSelected } = useDynamicTable();

    return (
      <div className="space-y-6">
       
        
        {/* Subcategories Management Section */}
        {subData?.success && Array.isArray(subData.data) && subData.data.length > 0 && (
          <div className="border-gray-200 bg-white shadow-lg rounded-lg">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Subcategories ({subData.data.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setOpen({ type: "addSub" })}>
                    <Plus className="w-4 h-4 mr-2" /> Add Subcategory
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-normal text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subData.data.map((sub: any, idx: number) => {
                      const subId = sub._id || sub.id;
                      return (
                        <tr key={subId || idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {sub.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {sub.categoryId?.name || 'Unknown Category'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(sub.createdAt || '2025-01-01').toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => startEditSub(sub)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => startDeleteSub(sub)}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Main Table */}
        <div className="border-gray-200 bg-white shadow-lg rounded-lg">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Categories ({paginatedData.length})
              </h2>
              <div className="flex items-center space-x-2">
                <Button size="sm" onClick={startAddCategory}>
                  <Plus className="w-4 h-4 mr-2" /> Add Category
                </Button>
                <Button variant="outline" size="sm" onClick={() => executeBulkAction('export')}>
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-0">
            {/* Filters */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <Input
                    placeholder="Search categories..."
                    value={state.searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Min Subcategories"
                  onChange={(e) => {/* Handle min subcategories filter */}}
                />
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {hasSelection && (
              <div className="p-4 bg-red-50 border-b">
                <div className="flex justify-between items-center">
                  <span>{state.selectedRows.size} selected</span>
                  <Button variant="destructive" size="sm" onClick={() => executeBulkAction('bulkDelete')}>
                    Delete Selected
                  </Button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => {
                          if (e.target.checked) selectAll();
                          else deselectAll();
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Subcategories</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Image</th>
                    <th className="px-6 py-3 text-right text-xs font-normal text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No categories found</td>
                    </tr>
                  ) : (
                    paginatedData.map((category, idx) => {
                      const catId = category._id || category.id;
                      return (
                        <tr key={catId || idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={state.selectedRows.has(catId)}
                              onChange={() => toggleRowSelection(catId)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {category.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {category.subsCount || 0}
                              </span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => startAddSub(category)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(category.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {category.image && category.image !== 'no_url' ? (
                              <button
                                onClick={() => setImageViewer({ url: category.image, name: category.name })}
                                className="w-12 h-12 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-zoom-in"
                              >
                                <img src={category.image} alt={category.name} className="w-12 h-12 object-cover" />
                              </button>
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                            <Button size="sm" variant="ghost" onClick={() => startAddSub(category)} className="text-green-600 hover:text-green-800">
                              <Plus className="w-3 h-3 mr-1" /> Sub
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => startEditCategory(category)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => startDeleteCategory(category)}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((state.currentPage - 1) * state.itemsPerPage) + 1} to{' '}
                    {Math.min(state.currentPage * state.itemsPerPage, state.data.length)} of{' '}
                    {state.data.length} results
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(state.currentPage - 1)}
                      disabled={state.currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={state.currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPagination(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(state.currentPage + 1)}
                      disabled={state.currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <CustomCategoriesTable />
      
      {/* Dialogs */}
        <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md bg-white border border-gray-200">
            <DialogHeader>
              <DialogTitle>
                {open?.type === "addCat" && "Add Category"}
                {open?.type === "editCat" && "Edit Category"}
                {open?.type === "delCat" && "Delete Category"}
                {open?.type === "addSub" && "Add Subcategory"}
                {open?.type === "editSub" && "Edit Subcategory"}
                {open?.type === "delSub" && "Delete Subcategory"}
              </DialogTitle>
            </DialogHeader>

            {open && (open.type === "addCat" || open.type === "editCat") && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="catName">Name</Label>
                <Input 
                  id="catName" 
                  value={form.name} 
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                />
                </div>
                <div>
                  <Label htmlFor="catFile">Image</Label>
                <Input 
                  id="catFile" 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))} 
                />
                {form.file && (
                  <img 
                    src={URL.createObjectURL(form.file)} 
                    alt="Preview" 
                    className="mt-2 w-32 h-32 object-cover rounded" 
                  />
                )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                  <Button onClick={submit} disabled={!form.name.trim()}>Save</Button>
                </div>
              </div>
            )}

            {open && (open.type === "addSub" || open.type === "editSub") && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subName">Subcategory Name</Label>
                <Input 
                  id="subName" 
                  value={form.name} 
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                />
                </div>
                <div>
                  <Label>Category</Label>
                <Select 
                  value={form.categoryId || open?.parentId || undefined} 
                  onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
                >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto bg-white border border-gray-200 rounded-md shadow-md">
                    {catData?.data?.map((c: any) => (
                      <SelectItem key={c._id || c.id} value={(c._id || c.id) as string}>
                        {c.name}
                      </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button 
                  onClick={submit} 
                  disabled={!form.name.trim() || !(form.categoryId || open?.parentId)}
                >
                  Save
                </Button>
              </div>
              </div>
            )}

            {open && (open.type === "delCat" || open.type === "delSub") && (
              <div className="space-y-4">
                <p className="text-sm">Are you sure? This will delete "{form.name || 'this item'}".</p>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                  <Button variant="destructive" onClick={submit}>Delete</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      {/* Image Viewer */}
        <Dialog open={!!imageViewer} onOpenChange={(o) => !o && setImageViewer(null)}>
          <DialogContent className="max-w-5xl w-[90vw] bg-white p-0">
            <div className="relative w-full h-[80vh] bg-black">
              {imageViewer?.url && (
                <img
                  src={imageViewer.url}
                  alt={imageViewer?.name || 'Full image'}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
    </>
  );
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