'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface User { id: number; username: string; full_name: string | null; profile_image: string | null; isAdmin?: boolean; }
interface Notification { id: number; actor_id: number; actor_username: string; actor_image: string | null; type: string; message: string; link: string | null; is_read: number; created_at: string; }
interface FriendRequest { id: number; sender_id: number; username: string; full_name: string | null; profile_image: string | null; created_at: string; }

export function Header({ user: propUser }: { user?: User | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(propUser || null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendReqOpen, setFriendReqOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadCount = useRef(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const friendReqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!propUser) { fetchUser(); }
    fetchNotifications();
    fetchFriendRequests();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentUnread = notifications.filter((n) => !n.is_read).length;
      setUnreadCount(currentUnread);
      
      // Play sound if new unread notifications arrived
      if (currentUnread > prevUnreadCount.current) {
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Audio play blocked by browser policy:', e));
        } catch (e) {}
      }
      prevUnreadCount.current = currentUnread;
    }, [notifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (friendReqRef.current && !friendReqRef.current.contains(e.target as Node)) setFriendReqOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchUser = async () => {
    try { const res = await fetch('/api/auth/me'); if (res.ok) setUser(await res.json()); }
    catch {}
  };

  const fetchNotifications = async () => {
    try { const res = await fetch('/api/notifications'); if (res.ok) setNotifications(await res.json()); }
    catch {}
  };

  const fetchFriendRequests = async () => {
    try { const res = await fetch('/api/friends/request'); if (res.ok) { const data = await res.json(); setFriendRequests(data.received || []); } }
    catch {}
  };

  const markNotificationsRead = async () => {
    try { await fetch('/api/notifications', { method: 'PUT' }); setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 }))); }
    catch {}
  };

  const handleFriendRespond = async (requestId: number, action: string) => {
    try {
      const res = await fetch('/api/friends/respond', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, action }) });
      if (res.ok) { setFriendRequests((prev) => prev.filter((r) => r.id !== requestId)); fetchFriendRequests(); }
    } catch {}
  };

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e1f2e] bg-[#0A0B10]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/feed')} className="flex items-center gap-2 text-lg font-bold text-[#e8e8ed]">
            <span className="text-[#4A7AFF]">●</span>
            <span className="hidden sm:inline">BlackSocial</span>
          </button>
          <div className="hidden md:flex items-center gap-1 ml-4">
            <button onClick={() => router.push('/feed')} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${pathname === '/feed' ? 'text-[#4A7AFF] bg-[#4A7AFF]/10' : 'text-[#e8e8ed]/60 hover:text-[#e8e8ed] hover:bg-[#1e1f2e]'}`}>Feed</button>
            <button onClick={() => router.push('/community')} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${pathname === '/community' || pathname.startsWith('/community/') ? 'text-[#4A7AFF] bg-[#4A7AFF]/10' : 'text-[#e8e8ed]/60 hover:text-[#e8e8ed] hover:bg-[#1e1f2e]'}`}>Communities</button>
            
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={friendReqRef}>
            <button onClick={() => { setFriendReqOpen(!friendReqOpen); if (!friendReqOpen) fetchFriendRequests(); }} className="relative rounded-full p-2 text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all" title="Friend Requests">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              {friendRequests.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#e74c3c] px-1 text-[10px] font-bold text-white leading-none">
                  {friendRequests.length > 9 ? '9+' : friendRequests.length}
                </span>
              )}
            </button>
            {friendReqOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl bg-[#13151c] border border-[#1e1f2e] shadow-2xl animate-scale-in">
                <div className="p-3 border-b border-[#1e1f2e]">
                  <h3 className="text-sm font-bold text-[#e8e8ed]">Friend Requests</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {friendRequests.length === 0 ? (
                    <div className="p-6 text-center text-sm text-[#e8e8ed]/50">No pending requests</div>
                  ) : (
                    friendRequests.map((req) => (
                      <div key={req.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1e1f2e] transition-colors">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={req.profile_image || undefined} />
                          <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{req.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-[#e8e8ed] font-medium">{req.full_name || req.username}</p>
                          <p className="text-xs text-[#e8e8ed]/40">@{req.username}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleFriendRespond(req.id, 'accepted')} className="rounded-lg bg-[#4A7AFF] px-3 py-1 text-xs font-semibold text-white hover:bg-[#3a6ae8] transition-all">Accept</button>
                          <button onClick={() => handleFriendRespond(req.id, 'rejected')} className="rounded-lg bg-[#1e1f2e] px-3 py-1 text-xs font-semibold text-[#e8e8ed]/70 hover:bg-[#2a2b3e] transition-all">Decline</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={notifRef}>
            <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markNotificationsRead(); }} className="relative rounded-full p-2 text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all" title="Notifications">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#e74c3c] px-1 text-[10px] font-bold text-white leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl bg-[#13151c] border border-[#1e1f2e] shadow-2xl animate-scale-in">
                <div className="p-3 border-b border-[#1e1f2e]">
                  <h3 className="text-sm font-bold text-[#e8e8ed]">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-[#e8e8ed]/50">No notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} onClick={() => { if (n.link) router.push(n.link); }} className={`flex items-start gap-3 px-4 py-3 hover:bg-[#1e1f2e] transition-colors cursor-pointer ${!n.is_read ? 'bg-[#1e1f2e]/50' : ''}`}>
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={n.actor_image || undefined} />
                          <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{n.actor_username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-[#e8e8ed]">{n.message}</p>
                          <p className="text-xs text-[#e8e8ed]/40 mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
                        </div>
                        {!n.is_read && <div className="mt-1.5 h-2 w-2 rounded-full shrink-0 bg-[#4A7AFF]" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => router.push('/profile')} className="rounded-full p-2 text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all" title="Settings">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>

          {user?.isAdmin && (
            <button onClick={() => router.push('/admin')} className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-[#4A7AFF]/20 text-[#4A7AFF] hover:bg-[#4A7AFF]/30 transition-all">
              Admin
            </button>
          )}

          <button onClick={handleLogout} className="rounded-full p-2 text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all" title="Logout">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>

          <Avatar className="h-8 w-8 cursor-pointer" onClick={() => router.push(`/profile/${user?.id}`)}>
            <AvatarImage src={user?.profile_image || undefined} />
            <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
