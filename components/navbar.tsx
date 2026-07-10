'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadCount = useRef(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // Friend Requests
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [friendReqOpen, setFriendReqOpen] = useState(false);
  const friendReqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    fetchSettings();
    fetchNotifications();
    fetchFriendRequests();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentUnread = notifications.filter((n: any) => !n.is_read).length;
    setUnreadCount(currentUnread);
    if (currentUnread > prevUnreadCount.current) {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}
    }
    prevUnreadCount.current = currentUnread;
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (friendReqRef.current && !friendReqRef.current.contains(e.target as Node)) setFriendReqOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkAuth = async () => {
    try { const res = await fetch('/api/auth/me'); if (res.ok) setUser(await res.json()); } catch {}
  };

  const fetchSettings = async () => {
    try { const res = await fetch('/api/admin/settings'); if (res.ok) setSettings(await res.json()); } catch {}
  };

  const fetchNotifications = async () => {
    try { const res = await fetch('/api/notifications'); if (res.ok) setNotifications(await res.json()); } catch {}
  };

  const fetchFriendRequests = async () => {
    try { const res = await fetch('/api/friends/request'); if (res.ok) { const data = await res.json(); setFriendRequests(data.received || []); } } catch {}
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); setSearching(false); return; }
    setSearching(true); setSearchOpen(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try { const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`); if (res.ok) setSearchResults(await res.json()); } catch {} finally { setSearching(false); }
    }, 500);
  };

  const handleFriendRespond = async (requestId: number, action: string) => {
    try {
      const res = await fetch('/api/friends/respond', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, action }) });
      if (res.ok) { setFriendRequests((prev) => prev.filter((r) => r.id !== requestId)); fetchFriendRequests(); }
    } catch {}
  };

  const markNotificationsRead = async () => {
    try { await fetch('/api/notifications', { method: 'PUT' }); fetchNotifications(); } catch {}
  };

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#13151c]/80 backdrop-blur-xl border-b border-[#1e1f2e]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-14">
          <div className="flex items-center gap-4">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={settings.site_name} className="h-8 w-auto cursor-pointer" onClick={() => router.push('/feed')} />
            ) : (
              <h1 className="cursor-pointer text-xl font-bold text-[#4A7AFF]" onClick={() => router.push('/feed')}>{settings?.site_name || 'BlackSocial'}</h1>
            )}

            {settings?.contract_address && (
              <div className="hidden lg:flex items-center gap-2 bg-[#1e1f2e] px-3 py-1.5 rounded-full border border-[#1e1f2e]">
                <span className="text-xs font-semibold text-[#e8e8ed]/50">CA:</span>
                <span className="text-xs font-mono text-[#4A7AFF] truncate max-w-[120px]">{settings.contract_address}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(settings.contract_address);
                    const el = document.getElementById('ca-copy-icon-nav');
                    if (el) {
                      el.innerHTML = '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />';
                      el.classList.add('text-green-400');
                      setTimeout(() => {
                        el.innerHTML = '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />';
                        el.classList.remove('text-green-400');
                      }, 2000);
                    }
                  }}
                  className="text-[#e8e8ed]/50 hover:text-[#e8e8ed] transition-colors mr-2"
                >
                  <svg id="ca-copy-icon-nav" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
                {settings?.twitter_url && (
                  <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-[#e8e8ed]/50 hover:text-[#e8e8ed] border-l border-[#e8e8ed]/20 pl-2">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                )}
              </div>
            )}

            <div className="relative hidden sm:block" ref={searchContainerRef}>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e8e8ed]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="Search users or communities..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
                  className="h-9 w-48 rounded-full bg-[#1e1f2e] pl-10 pr-4 text-sm text-[#e8e8ed] placeholder-[#e8e8ed]/30 border-0 outline-none focus:ring-1 focus:ring-[#4A7AFF] md:w-64 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#e8e8ed]/30 hover:text-[#e8e8ed]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              {searchOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl bg-[#13151c] border border-[#1e1f2e] shadow-2xl animate-scale-in">
                  {searching ? (
                    <div className="p-4 text-center text-sm text-[#e8e8ed]/50">Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[#e8e8ed]/50">{searchQuery.trim() ? 'No results found' : 'Search for users or communities'}</div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((result: any) => (
                        <button key={result.id} onClick={() => { router.push(result.link); setSearchOpen(false); setSearchQuery(''); }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#1e1f2e] transition-colors">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={result.image || undefined} />
                            <AvatarFallback className="bg-[#4A7AFF] text-white text-sm">{result.fallback}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#e8e8ed]">{result.title}</p>
                            <p className="truncate text-xs text-[#e8e8ed]/50">{result.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                      friendRequests.map((req: any) => (
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
                      notifications.map((n: any) => (
                        <div key={n.id} onClick={() => { if (n.link) router.push(n.link); setNotifOpen(false); }} className={`flex items-start gap-3 px-4 py-3 hover:bg-[#1e1f2e] transition-colors cursor-pointer ${!n.is_read ? 'bg-[#1e1f2e]/50' : ''}`}>
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
              <button onClick={() => router.push('/admin')} className="hidden sm:block rounded-lg px-3 py-1.5 text-xs font-semibold bg-[#4A7AFF]/20 text-[#4A7AFF] hover:bg-[#4A7AFF]/30 transition-all">
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

      {/* Nav tabs */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-3 pb-1 shrink-0">
        <div className="flex items-center gap-1 border-b border-[#1e1f2e]">
          <button onClick={() => router.push('/feed')} className={`px-4 py-3 text-sm font-semibold transition-all ${pathname === '/feed' ? 'text-[#4A7AFF] border-b-2 border-[#4A7AFF]' : 'text-[#e8e8ed]/60 hover:text-[#e8e8ed] hover:bg-[#1e1f2e]/50 rounded-t-lg'}`}>
            Feed
          </button>
          <button onClick={() => router.push('/community')} className={`px-4 py-3 text-sm font-semibold transition-all ${pathname.startsWith('/community') ? 'text-[#4A7AFF] border-b-2 border-[#4A7AFF]' : 'text-[#e8e8ed]/60 hover:text-[#e8e8ed] hover:bg-[#1e1f2e]/50 rounded-t-lg'}`}>
            Communities
          </button>
          <button onClick={() => router.push('/chat')} className={`px-4 py-3 text-sm font-semibold transition-all ${pathname === '/chat' ? 'text-[#4A7AFF] border-b-2 border-[#4A7AFF]' : 'text-[#e8e8ed]/60 hover:text-[#e8e8ed] hover:bg-[#1e1f2e]/50 rounded-t-lg'}`}>
            Chat
          </button>
        </div>
      </div>
    </>
  );
}
