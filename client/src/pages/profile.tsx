import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Smartphone, MessageCircle, Settings, Edit, Facebook, Twitter, Instagram, LogOut, 
  Shield, Save, X, Search, Send, Circle, User, Mail, Phone, MapPin, TrendingUp, 
  Download, Users, Activity, Key, Map, AlertCircle, CheckCircle, Clock, 
  Globe, Database, RefreshCw, Filter, MoreHorizontal, Eye, EyeOff
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  UserApiService, 
  transformUserData, 
  getOnlineStatus, 
  getUserDisplayName, 
  getUserInitials 
} from "@/lib/userApi";
import type { 
  User as UserType, 
  SettingsState, 
  ActivityLogItem, 
  IPLog, 
  AdminStats, 
  ProfileFormData,
  LoadingState,
  PaginationInfo,
  UserSearchParams
} from "@/lib/types";

// Error Boundary Component
class ProfileErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Profile Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full overflow-y-auto p-6 custom-scrollbar flex items-center justify-center"
        >
          <div className="max-w-md text-center">
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Something went wrong with the profile page. Please try refreshing.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

function Profile() {
  const { user, logout, fetchUserProfile } = useAuth();
  const queryClient = useQueryClient();

  // Add error boundary for the entire component
  const [componentError, setComponentError] = useState<Error | null>(null);

  // Reset error when user changes
  useEffect(() => {
    setComponentError(null);
  }, [user]);
  
  // State management
  const [settings, setSettings] = useState<SettingsState>({
    emailOnFollow: true,
    emailOnReply: false,
    emailOnMention: true,
    newLaunches: false,
    monthlyUpdates: true,
    newsletter: false,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: ''
  });
  
  // Admin features state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const isAdmin = (user as any)?.role === 'admin';
  
  // Debug admin mode changes
  useEffect(() => {
    console.log('Admin mode changed:', isAdminMode);
    console.log('Is admin:', isAdmin);
    console.log('User role:', (user as any)?.role);
  }, [isAdminMode, isAdmin, user]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useState<UserSearchParams>({
    page: 1,
    limit: 10,
    role: '',
    verified: undefined
  });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Loading states
  const [loading, setLoading] = useState<LoadingState>({
    profile: false,
    users: false,
    activity: false,
    ipLogs: false,
    adminStats: false,
    saving: false,
    uploading: false,
  });

  // Use user data directly from auth context
  let currentUser = null;
  let userError = null;
  
  try {
    if (user && typeof user === 'object') {
      currentUser = transformUserData(user as any);
      console.log('Profile - User data:', user);
      console.log('Profile - Transformed user:', currentUser);
    } else {
      console.log('Profile - No user data available');
    }
  } catch (error) {
    console.error('Error transforming user data:', error);
    userError = error as Error;
    setComponentError(error as Error);
  }
  
  const isLoadingUser = false; // User data is already loaded from auth context

  // Show error boundary if there's a component error
  if (componentError) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full overflow-y-auto p-6 custom-scrollbar flex items-center justify-center"
      >
        <div className="max-w-md text-center">
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              An error occurred while loading the profile. Please try refreshing the page.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setComponentError(null)}
            >
              Try Again
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['users', searchParams],
    queryFn: () => UserApiService.getUsers(searchParams),
    enabled: isAdmin && isAdminMode,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: activityData, isLoading: isLoadingActivity, error: activityError } = useQuery({
    queryKey: ['user-activity', selectedUser?.id],
    queryFn: () => UserApiService.getUserActivity(selectedUser!.id),
    enabled: !!selectedUser && isAdmin,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: false, // Don't retry on error
  });

  const { data: ipLogsData, isLoading: isLoadingIPLogs, error: ipLogsError } = useQuery({
    queryKey: ['user-ip-logs', selectedUser?.id],
    queryFn: () => UserApiService.getUserIPLogs(selectedUser!.id),
    enabled: !!selectedUser && isAdmin,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: false, // Don't retry on error
  });

  const { data: adminStats, isLoading: isLoadingAdminStats, error: adminStatsError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => UserApiService.getAdminStats(),
    enabled: isAdmin && isAdminMode, // Only fetch when in admin mode
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on error
  });

  // Log admin stats errors for debugging
  useEffect(() => {
    if (adminStatsError) {
      console.log('Admin stats endpoint not available, using fallback data');
    }
  }, [adminStatsError]);

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string | number; data: Partial<UserType> }) =>
      isAdminMode ? UserApiService.updateUserAdmin(userId, data) : UserApiService.updateUser(userId, data),
    onMutate: async (vars) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['user'] });
      
      // Snapshot previous value
      const previousUser = queryClient.getQueryData(['user']);
      
      // Optimistically update to new value
      queryClient.setQueryData(['user'], (old: any) => ({ ...old, ...vars.data }));
      
      return { previousUser };
    },
    onSuccess: (data, vars) => {
      // Update cache with response data if available
      if (data) {
        queryClient.setQueryData(['user'], data);
      }
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (fetchUserProfile) {
        fetchUserProfile(); // Force full profile reload from auth context
      }
      toast({ title: 'Success', description: 'Profile updated successfully!' });
    },
    onError: (error: any, vars, context) => {
      console.error('Full error details:', error); // Enhanced logging
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(['user'], context.previousUser);
      }
      let errorMessage = 'Failed to update profile';
      
      if (error.message) {
        if (error.message.includes('404')) {
          errorMessage = 'User not found. Please try logging in again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to server. Please check your internet connection.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message; // Use backend error message if available
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string | number; role: string }) =>
      UserApiService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Success', description: 'User role updated successfully!' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update role', variant: 'destructive' });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string | number) => UserApiService.resetUserPassword(userId),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Password reset email sent!' });
      setIsResetDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to reset password', variant: 'destructive' });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: ({ userId, file }: { userId: string | number; file: File }) =>
      UserApiService.uploadAvatar(userId, file),
    onSuccess: (data) => {
      setProfileForm(prev => ({ ...prev, avatar: data.url }));
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({ title: 'Success', description: 'Avatar uploaded successfully!' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to upload avatar', variant: 'destructive' });
    },
  });

  // Computed values
  const displayUser = useMemo(() => {
    try {
      if (isAdminMode && selectedUser) {
        return transformUserData(selectedUser);
      }
      return currentUser ? transformUserData(currentUser) : null;
    } catch (error) {
      console.error('Error computing displayUser:', error);
      return null;
    }
  }, [isAdminMode, selectedUser, currentUser]);

  const filteredUsers = useMemo(() => {
    try {
      if (!usersData?.data || !Array.isArray(usersData.data)) {
        console.log('usersData.data is not an array:', usersData?.data);
        return [];
      }
      return usersData.data.filter((u: UserType) => {
        const name = getUserDisplayName(u);
        const email = u.email || '';
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = name.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower);
        const isNotCurrentUser = u.id !== user?.id;
        return isNotCurrentUser && matchesSearch;
      });
    } catch (error) {
      console.error('Error filtering users:', error);
      return [];
    }
  }, [usersData?.data, searchQuery, user?.id]);

  const paginationInfo: PaginationInfo = useMemo(() => {
    try {
      if (!usersData) return {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNext: false,
        hasPrev: false,
      };

      const totalPages = Math.ceil((usersData.total || 0) / (searchParams.limit || 10));
      return {
        currentPage: searchParams.page || 1,
        totalPages,
        totalItems: usersData.total || 0,
        itemsPerPage: searchParams.limit || 10,
        hasNext: (searchParams.page || 1) < totalPages,
        hasPrev: (searchParams.page || 1) > 1,
      };
    } catch (error) {
      console.error('Error computing pagination info:', error);
      return {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNext: false,
        hasPrev: false,
      };
    }
  }, [usersData, searchParams]);

  // Early return if no user
  if (!user && !isAdminMode) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full overflow-y-auto p-6 custom-scrollbar flex items-center justify-center"
      >
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Loading Profile...</h2>
          <p className="text-stone-600">Please log in to view your profile.</p>
        </div>
      </motion.div>
    );
  }

  // Event handlers
  const handleSettingChange = useCallback(async (key: keyof SettingsState) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
    
    if (user) {
      try {
        await UserApiService.updateUser(user.id, { settings: newSettings } as any);
      } catch (error) {
        console.error('Failed to save settings:', error);
        toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
      }
    }
  }, [settings, user]);

  const handleEditProfile = useCallback(() => {
    const targetUser = isAdminMode ? selectedUser : displayUser;
    if (targetUser) {
      // Prefer DB firstname/lastname if available, fallback to splitting name
      const firstName = targetUser.firstName || targetUser.firstName || '';
      const lastName = targetUser.lastName || targetUser.lastName || '';
      let fullNameFallbackFirst = '';
      let fullNameFallbackLast = '';
      if (!firstName && !lastName) {
        // Fallback to splitting name if separate fields are missing
        const fullName = targetUser.name || '';
        const nameParts = fullName.split(' ');
        fullNameFallbackFirst = nameParts[0] || '';
        fullNameFallbackLast = nameParts.slice(1).join(' ') || '';
      }
      
      setProfileForm({
        firstName: firstName || fullNameFallbackFirst,
        lastName: lastName || fullNameFallbackLast,
        email: targetUser.email || '',
        phone: targetUser.phone || targetUser.mobile || '',
        avatar: targetUser.profilepicture || targetUser.avatar || ''
      });
      setIsEditingProfile(true);
    }
  }, [isAdminMode, selectedUser, displayUser]);

  const handleSaveProfile = useCallback(async () => {
    if (!displayUser?.id) {
      console.error('No user ID available for profile update');
      toast({ title: 'Error', description: 'No user ID available. Please try logging in again.', variant: 'destructive' });
      return;
    }
    
    // Map frontend fields to database fields
    const updateData: any = {};
    
    // Trim and set firstname, lastname, and combined name
    const firstNameTrimmed = profileForm.firstName.trim();
    const lastNameTrimmed = profileForm.lastName.trim();
    
    if (firstNameTrimmed) {
      updateData.firstname = firstNameTrimmed;
    }
    if (lastNameTrimmed) {
      updateData.lastname = lastNameTrimmed;
    }
    
    // Optional: Send combined name for backward compatibility
    if (firstNameTrimmed || lastNameTrimmed) {
      const fullName = `${firstNameTrimmed} ${lastNameTrimmed}`.trim();
      if (fullName) {
        updateData.name = fullName;
      }
    }
    
    // Map other fields to database schema
    if (profileForm.email.trim()) updateData.email = profileForm.email.trim();
    if (profileForm.phone.trim()) updateData.phone = profileForm.phone.trim();
    if (profileForm.avatar.trim()) updateData.profilepicture = profileForm.avatar.trim();

    console.log('Updating profile with data:', { userId: displayUser.id, data: updateData });
    console.log('Is admin mode:', isAdminMode);
    
    updateUserMutation.mutate({ userId: displayUser.id, data: updateData });
    setIsEditingProfile(false);
  }, [displayUser, profileForm, updateUserMutation, isAdminMode]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingProfile(false);
    setProfileForm({ firstName: '', lastName: '', email: '', phone: '', avatar: '' });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast({ title: 'Success', description: 'You have been logged out successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred during logout. Please try again.', variant: 'destructive' });
    }
  }, [logout]);

  const handleRoleChange = useCallback(async (role: string) => {
    if (!selectedUser || !isAdmin) return;
    updateRoleMutation.mutate({ userId: selectedUser.id, role });
  }, [selectedUser, isAdmin, updateRoleMutation]);

  const handleResetPassword = useCallback(async () => {
    if (!selectedUser || !isAdmin) return;
    resetPasswordMutation.mutate(selectedUser.id);
  }, [selectedUser, isAdmin, resetPasswordMutation]);

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!displayUser?.id) return;
    uploadAvatarMutation.mutate({ userId: displayUser.id, file });
  }, [displayUser, uploadAvatarMutation]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setSearchParams(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleUserSelect = useCallback((user: UserType) => {
    setSelectedUser(user);
    setActiveTab('profile');
  }, []);

  const handleBulkRoleChange = useCallback(async (role: string) => {
    if (selectedUsers.size === 0) return;
    try {
      const promises = Array.from(selectedUsers).map(userId => 
        UserApiService.updateUserRole(userId, role)
      );
      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Success', description: `${selectedUsers.size} users assigned role ${role}` });
      setSelectedUsers(new Set());
    } catch (error: any) {
      toast({ title: 'Error', description: 'Bulk update failed', variant: 'destructive' });
    }
  }, [selectedUsers, queryClient]);

  const handleUserToggle = useCallback((userId: string, checked: boolean) => {
    const newSet = new Set(selectedUsers);
    if (checked) {
      newSet.add(userId);
    } else {
      newSet.delete(userId);
    }
    setSelectedUsers(newSet);
  }, [selectedUsers]);

  const handlePageChange = useCallback((page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  }, [queryClient]);

  // Loading and error states
  if (isLoadingUser) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full overflow-y-auto p-6 custom-scrollbar flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Loading Profile...</h2>
          <p className="text-stone-600">Please wait while we fetch your profile data.</p>
        </div>
      </motion.div>
    );
  }

  if (userError || !displayUser) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full overflow-y-auto p-6 custom-scrollbar flex items-center justify-center"
      >
        <div className="max-w-md">
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {userError ? 'Failed to load profile data. Please try again.' : 'No profile data available.'}
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-full overflow-y-auto p-6 custom-scrollbar"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with Admin Toggle */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-indigo-100 dark:border-slate-700"
        >
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-400 to-indigo-400 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Avatar className="w-20 h-20 border-4 border-white/20 shadow-xl">
                    <AvatarImage src={displayUser.avatar} alt={getUserDisplayName(displayUser)} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl">
                      {getUserInitials(displayUser)}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="ml-6"
                >
                  <div className="flex items-center space-x-3">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {getUserDisplayName(displayUser)}
                  </h2>
                    {getOnlineStatus(displayUser) && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Circle className="w-2 h-2 fill-current mr-1" />
                        Online
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-lg mt-1">{displayUser.title}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{displayUser.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{displayUser.mobile || displayUser.phone}</span>
                    </div>
                    {isAdminMode && (
                      <div className="flex items-center space-x-1">
                        <Shield className="w-4 h-4" />
                        <span>{displayUser.verified ? 'Verified' : 'Unverified'}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex space-x-3"
              >
               
                <Button 
                  variant="secondary" 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={handleEditProfile}
                >
                  <Edit className="mr-2 w-4 h-4" />
                  Edit Profile
                </Button>
                <Button 
                  variant="secondary" 
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 w-4 h-4" />
                  Logout
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Admin User Search */}
        {isAdmin && isAdminMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>User Management</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    {selectedUsers.size > 0 && (
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handleBulkRoleChange('admin')}>Bulk Admin</Button>
                        <Button size="sm" onClick={() => handleBulkRoleChange('seller')}>Bulk Seller</Button>
                        <Button size="sm" variant="destructive" onClick={() => setSelectedUsers(new Set())}>Clear</Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex space-x-4 mb-4">
                <Input 
                  placeholder="Search users by name/email..." 
                  value={searchQuery} 
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={searchParams.role || 'all'} onValueChange={(value) => setSearchParams(prev => ({ ...prev, role: value === 'all' ? '' : value, page: 1 }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="buyer">Buyer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => handleSearchChange('')}>Clear</Button>
                </div>
                
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : usersError ? (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Users</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Failed to load users. Please check your connection and try again.
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleRefresh}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div>
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="mb-4">
                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            {searchQuery ? 'No users match your search criteria.' : 'No users are available.'}
                          </p>
                        </div>
                        {!searchQuery && (
                          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <strong>Note:</strong> This is demo mode. Real user data would be displayed here when the backend API is implemented.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredUsers.map((u) => (
                      <Card key={u.id} className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedUser?.id === u.id ? 'ring-2 ring-indigo-500' : ''}`}>
                        <CardContent className="p-4" onClick={() => handleUserSelect(u)}>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={u.avatar} alt={getUserDisplayName(u)} />
                              <AvatarFallback>{getUserInitials(u)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{getUserDisplayName(u)}</p>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'seller' ? 'default' : 'secondary'} className="text-xs">
                                  {u.role}
                                </Badge>
                                {getOnlineStatus(u) && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                    <Circle className="w-2 h-2 fill-current mr-1" />
                                    Online
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Checkbox 
                              checked={selectedUsers.has(String(u.id))} 
                              onCheckedChange={(checked) => handleUserToggle(String(u.id), !!checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                      </div>
                    )}
                  </div>
                )}
                
                {paginationInfo.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Showing {((paginationInfo.currentPage - 1) * paginationInfo.itemsPerPage) + 1} to {Math.min(paginationInfo.currentPage * paginationInfo.itemsPerPage, paginationInfo.totalItems)} of {paginationInfo.totalItems} users
                    </p>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
                        disabled={!paginationInfo.hasPrev}
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
                        disabled={!paginationInfo.hasNext}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

      
          {/* Profile Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-stone-900">Profile Information</CardTitle>
                {isAdminMode && selectedUser && (
                      <Select value={displayUser.role || ''} onValueChange={handleRoleChange}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                <div>
                        <label className="text-sm font-medium text-gray-900">First Name</label>
                        <p className="text-sm text-gray-600 mt-1">{displayUser.firstName || 'Not provided'}</p>
                </div>
                <div>
                        <label className="text-sm font-medium text-gray-900">Last Name</label>
                        <p className="text-sm text-gray-600 mt-1">{displayUser.lastName || 'Not provided'}</p>
                </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                <div>
                        <label className="text-sm font-medium text-gray-900">Email</label>
                        <p className="text-sm text-gray-600 mt-1">{displayUser.email || 'Not provided'}</p>
                </div>
                <div>
                        <label className="text-sm font-medium text-gray-900">Mobile</label>
                        <p className="text-sm text-gray-600 mt-1">{displayUser.mobile || displayUser.phone || 'Not provided'}</p>
                </div>
                    </div>
                  <div>
                      <label className="text-sm font-medium text-gray-900">Role</label>
                      <div className="mt-1">
                        <Badge variant={displayUser.role === 'admin' ? 'destructive' : displayUser.role === 'seller' ? 'default' : 'secondary'}>
                          {displayUser.role || 'buyer'}
                        </Badge>
                      </div>
                    </div>
                    {displayUser.business_name && (
                      <div>
                        <label className="text-sm font-medium text-gray-900">Business Name</label>
                        <p className="text-sm text-gray-600 mt-1">{displayUser.business_name}</p>
                      </div>
                    )}
                    
                {isAdminMode && (
                  <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-900">Verified</label>
                        <Switch 
                          checked={displayUser.verified || false} 
                          onCheckedChange={async (checked) => {
                      if (!selectedUser) return;
                      try {
                              await UserApiService.updateUserVerification(selectedUser.id, checked);
                              queryClient.invalidateQueries({ queryKey: ['users'] });
                        toast({ title: 'Updated', description: `Verification ${checked ? 'enabled' : 'disabled'}` });
                      } catch (e: any) {
                        toast({ title: 'Error', description: e.message, variant: 'destructive' });
                      }
                          }} 
                        />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

       
        </div>
          

         

        {/* Edit Profile Dialog */}
        <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>{isAdminMode ? 'Edit User Profile' : 'Edit Profile'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={profileForm.firstName} 
                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))} 
                    placeholder="Enter first name" 
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={profileForm.lastName} 
                    onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))} 
                    placeholder="Enter last name" 
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profileForm.email} 
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))} 
                  placeholder="Enter email address" 
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  value={profileForm.phone} 
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))} 
                  placeholder="Enter mobile number" 
                />
              </div>
              <div>
                <Label htmlFor="avatar">Profile Picture</Label>
                <Input 
                  id="avatar" 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                  const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
                {profileForm.avatar && (
                  <div className="mt-2">
                    <img src={profileForm.avatar} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                    <p className="text-xs text-gray-500 mt-1">Current avatar</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={updateUserMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password for {selectedUser ? getUserDisplayName(selectedUser) : 'User'}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 mb-4">
              This will generate a new random password and email it to the user. Are you sure?
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleResetPassword}
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Confirm Reset'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
  
  );
}

// Export the Profile component wrapped with error boundary
export default function ProfileWithErrorBoundary() {
  return (
    <ProfileErrorBoundary>
      <Profile />
    </ProfileErrorBoundary>
  );
}