import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getJson, apiUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { 
  MessageCircle, 
  Send, 
  Search,
  Loader2,
  Image as ImageIcon,
  X
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    firstname?: string;
    lastname?: string;
    business_name?: string;
    profilepicture?: string;
  };
}

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  buyer?: {
    id: string;
    name: string;
    email: string;
    firstname?: string;
    lastname?: string;
    business_name?: string;
    profilepicture?: string;
  };
  seller?: {
    id: string;
    name: string;
    email: string;
    firstname?: string;
    lastname?: string;
    business_name?: string;
    profilepicture?: string;
  };
  latestMessage?: {
    id: string;
    text: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount?: number;
  messageCount?: number;
}


export default function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedUserData, setSelectedUserData] = useState<any>(null); // Store selected user data
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'conversations' | 'users'>('conversations');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => getJson(`/messages/conversations?userId=${user?.id}&page=1&limit=1000`),
    enabled: !!user?.id,
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => getJson(`/users`),
    enabled: activeTab === 'users',
  });

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => {
      console.log('Fetching messages for conversation:', selectedConversationId);
      return getJson(`/messages/${selectedConversationId}/messages`);
    },
    enabled: !!selectedConversationId,
  });

  const conversations = (conversationsData as any)?.data || [];
  const allUsers = (usersData as any)?.data || [];
  const messages = (messagesData as any)?.data || [];

  // Helper function to get user display info
  const getUserDisplayInfo = (userId: string) => {
    console.log('getUserDisplayInfo called with userId:', userId);
    console.log('selectedUserData:', selectedUserData);
    
    // First try to get from stored user data
    // Check if selectedUserData exists and has matching ID OR if it's the only stored data (use it)
    if (selectedUserData) {
      const hasMatchingId = selectedUserData.id === userId || (selectedUserData as any).user_id === userId;
      // If we have selectedUserData and either the ID matches OR there's no other way to match,
      // use it (this handles the case where we clicked from conversations)
      if (hasMatchingId || !selectedUserData.id) {
        console.log('Found user data in selectedUserData');
        const displayName = selectedUserData.firstname && selectedUserData.lastname 
          ? `${selectedUserData.firstname} ${selectedUserData.lastname}`
          : selectedUserData.name || selectedUserData.email || 'Unknown User';
        return {
          name: displayName,
          initials: displayName.slice(0, 2).toUpperCase(),
          role: selectedUserData.role || 'user',
          avatar: selectedUserData.profilepicture || selectedUserData.avatar
        };
      }
    }

    // Fallback to conversation data
    console.log('Trying conversation fallback...');
    const conversation = conversations.find((c: Conversation) => {
      if (!c || !c.buyer_id || !c.seller_id) return false;
      const isCurrentUserBuyer = String(c.buyer_id) === String(user?.id);
      const otherParticipant = isCurrentUserBuyer ? c.seller : c.buyer;
      return otherParticipant && (otherParticipant.id === userId || (otherParticipant as any).user_id === userId);
    });
    
    console.log('Found conversation:', conversation);
    
    if (conversation) {
      const isCurrentUserBuyer = String(conversation.buyer_id) === String(user?.id);
      const otherParticipant = isCurrentUserBuyer ? conversation.seller : conversation.buyer;
      console.log('Other participant from conversation:', otherParticipant);
      if (otherParticipant) {
        const displayName = otherParticipant.firstname && otherParticipant.lastname 
          ? `${otherParticipant.firstname} ${otherParticipant.lastname}`
          : otherParticipant.name || otherParticipant.email || 'Unknown User';
        return {
          name: displayName,
          initials: displayName.slice(0, 2).toUpperCase(),
          role: isCurrentUserBuyer ? 'seller' : 'buyer',
          avatar: otherParticipant.profilepicture
        };
      }
    }

    // Final fallback
    return {
      name: 'Unknown User',
      initials: 'U',
      role: 'user',
      avatar: null
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedUserId) return;

    try {
      // First, get or create conversation
      let conversationId = selectedConversationId;
      
      if (!conversationId) {
        // Create conversation between current user and selected user
        const conversationResponse = await fetch(apiUrl('/messages/conversation/start'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            buyerId: user?.id,
            sellerId: selectedUserId,
          }),
        });
        
        if (conversationResponse.ok) {
          const conversationData = await conversationResponse.json();
          conversationId = conversationData.data.id;
          setSelectedConversationId(conversationId);
        } else {
          throw new Error('Failed to create conversation');
        }
      }

      let messageText = messageInput.trim();
      let imageUrl = '';
      
      // If there's an image file, upload it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append('img', selectedFile);
        
        const uploadResponse = await fetch(apiUrl(`/messages/${conversationId}/attachments`), {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.data.url;
          
          // Combine text and image URL
          if (messageText && imageUrl) {
            messageText = `${messageText} ${imageUrl}`;
          } else if (!messageText && imageUrl) {
            messageText = imageUrl; // Only image, no text
          }
        }
      }

      // Send message
      const response = await fetch(apiUrl(`/messages/${conversationId}/messages`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: user?.id,
          text: messageText,
        }),
      });

      if (response.ok) {
        setMessageInput('');
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUserClick = (userId: string, userData?: any) => {
    setSelectedUserId(userId);
    setSelectedUserData(userData); // Store the user data
    setActiveTab('conversations');
    
    // Find existing conversation or create new one
    const existingConversation = conversations.find((c: Conversation) => {
      if (!c || !c.buyer_id || !c.seller_id) return false;
      
      const isCurrentUserBuyer = String(c.buyer_id) === String(user?.id);
      const otherParticipant = isCurrentUserBuyer ? c.seller : c.buyer;
      
      return otherParticipant && otherParticipant.id === userId;
    });
    if (existingConversation) {
      setSelectedConversationId(existingConversation.id);
    } else {
      setSelectedConversationId(null);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header Section */}
      <div className="bg-green-50 border-b border-green-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-green-700">Messages</h1>
              <p className="text-gray-600 text-sm">Chat with users and manage conversations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Messages
                <Badge variant="secondary">
                  {activeTab === 'conversations' ? conversations.length : allUsers.filter((u: any) => u.id !== user?.id).length}
                </Badge>
              </CardTitle>
              
              <div className="flex gap-2">
                <Button 
                  variant={activeTab === 'conversations' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setActiveTab('conversations')}
                >
                  Conversations
                </Button>
                <Button 
                  variant={activeTab === 'users' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setActiveTab('users')}
                >
                  Users
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder={activeTab === 'conversations' ? "Search conversations..." : "Search users..."} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-2">
                  {activeTab === 'conversations' ? (
                    conversationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : (
                      conversations.map((conversation: Conversation) => {
                        // Determine the other participant (not the current user)
                        if (!conversation || !conversation.buyer_id || !conversation.seller_id) return null;
                        
                        const isCurrentUserBuyer = String(conversation.buyer_id) === String(user?.id);
                        const otherParticipant = isCurrentUserBuyer ? conversation.seller : conversation.buyer;
                        
                        if (!otherParticipant) return null;
                        
                        const displayName = otherParticipant.firstname && otherParticipant.lastname 
                          ? `${otherParticipant.firstname} ${otherParticipant.lastname}`
                          : otherParticipant.name || otherParticipant.email || 'Unknown User';
                        
                        return (
                          <motion.div
                            key={conversation.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${
                              selectedConversationId === conversation.id ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                            }`}
                            onClick={() => {
                              console.log('Conversation clicked:', {
                                conversationId: conversation.id,
                                otherParticipantId: otherParticipant.id,
                                otherParticipant: otherParticipant,
                                fullConversation: conversation,
                                otherParticipantKeys: Object.keys(otherParticipant),
                                otherParticipantValues: otherParticipant
                              });
                              
                              // Try different ID fields - check all possible keys
                              const userId = otherParticipant.id || 
                                            (otherParticipant as any).user_id || 
                                            (otherParticipant as any).buyer_id || 
                                            (otherParticipant as any).seller_id ||
                                            (otherParticipant as any).buyer?.id ||
                                            (otherParticipant as any).seller?.id;
                              console.log('Extracted userId:', userId);
                              
                              // If still no ID, use the conversation's buyer_id or seller_id
                              const finalUserId = userId || (isCurrentUserBuyer ? conversation.seller_id : conversation.buyer_id);
                              console.log('Final userId:', finalUserId);
                              
                              setSelectedConversationId(conversation.id);
                              setSelectedUserId(finalUserId);
                              setSelectedUserData(otherParticipant); // Store user data from conversation
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {otherParticipant.profilepicture ? (
                                  <img
                                    src={otherParticipant.profilepicture}
                                    alt={displayName}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium">
                                    {displayName.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-900 truncate">
                                    {displayName}
                                  </h3>
                                  <Badge variant="secondary">
                                    {isCurrentUserBuyer ? 'seller' : 'buyer'}
                                  </Badge>
                                </div>
                                
                                {conversation.latestMessage && (
                                  <p className="text-sm text-gray-600 truncate mt-1">
                                    {conversation.latestMessage.text}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-500">
                                    {conversation.latestMessage ? new Date(conversation.latestMessage.created_at).toLocaleDateString() : 'No messages'}
                                  </span>
                                  {conversation.unreadCount && conversation.unreadCount > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )
                  ) : (
                    usersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : (
                      allUsers
                        .filter((u: any) => u.id !== user?.id) // Don't show current user
                        .map((userItem: any) => {
                          const name = userItem.name || userItem.firstname || userItem.email || 'Unknown User';
                          const displayName = userItem.firstname && userItem.lastname 
                            ? `${userItem.firstname} ${userItem.lastname}` 
                            : name;
                          
                          return (
                            <motion.div
                              key={userItem.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 border-gray-200"
                              onClick={() => handleUserClick(userItem.id, userItem)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  {userItem.profilepicture || userItem.avatar ? (
                                    <img
                                      src={userItem.profilepicture || userItem.avatar}
                                      alt={displayName}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium">
                                      {displayName.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  {userItem.isOnline && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-gray-900 truncate">
                                      {displayName}
                                    </h3>
                                    <Badge variant={userItem.role === 'admin' ? 'destructive' : userItem.role === 'seller' ? 'default' : 'secondary'}>
                                      {userItem.role || 'buyer'}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 truncate mt-1">
                                    {userItem.email}
                                  </p>
                                  
                                  {userItem.business_name && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {userItem.business_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                    )
                  )}
                </div>
              </div>
            </CardContent>
        </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedUserId && (() => {
                    const userInfo = getUserDisplayInfo(selectedUserId);
                    return (
                      <>
                        <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium">
                          {userInfo.initials}
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-900">
                            {userInfo.name}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {userInfo.role}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </CardHeader>
              
            <CardContent className="flex flex-col h-[600px]">
              {(() => {
                console.log('Chat area render:', {
                  selectedUserId,
                  selectedConversationId,
                  messagesLength: messages.length,
                  messagesLoading
                });
                return selectedUserId;
              })() ? (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : (
                      messages.map((message: Message) => (
                        <motion.div 
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.sender_id === String(user?.id) ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === String(user?.id) 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-900'
                          }`}>
                            {/* Display both text and images */}
                            {(() => {
                              const text = message.text || '';
                              // Check if text contains an image URL
                              const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/gi;
                              const urls = text.match(urlRegex) || [];
                              const imageUrl = urls[0];
                              const textWithoutUrl = text.replace(urlRegex, '').trim();
                              
                              return (
                                <>
                                  {textWithoutUrl && (
                                    <p className="text-sm mb-2">{textWithoutUrl}</p>
                                  )}
                                  {imageUrl && (
                                    <img 
                                      src={imageUrl} 
                                      alt="Shared image" 
                                      className="max-w-full h-auto rounded-lg"
                                    />
                                  )}
                                  {!textWithoutUrl && !imageUrl && (
                                    <p className="text-sm">{message.text}</p>
                                  )}
                                </>
                              );
                            })()}
                            <p className={`text-xs mt-1 ${
                              message.sender_id === String(user?.id) ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative mb-2 inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-w-xs h-32 object-cover rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={handleRemoveImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!messageInput.trim() && !selectedFile}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a conversation or user.</h3>
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
