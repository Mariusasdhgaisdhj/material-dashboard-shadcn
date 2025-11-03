import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJson, apiUrl } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2,
  Crown,
  Shield,
  UserCheck,
  Calendar,
  TrendingUp,
  Ban,
  Key,
  Activity,
  Download,
  Upload,
  Filter,
  Search,
  MoreVertical
} from 'lucide-react';
import { DynamicTableProvider, useDynamicTable, TableConfig } from '@/contexts/DynamicTableContext';
import { DynamicTable } from '@/components/DynamicTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import AddressAutocomplete from '@/components/AddressAutocomplete';

// Users Configuration
const usersConfig: TableConfig = {
  id: 'users',
  title: 'Users',
  description: 'Manage user accounts and permissions',
  apiEndpoint: '/users',
  
  columns: [
    {
      id: 'avatar',
      label: 'Avatar',
      type: 'image',
      accessor: (row) => row.profilepicture || row.avatar || '',
      width: '80px',
    },
    {
      id: 'name',
      label: 'Name',
      type: 'text',
      sortable: true,
      filterable: true,
      accessor: (row) => {
        const addressinfoObj = (() => {
          try { return typeof row.addressinfo === 'string' ? JSON.parse(row.addressinfo) : row.addressinfo; } catch { return undefined; }
        })();
        const first = row.firstname || row.firstName || addressinfoObj?.firstName || "";
        const last = row.lastname || row.lastName || addressinfoObj?.lastName || "";
        if (first || last) return `${first} ${last}`.trim();
        if (row.name && !String(row.name).includes('@')) return String(row.name);
        return row.email || '';
      },
    },
    {
      id: 'email',
      label: 'Email',
      type: 'text',
      sortable: true,
      filterable: true,
      accessor: 'email',
    },
    {
      id: 'role',
      label: 'Role',
      type: 'badge',
      sortable: true,
      filterable: true,
      accessor: (row) => row.role || (row.isAdmin ? 'admin' : (row.isSeller ? 'seller' : 'user')),
      badgeVariant: (row: any) => {
        const role = row.role || (row.isAdmin ? 'admin' : (row.isSeller ? 'seller' : 'user'));
        switch (role) {
          case 'admin': return 'destructive';
          case 'seller': return 'secondary';
          case 'buyer': return 'outline';
          default: return 'default';
        }
      },
    },
    {
      id: 'status',
      label: 'Status',
      type: 'badge',
      sortable: true,
      filterable: true,
      accessor: (row) => row.suspended ? 'Suspended' : 'Active',
      badgeVariant: (row: any) => {
        return row.suspended ? 'destructive' : 'default';
      },
    },
    {
      id: 'businessName',
      label: 'Business',
      type: 'text',
      sortable: true,
      filterable: true,
      accessor: (row) => row.business_name || row.businessName || '',
    },
    {
      id: 'sellerRequest',
      label: 'Seller Request',
      type: 'badge',
      accessor: (row) => row.seller_request || '',
      badgeVariant: (row: any) => {
        const request = row.seller_request || '';
        if (request === 'pending') return 'secondary';
        if (request === 'approved') return 'default';
        return 'outline';
      },
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
      placeholder: 'Search by name, email, or business...',
      accessor: (row) => {
        const name = (() => {
          const addressinfoObj = (() => {
            try { return typeof row.addressinfo === 'string' ? JSON.parse(row.addressinfo) : row.addressinfo; } catch { return undefined; }
          })();
          const first = row.firstname || row.firstName || addressinfoObj?.firstName || "";
          const last = row.lastname || row.lastName || addressinfoObj?.lastName || "";
          if (first || last) return `${first} ${last}`.trim();
          if (row.name && !String(row.name).includes('@')) return String(row.name);
          return row.email || '';
        })();
        return `${name} ${row.email} ${row.business_name || row.businessName || ''}`.toLowerCase();
      },
    },
    {
      id: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'all', label: 'All Roles' },
        { value: 'admin', label: 'Admin' },
        { value: 'seller', label: 'Seller' },
        { value: 'buyer', label: 'Buyer' },
      ],
      accessor: (row) => row.role || (row.isAdmin ? 'admin' : (row.isSeller ? 'seller' : 'buyer')),
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'suspended', label: 'Suspended' },
      ],
      accessor: (row) => row.suspended ? 'suspended' : 'active',
    },
  ],
  
  actions: [
    {
      id: 'add',
      label: 'Add User',
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
      id: 'reset-password',
      label: 'Reset Password',
      icon: 'Key',
      type: 'button',
      variant: 'outline',
      onClick: async (row) => {
        // This will be handled by the component
      },
    },
    {
      id: 'suspend',
      label: 'Suspend',
      icon: 'Ban',
      type: 'button',
      variant: 'outline',
      onClick: async (row) => {
        // This will be handled by the component
      },
    },
    {
      id: 'unsuspend',
      label: 'Unsuspend',
      icon: 'UserCheck',
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
        if (selectedRows && confirm(`Are you sure you want to delete ${selectedRows.length} users?`)) {
          try {
            const promises = selectedRows.map(row => 
              fetch(apiUrl(`/users/${row._id || row.id}`), { method: 'DELETE' })
            );
            await Promise.all(promises);
            toast({ title: 'Success', description: `${selectedRows.length} users deleted` });
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
            Name: (() => {
              const addressinfoObj = (() => {
                try { return typeof row.addressinfo === 'string' ? JSON.parse(row.addressinfo) : row.addressinfo; } catch { return undefined; }
              })();
              const first = row.firstname || row.firstName || addressinfoObj?.firstName || "";
              const last = row.lastname || row.lastName || addressinfoObj?.lastName || "";
              if (first || last) return `${first} ${last}`.trim();
              if (row.name && !String(row.name).includes('@')) return String(row.name);
              return row.email || '';
      })(),
            Email: row.email,
            Role: row.role || (row.isAdmin ? 'admin' : (row.isSeller ? 'seller' : 'user')),
            'Business Name': row.business_name || row.businessName || '',
            'Seller Request': row.seller_request || '',
          }));
          
          const csvContent = [
            Object.keys(csvData[0] || {}).join(','),
            ...csvData.map(row => Object.values(row).join(','))
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          
          toast({ title: 'Exported', description: 'Users exported to CSV' });
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
    placeholder: 'Search users...',
    searchFields: ['name', 'email', 'businessName'],
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
    create: ['admin'],
    read: ['admin', 'manager'],
    update: ['admin'],
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

// Users Data Loader Component
const UsersDataLoader: React.FC = () => {
  const { setConfig, setData, refreshData, state } = useDynamicTable();
  
  const { data: usersData, isLoading, error, refetch: usersRefetch } = useQuery({ 
    queryKey: ["/users"], 
    queryFn: () => getJson<any>("/users"),
    retry: 2,
    staleTime: 60000,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Dialog states
  const [open, setOpen] = useState<{ 
    type: "add" | "edit" | "delete" | "promote" | "suspend" | "unsuspend" | "reset-password" | "bulk-action" | "announcement" | "seller-request"; 
    id?: string 
  } | null>(null);
  
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [bulkAction, setBulkAction] = useState<string>("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [form, setForm] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    phone: "", 
    avatar: "", 
    addressLine: "", 
    city: "", 
    province: "", 
    postalCode: "", 
    country: "",
    gcashName: "",
    gcashNumber: ""
  });
  const [addForm, setAddForm] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    phone: "", 
    password: "", 
    role: "buyer",
    businessName: "",
    addressLine: "", 
    city: "", 
    province: "", 
    postalCode: "", 
    country: "",
    gcashName: "",
    gcashNumber: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const [latestAddress, setLatestAddress] = useState<any | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [addAvatarFile, setAddAvatarFile] = useState<File | null>(null);
  const [addAvatarPreview, setAddAvatarPreview] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [chartAnimations, setChartAnimations] = useState({
    roleBars: false,
    circularCharts: false,
    statCards: false
  });

  // Handle address selection and auto-fill form fields
  const handleAddressSelect = (address: any) => {
    setSelectedAddress(address);
    
    // Auto-fill form fields based on selected address
    if (address.address) {
      setAddForm(prev => ({
        ...prev,
        addressLine: address.address.road || prev.addressLine,
        city: address.address.city || address.address.municipality || address.address.suburb || prev.city,
        province: address.address.province || address.address.state || prev.province,
        postalCode: address.address.postcode || prev.postalCode,
        country: address.address.country || prev.country,
      }));
    }
  };
  const [showCharts, setShowCharts] = useState(false);

  // Set configuration on mount
  useEffect(() => {
    setConfig(usersConfig);
  }, [setConfig]);

  // Process and set data when it loads
  useEffect(() => {
    if (usersData?.success) {
      let users = [];
      if (Array.isArray(usersData.data)) {
        users = usersData.data;
      } else if (usersData.data && Array.isArray(usersData.data.data)) {
        users = usersData.data.data;
      }
      console.log('Users data loaded:', users);
      
      // Hide charts and reset animations
      setShowCharts(false);
      setChartAnimations({
        roleBars: false,
        circularCharts: false,
        statCards: false
      });
      
      setData(users);
      
      // Show charts first, then animate
      setTimeout(() => {
        setShowCharts(true);
        
        // Animate progress bars first
        setTimeout(() => {
          setChartAnimations(prev => ({ ...prev, roleBars: true }));
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
    } else if (usersData && !usersData.success) {
      console.error('API returned error:', usersData);
    }
  }, [usersData, setData]);

  // Ensure data is refreshed when component mounts
  useEffect(() => {
    if (!usersData && !isLoading) {
      console.log('Refreshing users data on mount');
      usersRefetch();
    }
  }, [usersData, isLoading, usersRefetch]);

  // Force data refresh when returning to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && (!usersData || state.data.length === 0)) {
        console.log('Page became visible, refreshing data');
        usersRefetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [usersData, state.data.length, usersRefetch]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setForm({ firstName: "", lastName: "", email: "", phone: "", avatar: "", addressLine: "", city: "", province: "", postalCode: "", country: "", gcashName: "", gcashNumber: "" });
      setAddForm({ firstName: "", lastName: "", email: "", phone: "", password: "", role: "buyer", businessName: "", addressLine: "", city: "", province: "", postalCode: "", country: "", gcashName: "", gcashNumber: "" });
      setSelectedAddress(null);
      setAnnouncementTitle("");
      setAnnouncementMessage("");
    }
  }, [open]);

  // Get selected user
  const selected = useMemo(() => {
    if (!open?.id) return null;
    if (!usersData?.success) return null;
    const payload: any = usersData.data;
    const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
    return arr.find((u: any) => (u.id || u._id) === open.id) || null;
  }, [open, usersData]);

  // Dialog handlers
  const startAddUser = () => setOpen({ type: "add" });
  const startEditUser = (user: any) => {
        const addressinfoObj = (() => {
      try { return typeof user.addressinfo === 'string' ? JSON.parse(user.addressinfo) : user.addressinfo; } catch { return undefined; }
        })();
        const payoutInfoObj = (() => {
      try { 
        // Check both payoutinfo (lowercase, database column) and payoutInfo (camelCase, API response)
        return typeof user.payoutinfo === 'string' ? JSON.parse(user.payoutinfo) : 
               user.payoutinfo || 
               (typeof user.payoutInfo === 'string' ? JSON.parse(user.payoutInfo) : user.payoutInfo); 
      } catch { return undefined; }
        })();
        
        // Debug: Log the addressinfo structure
        console.log('Loading user for edit:', {
          userId: user._id || user.id,
          rawAddressinfo: user.addressinfo,
          parsedAddressinfo: addressinfoObj,
          street: addressinfoObj?.street,
          address: addressinfoObj?.address,
          addressLine: addressinfoObj?.addressLine,
          rawPayoutinfo: user.payoutinfo || user.payoutInfo,
          parsedPayoutinfo: payoutInfoObj
        });
        setForm({
      firstName: user.firstname || user.firstName || addressinfoObj?.firstName || "",
      lastName: user.lastname || user.lastName || addressinfoObj?.lastName || "",
      email: user.email || "",
      phone: user.phone || user.mobile || "",
      avatar: user.profilepicture || user.avatar || "",
          addressLine: addressinfoObj?.addressLine || addressinfoObj?.street || addressinfoObj?.address || addressinfoObj?.streetAddress || "",
          city: addressinfoObj?.city || "",
          province: addressinfoObj?.province || addressinfoObj?.state || "",
          postalCode: addressinfoObj?.postalCode || addressinfoObj?.zip || addressinfoObj?.postal_code || "",
          country: addressinfoObj?.country || "",
          gcashName: payoutInfoObj?.gcashName || "",
          gcashNumber: payoutInfoObj?.gcashNumber || "",
        });
    setOpen({ type: "edit", id: user._id || user.id });
  };
  const startDeleteUser = (user: any) => setOpen({ type: "delete", id: user._id || user.id });
  const startPromoteUser = (user: any) => setOpen({ type: "promote", id: user._id || user.id });
  const startViewSellerRequest = (user: any) => setOpen({ type: "seller-request", id: user._id || user.id });
  const startSuspendUser = (user: any) => setOpen({ type: "suspend", id: user._id || user.id });
  const startUnsuspendUser = (user: any) => setOpen({ type: "unsuspend", id: user._id || user.id });
  const startResetPassword = (user: any) => {
    setResetPasswordEmail(user.email);
    setOpen({ type: "reset-password", id: user._id || user.id });
  };
  const startAnnouncement = () => setOpen({ type: "announcement" });

  // Load latest address for edit
  useEffect(() => {
    if (open?.type === 'edit' && selected) {
        (async () => {
          try {
            setIsLoadingAddress(true);
            const ordersRes: any = await getJson<any>(`/orders?page=1&limit=1&userId=${selected.id || selected._id}&sortBy=order_date&sortOrder=desc`);
            const ordersArr: any[] = ordersRes?.success ? (Array.isArray(ordersRes.data) ? ordersRes.data : (Array.isArray(ordersRes?.data?.data) ? ordersRes.data.data : [])) : [];
            const firstOrder = ordersArr[0];
            const ship = firstOrder?.shipping_addresses?.[0] || firstOrder?.shipping_addresses || null;
            setLatestAddress(ship || null);
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

  // Submit handler
  const submit = async () => {
    if (!open) return;
    let success = false;
    
    try {
      if (open.type === 'edit' && open.id) {
        const updatePayload: Record<string, any> = {};
        if (form.firstName.trim()) updatePayload.firstname = form.firstName.trim();
        if (form.lastName.trim()) updatePayload.lastname = form.lastName.trim();
        if (form.email.trim()) updatePayload.email = form.email.trim();
        if (form.phone.trim()) updatePayload.phone = form.phone.trim();
        if (form.avatar.trim()) updatePayload.profilepicture = form.avatar.trim();
        // Build addressinfo with only non-empty values
        const addressInfo: Record<string, any> = {};
        const existingAddress = selected?.addressinfo && typeof selected.addressinfo === 'object' ? selected.addressinfo : {};
        
        // Merge existing addressinfo with new values (only non-empty)
        if (form.firstName.trim()) addressInfo.firstName = form.firstName.trim();
        if (form.lastName.trim()) addressInfo.lastName = form.lastName.trim();
        if (form.email.trim()) addressInfo.email = form.email.trim();
        if (form.phone.trim()) addressInfo.phone = form.phone.trim();
        if (form.addressLine.trim()) addressInfo.addressLine = form.addressLine.trim();
        if (form.city.trim()) addressInfo.city = form.city.trim();
        if (form.province.trim()) addressInfo.province = form.province.trim();
        if (form.postalCode.trim()) addressInfo.postalCode = form.postalCode.trim();
        if (form.country.trim()) addressInfo.country = form.country.trim();
        
        // Merge with existing addressinfo to preserve other fields
        updatePayload.addressinfo = { ...existingAddress, ...addressInfo };
        
        // Only include payoutinfo if user is a seller and has GCash data
        if (selected?.role === 'seller') {
          const payoutInfo: Record<string, any> = {};
          if (form.gcashName.trim()) payoutInfo.gcashName = form.gcashName.trim();
          if (form.gcashNumber.trim()) payoutInfo.gcashNumber = form.gcashNumber.trim();
          if (Object.keys(payoutInfo).length > 0) {
            updatePayload.payoutinfo = payoutInfo;
          }
        }

        const res = await fetch(apiUrl(`/users/${open.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });
        
        // Log for debugging
        console.log('Update payload:', updatePayload);
        console.log('Update response status:', res.status);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('Update failed:', errorData);
          throw new Error(errorData.message || 'Update failed');
        }
        
        const responseData = await res.json();
        console.log('Update response:', responseData);
        
        success = true;
        toast({ title: 'Updated', description: 'User updated successfully' });
      }
      
      if (open.type === 'add') {
        const composedName = `${addForm.firstName.trim()} ${addForm.lastName.trim()}`.trim();
        if (!composedName || !addForm.password.trim() || !addForm.email.trim()) {
          throw new Error('First name, last name, email, and password are required');
        }
        if (addForm.role === 'seller' && !addForm.businessName.trim()) {
          throw new Error('Business name is required for sellers');
        }
        const regPayload: Record<string, any> = { 
          name: composedName, 
          password: addForm.password.trim(), 
          email: addForm.email.trim().toLowerCase(),
          role: addForm.role,
        };

        // Add business_name if seller role is selected
        if (addForm.role === 'seller' && addForm.businessName.trim()) {
          regPayload.business_name = addForm.businessName.trim();
        }
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
        
        // Get the created user data from the response
        const createResponse = await res.json();
        const createdUser = createResponse.data;
        const createdUserId = createdUser?.id || createdUser?._id;
        
        if (!createdUserId) {
          throw new Error('Failed to get created user ID');
        }

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
          // Only include payoutinfo if role is seller (use lowercase for database column)
          if (addForm.role === 'seller') {
            updatePayload.payoutinfo = {
              gcashName: addForm.gcashName.trim() || undefined,
              gcashNumber: addForm.gcashNumber.trim() || undefined,
            };
          }
          if (Object.keys(updatePayload).length > 0) {
            try {
              const updateRes = await fetch(apiUrl(`/users/${createdUserId}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatePayload) });
              if (!updateRes.ok) {
                console.warn('Failed to update user additional info:', await updateRes.text());
              } else {
                console.log('User additional info updated successfully');
              }
            } catch (error) {
              console.error('User update error:', error);
            }
          }
          if (addAvatarFile) {
            try {
              const formData = new FormData();
              formData.append('img', addAvatarFile);
              const avatarRes = await fetch(apiUrl(`/users/${createdUserId}/avatar`), { method: 'POST', body: formData });
              if (!avatarRes.ok) {
                console.warn('Failed to upload avatar:', await avatarRes.text());
              } else {
                console.log('Avatar uploaded successfully');
              }
            } catch (error) {
              console.error('Avatar upload error:', error);
            }
          }
        }

        success = true;
        toast({ title: 'Created', description: 'User added successfully' });
      }
      
      if (open.type === 'delete' && open.id) {
        const res = await fetch(apiUrl(`/users/${open.id}`), { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        success = true;
        toast({ title: 'Deleted', description: 'User deleted' });
      }
      
      if (open.type === 'promote' && open.id) {
        const res = await fetch(apiUrl(`/users/${open.id}/promote-admin`), { method: 'POST' });
        if (!res.ok) throw new Error('Promotion failed');
        success = true;
        toast({ title: 'Promoted', description: 'User promoted to admin' });
      }
      
      if (open.type === 'suspend' && open.id) {
        const res = await fetch(apiUrl(`/users/${open.id}/suspend`), { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: suspendReason })
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Suspend failed');
        }
        success = true;
        toast({ title: 'Suspended', description: 'User account suspended' });
      }
      
      if (open.type === 'unsuspend' && open.id) {
        const res = await fetch(apiUrl(`/users/${open.id}/unsuspend`), { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Unsuspend failed');
        }
        success = true;
        toast({ title: 'Restored', description: 'User account restored' });
      }
      
      if (open.type === 'reset-password' && open.id) {
        const res = await fetch(apiUrl(`/users/${open.id}/reset-password`), { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetPasswordEmail })
        });
        if (!res.ok) throw new Error('Reset failed');
        success = true;
        toast({ title: 'Password Reset', description: 'Reset link sent to user email' });
      }
      
      if (open.type === 'announcement') {
        if (!announcementTitle.trim() || !announcementMessage.trim()) {
          throw new Error('Title and message are required');
        }
        const res = await fetch(apiUrl('/users/send-announcement'), { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: announcementTitle.trim(),
            message: announcementMessage.trim(),
            type: 'announcement'
          })
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Announcement failed');
        }
        success = true;
        toast({ title: 'Announcement Sent', description: 'Push notification sent to all users' });
      }
    } catch (e: any) {
      console.error('Action failed:', e);
      toast({ title: 'Error', description: e?.message || 'Action failed', variant: 'destructive' });
    } finally {
      if (success) {
      setOpen(null);
        await usersRefetch();
      }
    }
  };


  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="text-center text-gray-500">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="text-center text-red-500">Error loading users: {error.message}</div>
      </div>
    );
  }

  // Create a custom table component with dialog integration
  const CustomUsersTable = () => {
    const { state, setSearchTerm, setFilter, clearFilters, setSorting, setPagination, selectAll, deselectAll, toggleRowSelection, executeBulkAction, paginatedData, totalPages, hasSelection, isAllSelected } = useDynamicTable();

  return (
      <div className="space-y-6">
        
      

        {/* Main Table */}
        <div className="border-gray-200 bg-white shadow-lg rounded-lg">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Users ({paginatedData.length})
              </h2>
              <div className="flex items-center space-x-2">
                <Button size="sm" onClick={startAddUser}>
                  <Plus className="w-4 h-4 mr-2" /> Add User
                </Button>
                <Button variant="outline" size="sm" onClick={startAnnouncement}>
                  <Activity className="w-4 h-4 mr-2" /> Announcement
                </Button>
               
              </div>
              </div>
            </div>
            
          <div className="p-0">
            {/* Filters */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                <Input 
                    placeholder="Search users..."
                    value={state.searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
                <Select onValueChange={(value) => {
                  if (value === 'all') {
                    setFilter('role', '');
                  } else {
                    setFilter('role', value);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={state.filters.role ? `Filtered: ${state.filters.role}` : "Filter by role"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="seller">seller</SelectItem>
                    <SelectItem value="buyer">buyer</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={(value) => {
                  if (value === 'all') {
                    setFilter('status', '');
                  } else {
                    setFilter('status', value);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={state.filters.status ? `Filtered: ${state.filters.status}` : "Filter by status"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
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
                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Avatar</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Business</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">Seller Request</th>
                    <th className="px-6 py-3 text-right text-xs font-normal text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">No users found</td>
                    </tr>
                  ) : (
                    paginatedData.map((user, idx) => {
                      const userId = user._id || user.id;
                      const name = (() => {
                        const addressinfoObj = (() => {
                          try { return typeof user.addressinfo === 'string' ? JSON.parse(user.addressinfo) : user.addressinfo; } catch { return undefined; }
                        })();
                        const first = user.firstname || user.firstName || addressinfoObj?.firstName || "";
                        const last = user.lastname || user.lastName || addressinfoObj?.lastName || "";
                        if (first || last) return `${first} ${last}`.trim();
                        if (user.name && !String(user.name).includes('@')) return String(user.name);
                        return user.email || '';
                      })();
                      const role = user.role || (user.isAdmin ? 'admin' : (user.isSeller ? 'seller' : 'user'));
                      
                      return (
                        <tr key={userId || idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                              checked={state.selectedRows.has(userId)}
                              onChange={() => toggleRowSelection(userId)}
                        />
                      </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.profilepicture || user.avatar ? (
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={user.profilepicture || user.avatar} alt={name} />
                                <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <Avatar className="w-10 h-10">
                                <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              role === 'admin' ? 'destructive' : 
                              role === 'seller' ? 'secondary' : 
                              role === 'buyer' ? 'outline' : 'default'
                            }>
                              {role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={user.suspended ? 'destructive' : 'default'}>
                              {user.suspended ? 'Suspended' : 'Active'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.business_name || user.businessName || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.seller_request ? (
                              <Badge variant={
                                user.seller_request === 'pending' ? 'secondary' : 
                                user.seller_request === 'approved' ? 'default' : 'outline'
                              }>
                                {user.seller_request}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => startEditUser(user)}>
                              
                            Edit
                          </Button>
                            <Button size="sm" variant="outline" onClick={() => startResetPassword(user)}>
                            Reset
                          </Button>
                            {!user.suspended ? (
                              <Button size="sm" variant="outline" onClick={() => startSuspendUser(user)}>
                                Suspend
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => startUnsuspendUser(user)}>
                                Unsuspend
                              </Button>
                            )}
                            <Button size="sm" variant="destructive" onClick={() => startDeleteUser(user)}>
                            Delete
                          </Button>
                            {user.seller_request && (
                              <Button size="sm" variant="outline" onClick={() => startViewSellerRequest(user)}>
                                View Request
                              </Button>
                            )}
                            {user.seller_request === 'pending' && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={async () => {
                                  try {
                                    const res = await fetch(apiUrl(`/users/${userId}/approve-seller`), { method: 'POST' });
                                    if (!res.ok) throw new Error('Approve failed');
                                    toast({ title: 'Approved', description: 'Seller request approved' });
                                    await usersRefetch();
                                  } catch (e: any) {
                                    toast({ title: 'Error', description: e?.message || 'Approve failed', variant: 'destructive' });
                                  }
                                }}>
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={async () => {
                                  try {
                                    const res = await fetch(apiUrl(`/users/${userId}/reject-seller`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Requirements not met' }) });
                                    if (!res.ok) throw new Error('Reject failed');
                                    toast({ title: 'Rejected', description: 'Seller request rejected' });
                                    await usersRefetch();
                                  } catch (e: any) {
                                    toast({ title: 'Error', description: e?.message || 'Reject failed', variant: 'destructive' });
                                  }
                                }}>
                                  Reject
                                </Button>
                              </>
                            )}
                            {role !== 'admin' && (
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => startPromoteUser(user)}>
                              Promote
                            </Button>
                          )}
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
      <CustomUsersTable />
      
      {/* Dialogs */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
            {open?.type === 'add' && 'Add User'}
            {open?.type === 'edit' && 'Edit User'}
            {open?.type === 'delete' && 'Delete User'}
            {open?.type === 'promote' && 'Promote to Admin'}
            {open?.type === 'suspend' && 'Suspend User'}
            {open?.type === 'unsuspend' && 'Unsuspend User'}
            {open?.type === 'reset-password' && 'Reset Password'}
            {open?.type === 'announcement' && 'Send Announcement'}
            {open?.type === 'bulk-action' && 'Bulk Action'}
            </DialogTitle>
          </DialogHeader>

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
              <div>
                <Label htmlFor="add-role">Role</Label>
                <Select value={addForm.role} onValueChange={(value) => setAddForm((f) => ({ ...f, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {addForm.role === 'seller' && (
                <>
                  <div>
                    <Label htmlFor="add-businessName">Business Name</Label>
                    <Input 
                      id="add-businessName" 
                      value={addForm.businessName} 
                      onChange={(e) => setAddForm((f) => ({ ...f, businessName: e.target.value }))} 
                      placeholder="Enter business name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="add-gcashName">GCash Account Name</Label>
                      <Input 
                        id="add-gcashName" 
                        value={addForm.gcashName} 
                        onChange={(e) => setAddForm((f) => ({ ...f, gcashName: e.target.value }))} 
                        placeholder="e.g., Juan Dela Cruz"
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-gcashNumber">GCash Mobile Number</Label>
                      <Input 
                        id="add-gcashNumber" 
                        value={addForm.gcashNumber} 
                        onChange={(e) => setAddForm((f) => ({ ...f, gcashNumber: e.target.value }))} 
                        placeholder="e.g., 09123456789"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="grid grid-cols-1 gap-3">
                <AddressAutocomplete
                  label="Address"
                  value={addForm.addressLine}
                  onChange={(value) => setAddForm((f) => ({ ...f, addressLine: value }))}
                  onAddressSelect={handleAddressSelect}
                  placeholder="Start typing an address in the Philippines..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              {/* Show GCash fields only if user is a seller */}
              {selected?.role === 'seller' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="gcashName">GCash Account Name</Label>
                    <Input 
                      id="gcashName" 
                      value={form.gcashName} 
                      onChange={(e) => setForm((f) => ({ ...f, gcashName: e.target.value }))} 
                      placeholder="e.g., Juan Dela Cruz"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gcashNumber">GCash Mobile Number</Label>
                    <Input 
                      id="gcashNumber" 
                      value={form.gcashNumber} 
                      onChange={(e) => setForm((f) => ({ ...f, gcashNumber: e.target.value }))} 
                      placeholder="e.g., 09123456789"
                    />
                  </div>
                </div>
              )}
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

          {open?.type === 'suspend' && (
            <div className="space-y-4">
              <p className="text-sm">Suspend this user account? They will not be able to log in.</p>
              <div>
                <Label htmlFor="suspend-reason">Reason (optional)</Label>
                <Input 
                  id="suspend-reason" 
                  value={suspendReason} 
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter suspension reason..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button variant="destructive" onClick={submit}>Suspend</Button>
              </div>
            </div>
          )}

          {open?.type === 'unsuspend' && (
            <div className="space-y-4">
              <p className="text-sm">Restore this user account? They will be able to log in again.</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button onClick={submit}>Restore</Button>
              </div>
            </div>
          )}

          {open?.type === 'reset-password' && (
            <div className="space-y-4">
              <p className="text-sm">Send a password reset link to this user's email address.</p>
              <div>
                <Label htmlFor="reset-email">Email</Label>
                <Input 
                  id="reset-email" 
                  type="email"
                  value={resetPasswordEmail} 
                  onChange={(e) => setResetPasswordEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button onClick={submit}>Send Reset Link</Button>
              </div>
            </div>
          )}

          {open?.type === 'announcement' && (
            <div className="space-y-4">
              <p className="text-sm">Send a push notification announcement to all users.</p>
              <div>
                <Label htmlFor="announcement-title">Title</Label>
                <Input 
                  id="announcement-title" 
                  value={announcementTitle} 
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="Enter announcement title..."
                />
              </div>
              <div>
                <Label htmlFor="announcement-message">Message</Label>
                <textarea 
                  id="announcement-message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={announcementMessage} 
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Enter announcement message..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button onClick={submit}>Send Announcement</Button>
              </div>
            </div>
          )}

          {open?.type === 'seller-request' && selected && (
            <div className="space-y-4">
              {(() => {
                const addressinfoObj = (() => { try { return typeof selected.addressinfo === 'string' ? JSON.parse(selected.addressinfo) : selected.addressinfo; } catch { return undefined; } })();
                const app = addressinfoObj?.seller_application || {};
                const barangay = app?.documents?.barangayClearance || {};
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-500">Business Name</div>
                        <div className="font-medium">{selected.business_name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Phone</div>
                        <div className="font-medium">{selected.phone || '-'}</div>
                      </div>
                  
                      <div>
                        <div className="text-gray-500">TIN</div>
                        <div className="font-medium">{app?.taxIdNumber || '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Business Reg. No.</div>
                        <div className="font-medium">{app?.businessRegistrationNumber || '-'}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Store Description</div>
                      <div className="text-sm">{app?.storeDescription || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Address</div>
                      <div className="text-sm">
                        {[addressinfoObj?.line1 || addressinfoObj?.addressLine, addressinfoObj?.city, addressinfoObj?.province, addressinfoObj?.postalCode].filter(Boolean).join(', ') || '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm mb-2">Barangay Clearance</div>
                      {barangay?.url ? (
                        <div className="space-y-2">
                          <img src={barangay.url} alt="Barangay clearance" className="max-h-64 rounded border" />
                          <a href={barangay.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all text-xs">Open full image</a>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">No document</div>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Main Users Component
export default function Users() {
  return (
    <DynamicTableProvider>
      <div className="h-full overflow-y-auto p-6">
        <UsersDataLoader />
      </div>
    </DynamicTableProvider>
  );
}