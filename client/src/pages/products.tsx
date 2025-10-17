import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getJson, apiUrl } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function Products() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/products"],
    queryFn: () => getJson<any>("/products?page=1&limit=50"),
  });

  const { data: catData } = useQuery({ 
    queryKey: ["/categories"], 
    queryFn: () => getJson<any>("/categories") 
  });
  const { data: subData } = useQuery({ 
    queryKey: ["/subCategories"], 
    queryFn: () => getJson<any>("/subCategories") 
  });
  
  const categories: any[] = catData?.success && Array.isArray(catData.data) ? catData.data : [];
  const subcategories: any[] = subData?.success && Array.isArray(subData.data) ? subData.data : [];

  // Map category ID to its subcategories
  const categoryIdToSubs = useMemo(() => {
    const map: Record<string, any[]> = {};
    subcategories.forEach((s) => {
      const cid = s.categoryId?._id || s.categoryId || s.category_id;
      if (!cid) return;
      if (!map[cid]) map[cid] = [];
      map[cid].push(s);
    });
    return map;
  }, [subcategories]);

  // Normalize rows and memoize to avoid recreating array each render
  const rows: any[] = useMemo(() => (
    (data?.success && Array.isArray(data.data) ? data.data : []).map((p: any) => ({
    id: p.id || p._id, // backend sometimes uses _id
    name: p.name,
    price: p.price ?? p.totalPrice ?? 0,
    isFeatured: Boolean(p.is_featured || p.isFeatured),
    sellerName: p.users?.name || p.seller?.name || p.sellerId?.name || "-",
    images: Array.isArray(p.images)
      ? p.images.map((img: any) => img.url || img.imageUrl || img.image)
      : Array.isArray(p.product_images)
        ? p.product_images.map((img: any) => img.url || img.imageUrl || img.image)
        : [],
    // intentionally omit images to avoid showing them
    }))
  ), [data]);

  const [open, setOpen] = useState<{ type: "view"|"delete"|"add"; id?: string }|null>(null);
  const [form, setForm] = useState({ name: "", price: "" });
  const [addForm, setAddForm] = useState({ 
    name: "", 
    price: "", 
    quantity: "", 
    description: "", 
    categoryId: "",
    subcategoryId: "",
    sellerFirstName: "",
    sellerLastName: "",
    sellerBusinessName: ""
  });
  const [addImages, setAddImages] = useState<File[]>([]);
  const [addImagePreviews, setAddImagePreviews] = useState<string[]>([]);
  const [imageViewer, setImageViewer] = useState<{ url: string; idx: number } | null>(null);

  useEffect(() => {
    if (open?.type === 'view') {
      const p = rows.find((r) => r.id === open.id);
      if (p) setForm({ name: p.name || "", price: String(p.price ?? '') });
    }
    if (open?.type === 'add') {
      setAddForm({ 
        name: "", 
        price: "", 
        quantity: "", 
        description: "", 
        categoryId: "",
        subcategoryId: "",
        sellerFirstName: "",
        sellerLastName: "",
        sellerBusinessName: ""
      });
      setAddImages([]);
      setAddImagePreviews([]);
    }
  }, [open, rows]);

  // Use the original payload to access full product details from backend
  const selected = useMemo(() => {
    if (!open?.id) return null;
    const src: any[] = (data?.success && Array.isArray(data.data)) ? data.data : [];
    return src.find((p: any) => (p.id || p._id) === open.id) || null;
  }, [open, data]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Limit to 6 images total
    const newFiles = [...addImages, ...files].slice(0, 6);
    setAddImages(newFiles);
    
    // Create previews
    const previews = newFiles.map(file => URL.createObjectURL(file));
    setAddImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    const newImages = addImages.filter((_, i) => i !== index);
    const newPreviews = addImagePreviews.filter((_, i) => i !== index);
    setAddImages(newImages);
    setAddImagePreviews(newPreviews);
  };

  const submit = async () => {
    if (!open) return;
    try {
      if (open.type === 'add') {
        if (!addForm.name.trim() || !addForm.price.trim()) {
          throw new Error('Name and price are required');
        }
        
        const formData = new FormData();
        formData.append('name', addForm.name.trim());
        formData.append('price', addForm.price.trim());
        if (addForm.quantity.trim()) formData.append('quantity', addForm.quantity.trim());
        if (addForm.description.trim()) formData.append('description', addForm.description.trim());
        if (addForm.categoryId) formData.append('categoryId', addForm.categoryId);
        if (addForm.subcategoryId) formData.append('subcategoryId', addForm.subcategoryId);
        if (addForm.sellerFirstName.trim()) formData.append('sellerFirstName', addForm.sellerFirstName.trim());
        if (addForm.sellerLastName.trim()) formData.append('sellerLastName', addForm.sellerLastName.trim());
        if (addForm.sellerBusinessName.trim()) formData.append('sellerBusinessName', addForm.sellerBusinessName.trim());
        
        // Add images
        addImages.forEach((file) => {
          formData.append('images', file);
        });

        const res = await fetch(apiUrl('/products'), {
          method: 'POST',
          body: formData,
        });
        
        if (!res.ok) {
          let message = 'Create failed';
          try { const j = await res.json(); message = j?.message || message; } catch {}
          throw new Error(message);
        }
        
        toast({ title: 'Created', description: 'Product added successfully' });
      }
      if (open.type === 'delete') {
        const res = await fetch(apiUrl(`/products/${open.id}`), { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        toast({ title: 'Deleted', description: 'Product deleted' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Action failed', variant: 'destructive' });
    } finally {
      setOpen(null);
      await refetch();
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-stone-200"><CardHeader className="border-b border-stone-200"><CardTitle className="text-lg font-semibold text-stone-900">Products</CardTitle></CardHeader><CardContent className="p-6 bg-white">Loading...</CardContent></Card>
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-stone-200"><CardHeader className="border-b border-stone-200"><CardTitle className="text-lg font-semibold text-stone-900">Products</CardTitle></CardHeader><CardContent className="p-6 text-red-500">Failed to load</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <Card className="border-black-200 bg-white">
        <CardHeader className="border-b border-stone-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-stone-900">Products ({rows.length})</CardTitle>
            <Button size="sm" onClick={() => setOpen({ type: 'add' })}>Add Product</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">{p.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">₱{Number(p.price || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">{p.sellerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(apiUrl(`/products/${p.id}/featured`), {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isFeatured: !p.isFeatured })
                            });
                            if (!res.ok) throw new Error('Toggle failed');
                            toast({ title: 'Updated', description: `Product ${!p.isFeatured ? 'marked' : 'removed'} as featured` });
                            await refetch();
                          } catch (e: any) {
                            toast({ title: 'Error', description: e?.message || 'Update failed', variant: 'destructive' });
                          }
                        }}
                        className={`px-2 py-1 rounded-md border ${p.isFeatured ? 'bg-green-100 text-green-700 border-green-300' : 'bg-stone-100 text-stone-700 border-stone-300'}`}
                        aria-label="Toggle Featured"
                      >
                        {p.isFeatured ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setOpen({ type: 'view', id: p.id })}>View</Button>
                      <Button size="sm" variant="destructive" onClick={() => setOpen({ type: 'delete', id: p.id })}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>
            {open?.type === 'add' && 'Add Product'}
            {open?.type === 'view' && 'View Product'}
            {open?.type === 'delete' && 'Delete Product'}
          </DialogTitle></DialogHeader>

          {open?.type === 'add' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-name">Product Name *</Label>
                <Input 
                  id="add-name" 
                  value={addForm.name} 
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} 
                  placeholder="Enter product name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="add-price">Price *</Label>
                  <Input 
                    id="add-price" 
                    type="number" 
                    value={addForm.price} 
                    onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))} 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="add-quantity">Quantity</Label>
                  <Input 
                    id="add-quantity" 
                    type="number" 
                    value={addForm.quantity} 
                    onChange={(e) => setAddForm((f) => ({ ...f, quantity: e.target.value }))} 
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="add-description">Description</Label>
                <textarea 
                  id="add-description"
                  value={addForm.description}
                  onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-black-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  placeholder="Enter product description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="add-category">Category</Label>
                  <Select value={addForm.categoryId} onValueChange={(v) => setAddForm((f) => ({ ...f, categoryId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {categories.map((c) => (
                        <SelectItem key={c._id || c.id} value={(c._id || c.id) as string}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="add-subcategory">Subcategory</Label>
                  <Select 
                    value={addForm.subcategoryId} 
                    onValueChange={(v) => setAddForm((f) => ({ ...f, subcategoryId: v }))}
                    disabled={!addForm.categoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {addForm.categoryId 
                        ? (categoryIdToSubs[addForm.categoryId] || []).map((s) => (
                            <SelectItem key={s._id || s.id} value={(s._id || s.id) as string}>
                              {s.name}
                            </SelectItem>
                          ))
                        : subcategories.map((s) => (
                            <SelectItem key={s._id || s.id} value={(s._id || s.id) as string}>
                              {s.name}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Seller Information</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="add-seller-first">First Name</Label>
                    <Input 
                      id="add-seller-first" 
                      value={addForm.sellerFirstName} 
                      onChange={(e) => setAddForm((f) => ({ ...f, sellerFirstName: e.target.value }))} 
                      placeholder="Seller first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-seller-last">Last Name</Label>
                    <Input 
                      id="add-seller-last" 
                      value={addForm.sellerLastName} 
                      onChange={(e) => setAddForm((f) => ({ ...f, sellerLastName: e.target.value }))} 
                      placeholder="Seller last name"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="add-seller-business">Business Name</Label>
                    <Input 
                      id="add-seller-business" 
                      value={addForm.sellerBusinessName} 
                      onChange={(e) => setAddForm((f) => ({ ...f, sellerBusinessName: e.target.value }))} 
                      placeholder="Business name"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="add-images">Product Images (Max 6)</Label>
                <Input 
                  id="add-images" 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={handleImageSelect}
                  disabled={addImages.length >= 6}
                />
                <p className="text-xs text-stone-500 mt-1">{addImages.length}/6 images selected</p>
              </div>
              {addImagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {addImagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-md border border-stone-200 bg-stone-50">
                      <img src={preview} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button onClick={submit}>Create Product</Button>
              </div>
            </div>
          )}

          {open?.type === 'view' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} readOnly />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input id="price" value={form.price} readOnly />
              </div>
            
              <div>
                <Label>Quantity</Label>
                <Input value={selected?.quantity ?? ""} readOnly />
              </div>
              <div>
                <Label>Description</Label>
                <div className="mt-1 rounded-md border border-black-200 bg-white p-3 text-sm text-stone-800 min-h-[44px] whitespace-pre-wrap break-words leading-relaxed">
                  {selected?.description || "-"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Input value={selected?.proCategoryId?.name || "-"} readOnly />
                </div>
                <div>
                  <Label>Subcategory</Label>
                  <Input value={selected?.proSubCategoryId?.name || "-"} readOnly />
                </div>
                
              </div>
              <div>
                <Label>Seller</Label>
                <b>



                </b>
                <div className="mt-1 grid grid-cols-2 gap-3">
                  <Label> First Name
                  <Input value={selected?.sellerId?.name || selected?.users?.name || "-"} readOnly />
                  </Label>
                  <Label>Last Name
                  <Input value={selected?.sellerId?.email || selected?.users?.email || "-"} readOnly />
                  </Label>
                  <Label>Business Name
                  <Input value={selected?.sellerId?.businessName || "-"} readOnly />
                  </Label>
                 
                  
                </div>
              </div>
              <div>
                <Label>Images</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {(
                    (Array.isArray(selected?.images) && selected?.images?.length) ? selected.images :
                    (rows.find((r) => r.id === open?.id)?.images || [])
                  ).length === 0 && (
                    <div className="text-sm text-stone-500">No images</div>
                  )}
                {(
                  (Array.isArray(selected?.images) && selected?.images?.length) ? selected.images :
                  (rows.find((r) => r.id === open?.id)?.images || [])
                ).map((img: any, idx: number) => {
                  const url = typeof img === 'string' ? img : (img?.url || img?.imageUrl || img?.image);
                  if (!url) return null;
                  return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageViewer({ url, idx })}
                        className="aspect-square overflow-hidden rounded-md border border-stone-200 bg-stone-50 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-stone-400"
                        aria-label={`View image ${idx + 1}`}
                      >
                        <img src={url} alt={`Product image ${idx + 1}`} className="h-full w-full object-cover" />
                      </button>
                  );
                })}
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
                <Button variant="destructive" onClick={submit}>Delete</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full image viewer */}
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
    </div>
  );
}