import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Smartphone, MessageCircle, Settings, Edit, Facebook, Twitter, Instagram, LogOut, Shield, Save, X, Search, Send, Circle } from "lucide-react";
import { messagesData } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiUrl, getJson } from "@/lib/api";
import type { SettingsState } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const { user, logout, fetchUserProfile } = useAuth();
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
  const [adminData, setAdminData] = useState<any>(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [sentMessages, setSentMessages] = useState<any[]>(() => {
    // Load messages from localStorage on component mount
    try {
      const saved = localStorage.getItem('sentMessages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // Fetch online users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/users?page=1&limit=50"],
    queryFn: () => getJson<any>("/users?page=1&limit=50")
  });

  // Handle nested data structure from API: {success: true, data: {data: [...]}}
  const users: any[] = usersData?.success ? 
    (Array.isArray(usersData.data) ? usersData.data : 
     (Array.isArray(usersData.data?.data) ? usersData.data.data : [])) : [];
  
  // Debug: Log users to see what we're getting
  console.log('All users from API:', users);
  console.log('Current user:', user);
  
  // Filter users based on search query and exclude current user
  const filteredUsers = users.filter((u: any) => {
    const name = u.name || u.firstname || u.firstName || u.username || '';
    const email = u.email || '';
    const searchLower = searchQuery.toLowerCase();
    const userId = u._id || u.id;
    const currentUserId = user?.id;
    const isNotCurrentUser = userId !== currentUserId;
    const matchesSearch = name.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower);
    
    // Debug: Log filtering
    console.log('User filter check:', {
      name,
      email,
      searchLower,
      isNotCurrentUser,
      matchesSearch,
      userId,
      currentUserId,
      userObject: u
    });
    
    return isNotCurrentUser && matchesSearch;
  });
  
  console.log('Filtered users:', filteredUsers);

  // Determine online status based on recent activity
  const getOnlineStatus = (user: any) => {
    const userId = user._id || user.id;
    
    // Check if user has been active recently (within last 5 minutes)
    const lastActive = user.lastActive || user.updatedAt || user.createdAt;
    if (lastActive) {
      const lastActiveTime = new Date(lastActive);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return lastActiveTime > fiveMinutesAgo;
    }
    
    // Fallback: consider users with recent creation dates as potentially active
    const createdAt = new Date(user.createdAt);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return createdAt > oneHourAgo;
  };

  const handleSettingChange = async (key: keyof SettingsState) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
    if (user) {
      try {
        await fetch(apiUrl(`/users/${user.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: newSettings })
        });
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }
  };

  const handleEditProfile = () => {
    if (user) {
      setProfileForm({
        firstName: (user as any).firstName || (user as any).username || '',
        lastName: (user as any).lastName || '',
        email: (user as any).email || '',
        phone: (user as any).mobile || (user as any).phone || '',
        avatar: (user as any).avatar || ''
      });
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const updatePayload: Record<string, any> = {};
      if (profileForm.firstName.trim()) updatePayload.firstname = profileForm.firstName.trim();
      if (profileForm.lastName.trim()) updatePayload.lastname = profileForm.lastName.trim();
      if (profileForm.email.trim()) updatePayload.email = profileForm.email.trim();
      if (profileForm.phone.trim()) updatePayload.phone = profileForm.phone.trim();
      if (profileForm.avatar.trim()) updatePayload.profilepicture = profileForm.avatar.trim();

      const response = await fetch(apiUrl(`/users/${user.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (response.ok) {
        await fetchUserProfile();
        setIsEditingProfile(false);
        toast({ title: 'Success', description: 'Profile updated successfully!' });
      } else {
        let description = 'Failed to update profile';
        try {
          const err = await response.json();
          description = err?.message || description;
        } catch {}
        toast({ title: 'Error', description, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error', description: 'An error occurred while updating your profile', variant: 'destructive' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileForm({ firstName: '', lastName: '', email: '', phone: '', avatar: '' });
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Success', description: 'You have been logged out successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred during logout. Please try again.', variant: 'destructive' });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !messageText.trim()) {
      toast({ title: 'Error', description: 'Please select a user and enter a message', variant: 'destructive' });
      return;
    }

    try {
      // Create or get conversation between admin and selected user
      // For admin messaging, we need to determine roles based on user types
      const adminId = user?.id;
      const targetUserId = selectedUser._id || selectedUser.id;
      
      // Determine who should be buyer and seller based on roles
      let buyerId, sellerId;
      if (user?.isAdmin) {
        // Admin is always the "buyer" in the conversation structure
        buyerId = adminId;
        sellerId = targetUserId;
      } else {
        // For non-admin users, use the original logic
        buyerId = adminId;
        sellerId = targetUserId;
      }

      const conversationResponse = await fetch(apiUrl('/messages/conversation'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: buyerId,
          sellerId: sellerId
        })
      });

      if (!conversationResponse.ok) {
        throw new Error('Failed to create conversation');
      }

      const conversationData = await conversationResponse.json();
      const conversationId = conversationData.data.id;

      // Send the actual message
      const messageResponse = await fetch(apiUrl(`/messages/${conversationId}/messages`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user?.id,
          text: messageText.trim()
        })
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to send message');
      }

      const messageData = await messageResponse.json();
      console.log('Message sent successfully:', messageData);
      
      // Add to sent messages history for UI
      const newMessage = {
        id: messageData.data.id,
        recipientId: selectedUser._id || selectedUser.id,
        recipientName: selectedUser.name || selectedUser.firstname || selectedUser.firstName || selectedUser.username,
        recipientEmail: selectedUser.email,
        message: messageText.trim(),
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      const updatedMessages = [newMessage, ...sentMessages];
      setSentMessages(updatedMessages);
      
      // Save to localStorage for UI persistence
      localStorage.setItem('sentMessages', JSON.stringify(updatedMessages));
      
      toast({ 
        title: 'Message Sent', 
        description: `Message sent to ${selectedUser.name || selectedUser.firstName || selectedUser.username}` 
      });
      
      setMessageText('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: 'destructive' });
    }
  };

  const handleStartChat = (user: any) => {
    setSelectedUser(user);
    setMessageText('');
  };

  const fetchConversations = async () => {
    if (!user?.id) return;
    
    setIsLoadingConversations(true);
    try {
      const response = await fetch(apiUrl(`/messages/conversations?userId=${user.id}`));
      if (response.ok) {
        const data = await response.json();
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchAdminData = async () => {
    // No admin stats endpoint available; skip to avoid console JSON parse errors
    return;
  };

  useEffect(() => {
    fetchUserProfile();
    if (user?.isAdmin) fetchAdminData();
    if (user?.id) fetchConversations();
  }, [user?.isAdmin, user?.id]);

  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch {}
    }
  }, []);

  const userProfile = user ? {
    name: (user as any).firstName && (user as any).lastName ? `${(user as any).firstName} ${(user as any).lastName}` : (user as any).username,
    title: (user as any).title || 'User',
    firstName: (user as any).firstName || (user as any).username,
    lastName: (user as any).lastName || (user as any).username,
    phone: (user as any).mobile || (user as any).phone || 'Not provided',
    email: (user as any).email || 'Not provided',
    shippingFee: (user as any).shipping_fee ?? undefined,
    avatar: (user as any).avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face'
  } : {
    name: 'Guest User', title: 'Guest', firstName: 'Guest', phone: 'Not provided', email: 'Not provided', shippingFee: undefined,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face'
  };

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-stone-900 rounded-xl p-8 mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="w-16 h-16 border-2 border-white/20">
                  <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                  <AvatarFallback className="bg-stone-700 text-white">
                    {String(userProfile.name).split(' ').map((part: string) => part[0] ?? '').join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-white">{userProfile.name}</h2>
                  <p className="text-white/80">{userProfile.title}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                
                <Button variant="secondary" className="bg-red-500/20 text-white hover:bg-red-500/30 hover:text-white border-0" onClick={handleLogout}>
                  <LogOut className="mr-2 w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Profile Information */}
          <Card className="border-black-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-stone-900">Profile Information</CardTitle>
                <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-600" onClick={handleEditProfile}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-black">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" value={profileForm.firstName} onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))} placeholder="Enter your first name" />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" value={profileForm.lastName} onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Enter your last name" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={profileForm.email} onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))} placeholder="Enter your email" />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={profileForm.phone} onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="Enter your mobile number" />
                      </div>
                      <div>
                        <Label htmlFor="avatar">Profile Picture</Label>
                        <Input id="avatar" type="file" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !user) return;
                          try {
                            const fd = new FormData();
                            fd.append('img', file);
                            const resp = await fetch(apiUrl(`/users/${user.id}/avatar`), { method: 'POST', body: fd });
                            const data = await resp.json();
                            if (resp.ok && data?.data?.url) {
                              setProfileForm(prev => ({ ...prev, avatar: data.data.url }));
                              toast({ title: 'Uploaded', description: 'Profile picture uploaded.' });
                            } else {
                              toast({ title: 'Upload failed', description: data?.message || 'Unable to upload image', variant: 'destructive' });
                            }
                          } catch (err) {
                            toast({ title: 'Upload error', description: String(err), variant: 'destructive' });
                          }
                        }} />
                        {profileForm.avatar && (
                          <p className="text-xs text-stone-500 mt-1">Uploaded: {profileForm.avatar}</p>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={handleCancelEdit}><X className="w-4 h-4 mr-2" />Cancel</Button>
                        <Button onClick={handleSaveProfile} disabled={isSavingProfile}><Save className="w-4 h-4 mr-2" />{isSavingProfile ? 'Saving...' : 'Save Changes'}</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-normal text-gray-900">First Name:</label>
                  <p className="text-sm text-gray-600 mt-1">{userProfile.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-normal text-gray-900">Last Name:</label>
                  <p className="text-sm text-gray-600 mt-1">{userProfile.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-normal text-gray-900">Mobile:</label>
                  <p className="text-sm text-gray-600 mt-1">{userProfile.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-normal text-gray-900">Email:</label>
                  <p className="text-sm text-gray-600 mt-1">{userProfile.email}</p>
                </div>
                {userProfile.shippingFee !== undefined && (
                  <div>
                    <label className="text-sm font-normal text-gray-900">Shipping Fee:</label>
                    <p className="text-sm text-gray-600 mt-1">{String(userProfile.shippingFee)}</p>
                  </div>
                )}
                
                </div>
             
            </CardContent>
          </Card>

          
        </div>
      </div>
    </div>
  );
}
