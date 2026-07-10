'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalCommunities: number;
}

export default function AdminPanel() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [security, setSecurity] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [saving, setSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalPosts: 0, totalComments: 0, totalCommunities: 0 });

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [allCommunities, setAllCommunities] = useState<any[]>([]);

  useEffect(() => { checkAdminAuth(); }, []);

  const checkAdminAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) { router.push('/'); return; }
      const data = await res.json();
      if (!data.isAdmin) { router.push('/feed'); return; }
      setUser(data);
      await fetchSettings();
      await fetchStats();
    } catch { router.push('/'); }
    finally { setLoading(false); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) { const data = await res.json(); setSettings(data); setTheme(data.theme); setSecurity(data.security); }
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const [usersRes, postsRes, commentsRes, communitiesRes] = await Promise.all([
        fetch('/api/admin/users'), fetch('/api/admin/posts'), fetch('/api/admin/comments'), fetch('/api/communities'),
      ]);
      const usersData = usersRes.ok ? await usersRes.json() : [];
      const postsData = postsRes.ok ? await postsRes.json() : [];
      const commentsData = commentsRes.ok ? await commentsRes.json() : [];
      const communitiesData = communitiesRes.ok ? await communitiesRes.json() : [];
      
      setAllUsers(usersData);
      setAllPosts(postsData);
      setAllComments(commentsData);
      setAllCommunities(communitiesData);

      setStats({
        totalUsers: Array.isArray(usersData) ? usersData.length : 0,
        totalPosts: Array.isArray(postsData) ? postsData.length : 0,
        totalComments: Array.isArray(commentsData) ? commentsData.length : 0,
        totalCommunities: Array.isArray(communitiesData) ? communitiesData.length : 0,
      });
    } catch {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, theme }),
      });
      if (res.ok) { toast({ title: 'Success', description: 'Settings saved!' }); fetchSettings(); }
      else toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0B10]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#4A7AFF] border-t-transparent" />
          <p className="text-[#e8e8ed]/50 text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const colorInput = (label: string, key: string, value: string) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#e8e8ed]/70">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value || '#1877f2'} onChange={(e) => setTheme({ ...theme, [key]: e.target.value })} className="h-9 w-10 rounded-lg border-0 bg-transparent cursor-pointer" />
        <input type="text" value={value || '#1877f2'} onChange={(e) => setTheme({ ...theme, [key]: e.target.value })} className="h-9 flex-1 rounded-lg bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-xs px-3 outline-none focus:ring-1 focus:ring-[#4A7AFF]" />
      </div>
    </div>
  );

  const getCustomFont = () => {
    try {
      if (settings?.theme_json) {
        const parsed = JSON.parse(settings.theme_json);
        if (parsed?.fonts?.body) return parsed.fonts.body;
      }
    } catch {}
    return 'inherit';
  };

  return (
    <div className="min-h-screen bg-[#0A0B10] text-[#e8e8ed]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#13151c]/80 backdrop-blur-xl border-b border-[#1e1f2e]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-14">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-[#4A7AFF]">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/feed')} className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-[#1e1f2e] text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e]/80 transition-all">
              View Site
            </button>
            <button onClick={handleLogout} className="rounded-full p-2 text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all" title="Logout">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
            <Avatar className="h-8 w-8 cursor-pointer" onClick={() => router.push('/profile')}>
              <AvatarImage src={user?.profile_image || undefined} />
              <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: '#4A7AFF' },
            { label: 'Total Posts', value: stats.totalPosts, icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', color: '#22c55e' },
            { label: 'Comments', value: stats.totalComments, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: '#f59e0b' },
            { label: 'Communities', value: stats.totalCommunities, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: '#ec4899' },
          ].map((stat, i) => (
            <div key={i} className="card-hover rounded-2xl bg-[#13151c] border border-[#1e1f2e] p-4 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#e8e8ed]/50">{stat.label}</p>
                  <p className="text-2xl font-bold text-[#e8e8ed] mt-1">{stat.value}</p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: stat.color + '15' }}>
                  <svg className="h-6 w-6" style={{ color: stat.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} /></svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[#1e1f2e] mb-6 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'users', label: 'Users' },
            { id: 'moderation', label: 'Moderation' },
            { id: 'communities', label: 'Communities' },
            { id: 'general', label: 'General' },
            { id: 'theme', label: 'Theme' },
            { id: 'security', label: 'Security' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'text-[#4A7AFF] border-b-2 border-[#4A7AFF]' : 'text-[#e8e8ed]/50 hover:text-[#e8e8ed]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] p-6">
              <h2 className="text-lg font-bold text-[#e8e8ed] mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button onClick={() => { setActiveTab('general'); }} className="card-hover rounded-xl bg-[#1e1f2e] p-4 text-left">
                  <div className="rounded-lg bg-[#4A7AFF]/15 p-2 w-fit mb-2">
                    <svg className="h-5 w-5 text-[#4A7AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <p className="text-sm font-semibold text-[#e8e8ed]">Site Settings</p>
                  <p className="text-xs text-[#e8e8ed]/50 mt-0.5">Update site name, description, logo</p>
                </button>
                <button onClick={() => { setActiveTab('theme'); }} className="card-hover rounded-xl bg-[#1e1f2e] p-4 text-left">
                  <div className="rounded-lg bg-[#22c55e]/15 p-2 w-fit mb-2">
                    <svg className="h-5 w-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                  </div>
                  <p className="text-sm font-semibold text-[#e8e8ed]">Theme Colors</p>
                  <p className="text-xs text-[#e8e8ed]/50 mt-0.5">Customize site appearance</p>
                </button>
                <button onClick={() => router.push('/community')} className="card-hover rounded-xl bg-[#1e1f2e] p-4 text-left">
                  <div className="rounded-lg bg-[#f59e0b]/15 p-2 w-fit mb-2">
                    <svg className="h-5 w-5 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <p className="text-sm font-semibold text-[#e8e8ed]">Communities</p>
                  <p className="text-xs text-[#e8e8ed]/50 mt-0.5">Manage communities</p>
                </button>
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="card-hover rounded-xl bg-[#1e1f2e] p-4 text-left block">
                  <div className="rounded-lg bg-[#ec4899]/15 p-2 w-fit mb-2">
                    <svg className="h-5 w-5 text-[#ec4899]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <p className="text-sm font-semibold text-[#e8e8ed]">Deploy</p>
                  <p className="text-xs text-[#e8e8ed]/50 mt-0.5">Open Vercel dashboard</p>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="animate-fade-in-up space-y-4">
            <div className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] overflow-hidden">
              <div className="p-6 border-b border-[#1e1f2e]">
                <h2 className="text-lg font-bold text-[#e8e8ed]">User Management</h2>
                <p className="text-sm text-[#e8e8ed]/50">Manage registered users, assign roles, and handle bans.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1e1f2e] text-[#e8e8ed]/70">
                    <tr>
                      <th className="px-6 py-3 font-medium">User</th>
                      <th className="px-6 py-3 font-medium">Email</th>
                      <th className="px-6 py-3 font-medium">Joined</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1f2e]">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#1e1f2e]/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.profile_image || undefined} />
                              <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{u.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-[#e8e8ed]">{u.username}</p>
                              {u.is_admin ? <span className="text-[10px] font-bold text-[#22c55e] uppercase">Admin</span> : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#e8e8ed]/70">{u.email}</td>
                        <td className="px-6 py-4 text-[#e8e8ed]/70">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={async () => {
                              if (confirm('Toggle Admin status for this user?')) {
                                await fetch('/api/admin/users/action', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'promote', userId: u.id }) });
                                fetchStats();
                              }
                            }} className="rounded-lg bg-[#4A7AFF]/10 px-3 py-1.5 text-xs font-semibold text-[#4A7AFF] hover:bg-[#4A7AFF]/20 transition-all">Toggle Admin</button>
                            <button onClick={async () => {
                              if (confirm('Permanently delete this user and all their content?')) {
                                await fetch('/api/admin/users/action', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'delete', userId: u.id }) });
                                fetchStats();
                              }
                            }} className="rounded-lg bg-[#e74c3c]/10 px-3 py-1.5 text-xs font-semibold text-[#e74c3c] hover:bg-[#e74c3c]/20 transition-all">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allUsers.length === 0 && <div className="p-6 text-center text-[#e8e8ed]/50 text-sm">No users found.</div>}
              </div>
            </div>
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="animate-fade-in-up space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] overflow-hidden">
                <div className="p-4 border-b border-[#1e1f2e]">
                  <h2 className="text-base font-bold text-[#e8e8ed]">Recent Posts</h2>
                </div>
                <div className="divide-y divide-[#1e1f2e] max-h-[600px] overflow-y-auto">
                  {allPosts.map((post) => (
                    <div key={post.id} className="p-4 hover:bg-[#1e1f2e]/50 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-[#4A7AFF] mb-1">@{post.username}</p>
                          <p className="text-sm text-[#e8e8ed]/90 line-clamp-3">{post.content || '[Image Post]'}</p>
                        </div>
                        <button onClick={async () => {
                          if (confirm('Delete this post?')) {
                            await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
                            fetchStats();
                          }
                        }} className="p-1.5 text-[#e74c3c] bg-[#e74c3c]/10 hover:bg-[#e74c3c]/20 rounded-lg shrink-0">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {allPosts.length === 0 && <div className="p-4 text-center text-sm text-[#e8e8ed]/50">No posts.</div>}
                </div>
              </div>

              <div className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] overflow-hidden">
                <div className="p-4 border-b border-[#1e1f2e]">
                  <h2 className="text-base font-bold text-[#e8e8ed]">Recent Comments</h2>
                </div>
                <div className="divide-y divide-[#1e1f2e] max-h-[600px] overflow-y-auto">
                  {allComments.map((comment) => (
                    <div key={comment.id} className="p-4 hover:bg-[#1e1f2e]/50 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-[#4A7AFF] mb-1">@{comment.username} on Post #{comment.post_id}</p>
                          <p className="text-sm text-[#e8e8ed]/90 line-clamp-3">{comment.content}</p>
                        </div>
                        <button onClick={async () => {
                          if (confirm('Delete this comment?')) {
                            await fetch(`/api/posts/${comment.post_id}/comments/${comment.id}`, { method: 'DELETE' });
                            fetchStats();
                          }
                        }} className="p-1.5 text-[#e74c3c] bg-[#e74c3c]/10 hover:bg-[#e74c3c]/20 rounded-lg shrink-0">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {allComments.length === 0 && <div className="p-4 text-center text-sm text-[#e8e8ed]/50">No comments.</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Communities Tab */}
        {activeTab === 'communities' && (
          <div className="animate-fade-in-up space-y-4">
            <div className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] overflow-hidden">
              <div className="p-6 border-b border-[#1e1f2e]">
                <h2 className="text-lg font-bold text-[#e8e8ed]">Communities Management</h2>
                <p className="text-sm text-[#e8e8ed]/50">Monitor and moderate all communities across the network.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1e1f2e] text-[#e8e8ed]/70">
                    <tr>
                      <th className="px-6 py-3 font-medium">Community</th>
                      <th className="px-6 py-3 font-medium">Creator</th>
                      <th className="px-6 py-3 font-medium">Members</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1f2e]">
                    {allCommunities.map((c) => (
                      <tr key={c.id} className="hover:bg-[#1e1f2e]/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/community/${c.slug}`)}>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={c.image || undefined} />
                              <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{c.name[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-[#e8e8ed] hover:underline">{c.name}</p>
                              <p className="text-xs text-[#e8e8ed]/50">/{c.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#e8e8ed]/70">@{c.owner_username || 'Unknown'}</td>
                        <td className="px-6 py-4 text-[#e8e8ed]/70">{c.member_count}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={async () => {
                            if (confirm('Permanently delete this community and all its posts?')) {
                              await fetch('/api/admin/communities/action', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'delete', communityId: c.id }) });
                              fetchStats();
                            }
                          }} className="rounded-lg bg-[#e74c3c]/10 px-3 py-1.5 text-xs font-semibold text-[#e74c3c] hover:bg-[#e74c3c]/20 transition-all">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allCommunities.length === 0 && <div className="p-6 text-center text-[#e8e8ed]/50 text-sm">No communities found.</div>}
              </div>
            </div>
          </div>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <form onSubmit={handleSave} className="animate-fade-in-up">
            <div className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#e8e8ed] mb-1">General Settings</h2>
                <p className="text-sm text-[#e8e8ed]/50">Configure your site name, title, description, and social links</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#e8e8ed]/70">Site Name</label>
                  <input value={settings?.site_name || ''} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} placeholder="BlackSocial" className="h-10 w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#e8e8ed]/70">Site Title</label>
                  <input value={settings?.site_title || ''} onChange={(e) => setSettings({ ...settings, site_title: e.target.value })} placeholder="BlackSocial Network" className="h-10 w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#e8e8ed]/70">Logo URL</label>
                  <input value={settings?.logo_url || ''} onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })} placeholder="https://example.com/logo.png" className="h-10 w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#e8e8ed]/70">Logo Size (px)</label>
                  <input type="number" min="20" max="1000" value={settings?.logo_size || '80'} onChange={(e) => setSettings({ ...settings, logo_size: e.target.value })} className="h-10 w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#e8e8ed]/70">Favicon URL</label>
                  <input value={settings?.favicon_url || ''} onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })} placeholder="https://example.com/favicon.ico" className="h-10 w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-[#e8e8ed]/70">Twitter/X URL</label>
                    {settings?.dev_wallet && <span className="text-[10px] text-[#22c55e]">Auto-synced from Dev Wallet</span>}
                  </div>
                  <input value={settings?.twitter_url || ''} onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })} placeholder="https://twitter.com/yourusername" className="h-10 w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#e8e8ed]/70">Contract Address</label>
                  <input value={settings?.contract_address || ''} onChange={(e) => setSettings({ ...settings, contract_address: e.target.value })} placeholder="Token Mint Address" className="h-10 w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#e8e8ed]/70">Dev Wallet (Pump.fun / Robinhood Auto-sync)</label>
                  <div className="flex items-center gap-2">
                    <input value={settings?.dev_wallet || ''} onChange={(e) => setSettings({ ...settings, dev_wallet: e.target.value })} placeholder="Wallet Address" className="h-10 flex-1 rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all" />
                    <button type="button" onClick={async () => {
                      if (!settings?.dev_wallet) return toast({ title: 'Error', description: 'Enter a dev wallet first', variant: 'destructive' });
                      try {
                        const res = await fetch('/api/admin/sync-token', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ wallet: settings.dev_wallet })
                        });
                        const data = await res.json();
                        if (data.coins && data.coins.length > 0) {
                          const coin = data.coins[0];
                          setSettings({ ...settings, contract_address: coin.mint, twitter_url: coin.twitter || settings.twitter_url });
                          toast({ title: 'Synced!', description: `Found token: ${coin.name}` });
                        } else if (data.tokens && data.tokens.length > 0) {
                          const token = data.tokens[0];
                          setSettings({ ...settings, contract_address: token.address, twitter_url: token.twitter || settings.twitter_url });
                          toast({ title: 'Synced!', description: `Found token: ${token.name}` });
                        } else {
                          toast({ title: 'Not found', description: 'No tokens found for this wallet', variant: 'destructive' });
                        }
                      } catch {
                        toast({ title: 'Error', description: 'Failed to fetch from provider', variant: 'destructive' });
                      }
                    }} className="h-10 rounded-xl bg-[#22c55e] px-4 text-sm font-semibold text-white hover:bg-[#16a34a] transition-all whitespace-nowrap">Sync</button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#e8e8ed]/70">Site Description</label>
                <textarea value={settings?.site_description || ''} onChange={(e) => setSettings({ ...settings, site_description: e.target.value })} placeholder="Join our community..." rows={3} className="w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 py-3 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#e8e8ed]/70">Copyright Text</label>
                <input value={settings?.copyright_text || ''} onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })} placeholder="\u00A9 2024 BlackSocial. All rights reserved." className="h-10 w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all" />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={saving} className="button-gradient rounded-xl px-8 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>
          </form>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && security && (
          <form onSubmit={handleSave} className="animate-fade-in-up">
            <div className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#e8e8ed] mb-1">Security Settings</h2>
                <p className="text-sm text-[#e8e8ed]/50">Configure rate limiting, content filtering, and session security</p>
              </div>

              <div className="rounded-xl bg-[#1e1f2e]/50 p-4 border border-[#1e1f2e] space-y-4">
                <h3 className="text-sm font-semibold text-[#e8e8ed]">Rate Limiting</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#e8e8ed]/70">Max Posts / Minute</label>
                    <input type="number" min="1" max="100" value={security.maxPostsPerMinute} onChange={(e) => setSecurity({ ...security, maxPostsPerMinute: e.target.value })} className="h-9 w-full rounded-lg bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-3 outline-none focus:ring-1 focus:ring-[#4A7AFF]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#e8e8ed]/70">Max Comments / Minute</label>
                    <input type="number" min="1" max="100" value={security.maxCommentsPerMinute} onChange={(e) => setSecurity({ ...security, maxCommentsPerMinute: e.target.value })} className="h-9 w-full rounded-lg bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-3 outline-none focus:ring-1 focus:ring-[#4A7AFF]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#e8e8ed]/70">Max Messages / Minute</label>
                    <input type="number" min="1" max="100" value={security.maxMessagesPerMinute} onChange={(e) => setSecurity({ ...security, maxMessagesPerMinute: e.target.value })} className="h-9 w-full rounded-lg bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-3 outline-none focus:ring-1 focus:ring-[#4A7AFF]" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#e8e8ed]/70">Enable Rate Limiting</label>
                  <button type="button" onClick={() => setSecurity({ ...security, enableRateLimiting: !security.enableRateLimiting })} className={`relative h-6 w-11 rounded-full transition-all ${security.enableRateLimiting ? 'bg-[#22c55e]' : 'bg-[#1e1f2e]'}`}>
                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${security.enableRateLimiting ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-[#1e1f2e]/50 p-4 border border-[#1e1f2e] space-y-4">
                <h3 className="text-sm font-semibold text-[#e8e8ed]">Content Filtering</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#e8e8ed]/70">Max Content Length (chars)</label>
                    <input type="number" min="100" max="50000" value={security.maxContentLength} onChange={(e) => setSecurity({ ...security, maxContentLength: e.target.value })} className="h-9 w-full rounded-lg bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-3 outline-none focus:ring-1 focus:ring-[#4A7AFF]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#e8e8ed]/70">Blocked Words (comma-separated)</label>
                    <input value={security.blockedWords} onChange={(e) => setSecurity({ ...security, blockedWords: e.target.value })} placeholder="badword1, badword2" className="h-9 w-full rounded-lg bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-3 outline-none focus:ring-1 focus:ring-[#4A7AFF]" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[#e8e8ed]/70">Strict HTML Sanitization</label>
                    <p className="text-xs text-[#e8e8ed]/40">Strip all HTML tags from user content</p>
                  </div>
                  <button type="button" onClick={() => setSecurity({ ...security, strictSanitization: !security.strictSanitization })} className={`relative h-6 w-11 rounded-full transition-all ${security.strictSanitization ? 'bg-[#22c55e]' : 'bg-[#1e1f2e]'}`}>
                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${security.strictSanitization ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-[#1e1f2e]/50 p-4 border border-[#1e1f2e] space-y-4">
                <h3 className="text-sm font-semibold text-[#e8e8ed]">Session</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#e8e8ed]/70">Session Timeout (minutes)</label>
                    <input type="number" min="60" max="43200" value={security.sessionTimeoutMinutes} onChange={(e) => setSecurity({ ...security, sessionTimeoutMinutes: e.target.value })} className="h-9 w-full rounded-lg bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-3 outline-none focus:ring-1 focus:ring-[#4A7AFF]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#e8e8ed]/70">Max Login Attempts</label>
                    <input type="number" min="1" max="20" value={security.maxLoginAttempts} onChange={(e) => setSecurity({ ...security, maxLoginAttempts: e.target.value })} className="h-9 w-full rounded-lg bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-3 outline-none focus:ring-1 focus:ring-[#4A7AFF]" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#4A7AFF]/10 border border-[#4A7AFF]/20 p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-[#4A7AFF] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <div>
                    <p className="text-sm font-medium text-[#e8e8ed]">Security Note</p>
                    <p className="text-xs text-[#e8e8ed]/60 mt-1">All user inputs are sanitized to prevent XSS attacks. SQL injection is prevented through parameterized queries. Passwords are hashed with bcrypt. Sessions use HTTP-only cookies with JWT tokens.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={saving} className="button-gradient rounded-xl px-8 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Security Settings'}
              </button>
            </div>
          </form>
        )}

        {/* Theme Tab */}
        {activeTab === 'theme' && (
          <form onSubmit={handleSave} className="animate-fade-in-up">
            <div className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#e8e8ed] mb-1">Theme Settings</h2>
                  <p className="text-sm text-[#e8e8ed]/50">Customize the colors and appearance of your site</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowImportModal(true)} className="rounded-xl bg-[#1e1f2e] px-4 py-2 text-sm font-semibold text-[#e8e8ed] hover:bg-[#2a2d3d] transition-all">Import JSON</button>
                  <button type="button" onClick={() => {
                    setSettings({ ...settings, theme_json: '' });
                    setTheme(null); // Will revert to defaults after save
                    toast({ title: 'Success', description: 'Restored defaults. Click Save.' });
                  }} className="rounded-xl bg-[#e74c3c]/10 text-[#e74c3c] px-4 py-2 text-sm font-semibold hover:bg-[#e74c3c]/20 transition-all">Restore Default</button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {colorInput('Primary', 'primary_color', theme?.primary_color)}
                {colorInput('Secondary', 'secondary_color', theme?.secondary_color)}
                {colorInput('Background', 'background_color', theme?.background_color)}
                {colorInput('Card', 'card_color', theme?.card_color)}
                {colorInput('Text', 'text_color', theme?.text_color)}
                {colorInput('Accent', 'accent_color', theme?.accent_color)}
                {colorInput('Border', 'border_color', theme?.border_color)}
                {colorInput('Muted', 'muted_color', theme?.muted_color)}
                {colorInput('Success', 'success_color', theme?.success_color)}
                {colorInput('Error', 'error_color', theme?.error_color)}
                {colorInput('Warning', 'warning_color', theme?.warning_color)}
                {colorInput('Info', 'info_color', theme?.info_color)}
                {colorInput('Link', 'link_color', theme?.link_color)}
                {colorInput('Hover', 'hover_color', theme?.hover_color)}
                {colorInput('Input BG', 'input_bg_color', theme?.input_bg_color)}
                {colorInput('Button Text', 'button_text_color', theme?.button_text_color)}
                {colorInput('Placeholder', 'placeholder_color', theme?.placeholder_color)}
              </div>

              {/* Enhanced Previews */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Login Preview */}
                <div className="rounded-xl bg-[#1e1f2e] p-4 space-y-3">
                  <p className="text-xs font-medium text-[#e8e8ed]/50">Login Preview</p>
                  <div className="rounded-xl p-6 border flex flex-col items-center justify-center min-h-[300px]" style={{ backgroundColor: theme?.background_color || '#0A0B10', borderColor: theme?.border_color || '#1e1f2e' }}>
                    <h1 className="text-2xl font-bold mb-2" style={{ color: theme?.primary_color || '#4A7AFF', fontFamily: getCustomFont() }}>{settings?.site_name || 'BlackSocial'}</h1>
                    <p className="text-xs mb-6 text-center" style={{ color: theme?.text_color || '#e8e8ed', opacity: 0.7 }}>{settings?.site_description || 'Join our community of token holders.'}</p>
                    
                    <div className="w-full max-w-xs space-y-3">
                      <input disabled placeholder="Email address" className="w-full h-10 rounded-xl px-4 text-sm border outline-none" style={{ backgroundColor: theme?.input_bg_color || '#13151c', borderColor: theme?.border_color || '#1e1f2e', color: theme?.text_color || '#e8e8ed' }} />
                      <input disabled placeholder="Password" type="password" className="w-full h-10 rounded-xl px-4 text-sm border outline-none" style={{ backgroundColor: theme?.input_bg_color || '#13151c', borderColor: theme?.border_color || '#1e1f2e', color: theme?.text_color || '#e8e8ed' }} />
                      <button disabled className="w-full h-10 rounded-xl text-sm font-semibold opacity-90 transition-all hover:opacity-100" style={{ backgroundColor: theme?.primary_color || '#4A7AFF', color: theme?.button_text_color || '#ffffff' }}>Log In</button>
                    </div>
                  </div>
                </div>

                {/* Feed Preview */}
                <div className="rounded-xl bg-[#1e1f2e] p-4 space-y-3">
                  <p className="text-xs font-medium text-[#e8e8ed]/50">Feed Preview</p>
                  <div className="rounded-xl border overflow-hidden min-h-[300px]" style={{ backgroundColor: theme?.background_color || '#0A0B10', borderColor: theme?.border_color || '#1e1f2e' }}>
                    {/* Mock Nav */}
                    <div className="h-12 border-b flex items-center px-4 justify-between" style={{ backgroundColor: theme?.card_color || '#13151c', borderColor: theme?.border_color || '#1e1f2e' }}>
                      <span className="font-bold text-sm" style={{ color: theme?.primary_color || '#4A7AFF' }}>Feed</span>
                      <div className="flex gap-2">
                        <div className="h-6 w-16 rounded-full" style={{ backgroundColor: theme?.input_bg_color || '#1e1f2e' }}></div>
                        <div className="h-6 w-6 rounded-full" style={{ backgroundColor: theme?.primary_color || '#4A7AFF' }}></div>
                      </div>
                    </div>
                    {/* Mock Post */}
                    <div className="p-4 space-y-4">
                      <div className="border rounded-xl p-3 space-y-2" style={{ backgroundColor: theme?.card_color || '#13151c', borderColor: theme?.border_color || '#1e1f2e' }}>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: theme?.primary_color || '#4A7AFF', color: theme?.button_text_color || '#ffffff' }}>U</div>
                          <div>
                            <p className="text-sm font-bold leading-none" style={{ color: theme?.text_color || '#e8e8ed' }}>User Name</p>
                            <p className="text-[10px]" style={{ color: theme?.text_color || '#e8e8ed', opacity: 0.5 }}>2 hours ago</p>
                          </div>
                        </div>
                        <p className="text-sm" style={{ color: theme?.text_color || '#e8e8ed', fontFamily: getCustomFont() }}>
                          This is a sample post showing exactly how your theme colors and fonts will look like in the feed.
                        </p>
                        <div className="flex gap-2 pt-2 border-t" style={{ borderColor: theme?.border_color || '#1e1f2e' }}>
                          <button disabled className="text-xs px-2 py-1 rounded" style={{ color: theme?.text_color || '#e8e8ed', opacity: 0.7 }}>❤️ Like</button>
                          <button disabled className="text-xs px-2 py-1 rounded" style={{ color: theme?.text_color || '#e8e8ed', opacity: 0.7 }}>💬 Comment</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={saving} className="button-gradient rounded-xl px-8 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowImportModal(false)}>
          <div className="w-full max-w-lg mx-4 rounded-2xl bg-[#13151c] border border-[#1e1f2e] overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#1e1f2e]">
              <h2 className="text-lg font-bold text-[#e8e8ed]">Import Theme JSON</h2>
              <button onClick={() => setShowImportModal(false)} className="rounded-full p-1 text-[#e8e8ed]/50 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='{\n  "themeName": "Pump.fun",\n  "colors": {\n    "background_color": "#121212"\n  }\n}'
                rows={8}
                className="w-full resize-none rounded-xl bg-[#1e1f2e] text-[#e8e8ed] text-sm font-mono placeholder-[#e8e8ed]/30 p-3 border border-[#1e1f2e] outline-none focus:border-[#4A7AFF] focus:ring-1 focus:ring-[#4A7AFF] transition-all"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowImportModal(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all">Cancel</button>
                <button type="button" onClick={() => {
                  try {
                    if (!importJson.trim()) return;
                    const parsed = JSON.parse(importJson);
                    if (parsed.colors) setTheme({ ...theme, ...parsed.colors });
                    setSettings({ ...settings, theme_json: importJson });
                    setShowImportModal(false);
                    setImportJson('');
                    toast({ title: 'Success', description: 'Theme JSON imported! You can preview it below, then click Save.' });
                  } catch {
                    toast({ title: 'Error', description: 'Invalid JSON format', variant: 'destructive' });
                  }
                }} className="button-gradient rounded-xl px-6 py-2 text-sm font-semibold text-white">Apply Preview</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
