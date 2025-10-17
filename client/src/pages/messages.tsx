import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getJson, apiUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Messages() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["/messages/conversations", user?.id ?? "anon"],
    queryFn: () => getJson<any>(`/messages/conversations/${user?.id}?page=1&limit=50`),
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  const conversations: any[] = Array.isArray(data?.data) ? data?.data : [];

  const selectedConversation = useMemo(() => {
    if (!selectedId) return null;
    return conversations.find((c: any) => (c.id || c._id) === selectedId) || null;
  }, [selectedId, conversations]);

  const {
    data: msgsData,
    isLoading: msgsLoading,
    error: msgsError,
    refetch: refetchMsgs
  } = useQuery({
    queryKey: ["/messages", selectedId],
    queryFn: () => getJson<any>(`/messages/${selectedId}/messages?page=1&limit=200`),
    enabled: !!user?.id && !!selectedId,
    refetchInterval: 3000,
  });

  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => {
    setMessages(Array.isArray(msgsData?.data) ? msgsData?.data : []);
  }, [msgsData]);

  const listRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, selectedId]);

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c: any) => {
      const buyerName = (c?.buyer?.business_name || c?.buyer?.name || "").toLowerCase();
      const sellerName = (c?.seller?.business_name || c?.seller?.name || "").toLowerCase();
      return buyerName.includes(q) || sellerName.includes(q);
    });
  }, [conversations, query]);

  function getOtherParty(convo: any): { name: string; avatar?: string } {
    if (!convo) return { name: "Conversation" };
    const buyer = convo.buyer || {};
    const seller = convo.seller || {};
    const buyerName = buyer.business_name || buyer.name || `${buyer.firstname || ''} ${buyer.lastname || ''}`.trim();
    const sellerName = seller.business_name || seller.name || `${seller.firstname || ''} ${seller.lastname || ''}`.trim();
    // Determine which party is "other" by comparing emails (always present)
    const meEmail = user?.email;
    const other = meEmail && buyer.email === meEmail ? seller : (meEmail && seller.email === meEmail ? buyer : (buyerName ? buyer : seller));
    const otherName = other.business_name || other.name || `${other.firstname || ''} ${other.lastname || ''}`.trim();
    return { name: otherName || "Conversation", avatar: other.profilepicture };
  }

  function formatTimeAgo(iso?: string) {
    if (!iso) return "";
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, Math.floor((now - then) / 1000));
    if (diff < 60) return "now";
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return d === 1 ? "1d" : `${d}d`;
  }

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <Card className="border-stone-200">
        <CardHeader className="border-b border-stone-200">
          <CardTitle className="text-lg font-semibold text-stone-900">Messages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!user?.id && (
            <div className="p-6 text-sm text-stone-600">Sign in to load your conversations.</div>
          )}
          {user?.id && (
            <div className="grid grid-cols-1 lg:grid-cols-3">
              {/* Conversations list */}
              <div className="border-r border-stone-200 p-4 space-y-3 lg:col-span-1">
                <div className="mb-2">
                  <Input placeholder="Search conversations" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                {isLoading && <div className="text-sm text-stone-600">Loading conversations…</div>}
                {error && <div className="text-sm text-red-600">Failed to load conversations.</div>}
                {!isLoading && !error && conversations.length === 0 && (
                  <div className="text-sm text-stone-600">No conversations yet.</div>
                )}
                {filteredConversations.map((c: any) => {
                  const id = c.id || c._id;
                  const other = getOtherParty(c);
                  const title = other.name;
                  const isActive = selectedId === id;
                  const preview = c.latestMessage?.text || c.preview || "No messages yet.";
                  const when = formatTimeAgo(c.latestMessage?.created_at);
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedId(id)}
                      className={`w-full text-left p-3 rounded-md border ${isActive ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:bg-stone-50'} transition`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {other.avatar ? (
                            <img src={other.avatar as string} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-stone-800 text-white flex items-center justify-center text-xs">
                              {title.slice(0,2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-stone-900">{title}</div>
                            <div className="text-xs text-stone-600 truncate max-w-[200px]">{preview}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-stone-500">{when}</span>
                          {c.unreadCount ? <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" /> : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Messages thread */}
              <div className="lg:col-span-2 p-0 lg:p-4">
                {!selectedConversation && (
                  <div className="text-sm text-stone-600">Select a conversation to view messages.</div>
                )}
                {selectedConversation && (
                  <div className="flex flex-col h-[70vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white">
                      <div className="flex items-center gap-3">
                        {getOtherParty(selectedConversation).avatar ? (
                          <img src={getOtherParty(selectedConversation).avatar as string} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-stone-800 text-white flex items-center justify-center text-xs">
                            {getOtherParty(selectedConversation).name?.slice(0,2)?.toUpperCase()}
                          </div>
                        )}
                        <div className="font-medium text-stone-900">{getOtherParty(selectedConversation).name}</div>
                      </div>
                    </div>
                    {/* Messages */}
                    <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 p-4 bg-white">
                      {msgsLoading && <div className="text-sm text-stone-600 p-2">Loading…</div>}
                      {msgsError && <div className="text-sm text-red-600 p-2">Failed to load messages.</div>}
                      {!msgsLoading && !msgsError && messages.length === 0 && (
                        <div className="text-sm text-stone-600 p-2">No messages yet.</div>
                      )}
                      {messages.map((m: any) => (
                        <div key={m.id} className={`max-w-[75%] p-2 rounded-2xl text-sm ${m.sender_id === user?.id ? 'ml-auto bg-stone-800 text-white' : 'bg-stone-100 text-stone-900'}`}>
                          <div className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</div>
                        </div>
                      ))}
                    </div>
                    {/* Composer */}
                    <form
                      className="p-3 border-t border-stone-200 bg-white flex gap-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const body = { senderId: user?.id, text } as any;
                        if (!text.trim()) return;
                        // Optimistic UI
                        const optimistic = { id: `tmp-${Date.now()}`, text, sender_id: user?.id };
                        setMessages((prev) => [...prev, optimistic]);
                        setText("");
                        const res = await fetch(apiUrl(`/messages/${selectedId}/messages`), {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(body)
                        });
                        if (!res.ok) {
                          // Revert optimistic
                          setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
                          return;
                        }
                        await refetchMsgs();
                        await qc.invalidateQueries({ queryKey: ["/messages/conversations", user?.id ?? "anon"] });
                      }}
                    >
                      <textarea
                        className="flex-1 min-h-[42px] max-h-32 resize-none border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            const form = e.currentTarget.form as HTMLFormElement | null;
                            if (form) form.requestSubmit();
                          }
                        }}
                      />
                      <Button type="submit" disabled={!text.trim()}>Send</Button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


