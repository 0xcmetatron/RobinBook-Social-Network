'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface User { id: number; username: string; full_name: string | null; profile_image: string | null; }
interface Message { id: number; sender_id?: number; receiver_id?: number; user_id?: number; content?: string; message?: string; is_read?: number; created_at: string; username: string; full_name: string | null; profile_image: string | null; }
interface Conversation { other_user_id: number; username: string; full_name: string | null; profile_image: string | null; last_message: string; last_message_at: string; last_sender_id: number; unread_count: number; }

interface DmChatProps {
  user: User | null;
}

export function DmChat({ user }: DmChatProps) {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: number; username: string; full_name: string | null; profile_image: string | null } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [globalMessages, setGlobalMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'global' | 'friends' | 'dms'>('global');
  const [friends, setFriends] = useState<User[]>([]);

  useEffect(() => {
    const handleOpenGlobalChat = () => {
      setOpen(true);
      setTab('global');
      setSelectedUser(null);
    };
    window.addEventListener('open-global-chat', handleOpenGlobalChat);
    return () => window.removeEventListener('open-global-chat', handleOpenGlobalChat);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  useEffect(() => {
    if (!open) { setSelectedUser(null); setMessages([]); if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } return; }
    fetchConversations();
    fetchFriends();
    fetchGlobalMessages();
  }, [open]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
      scrollToBottom();
      pollRef.current = window.setInterval(() => fetchMessages(selectedUser.id, true), 3000);
    } else {
      fetchConversations();
      fetchGlobalMessages(true);
      pollRef.current = window.setInterval(() => { fetchConversations(); fetchGlobalMessages(true); }, 5000);
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [selectedUser]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchGlobalMessages = async (silent?: boolean) => {
    try { const res = await fetch('/api/chat'); if (res.ok) { setGlobalMessages(await res.json()); if (!silent) scrollToBottom(); } } catch {}
  };
  
  const fetchConversations = async () => {
    try { const res = await fetch('/api/messages'); if (res.ok) setConversations(await res.json()); }
    catch {}
  };

  const fetchFriends = async () => {
    try { const res = await fetch('/api/friends'); if (res.ok) setFriends(await res.json()); }
    catch {}
  };

  const fetchMessages = async (userId: number, silent?: boolean) => {
    try {
      const res = await fetch(`/api/messages?userId=${userId}`);
      if (res.ok) { const data = await res.json(); setMessages(data); if (!silent) scrollToBottom(); }
    } catch {}
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    if (tab === 'global') {
      setSending(true);
      try {
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: newMessage }) });
        if (res.ok) { setNewMessage(''); await fetchGlobalMessages(); }
      } catch {} finally { setSending(false); }
      return;
    }

    if (!selectedUser) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: selectedUser.id, content: newMessage }) });
      if (res.ok) { setNewMessage(''); await fetchMessages(selectedUser.id); }
    } catch {} finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#4A7AFF] text-white shadow-lg hover:bg-[#3a6ae8] transition-all" title="Messages">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#e74c3c] text-[10px] font-bold text-white">{totalUnread > 9 ? '9+' : totalUnread}</span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-40 w-80 sm:w-96 rounded-2xl bg-[#13151c] border border-[#1e1f2e] shadow-2xl overflow-hidden animate-scale-in">
          {selectedUser ? (
            <>
              <div className="flex items-center justify-between p-3 border-b border-[#1e1f2e]">
                <button onClick={() => { setSelectedUser(null); setMessages([]); }} className="text-[#e8e8ed]/60 hover:text-[#e8e8ed] transition-all">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedUser.profile_image || undefined} />
                    <AvatarFallback className="bg-[#4A7AFF] text-white text-[10px]">{selectedUser.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-[#e8e8ed]">{selectedUser.full_name || selectedUser.username}</span>
                </div>
                <div className="w-5" />
              </div>

              <div className="h-80 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-[#e8e8ed]/50">No messages yet. Say hello!</div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <Avatar className="h-6 w-6 mr-2 mt-1 shrink-0">
                            <AvatarImage src={selectedUser.profile_image || undefined} />
                            <AvatarFallback className="bg-[#4A7AFF] text-white text-[10px]">{selectedUser.username[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${isMe ? 'bg-[#4A7AFF] text-white rounded-br-sm' : 'bg-[#1e1f2e] text-[#e8e8ed] rounded-bl-sm'}`}>
                          <p className="break-words">{m.content}</p>
                          <p className={`text-[10px] mt-0.5 ${isMe ? 'text-white/60' : 'text-[#e8e8ed]/40'}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-[#1e1f2e]">
                <div className="flex items-center gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl bg-[#1e1f2e] px-3 py-2 text-sm text-[#e8e8ed] placeholder-[#e8e8ed]/40 outline-none focus:ring-1 focus:ring-[#4A7AFF]"
                  />
                  <button onClick={handleSend} disabled={!newMessage.trim() || sending} className="rounded-xl bg-[#4A7AFF] p-2 text-white hover:bg-[#3a6ae8] transition-all disabled:opacity-50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 border-b border-[#1e1f2e]">
                <h3 className="text-sm font-bold text-[#e8e8ed]">Messages</h3>
                <div className="flex gap-1">
                  <button onClick={() => { setTab('global'); setSelectedUser(null); }} className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${tab === 'global' ? 'bg-[#4A7AFF]/20 text-[#4A7AFF]' : 'text-[#e8e8ed]/60 hover:text-[#e8e8ed]'}`}>Global</button>
                  <button onClick={() => { setTab('dms'); setSelectedUser(null); }} className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${tab === 'dms' ? 'bg-[#4A7AFF]/20 text-[#4A7AFF]' : 'text-[#e8e8ed]/60 hover:text-[#e8e8ed]'}`}>DMs</button>
                  <button onClick={() => { setTab('friends'); setSelectedUser(null); }} className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${tab === 'friends' ? 'bg-[#4A7AFF]/20 text-[#4A7AFF]' : 'text-[#e8e8ed]/60 hover:text-[#e8e8ed]'}`}>Friends</button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {tab === 'global' ? (
                  <div className="flex flex-col h-80">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {globalMessages.length === 0 ? (
                        <div className="text-center text-sm text-[#e8e8ed]/50">No messages yet. Be the first to say hi!</div>
                      ) : (
                        globalMessages.map((msg) => (
                          <div key={msg.id} className={`flex gap-3 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={msg.profile_image || undefined} />
                              <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{msg.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'} max-w-[75%]`}>
                              <span className="text-[10px] text-[#e8e8ed]/50 mb-1 px-1">{msg.full_name || msg.username}</span>
                              <div className={`rounded-2xl px-4 py-2 text-sm ${msg.user_id === user?.id ? 'bg-[#4A7AFF] text-white rounded-tr-sm' : 'bg-[#1e1f2e] text-[#e8e8ed] rounded-tl-sm'}`}>
                                {msg.message}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-3 border-t border-[#1e1f2e]">
                      <div className="flex items-center gap-2">
                        <input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Type a message..."
                          className="flex-1 rounded-xl bg-[#1e1f2e] px-3 py-2 text-sm text-[#e8e8ed] placeholder-[#e8e8ed]/40 outline-none focus:ring-1 focus:ring-[#4A7AFF]"
                        />
                        <button onClick={handleSend} disabled={!newMessage.trim() || sending} className="rounded-xl bg-[#4A7AFF] p-2 text-white hover:bg-[#3a6ae8] transition-all disabled:opacity-50">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : tab === 'dms' ? (
                  conversations.length === 0 ? (
                    <div className="p-6 text-center text-sm text-[#e8e8ed]/50">No conversations yet</div>
                  ) : (
                    conversations.map((c) => (
                      <div key={c.other_user_id} onClick={() => setSelectedUser({ id: c.other_user_id, username: c.username, full_name: c.full_name, profile_image: c.profile_image })} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1e1f2e] transition-colors cursor-pointer">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={c.profile_image || undefined} />
                          <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{c.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-[#e8e8ed]">{c.full_name || c.username}</p>
                            {c.unread_count > 0 && <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#4A7AFF] text-[10px] font-bold text-white">{c.unread_count}</span>}
                          </div>
                          <p className="text-xs text-[#e8e8ed]/50 truncate">{c.last_sender_id === user?.id ? 'You: ' : ''}{c.last_message}</p>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  friends.length === 0 ? (
                    <div className="p-6 text-center text-sm text-[#e8e8ed]/50">No friends yet. Add some friends!</div>
                  ) : (
                    friends.map((f) => (
                      <div key={f.id} onClick={() => setSelectedUser(f)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1e1f2e] transition-colors cursor-pointer">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={f.profile_image || undefined} />
                          <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{f.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#e8e8ed]">{f.full_name || f.username}</p>
                          <p className="text-xs text-[#e8e8ed]/50">@{f.username}</p>
                        </div>
                        <svg className="h-4 w-4 text-[#e8e8ed]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    ))
                  )
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
