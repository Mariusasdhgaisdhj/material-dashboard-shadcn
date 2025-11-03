import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductApiService, Product, ProductSearchParams } from "@/lib/productApi";
import { getJson } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Image as ImageIcon,
  Calendar,
  User,
  Download,
  AlertCircle,
  RefreshCw,
  X,
  Archive,
  ArchiveRestore,
  EyeOff,
  Eye as EyeIcon
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function Products() {
  const queryClient = useQueryClient();
  
  // Search and filter states
  const [searchParams, setSearchParams] = useState<ProductSearchParams>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Fetch products with real API
  const { data: productsData, isLoading, error, refetch } = useQuery({
    queryKey: ['products', searchParams],
    queryFn: () => ProductApiService.getProducts(searchParams),
    retry: 2,
    staleTime: 30000, // 30 seconds
  });

  // Fetch categories
  const { data: catData } = useQuery({ 
    queryKey: ["/categories"], 
    queryFn: () => getJson<any>("/categories") 
  });
  
  // Fetch subcategories
  const { data: subData } = useQuery({ 
    queryKey: ["/subCategories"], 
    queryFn: () => getJson<any>("/subCategories") 
  });
  
  // Fetch sellers (users with role=seller)
  const { data: sellersData } = useQuery({ 
    queryKey: ["/users"], 
    queryFn: () => getJson<any>("/users") 
  });
  
  const categories: any[] = catData?.success && Array.isArray(catData.data) ? catData.data : [];
  const allSubcategories: any[] = subData?.success && Array.isArray(subData.data) ? subData.data : [];
  const sellers: any[] = sellersData?.success && Array.isArray(sellersData.data) 
    ? sellersData.data.filter((user: any) => {
        // More inclusive filtering - check multiple possible seller indicators
        const isSeller = user.role === 'seller' || 
                        user.isSeller === true || 
                        user.business_name || 
                        user.businessName ||
                        user.seller_request === 'approved';
        console.log('User seller check:', { 
          id: user._id, 
          name: user.name || user.email, 
          role: user.role, 
          isSeller: user.isSeller, 
          business_name: user.business_name,
          businessName: user.businessName,
          seller_request: user.seller_request,
          isSellerResult: isSeller 
        } );
        return isSeller;
      })
    : [];
  
  // Debug: Log all sellers with all possible ID fields
  console.log('All sellers:', sellers.map(s => ({ 
    _id: s._id, 
    id: s.id,
    name: s.business_name || s.businessName || s.name || s.email, 
    role: s.role, 
    isSeller: s.isSeller 
  })));
  
  // Use sellers directly for now to debug
  const uniqueSellers = sellers;

  // Filter subcategories based on selected category
  const getFilteredSubcategories = (categoryId: string) => {
    if (!categoryId) return [];
    return allSubcategories.filter((sub: any) => {
      const subCategoryId = sub.categoryId?._id || sub.categoryId || sub.category_id;
      return subCategoryId === categoryId;
    });
  };

  // Products data
  const products: Product[] = productsData?.data || [];
  const totalProducts = productsData?.total || 0;

  // UI States
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<{ type: "view"|"delete"|"add"|"edit"; id?: string }|null>(null);
  const [imageViewer, setImageViewer] = useState<{ url: string; idx: number } | null>(null);
  
  // Form states
  const [addForm, setAddForm] = useState({ 
    name: "", 
    price: "", 
    quantity: "", 
    description: "", 
    categoryId: "", 
    subcategoryId: "",
    sellerId: ""
  });
  const [editForm, setEditForm] = useState({ ...addForm });
  const [addImages, setAddImages] = useState<File[]>([]);
  const [editImages, setEditImages] = useState<File[]>([]);
  const [addImagePreviews, setAddImagePreviews] = useState<string[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: ProductApiService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Success', description: 'Product created successfully' });
      setOpen(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => {
      console.log('Updating product with ID:', id);
      console.log('FormData contents:', Array.from(data.entries()));
      return ProductApiService.updateProduct(id, data);
    },
    onSuccess: (data) => {
      console.log('Update successful, received data:', data);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Success', description: 'Product updated successfully' });
      setOpen(null);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ProductApiService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Success', description: 'Product deleted successfully' });
      setOpen(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: ProductApiService.bulkDeleteProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Success', description: 'Products deleted successfully' });
      setSelectedProducts(new Set());
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Chart Data
  const statsData = [
    { name: 'Total Products', value: products.length, color: '#10B981' },
    { name: 'Low Stock', value: products.filter(p => p.quantity < 10).length, color: '#F59E0B' },
    { name: 'High Value', value: products.filter(p => p.price > 1000).length, color: '#3B82F6' }
  ];

  // Handlers
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilter = (key: keyof ProductSearchParams, value: any) => {
    // Convert "all" to undefined to clear the filter
    const filterValue = value === "all" ? undefined : value;
    setSearchParams(prev => ({ ...prev, [key]: filterValue, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    ProductApiService.exportToCSV(products);
    toast({ title: 'Success', description: 'Products exported to CSV' });
  };

  const handleBulkDelete = () => {
    if (selectedProducts.size === 0) return;
    bulkDeleteMutation.mutate(Array.from(selectedProducts));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const currentImages = isEdit ? editImages : addImages;
    const newFiles = [...currentImages, ...files].slice(0, 5);
    if (isEdit) {
      setEditImages(newFiles);
      setEditImagePreviews(newFiles.map(file => URL.createObjectURL(file)));
    } else {
      setAddImages(newFiles);
      setAddImagePreviews(newFiles.map(file => URL.createObjectURL(file)));
    }
  };

  const removeImage = (index: number, isEdit = false) => {
    if (isEdit) {
      const newImages = editImages.filter((_, i) => i !== index);
      const newPreviews = editImagePreviews.filter((_, i) => i !== index);
      setEditImages(newImages);
      setEditImagePreviews(newPreviews);
    } else {
      const newImages = addImages.filter((_, i) => i !== index);
      const newPreviews = addImagePreviews.filter((_, i) => i !== index);
      setAddImages(newImages);
      setAddImagePreviews(newPreviews);
    }
  };

  // Get selected product for view/edit
  const selectedProduct = useMemo(() => {
    if (!open?.id) return null;
    return products.find(p => p._id === open.id) || null;
  }, [open, products]);

  const handleSubmit = async () => {
    if (!open) return;

    try {
      const isEdit = open.type === 'edit';
      const currentForm = isEdit ? editForm : addForm;
      const currentImages = isEdit ? editImages : addImages;

      if (!currentForm.name.trim() || !currentForm.price.trim()) {
        throw new Error('Name and price are required');
      }

      // Only require seller selection for new products, not when editing
      if (!isEdit && (!currentForm.sellerId || currentForm.sellerId.trim() === '')) {
        throw new Error('Please select a seller');
      }

      const formData = new FormData();
      formData.append('name', currentForm.name.trim());
      formData.append('price', currentForm.price.trim());
      formData.append('quantity', currentForm.quantity);
      formData.append('description', currentForm.description);
      if (currentForm.categoryId) formData.append('proCategoryId', currentForm.categoryId);
      if (currentForm.subcategoryId) formData.append('proSubCategoryId', currentForm.subcategoryId);
      if (currentForm.sellerId) formData.append('sellerId', currentForm.sellerId);

      // Debug: Log form data
      console.log('Form data being sent:', {
        name: currentForm.name.trim(),
        price: currentForm.price.trim(),
        quantity: currentForm.quantity,
        description: currentForm.description,
        categoryId: currentForm.categoryId,
        subcategoryId: currentForm.subcategoryId,
        sellerId: currentForm.sellerId
      });

      // Add images
      currentImages.forEach((file, index) => {
        formData.append(`image${index + 1}`, file);
      });

      if (isEdit) {
        updateMutation.mutate({ id: open.id!, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = () => {
    if (open?.id) {
      deleteMutation.mutate(open.id);
    }
  };

  // Format description like in Flutter app
  const formatDescription = (description: string) => {
    if (!description || description === 'No description available.') {
      return { isFormatted: false, content: description, entries: [] };
    }

    const lines = description.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const entries: Array<{ key: string; value: string }> = [];
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0 && colonIndex < line.length - 1) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        if (key.length <= 40 && value.length > 0) {
          entries.push({ key, value });
        }
      }
    }

    return {
      isFormatted: entries.length > 0,
      content: description,
      entries: entries
    };
  };

  // Initialize form when opening dialogs
  useEffect(() => {
    if (open?.type === 'edit' && selectedProduct) {
      setEditForm({
        name: selectedProduct.name || "",
        price: String(selectedProduct.price || ""),
        quantity: String(selectedProduct.quantity || ""),
        description: selectedProduct.description || "",
        categoryId: selectedProduct.proCategoryId?._id || "",
        subcategoryId: selectedProduct.proSubCategoryId?._id || "",
        sellerId: selectedProduct.sellerId?._id || selectedProduct.sellerId?._id || ""
      });
    } else if (open?.type === 'add') {
      setAddForm({
        name: "",
        price: "",
        quantity: "",
        description: "",
        categoryId: "",
        subcategoryId: "",
        sellerId: ""
      });
      setAddImages([]);
      setAddImagePreviews([]);
    }
  }, [open, selectedProduct]);

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-900">Error Loading Products</CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <p className="text-red-600 mb-4">Failed to load products. Please try again.</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-full overflow-y-auto p-6 custom-scrollbar"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-100"
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-400 to-green-400 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative p-8">
          <div className="flex justify-between items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center space-x-3 mb-2"
              >
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Products
                </h1>
               
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-slate-600 text-lg"
              >
                Manage your product catalog and inventory
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex items-center space-x-2"
            >
              <Button 
                onClick={handleRefresh}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={() => setOpen({ type: 'add' })}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

    

      {/* Main Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card className="border-green-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">Product Catalog</CardTitle>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
               
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            {/* Filters Row */}
            <div className="p-4 bg-stone-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchParams.search || ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <Select 
                  value={searchParams.categoryId || 'all'} 
                  onValueChange={(v) => {
                    handleFilter('categoryId', v);
                    handleFilter('subCategoryId', undefined); // Clear subcategory when category changes
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={searchParams.subCategoryId || 'all'} 
                  onValueChange={(v) => handleFilter('subCategoryId', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Subcategory" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Subcategories</SelectItem>
                    {getFilteredSubcategories(searchParams.categoryId || '').map(s => (
                      <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min Price"
                    value={searchParams.minPrice || ''}
                    onChange={(e) => handleFilter('minPrice', parseFloat(e.target.value) || undefined)}
                  />
                  <Input
                    type="number"
                    placeholder="Max Price"
                    value={searchParams.maxPrice || ''}
                    onChange={(e) => handleFilter('maxPrice', parseFloat(e.target.value) || undefined)}
                  />
                </div>
                <Select 
                  value={searchParams.sortBy || 'createdAt'} 
                  onValueChange={(v) => handleFilter('sortBy', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="quantity">Stock</SelectItem>
                    <SelectItem value="createdAt">Date</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setSearchParams({ page: 1, limit: 10, search: '', sortBy: 'createdAt', sortOrder: 'desc', categoryId: undefined, subCategoryId: undefined, minPrice: undefined, maxPrice: undefined })}>
                    Clear
                  </Button>
                
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.size > 0 && (
              <div className="p-4 bg-red-50 border-b">
                <div className="flex justify-between items-center">
                  <span>{selectedProducts.size} selected</span>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                  >
                    {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3">
                      <Checkbox 
                        checked={selectedProducts.size === products.length && products.length > 0} 
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedProducts(new Set(products.map(p => p._id)));
                          else setSelectedProducts(new Set());
                        }} 
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Images</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Visibility</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-stone-50">
                      <td className="px-6 py-4">
                        <Checkbox 
                          checked={selectedProducts.has(product._id)} 
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedProducts);
                            if (checked) newSet.add(product._id); 
                            else newSet.delete(product._id);
                            setSelectedProducts(newSet);
                          }} 
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        <div className="flex items-center space-x-3">
                          {product.images && product.images.length > 0 && (
                            <img 
                              src={product.images[0].url} 
                              alt={product.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        ₱{Number(product.price || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{product.quantity}</span>
                          {product.quantity < 10 && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {product.proCategoryId?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {product.sellerId?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {product.images?.length || 0} images
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        <div className="flex items-center gap-2">
                          {product.hidden ? <Badge variant="secondary" className="bg-stone-200 text-stone-700">Hidden</Badge> : null}
                          {product.archived ? <Badge variant="secondary" className="bg-stone-200 text-stone-700">Archived</Badge> : null}
                          {!product.hidden && !product.archived ? <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Visible</Badge> : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setOpen({ type: 'view', id: product._id })}
                        >
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setOpen({ type: 'edit', id: product._id })}
                        >
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className={product.hidden ? 'text-emerald-600 border-emerald-300' : 'text-stone-700'}
                          onClick={async () => {
                            const newHiddenState = !product.hidden;
                            // Optimistic update
                            queryClient.setQueryData(['products', searchParams], (oldData: any) => {
                              if (!oldData) return oldData;
                              return {
                                ...oldData,
                                data: oldData.data.map((p: Product) =>
                                  p._id === product._id ? { ...p, hidden: newHiddenState } : p
                                )
                              };
                            });
                            try {
                              await ProductApiService.updateFlags(product._id, { hidden: newHiddenState });
                              // Refetch immediately to ensure sync
                              await queryClient.refetchQueries({ queryKey: ['products'] });
                              toast({ title: 'Success', description: newHiddenState ? 'Product hidden' : 'Product unhidden' });
                              try {
                                const sellerId = product.sellerId?._id || '';
                                if (sellerId) {
                                  await ProductApiService.notify(product._id, {
                                    type: newHiddenState ? 'product_hidden' : 'product_unhidden',
                                    sellerId,
                                    productName: product.name,
                                  });
                                }
                              } catch (_) {}
                            } catch (e: any) {
                              // Revert optimistic update on error
                              queryClient.setQueryData(['products', searchParams], (oldData: any) => {
                                if (!oldData) return oldData;
                                return {
                                  ...oldData,
                                  data: oldData.data.map((p: Product) =>
                                    p._id === product._id ? { ...p, hidden: product.hidden } : p
                                  )
                                };
                              });
                              toast({ title: 'Error', description: e.message, variant: 'destructive' });
                            }
                          }}
                        >
                          {product.hidden ? <EyeIcon className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />} {product.hidden ? 'Unhide' : 'Hide'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className={product.archived ? 'text-emerald-600 border-emerald-300' : 'text-stone-700'}
                          onClick={async () => {
                            const newArchivedState = !product.archived;
                            // Optimistic update
                            queryClient.setQueryData(['products', searchParams], (oldData: any) => {
                              if (!oldData) return oldData;
                              return {
                                ...oldData,
                                data: oldData.data.map((p: Product) =>
                                  p._id === product._id ? { ...p, archived: newArchivedState } : p
                                )
                              };
                            });
                            try {
                              await ProductApiService.updateFlags(product._id, { archived: newArchivedState });
                              // Refetch immediately to ensure sync
                              await queryClient.refetchQueries({ queryKey: ['products'] });
                              toast({ title: 'Success', description: newArchivedState ? 'Product archived' : 'Product unarchived' });
                              try {
                                const sellerId = product.sellerId?._id || '';
                                if (sellerId) {
                                  await ProductApiService.notify(product._id, {
                                    type: newArchivedState ? 'product_archived' : 'product_unarchived',
                                    sellerId,
                                    productName: product.name,
                                  });
                                }
                              } catch (_) {}
                            } catch (e: any) {
                              // Revert optimistic update on error
                              queryClient.setQueryData(['products', searchParams], (oldData: any) => {
                                if (!oldData) return oldData;
                                return {
                                  ...oldData,
                                  data: oldData.data.map((p: Product) =>
                                    p._id === product._id ? { ...p, archived: product.archived } : p
                                  )
                                };
                              });
                              toast({ title: 'Error', description: e.message, variant: 'destructive' });
                            }
                          }}
                        >
                          {product.archived ? <ArchiveRestore className="w-4 h-4 mr-1" /> : <Archive className="w-4 h-4 mr-1" />} {product.archived ? 'Unarchive' : 'Archive'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => setOpen({ type: 'delete', id: product._id })}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t">
              <Pagination>
                <PaginationContent className="bg-white">
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max((searchParams.page || 1) - 1, 1))}
                      className={searchParams.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.ceil(totalProducts / (searchParams.limit || 10)) }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        onClick={() => handlePageChange(page)} 
                        isActive={searchParams.page === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min((searchParams.page || 1) + 1, Math.ceil(totalProducts / (searchParams.limit || 10))))}
                      className={searchParams.page === Math.ceil(totalProducts / (searchParams.limit || 10)) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>
              {open?.type === 'add' && 'Add Product'}
              {open?.type === 'edit' && 'Edit Product'}
              {open?.type === 'view' && 'View Product'}
              {open?.type === 'delete' && 'Delete Product'}
            </DialogTitle>
          </DialogHeader>

          {(open?.type === 'add' || open?.type === 'edit') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input 
                    value={open.type === 'edit' ? editForm.name : addForm.name} 
                    onChange={(e) => {
                      if (open.type === 'edit') setEditForm(f => ({ ...f, name: e.target.value }));
                      else setAddForm(f => ({ ...f, name: e.target.value }));
                    }} 
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <Label>Price *</Label>
                  <Input 
                    type="number" 
                    value={open.type === 'edit' ? editForm.price : addForm.price} 
                    onChange={(e) => {
                      if (open.type === 'edit') setEditForm(f => ({ ...f, price: e.target.value }));
                      else setAddForm(f => ({ ...f, price: e.target.value }));
                    }} 
                    placeholder="Enter price"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity *</Label>
                  <Input 
                    type="number" 
                    value={open.type === 'edit' ? editForm.quantity : addForm.quantity} 
                    onChange={(e) => {
                      if (open.type === 'edit') setEditForm(f => ({ ...f, quantity: e.target.value }));
                      else setAddForm(f => ({ ...f, quantity: e.target.value }));
                    }} 
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <Label>Seller *</Label>
                  <Select 
                    value={open.type === 'edit' ? (editForm.sellerId || '') : (addForm.sellerId || '')} 
                    onValueChange={(v) => {
                      console.log('Seller selected:', v);
                      if (open.type === 'edit') setEditForm(f => ({ ...f, sellerId: v }));
                      else setAddForm(f => ({ ...f, sellerId: v }));
                    }}
                    disabled={false}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select seller" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {uniqueSellers.map(seller => {
                        const sellerId = seller._id || seller.id;
                        const sellerName = seller.business_name || seller.businessName || seller.name || seller.email;
                        console.log('Rendering seller:', sellerId, sellerName);
                        
                        // Skip sellers without valid IDs
                        if (!sellerId) {
                          console.warn('Skipping seller without ID:', seller);
                          return null;
                        }
                        
                        return (
                          <SelectItem key={sellerId} value={sellerId}>
                            {sellerName}
                          </SelectItem>
                        );
                      }).filter(Boolean)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <textarea 
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  value={open.type === 'edit' ? editForm.description : addForm.description} 
                  onChange={(e) => {
                    if (open.type === 'edit') setEditForm(f => ({ ...f, description: e.target.value }));
                    else setAddForm(f => ({ ...f, description: e.target.value }));
                  }} 
                  placeholder="Enter product description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={open.type === 'edit' ? editForm.categoryId : addForm.categoryId} 
                    onValueChange={(v) => {
                      if (open.type === 'edit') {
                        setEditForm(f => ({ ...f, categoryId: v, subcategoryId: "" }));
                      } else {
                        setAddForm(f => ({ ...f, categoryId: v, subcategoryId: "" }));
                      }
                    }}
                  >
                    <SelectTrigger >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {categories.map(c => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subcategory</Label>
                  <Select 
                    value={open.type === 'edit' ? editForm.subcategoryId : addForm.subcategoryId} 
                    onValueChange={(v) => {
                      if (open.type === 'edit') setEditForm(f => ({ ...f, subcategoryId: v }));
                      else setAddForm(f => ({ ...f, subcategoryId: v }));
                    }}
                    disabled={!(open.type === 'edit' ? editForm.categoryId : addForm.categoryId)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        (open.type === 'edit' ? editForm.categoryId : addForm.categoryId) 
                          ? "Select subcategory" 
                          : "Select category first"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {getFilteredSubcategories(open.type === 'edit' ? editForm.categoryId : addForm.categoryId).map(s => (
                        <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Images (Max 5)</Label>
                <Input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={(e) => handleImageSelect(e, open.type === 'edit')} 
                />
                <p className="text-xs text-stone-500 mt-1">
                  {(open.type === 'edit' ? editImages.length : addImages.length)}/5 selected
                </p>
              </div>

              {(open.type === 'edit' ? editImagePreviews : addImagePreviews).length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {(open.type === 'edit' ? editImagePreviews : addImagePreviews).map((preview, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-md border">
                      <img src={preview} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                      <button 
                        onClick={() => removeImage(idx, open.type === 'edit')} 
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (open.type === 'edit' ? 'Update' : 'Create')}
                </Button>
              </div>
            </div>
          )}

          {open?.type === 'view' && selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={selectedProduct.name} readOnly />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input value={`₱${selectedProduct.price.toLocaleString()}`} readOnly />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input value={selectedProduct.quantity.toString()} readOnly />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={selectedProduct.proCategoryId?.name || "-"} readOnly />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <div className="mt-1">
                  {(() => {
                    const formatted = formatDescription(selectedProduct.description || '');
                    if (formatted.isFormatted) {
                      return (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center mb-2">
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-2">
                              <span className="text-white text-xs">🌱</span>
                            </div>
                            <span className="font-semibold text-green-800">Care & Maintenance</span>
                          </div>
                          <div className="space-y-2">
                            {formatted.entries.map((entry, index) => (
                              <div key={index} className="flex items-start">
                                <span className="text-slate-500 mr-2">•</span>
                                <div className="flex-1">
                                  <span className="font-semibold text-slate-800">{entry.key}: </span>
                                  <span className="text-slate-700">{entry.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm text-stone-800 min-h-[44px] whitespace-pre-wrap break-words leading-relaxed">
                          {formatted.content || "-"}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subcategory</Label>
                  <Input value={selectedProduct.proSubCategoryId?.name || "-"} readOnly />
                </div>
                <div>
                  <Label>Seller</Label>
                  <Input value={selectedProduct.sellerId?.name || "-"} readOnly />
                </div>
              </div>

              <div>
                <Label>Images</Label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageViewer({ url: img.url, idx })}
                        className="aspect-square overflow-hidden rounded-md border border-stone-200 bg-stone-50 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-stone-400"
                        aria-label={`View image ${idx + 1}`}
                      >
                        <img src={img.url} alt={`Product image ${idx + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))
                  ) : (
                    <div className="text-sm text-stone-500">No images</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button onClick={() => setOpen(null)}>Close</Button>
              </div>
            </div>
          )}

          {open?.type === 'delete' && (
            <div className="space-y-4">
              <p className="text-sm">Are you sure you want to delete this product?</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
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
                alt="Full image" 
                className="w-full h-full object-contain" 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}