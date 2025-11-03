import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getJson, apiUrl } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2,
  TrendingUp,
  MessageCircle,
  User,
  Search,
  Filter,
  Download,
  Pin,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Flag,
  XCircle,
  AlertTriangle
} from "lucide-react";

export default function Forum() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ 
    queryKey: ["/posts?page=1&limit=50"], 
    queryFn: () => getJson<any>("/posts?page=1&limit=50") 
  });
  
  const posts: any[] = data?.success && Array.isArray(data.data) ? data.data : [];
  
  const forumCategories = useMemo(() => {
    const s = new Set<string>();
    posts.forEach(p => s.add(p.category || "General"));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  // Enhanced state
  const [open, setOpen] = useState<{ 
    type: "add"|"edit"|"delete"|"comments"|"moderate"|"bulk-action"; 
    id?: string 
  }|null>(null);
  
  const [form, setForm] = useState<{ 
    title: string; 
    content: string; 
    category?: string; 
    imageFile?: File | null 
  }>({ 
    title: "", 
    content: "", 
    category: "General",
    imageFile: null
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [moderationReason, setModerationReason] = useState("");

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch = searchQuery === "" || 
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.users?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || post.category === categoryFilter;
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "pinned" && post.is_pinned) ||
        (statusFilter === "locked" && post.is_locked) ||
        (statusFilter === "hidden" && post.is_hidden) ||
        (statusFilter === "flagged" && post.is_flagged);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [posts, searchQuery, categoryFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: posts.length,
      pinned: posts.filter(p => p.is_pinned).length,
      locked: posts.filter(p => p.is_locked).length,
      hidden: posts.filter(p => p.is_hidden).length,
      flagged: posts.filter(p => p.is_flagged).length,
    };
  }, [posts]);

  const selected = useMemo(() => posts.find(p => (p.id || p._id) === open?.id), [open, posts]);

  useEffect(() => {
    if (open?.type === "edit" && selected) {
      setForm({ 
        title: selected.title || "", 
        content: selected.content || "", 
        category: selected.category || "General",
        imageFile: null
      });
    }
    if (!open) setForm({ title: "", content: "", category: "General", imageFile: null });
  }, [open, selected]);

  const startAdd = () => setOpen({ type: "add" });
  const startEdit = (p: any) => setOpen({ type: "edit", id: p.id || p._id });
  const startDelete = (p: any) => setOpen({ type: "delete", id: p.id || p._id });
  const openComments = (p: any) => setOpen({ type: "comments", id: p.id || p._id });
  const openModerate = (p: any) => {
    setModerationReason("");
    setOpen({ type: "moderate", id: p.id || p._id });
  };

  const submit = async () => {
    try {
      if (!open) return;
      
      if (open.type === "add") {
        const formData = new FormData();
        formData.append('userId', String(user?.id || ''));
        formData.append('title', form.title);
        formData.append('content', form.content);
        formData.append('category', form.category || 'General');
        
        if (form.imageFile) {
          formData.append('img', form.imageFile);
        }
        
        const res = await fetch(apiUrl("/posts"), {
          method: "POST",
          body: formData
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Failed to create post' }));
          throw new Error(errorData.message || 'Failed to create post');
        }
        
        toast({ title: "Success", description: "Post created successfully" });
      }
      
      if (open.type === "edit" && open.id) {
        const res = await fetch(apiUrl(`/posts/${open.id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title: form.title, 
            content: form.content, 
            category: form.category 
          })
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Failed to update post' }));
          throw new Error(errorData.message || 'Failed to update post');
        }
        
        toast({ title: "Success", description: "Post updated successfully" });
      }
      
      if (open.type === "delete" && open.id) {
        const res = await fetch(apiUrl(`/posts/${open.id}/delete`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id })
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Failed to delete post' }));
          throw new Error(errorData.message || 'Failed to delete post');
        }
        
        toast({ title: "Success", description: "Post deleted successfully" });
      }
      
      if (open.type === "moderate" && open.id) {
        const res = await fetch(apiUrl(`/posts/${open.id}/moderate`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: moderationReason, action: "flag" })
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Failed to moderate post' }));
          throw new Error(errorData.message || 'Failed to moderate post');
        }
        
        toast({ title: "Success", description: "Post moderated successfully" });
      }
      
      if (open.type === "bulk-action" && bulkAction) {
        const postIds = Array.from(selectedPosts);
        if (postIds.length === 0) throw new Error("No posts selected");
        
        const res = await fetch(apiUrl("/posts/bulk-action"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: bulkAction, postIds })
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Bulk action failed' }));
          throw new Error(errorData.message || 'Bulk action failed');
        }
        
        toast({ title: "Success", description: `${bulkAction} applied to ${postIds.length} posts` });
        setSelectedPosts(new Set());
      }
    } catch (e: any) {
      console.error('Submit error:', e);
      toast({ 
        title: "Error", 
        description: e?.message || "Action failed", 
        variant: "destructive" 
      });
    } finally {
      setOpen(null);
      await refetch();
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Title', 'Author', 'Category', 'Created', 'Status'].join(','),
      ...filteredPosts.map(p => [
        `"${p.title || 'Untitled'}"`,
        `"${p.users?.name || p.users?.email || 'Unknown'}"`,
        `"${p.category || 'General'}"`,
        `"${p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}"`,
        `"${p.is_pinned ? 'Pinned' : p.is_locked ? 'Locked' : p.is_hidden ? 'Hidden' : 'Active'}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forum-posts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${filteredPosts.length} posts exported to CSV` });
  };

  const togglePostSelection = (postId: string) => {
    const newSet = new Set(selectedPosts);
    if (newSet.has(postId)) {
      newSet.delete(postId);
    } else {
      newSet.add(postId);
    }
    setSelectedPosts(newSet);
  };

  const toggleAllPosts = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id || p._id)));
    }
  };

  const quickAction = async (postId: string, action: string) => {
    try {
      const res = await fetch(apiUrl(`/posts/${postId}/${action}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `Failed to ${action} post` }));
        throw new Error(errorData.message || `Failed to ${action} post`);
      }
      
      toast({ title: "Success", description: `Post ${action}ed successfully` });
      await refetch();
    } catch (e: any) {
      console.error(`${action} error:`, e);
      toast({ title: "Error", description: e?.message || "Action failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Forum Posts</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-stone-500">Loading forum posts...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Forum Posts</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-red-500">Error loading forum posts: {error.message}</div>
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
      className="h-full overflow-y-auto p-6"
    >
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-2 border-slate-200 shadow-xl"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400 to-blue-400 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center space-x-4 mb-3"
              >
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Forum Management
                  </h1>
                  <p className="text-slate-600 text-lg mt-1">Community discussions and knowledge sharing</p>
                </div>
               
              </motion.div>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex gap-3"
            >
             
              {selectedPosts.size > 0 && (
                <Button 
                  onClick={() => setOpen({ type: 'bulk-action' })}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200 font-medium"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Bulk ({selectedPosts.size})
                </Button>
              )}
              <Button 
                onClick={startAdd}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card className="border-2 border-slate-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl overflow-hidden">
          <CardHeader className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Community Posts</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">Manage and moderate forum discussions</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 px-4 py-2 bg-white/80 rounded-lg border border-slate-200">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">{filteredPosts.length} displayed</span>
              </div>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="flex gap-4 items-center p-4 bg-white/60 rounded-xl border border-slate-200">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder="Search posts by title, content, or author..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                />
              </div>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white font-medium"
              >
                <option value="all">All Categories</option>
                {forumCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white font-medium"
              >
                <option value="all">All Status</option>
                <option value="pinned">Pinned</option>
                <option value="locked">Locked</option>
                <option value="hidden">Hidden</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input 
                        type="checkbox" 
                        checked={selectedPosts.size === filteredPosts.length && filteredPosts.length > 0}
                        onChange={toggleAllPosts}
                        className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Post</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y-2 divide-slate-100">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-slate-500 font-medium">No forum posts found</p>
                          <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post, idx) => (
                      <tr key={post.id || post._id || idx} className="hover:bg-slate-50/80 transition-colors duration-200 border-b border-slate-100">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input 
                            type="checkbox" 
                            checked={selectedPosts.has(post.id || post._id)}
                            onChange={() => togglePostSelection(post.id || post._id)}
                            className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                          <div className="flex items-center gap-4">
                            {/* Post Image Thumbnail */}
                            {(post.image_url || post.imageUrl) && (
                              <img 
                                src={post.image_url || post.imageUrl} 
                                alt={post.title || "Post image"}
                                className="w-14 h-14 rounded-lg object-cover border-2 border-slate-200 shadow-sm"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {post.is_pinned && <Pin className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                                {post.is_locked && <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                                {post.is_flagged && <Flag className="w-4 h-4 text-red-600 flex-shrink-0" />}
                                <div className="truncate font-semibold text-slate-900 text-base">{post.title || "Untitled"}</div>
                              </div>
                              {post.content && (
                                <p className="text-sm text-slate-600 truncate max-w-md leading-relaxed">
                                  {post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {(post.users?.name || post.users?.email || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900">{post.users?.name || "Unknown"}</div>
                              <div className="text-xs text-slate-500">{post.users?.email || ""}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant="secondary" 
                            className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 font-medium px-3 py-1"
                          >
                            {post.category || "General"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-1 flex-wrap">
                            {post.is_pinned && (
                              <Badge className="bg-blue-100 text-blue-800 border border-blue-200 font-medium">Pinned</Badge>
                            )}
                            {post.is_locked && (
                              <Badge className="bg-amber-100 text-amber-800 border border-amber-200 font-medium">Locked</Badge>
                            )}
                            {post.is_hidden && (
                              <Badge className="bg-slate-100 text-slate-800 border border-slate-200 font-medium">Hidden</Badge>
                            )}
                            {post.is_flagged && (
                              <Badge className="bg-red-100 text-red-800 border border-red-200 font-medium">Flagged</Badge>
                            )}
                            {!post.is_pinned && !post.is_locked && !post.is_hidden && !post.is_flagged && (
                              <Badge className="bg-green-100 text-green-800 border border-green-200 font-medium">Active</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                          {post.created_at ? new Date(post.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2 flex-wrap">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openComments(post)} 
                              title="View Comments"
                              className="border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className={`${post.is_pinned ? "text-blue-700 border-blue-400 bg-blue-50" : "text-blue-600 border-blue-300 hover:bg-blue-50"} transition-all duration-200`}
                              onClick={() => quickAction(post.id || post._id, post.is_pinned ? "unpin" : "pin")}
                              title={post.is_pinned ? "Unpin" : "Pin"}
                            >
                              <Pin className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className={`${post.is_locked ? "text-amber-700 border-amber-400 bg-amber-50" : "text-amber-600 border-amber-300 hover:bg-amber-50"} transition-all duration-200`}
                              onClick={() => quickAction(post.id || post._id, post.is_locked ? "unlock" : "lock")}
                              title={post.is_locked ? "Unlock" : "Lock"}
                            >
                              {post.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className={`${post.is_hidden ? "text-slate-700 border-slate-400 bg-slate-50" : "text-slate-600 border-slate-300 hover:bg-slate-50"} transition-all duration-200`}
                              onClick={() => quickAction(post.id || post._id, post.is_hidden ? "show" : "hide")}
                              title={post.is_hidden ? "Show" : "Hide"}
                            >
                              {post.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className={`${post.is_flagged ? "text-red-700 border-red-400 bg-red-50" : "text-orange-600 border-orange-300 hover:bg-orange-50"} transition-all duration-200`}
                              onClick={() => post.is_flagged ? quickAction(post.id || post._id, "unflag") : openModerate(post)}
                              title={post.is_flagged ? "Unflag" : "Flag"}
                            >
                              <Flag className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => startEdit(post)}
                              className="text-indigo-600 border-indigo-300 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => startDelete(post)}
                              className="hover:bg-red-600 hover:border-red-600 transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl bg-white border-2 border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader className="border-b-2 border-slate-100 pb-4">
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {open?.type === "add" && (
                <>
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  Create New Post
                </>
              )}
              {open?.type === "edit" && (
                <>
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                  Edit Post
                </>
              )}
              {open?.type === "delete" && (
                <>
                  <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                  Delete Post
                </>
              )}
              {open?.type === "comments" && (
                <>
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  Post Comments
                </>
              )}
              {open?.type === "moderate" && (
                <>
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                    <Flag className="w-5 h-5 text-white" />
                  </div>
                  Moderate Post
                </>
              )}
              {open?.type === "bulk-action" && (
                <>
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  Bulk Actions
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {open?.type === "add" || open?.type === "edit" ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select forum category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {forumCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" rows={6} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
              </div>
              
              {/* Image Upload */}
              <div>
                <Label htmlFor="post-image">Post Image (Optional)</Label>
                <Input 
                  id="post-image" 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setForm((f) => ({ ...f, imageFile: file }));
                  }}
                  className="cursor-pointer"
                />
                {form.imageFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {form.imageFile.name}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setForm((f) => ({ ...f, imageFile: null }))}
                      className="h-6 px-2"
                    >
                      <XCircle className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                {open?.type === "edit" && selected?.image_url && !form.imageFile && (
                  <div className="mt-2">
                    <img 
                      src={selected.image_url} 
                      alt="Current post image"
                      className="w-32 h-32 object-cover rounded-md border border-slate-200"
                    />
                    <p className="text-xs text-slate-500 mt-1">Current image</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button onClick={submit} disabled={!form.title.trim() || !form.content.trim()}>Save</Button>
              </div>
            </div>
          ) : null}

          {open?.type === "delete" ? (
            <div className="space-y-4">
              <p className="text-sm text-stone-700">Are you sure you want to delete this post?</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button variant="destructive" onClick={submit}>Delete</Button>
              </div>
            </div>
          ) : null}

          {open?.type === "moderate" ? (
            <div className="space-y-4">
              {selected?.is_flagged ? (
                <>
                 
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                    <Button 
                      onClick={() => quickAction(selected.id || selected._id, "unflag")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Unflag Post
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-stone-700">Flag this post for moderation review.</p>
                  <div>
                    <Label htmlFor="moderation-reason">Reason</Label>
                    <Textarea 
                      id="moderation-reason" 
                      rows={3}
                      value={moderationReason} 
                      onChange={(e) => setModerationReason(e.target.value)}
                      placeholder="Enter moderation reason (spam, inappropriate content, etc.)"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={submit}>Flag Post</Button>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {open?.type === "bulk-action" ? (
            <div className="space-y-4">
              <p className="text-sm">Apply an action to {selectedPosts.size} selected post(s).</p>
              <div>
                <Label htmlFor="bulk-action-select">Select Action</Label>
                <select 
                  id="bulk-action-select"
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Choose an action...</option>
                  <option value="delete">Delete Posts</option>
                  <option value="pin">Pin Posts</option>
                  <option value="unpin">Unpin Posts</option>
                  <option value="lock">Lock Posts</option>
                  <option value="unlock">Unlock Posts</option>
                  <option value="hide">Hide Posts</option>
                  <option value="show">Show Posts</option>
                  <option value="archive">Archive Posts</option>
                  <option value="flag">Flag for Review</option>
                  <option value="unflag">Unflag Posts</option>
                  <option value="approve">Approve Posts</option>
                </select>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-xs text-amber-800">⚠️ This action will affect {selectedPosts.size} post(s). Please proceed with caution.</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button onClick={submit} disabled={!bulkAction}>Apply Action</Button>
              </div>
            </div>
          ) : null}

          {open?.type === "comments" && selected ? (
            <Comments postId={selected.id || selected._id} onClose={() => setOpen(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function Comments({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ 
    queryKey: ["/posts/", postId, "/comments"], 
    queryFn: () => getJson<any>(`/posts/${postId}/comments`),
    retry: false
  });
  const comments: any[] = data?.success && Array.isArray(data.data) ? data.data : [];
  
  const isEndpointUnavailable = error?.message?.includes("404") || error?.message?.includes("Cannot GET");
  
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remove = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/posts/comments/${id}`), { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete comment");
      toast({ title: "Success", description: "Comment deleted" });
      await refetch();
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to delete comment", variant: "destructive" });
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(apiUrl(`/posts/${postId}/comments`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user?.id,
          content: newComment 
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to add comment' }));
        throw new Error(errorData.message || 'Failed to add comment');
      }
      
      toast({ title: "Success", description: "Comment added" });
      setNewComment("");
      await refetch();
    } catch (e: any) {
      console.error('Add comment error:', e);
      toast({ 
        title: "Error", 
        description: e?.message || "Failed to add comment", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const flagComment = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/posts/comments/${id}/flag`), {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Failed to flag comment");
      toast({ title: "Success", description: "Comment flagged for review" });
      await refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to flag comment", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {isEndpointUnavailable ? (
        <div className="border border-amber-200 rounded-lg p-6 bg-amber-50">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">Comments Feature Not Available</h3>
          </div>
          <p className="text-sm text-amber-800 mb-4">
            The comments endpoint is not yet implemented on the backend. 
            You'll need to add the following route to your Express server.
          </p>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <Label htmlFor="new-comment" className="mb-2 block">Add Comment</Label>
            <Textarea 
              id="new-comment"
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment..."
              className="mb-2"
            />
            <div className="flex justify-end">
              <Button 
                size="sm" 
                onClick={addComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Comment"}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-normal text-stone-500">Author</th>
                  <th className="px-4 py-2 text-left text-xs font-normal text-stone-500">Content</th>
                  <th className="px-4 py-2 text-left text-xs font-normal text-stone-500">Date</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {isLoading ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-stone-500">Loading...</td></tr>
                ) : error && !isEndpointUnavailable ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-red-500">Failed to load comments</td></tr>
                ) : comments.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-stone-500">No comments yet. Be the first to comment!</td></tr>
                ) : (
                  comments.map((c) => (
                    <tr key={c.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3 text-sm text-stone-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          {c.users?.name || c.users?.email || "Unknown"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-900">
                        <div className="flex items-start gap-2">
                          {c.is_flagged && <Flag className="w-3 h-3 text-red-600 mt-1 flex-shrink-0" />}
                          <span>{c.content}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-500 whitespace-nowrap">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-orange-600 border-orange-300"
                            onClick={() => flagComment(c.id)}
                            title="Flag comment"
                          >
                            <Flag className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => remove(c.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </>
      )}
    </div>
  );
}