import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getJson, apiUrl } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

export default function Categories() {
  const { data: catData, isLoading, error, refetch: catRefetch } = useQuery({ 
    queryKey: ["/categories"], 
    queryFn: () => getJson<any>("/categories") 
  });
  const { data: subData, refetch: subRefetch } = useQuery({ 
    queryKey: ["/subCategories"], 
    queryFn: () => getJson<any>("/subCategories") 
  });
  
  // Lists
  const categories: any[] = catData?.success && Array.isArray(catData.data) ? catData.data : [];
  const subcategories: any[] = subData?.success && Array.isArray(subData.data) ? subData.data : [];

  // Map category id to subcategories
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

  // Dialog state for create/edit/delete
  const [open, setOpen] = useState<{ type: "addCat"|"editCat"|"delCat"|"addSub"|"editSub"|"delSub"; id?: string; parentId?: string }|null>(null);
  const [form, setForm] = useState<{ name: string; file?: File | null; imageUrl?: string; categoryId?: string }>({ name: "" });

  useEffect(() => {
    if (!open) {
      setForm({ name: "" });
    }
  }, [open]);

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

  // Mutations
  const submit = async () => {
    let success = false;
    try {
      if (!open) return;
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
      }
      if (open.type === "editCat" && open.id) {
        const fd = new FormData();
        fd.append("name", form.name.trim());
        if (form.file) {
          fd.append("img", form.file);
        } else if (form.imageUrl) {
          // Backend update route requires image; send existing URL when not uploading a new file
          fd.append("image", form.imageUrl);
        }
        const res = await fetch(apiUrl(`/categories/${open.id}`), { method: "PUT", body: fd });
        if (!res.ok) {
          const msg = await safeMessage(res);
          throw new Error(msg || `Edit category failed: ${res.status}`);
        }
        success = true;
      }
      if (open.type === "delCat" && open.id) {
        const res = await fetch(apiUrl(`/categories/${open.id}`), { method: "DELETE" });
        if (!res.ok) {
          const msg = await safeMessage(res);
          throw new Error(msg || `Delete category failed: ${res.status}`);
        }
        success = true;
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
      }
      if (open.type === "delSub" && open.id) {
        const res = await fetch(apiUrl(`/subCategories/${open.id}`), { method: "DELETE" });
        if (!res.ok) {
          const msg = await safeMessage(res);
          throw new Error(msg || `Delete subcategory failed: ${res.status}`);
        }
        success = true;
      }
    } catch (e: any) {
      console.error('Mutation failed:', e);
      // Surface backend message so you know why (e.g., cannot delete due to references)
      alert(e?.message || 'Action failed');
    } finally {
      if (success && open) {
        setOpen(null);
        await Promise.all([catRefetch(), subRefetch()]);
      }
    }
  };

  async function safeMessage(res: Response): Promise<string | undefined> {
    try {
      const data = await res.json();
      return (data && typeof data === 'object') ? (data.message || data.error) : undefined;
    } catch {
      return undefined;
    }
  }

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-black-200">
          <CardHeader className="border-b border-black-200">
            <CardTitle className="text-lg font-semibold text-black-900">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-black-500">Loading categories...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-black-200">
          <CardHeader className="border-b border-black-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-red-500">Error loading categories: {error.message}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar bg-white">
      <Card className="border-black-200 bg-white">
        <CardHeader className="border-b border-black-200">
          <CardTitle className="text-lg font-semibold text-stone-900">Categories ({categories.length})</CardTitle>
          <div>
            <Button size="sm" onClick={startAddCategory}>Add Category</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto bg-white">
            <table className="w-full bg-white">
              <thead className="bg-black-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Subcategories</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black-200">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-stone-500">No categories found</td>
                  </tr>
                ) : (
                  categories.map((category, idx) => {
                    const catId = category._id || category.id;
                    const subs = categoryIdToSubs[catId] || [];
                    return (
                      <tr key={catId || idx} className="align-top hover:bg-white-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-medium">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {category.image && category.image !== 'no_url' ? (
                            <img 
                              src={category.image} 
                              alt={category.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-stone-200 rounded-lg flex items-center justify-center">
                              <span className="text-stone-400 text-xs">No Image</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-900">
                          {subs.length === 0 ? (
                            <span className="text-stone-500">No subcategories</span>
                          ) : (
                            <ul className="list-disc pl-5 space-y-1 bg-white">
                              {subs.map((s) => (
                                <li key={s._id} className="flex items-center justify-between pr-2 ">
                                  <span>{s.name}</span>
                                  <span className="space-x-2 bg-white">
                                    <Button size="sm" variant="outline" onClick={() => startEditSub(s)}>Edit</Button>
                                    <Button size="sm" variant="destructive" onClick={() => startDeleteSub(s)}>Delete</Button>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-3">
                            <Button size="sm" onClick={() => startAddSub(category)}>Add Subcategory</Button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => startEditCategory(category)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => startDeleteCategory(category)}>Delete</Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for all actions */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md bg-white border border-black-200">
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
            <div className="space-y-4 bg-white">
              <div>
                <Label htmlFor="catName">Name</Label>
                <Input id="catName" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Category name" />
              </div>
              <div>
                <Label htmlFor="catFile">Image</Label>
                <Input id="catFile" type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))} />
              </div>
              <div className="flex justify-end space-x-2 bg-white">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button onClick={submit} disabled={!form.name.trim()}>Save</Button>
              </div>
            </div>
          )}

          {open && (open.type === "addSub" || open.type === "editSub") && (
            <div className="space-y-4 bg-white">
              <div>
                <Label htmlFor="subName">Subcategory Name</Label>
                <Input id="subName" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Subcategory name" />
              </div>
              <div>
                <Label>Category</Label>
                <Select bg-white value={form.categoryId || open?.parentId || undefined} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {categories.map((c) => (
                      <SelectItem className="bg-white" key={c._id || c.id} value={(c._id || c.id) as string}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 bg-white">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button onClick={submit} disabled={!form.name.trim() || !(form.categoryId || open?.parentId)}>Save</Button>
              </div>
            </div>
          )}

          {open && (open.type === "delCat" || open.type === "delSub") && (
            <div className="space-y-4 bg-white">
              <p className="text-sm text-stone-700">Are you sure you want to delete this {open.type === "delCat" ? "category" : "subcategory"}? This action cannot be undone.</p>
              <div className="flex justify-end space-x-2 bg-white">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button variant="destructive" onClick={submit}>Delete</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}