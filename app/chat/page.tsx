'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/navbar';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RichText, EmojiPicker } from '@/components/rich-text';
import { LinkPreview, extractUrls } from '@/components/link-preview';

interface User { id: number; username: string; full_name: string; profile_image: string | null; isAdmin?: boolean; }
interface Message {
  id: number; user_id: number; message: string; created_at: string;
  username: string; full_name: string; profile_image: string | null;
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number>(0);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => { checkAuth(); fetchMessages(); const interval = setInterval(fetchNewMessages, 2000); return () => clearInterval(interval); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const checkAuth = async () => {
    try { const res = await fetch('/api/auth/me'); if (res.ok) setUser(await res.json()); else router.push('/'); }
    catch { router.push('/'); } finally { setLoading(false); }
  };

  const fetchMessages = async () => {
    try { const res = await fetch('/api/chat'); if (res.ok) { const data = await res.json(); setMessages(data); if (data.length > 0) lastMessageIdRef.current = data[data.length - 1].id; } } catch {}
  };

  const fetchNewMessages = async () => {
    try { const res = await fetch(`/api/chat?since=${lastMessageIdRef.current}`); if (res.ok) { const data = await res.json(); if (data.length > 0) { setMessages((prev) => [...prev, ...data]); lastMessageIdRef.current = data[data.length - 1].id; } } } catch {}
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newMessage.trim()) return;
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: newMessage }) });
      if (res.ok) { setNewMessage(''); fetchNewMessages(); }
    } catch {}
  };

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
  };

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0B10]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#4A7AFF] border-t-transparent" />
          <p className="text-[#e8e8ed]/50 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#0A0B10] text-[#e8e8ed]">
      {/* Standard Header */}
      <Navbar />

      {/* WhatsApp-style header for Chat Room */}
      <div className="bg-[#13151c] border-b border-[#1e1f2e] px-4 py-3 shrink-0">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#4A7AFF] text-white">GC</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#22c55e] border-2 border-[#13151c]" />
            </div>
            <div>
              <p className="font-semibold text-[#e8e8ed]">Global Chat Room</p>
              <p className="text-xs text-[#e8e8ed]/50">
                {isTyping ? (
                  <span className="text-[#22c55e] animate-pulse">typing...</span>
                ) : (
                  <span>{messages.length > 0 ? 'online' : 'start the conversation'}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages - WhatsApp dark chat bubbles */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-4xl space-y-2">
          {messages.map((msg, idx) => {
            const isOwn = msg.user_id === user?.id;
            const showAvatar = idx === 0 || messages[idx - 1].user_id !== msg.user_id;

            return (
              <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                {!isOwn && (
                  <div className={`w-8 shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                    {showAvatar ? (
                      <Avatar className="h-8 w-8 cursor-pointer" onClick={() => router.push(`/profile/${msg.user_id}`)}>
                        <AvatarImage src={msg.profile_image || undefined} />
                        <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{msg.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8" />
                    )}
                  </div>
                )}
                <div className={`flex max-w-[75%] flex-col ${isOwn ? 'items-end' : ''}`}>
                  {!isOwn && showAvatar && (
                    <div className="flex items-center gap-2 mb-0.5 px-1">
                      <p className="text-xs font-semibold text-[#4A7AFF] cursor-pointer hover:underline" onClick={() => router.push(`/profile/${msg.user_id}`)}>
                        {msg.full_name || msg.username}
                      </p>
                      <p className="text-[10px] text-[#e8e8ed]/30">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  )}
                  <div className={`relative px-4 py-2.5 ${
                    isOwn
                      ? 'rounded-2xl rounded-br-md bg-[#4A7AFF] text-white'
                      : 'rounded-2xl rounded-bl-md bg-[#1e1f2e] text-[#e8e8ed]'
                  }`}>
                    <RichText content={msg.message} />
                    {extractUrls(msg.message).length > 0 && <div className="mt-1"><LinkPreview url={extractUrls(msg.message)[0]} compact /></div>}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - WhatsApp style */}
      <div className="bg-[#13151c] border-t border-[#1e1f2e] px-4 py-3 shrink-0">
        <div className="mx-auto max-w-4xl">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <div ref={emojiRef} className="relative">
              <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="rounded-full p-2 text-[#e8e8ed]/50 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
              {showEmoji && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
                  <EmojiPicker onSelect={(emoji: string) => { setNewMessage((prev) => prev + emoji); setShowEmoji(false); chatInputRef.current?.focus(); }} primaryColor="#4A7AFF" cardColor="#13151c" textColor="#e8e8ed" borderColor="#1e1f2e" accentColor="#4A7AFF" />
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <input
                ref={chatInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                placeholder="Type a message..."
                className="w-full h-11 rounded-full bg-[#1e1f2e] text-[#e8e8ed] text-sm placeholder-[#e8e8ed]/30 px-5 pr-12 border-0 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="button-gradient rounded-full p-3 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}