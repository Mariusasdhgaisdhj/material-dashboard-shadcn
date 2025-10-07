import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Smartphone, MessageCircle, Settings, Edit, Facebook, Twitter, Instagram, LogOut, Shield, Save, X } from "lucide-react";
import { messagesData } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";
import type { SettingsState } from "@/lib/types";

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

  const fetchAdminData = async () => {
    // No admin stats endpoint available; skip to avoid console JSON parse errors
    return;
  };

  useEffect(() => {
    fetchUserProfile();
    if (user?.isAdmin) fetchAdminData();
  }, [user?.isAdmin]);

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Settings */}
          <Card className="border-black-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stone-900">Platform Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-normal text-stone-900 mb-3">ACCOUNT</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-700">Email me when someone follows me</span>
                    <Switch checked={settings.emailOnFollow} onCheckedChange={() => handleSettingChange('emailOnFollow')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-700">Email me when someone answers on my post</span>
                    <Switch checked={settings.emailOnReply} onCheckedChange={() => handleSettingChange('emailOnReply')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-700">Email me when someone mentions me</span>
                    <Switch checked={settings.emailOnMention} onCheckedChange={() => handleSettingChange('emailOnMention')} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-normal text-stone-900 mb-3">APPLICATION</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-700">New launches and projects</span>
                    <Switch checked={settings.newLaunches} onCheckedChange={() => handleSettingChange('newLaunches')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-700">Monthly product updates</span>
                    <Switch checked={settings.monthlyUpdates} onCheckedChange={() => handleSettingChange('monthlyUpdates')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-700">Subscribe to newsletter</span>
                    <Switch checked={settings.newsletter} onCheckedChange={() => handleSettingChange('newsletter')} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Messages */}
          <Card className="border-black-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messagesData.map((message) => (
                  <div key={message.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={message.avatar} alt={message.sender} />
                        <AvatarFallback>{message.sender.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="text-sm font-normal text-gray-900">{message.sender}</p>
                        <p className="text-xs text-gray-500">{message.preview}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs font-normal text-primary-600 border-primary-200 hover:bg-primary-50">REPLY</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
