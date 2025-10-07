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

export default function Forum() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ 
    queryKey: ["/posts?page=1&limit=50"], 
    queryFn: () => getJson<any>("/posts?page=1&limit=50") 
  });
  
  // Handle backend response format: { success: true, data: [...] }
  const posts: any[] = data?.success && Array.isArray(data.data) ? data.data : [];
  
  // Build forum categories from posts (not product categories)
  const forumCategories = useMemo(() => {
    const s = new Set<string>();
    posts.forEach(p => s.add(p.category || "General"));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  // Dialog state
  const [open, setOpen] = useState<{ type: "add"|"edit"|"delete"|"comments"; id?: string }|null>(null);
  const [form, setForm] = useState<{ title: string; content: string; category?: string }>({ title: "", content: "", category: "General" });
  const selected = useMemo(() => posts.find(p => (p.id || p._id) === open?.id), [open, posts]);

  useEffect(() => {
    if (open?.type === "edit" && selected) {
      setForm({ title: selected.title || "", content: selected.content || "", category: selected.category || "General" });
    }
    if (!open) setForm({ title: "", content: "", category: "General" });
  }, [open, selected]);

  const startAdd = () => setOpen({ type: "add" });
  const startEdit = (p: any) => setOpen({ type: "edit", id: p.id || p._id });
  const startDelete = (p: any) => setOpen({ type: "delete", id: p.id || p._id });
  const openComments = (p: any) => setOpen({ type: "comments", id: p.id || p._id });

  // Mutations (unchanged)
  const submit = async () => {
    try {
      if (!open) return;
      if (open.type === "add") {
        await fetch(apiUrl("/posts"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id, title: form.title, content: form.content, category: form.category })
        });
      }
      if (open.type === "edit" && open.id) {
        await fetch(apiUrl(`/posts/${open.id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: form.title, content: form.content, category: form.category })
        });
      }
      if (open.type === "delete" && open.id) {
        await fetch(apiUrl(`/posts/${open.id}/delete`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id })
        });
      }
    } finally {
      setOpen(null);
      await refetch();
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
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
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
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
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <Card className="border-black-200">
        <CardHeader className="border-b border-black-200 ">
          <CardTitle className="text-lg font-semibold text-black-900">Forum Posts ({posts.length})</CardTitle>
          <div>
            <Button size="sm" onClick={startAdd}>New Post</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-normal text-black-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-black-500 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-black-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-black-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black-200">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-black-500">No forum posts found</td>
                  </tr>
                ) : (
                  posts.map((post, idx) => (
                    <tr key={post.id || post._id || idx} className="hover:bg-black-50">
                      <td className="px-6 py-4 text-sm text-black-900 font-medium max-w-xs">
                        <div className="truncate">{post.title || "Untitled"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black-900">
                        {post.users?.name || post.users?.email || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="secondary" 
                          className="bg-blue-100 text-blue-800 hover:bg-blue-100"
                        >
                          {post.category || "General"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black-900">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openComments(post)}>Comments</Button>
                        <Button size="sm" variant="outline" onClick={() => startEdit(post)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => startDelete(post)}>Delete</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl bg-white border-black-200">
          <DialogHeader>
            <DialogTitle>
              {open?.type === "add" && "Create Post"}
              {open?.type === "edit" && "Edit Post"}
              {open?.type === "delete" && "Delete Post"}
              {open?.type === "comments" && "Comments"}
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
                  <SelectContent>
                    {forumCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" rows={6} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button onClick={submit} disabled={!form.title.trim() || !form.content.trim()}>Save</Button>
              </div>
            </div>
          ) : null}

          {open?.type === "delete" ? (
            <div className="space-y-4">
              <p className="text-sm text-black-700">Are you sure you want to delete this post?</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button variant="destructive" onClick={submit}>Delete</Button>
              </div>
            </div>
          ) : null}

          {open?.type === "comments" && selected ? (
            <Comments postId={selected.id || selected._id} onClose={() => setOpen(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Comments({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { data, isLoading, error, refetch } = useQuery({ 
    queryKey: ["/posts/", postId, "/comments"], 
    queryFn: () => getJson<any>(`/posts/${postId}/comments`) 
  });
  const comments: any[] = data?.success && Array.isArray(data.data) ? data.data : [];

  const remove = async (id: string) => {
    await fetch(apiUrl(`/posts/comments/${id}`), { method: "DELETE" }).catch(() => {});
    await refetch();
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-black-200 rounded-md">
        <table className="w-full">
          <thead className="bg-black-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-normal text-black-500">Author</th>
              <th className="px-4 py-2 text-left text-xs font-normal text-black-500">Content</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-black-200">
            {isLoading ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-black-500">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-red-500">Failed to load</td></tr>
            ) : comments.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-black-500">No comments</td></tr>
            ) : (
              comments.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-sm text-black-900 whitespace-nowrap">{c.users?.name || c.users?.email || "Unknown"}</td>
                  <td className="px-4 py-2 text-sm text-black-900">{c.content}</td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="destructive" onClick={() => remove(c.id)}>Delete</Button>
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
    </div>
  );
}


