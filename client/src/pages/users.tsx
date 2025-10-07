import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { getJson, apiUrl } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function Users() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/users"],
    queryFn: () => getJson<any>("/users"),
  });

  const rows: any[] = useMemo(() => {
    if (!data?.success) return [];
    const payload: any = data.data;
    const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
    return arr.map((u: any) => ({
      id: u.id || u._id,
      // Prefer explicit first/last name columns, then addressinfo JSON, then fallbacks
      name: (() => {
        const addressinfoObj = (() => {
          try { return typeof u.addressinfo === 'string' ? JSON.parse(u.addressinfo) : u.addressinfo; } catch { return undefined; }
        })();
        const first = u.firstname || u.firstName || addressinfoObj?.firstName || "";
        const last = u.lastname || u.lastName || addressinfoObj?.lastName || "";
        if (first || last) return `${first} ${last}`.trim();
        if (u.name && !String(u.name).includes('@')) return String(u.name);
        return u.email || '';
      })(),
      email: u.email || "",
      role: u.role || (u.isAdmin ? 'admin' : (u.isSeller ? 'seller' : 'user')),
      businessName: u.business_name || u.businessName || '',
    }));
  }, [data]);

  const [open, setOpen] = useState<{ type: "add"|"edit"|"delete"|"promote"; id?: string }|null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", avatar: "", addressLine: "", city: "", province: "", postalCode: "", country: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [latestAddress, setLatestAddress] = useState<any | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [addForm, setAddForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", addressLine: "", city: "", province: "", postalCode: "", country: "" });
  const [addAvatarFile, setAddAvatarFile] = useState<File | null>(null);
  const [addAvatarPreview, setAddAvatarPreview] = useState<string>("");

  // Use original backend payload to hydrate edit form with full details
  const selected = useMemo(() => {
    if (!open?.id) return null;
    if (!data?.success) return null;
    const payload: any = data.data;
    const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
    return arr.find((u: any) => (u.id || u._id) === open.id) || null;
  }, [open, data]);

  useEffect(() => {
    if (open?.type === 'edit') {
      if (selected) {
        const addressinfoObj = (() => {
          try { return typeof selected.addressinfo === 'string' ? JSON.parse(selected.addressinfo) : selected.addressinfo; } catch { return undefined; }
        })();
        setForm({
          firstName: selected.firstname || selected.firstName || addressinfoObj?.firstName || "",
          lastName: selected.lastname || selected.lastName || addressinfoObj?.lastName || "",
          email: selected.email || "",
          phone: selected.phone || selected.mobile || "",
          avatar: selected.profilepicture || selected.avatar || "",
          addressLine: addressinfoObj?.street || addressinfoObj?.address || "",
          city: addressinfoObj?.city || "",
          province: addressinfoObj?.province || addressinfoObj?.state || "",
          postalCode: addressinfoObj?.postalCode || addressinfoObj?.zip || "",
          country: addressinfoObj?.country || "",
        });

        // Fetch latest shipping address from orders for this user
        (async () => {
          try {
            setIsLoadingAddress(true);
            const ordersRes: any = await getJson<any>(`/orders?page=1&limit=1&userId=${selected.id || selected._id}&sortBy=order_date&sortOrder=desc`);
            const ordersArr: any[] = ordersRes?.success ? (Array.isArray(ordersRes.data) ? ordersRes.data : (Array.isArray(ordersRes?.data?.data) ? ordersRes.data.data : [])) : [];
            const firstOrder = ordersArr[0];
            const ship = firstOrder?.shipping_addresses?.[0] || firstOrder?.shipping_addresses || null;
            setLatestAddress(ship || null);
            // If form fields are empty, prefill from latest shipping address
            if (ship) {
              setForm((f) => ({
                ...f,
                addressLine: f.addressLine || ship.street || "",
                city: f.city || ship.city || "",
                province: f.province || ship.state || "",
                postalCode: f.postalCode || ship.postal_code || "",
                country: f.country || ship.country || "",
                phone: f.phone || ship.phone || f.phone,
              }));
            }
          } catch {
            setLatestAddress(null);
          } finally {
            setIsLoadingAddress(false);
          }
        })();
      }
    }
    if (open?.type === 'add') {
      setAddForm({ firstName: "", lastName: "", email: "", phone: "", password: "", addressLine: "", city: "", province: "", postalCode: "", country: "" });
      setAddAvatarFile(null);
      setAddAvatarPreview("");
      setLatestAddress(null);
    }
  }, [open, selected]);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!open?.id) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('img', file);
      const res = await fetch(apiUrl(`/users/${open.id}/avatar`), {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Upload failed');
      const url = json?.data?.url;
      if (url) setForm((f) => ({ ...f, avatar: url }));
      toast({ title: 'Uploaded', description: 'Profile picture uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message || 'Unable to upload image', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const submit = async () => {
    if (!open) return;
    try {
      if (open.type === 'edit') {
        const updatePayload: Record<string, any> = {};
        if (form.firstName.trim()) updatePayload.firstname = form.firstName.trim();
        if (form.lastName.trim()) updatePayload.lastname = form.lastName.trim();
        if (form.email.trim()) updatePayload.email = form.email.trim();
        if (form.phone.trim()) updatePayload.phone = form.phone.trim();
        if (form.avatar.trim()) updatePayload.profilepicture = form.avatar.trim();
        // Keep addressinfo JSON in sync if present
        updatePayload.addressinfo = {
          ...(selected?.addressinfo && typeof selected.addressinfo === 'object' ? selected.addressinfo : {}),
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          addressLine: form.addressLine.trim() || undefined,
          city: form.city.trim() || undefined,
          province: form.province.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
          country: form.country.trim() || undefined,
        };

        const res = await fetch(apiUrl(`/users/${open.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });
        if (!res.ok) throw new Error('Update failed');
        toast({ title: 'Updated', description: 'User updated successfully' });
      }
      if (open.type === 'add') {
        const composedName = `${addForm.firstName.trim()} ${addForm.lastName.trim()}`.trim();
        if (!composedName || !addForm.password.trim() || !addForm.email.trim()) {
          throw new Error('First name, last name, email, and password are required');
        }
        const regPayload: Record<string, any> = { 
          name: composedName, 
          password: addForm.password.trim(), 
          email: addForm.email.trim().toLowerCase(),
          role: 'buyer',
        };
        // Create Supabase Auth user + users row in one go
        const res = await fetch(apiUrl(`/users/create-auth`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(regPayload)
        });
        if (!res.ok) {
          let message = 'Create failed';
          try { const j = await res.json(); message = j?.message || message; } catch {}
          throw new Error(message);
        }
        // After create, refetch to find the new user by email or name, then update extra fields
        await refetch();
        let createdUserId: string | undefined;
        try {
          const payload: any = (data as any)?.data;
          const list: any[] = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
          const found = list.find((u: any) => (addForm.email ? u.email === addForm.email.trim() : (u.name === composedName)));
          createdUserId = found?.id || found?._id;
        } catch {}

        if (createdUserId) {
          const updatePayload: Record<string, any> = {};
          if (addForm.firstName.trim()) updatePayload.firstname = addForm.firstName.trim();
          if (addForm.lastName.trim()) updatePayload.lastname = addForm.lastName.trim();
          if (addForm.email.trim()) updatePayload.email = addForm.email.trim();
          if (addForm.phone.trim()) updatePayload.phone = addForm.phone.trim();
          updatePayload.addressinfo = {
            firstName: addForm.firstName.trim() || undefined,
            lastName: addForm.lastName.trim() || undefined,
            email: addForm.email.trim() || undefined,
            phone: addForm.phone.trim() || undefined,
            addressLine: addForm.addressLine.trim() || undefined,
            city: addForm.city.trim() || undefined,
            province: addForm.province.trim() || undefined,
            postalCode: addForm.postalCode.trim() || undefined,
            country: addForm.country.trim() || undefined,
          };
          if (Object.keys(updatePayload).length > 0) {
            try {
              await fetch(apiUrl(`/users/${createdUserId}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatePayload) });
            } catch {}
          }
          if (addAvatarFile) {
            try {
              const formData = new FormData();
              formData.append('img', addAvatarFile);
              await fetch(apiUrl(`/users/${createdUserId}/avatar`), { method: 'POST', body: formData });
            } catch {}
          }
          await refetch();
        }

        toast({ title: 'Created', description: 'User added successfully' });
      }
      if (open.type === 'delete') {
        const res = await fetch(apiUrl(`/users/${open.id}`), { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        toast({ title: 'Deleted', description: 'User deleted' });
      }
      if (open.type === 'promote') {
        const res = await fetch(apiUrl(`/users/${open.id}/promote-admin`), { method: 'POST' });
        if (!res.ok) throw new Error('Promotion failed');
        toast({ title: 'Promoted', description: 'User promoted to admin' });
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
        <Card className="border-stone-200"><CardHeader className="border-b border-stone-200"><CardTitle className="text-lg font-semibold text-stone-900">Users</CardTitle></CardHeader><CardContent className="p-6">Loading...</CardContent></Card>
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-stone-200"><CardHeader className="border-b border-stone-200"><CardTitle className="text-lg font-semibold text-stone-900">Users</CardTitle></CardHeader><CardContent className="p-6 text-red-500">Failed to load</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <Card className="border-stone-200">
        <CardHeader className="border-b border-stone-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-stone-900">Users ({rows.length})</CardTitle>
            <Button size="sm" onClick={() => setOpen({ type: 'add' })}>Add User</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">{u.businessName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">{u.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setOpen({ type: 'edit', id: u.id })}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => setOpen({ type: 'delete', id: u.id })}>Delete</Button>
                      {u.role !== 'admin' && (
                        <Button size="sm" onClick={() => setOpen({ type: 'promote', id: u.id })}>Promote</Button>
                      )}
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
            {open?.type === 'add' && 'Add User'}
            {open?.type === 'edit' && 'Edit User'}
            {open?.type === 'delete' && 'Delete User'}
            {open?.type === 'promote' && 'Promote to Admin'}
          </DialogTitle></DialogHeader>

          {open?.type === 'add' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="add-first">First Name</Label>
                  <Input id="add-first" value={addForm.firstName} onChange={(e) => setAddForm((f) => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="add-last">Last Name</Label>
                  <Input id="add-last" value={addForm.lastName} onChange={(e) => setAddForm((f) => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label htmlFor="add-email">Email</Label>
                <Input id="add-email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="add-phone">Phone</Label>
                <Input id="add-phone" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="add-addressLine">Address Line</Label>
                  <Input id="add-addressLine" value={addForm.addressLine} onChange={(e) => setAddForm((f) => ({ ...f, addressLine: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="add-city">City</Label>
                  <Input id="add-city" value={addForm.city} onChange={(e) => setAddForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="add-province">Province/State</Label>
                  <Input id="add-province" value={addForm.province} onChange={(e) => setAddForm((f) => ({ ...f, province: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="add-postal">Postal Code</Label>
                  <Input id="add-postal" value={addForm.postalCode} onChange={(e) => setAddForm((f) => ({ ...f, postalCode: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="add-country">Country</Label>
                  <Input id="add-country" value={addForm.country} onChange={(e) => setAddForm((f) => ({ ...f, country: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label htmlFor="add-password">Password</Label>
                <Input id="add-password" type="password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="add-avatar">Profile Picture</Label>
                <Input id="add-avatar" type="file" accept="image/*" onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0] || null;
                  setAddAvatarFile(file);
                  setAddAvatarPreview(file ? URL.createObjectURL(file) : "");
                }} />
                {addAvatarPreview && (
                  <div className="mt-2">
                    <img src={addAvatarPreview} alt="Avatar preview" className="h-16 w-16 rounded-full object-cover border border-stone-200" />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button onClick={submit}>Create</Button>
              </div>
            </div>
          )}

          {open?.type === 'edit' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="addressLine">Address Line</Label>
                  <Input id="addressLine" value={form.addressLine} onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="province">Province/State</Label>
                  <Input id="province" value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label htmlFor="avatar">Profile Picture</Label>
                <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarFile} disabled={isUploading} />
                {form.avatar && (
                  <div className="mt-2">
                    <img src={form.avatar} alt="Avatar preview" className="h-16 w-16 rounded-full object-cover border border-stone-200" />
                    <div className="text-xs text-stone-500 break-all mt-1">{form.avatar}</div>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button onClick={submit}>Save Changes</Button>
              </div>
          {latestAddress && (
            <div className="mt-4 rounded-md border border-stone-200 p-3 bg-stone-50">
              <div className="text-xs font-medium text-stone-600 mb-2">Latest shipping address from last order</div>
              <div className="grid grid-cols-2 gap-3 text-xs text-stone-700">
                <div><span className="font-semibold">Street:</span> {latestAddress.street || '-'}</div>
                <div><span className="font-semibold">City:</span> {latestAddress.city || '-'}</div>
                <div><span className="font-semibold">State:</span> {latestAddress.state || '-'}</div>
                <div><span className="font-semibold">Postal:</span> {latestAddress.postal_code || '-'}</div>
                <div><span className="font-semibold">Country:</span> {latestAddress.country || '-'}</div>
                <div><span className="font-semibold">Phone:</span> {latestAddress.phone || '-'}</div>
              </div>
            </div>
          )}
            </div>
          )}

          {open?.type === 'delete' && (
            <div className="space-y-4">
              <p className="text-sm">Are you sure you want to delete this user?</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button variant="destructive" onClick={submit}>Delete</Button>
              </div>
            </div>
          )}

          {open?.type === 'promote' && (
            <div className="space-y-4">
              <p className="text-sm">Promote this user to admin?</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button onClick={submit}>Promote</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
