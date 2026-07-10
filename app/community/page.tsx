'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';

import { toast } from '@/hooks/use-toast';

interface Community {
  id: number; name: string; slug: string; description: string | null; image: string | null;
  is_private: number; owner_id: number; owner_username: string; member_count: number; created_at: string;
}

interface User { id: number; username: string; full_name: string | null; profile_image: string | null; }

export default function CommunityDirectoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { checkAuth(); fetchCommunities(); }, []);

  const checkAuth = async () => {
    try { const res = await fetch('/api/auth/me'); if (res.ok) setUser(await res.json()); else router.push('/'); }
    catch { router.push('/'); }
  };

  const fetchCommunities = async () => {
    try { const res = await fetch('/api/communities'); if (res.ok) setCommunities(await res.json()); }
    catch {} finally { setLoading(false); }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = () => setNewImage(reader.result as string); reader.readAsDataURL(file); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newName.trim()) return; setSubmitting(true);
    try {
      const res = await fetch('/api/communities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, description: newDescription, image: newImage ? newImage.split(',')[1] : null, is_private: newIsPrivate }) });
      if (res.ok) { const data = await res.json(); setShowCreate(false); setNewName(''); setNewDescription(''); setNewImage(null); setNewIsPrivate(false); router.push(`/community/${data.slug}`); }
      else { const err = await res.json(); toast({ title: 'Error', description: err.error || 'Failed to create community', variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Failed to create community', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const filtered = communities.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()));

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
    <div className="min-h-screen bg-[#0A0B10] text-[#e8e8ed]">
      {/* Header */}
      <Navbar />

      {/* Mobile search */}
      <div className="px-4 pt-3 sm:hidden">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e8e8ed]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input placeholder="Search communities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-10 w-full rounded-xl bg-[#1e1f2e] pl-10 pr-4 text-sm text-[#e8e8ed] placeholder-[#e8e8ed]/30 border-0 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="hidden sm:block relative w-full sm:w-96">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e8e8ed]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input placeholder="Search communities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-10 w-full rounded-xl bg-[#1e1f2e] pl-10 pr-4 text-sm text-[#e8e8ed] placeholder-[#e8e8ed]/30 border-0 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all" />
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="button-gradient h-10 px-6 rounded-xl text-sm font-semibold text-white whitespace-nowrap transition-all hover:scale-[1.02]"
            >
              Create Community
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((community) => (
            <div
              key={community.id}
              onClick={() => router.push(`/community/${community.slug}`)}
              className="card-hover rounded-2xl bg-[#13151c] border border-[#1e1f2e] overflow-hidden cursor-pointer animate-fade-in-up"
            >
              <div className="h-24 bg-gradient-to-br from-[#4A7AFF]/20 to-[#22c55e]/20 flex items-center justify-center">
                <Avatar className="h-16 w-16 border-2 border-[#13151c]">
                  <AvatarImage src={community.image || undefined} />
                  <AvatarFallback className="bg-[#4A7AFF] text-white text-lg">{community.name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="truncate font-semibold text-[#e8e8ed]">{community.name}</p>
                  {community.is_private ? (
                    <svg className="h-3.5 w-3.5 shrink-0 text-[#e8e8ed]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  ) : (
                    <svg className="h-3.5 w-3.5 shrink-0 text-[#e8e8ed]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#e8e8ed]/50 mb-2">
                  <span>{community.member_count} member{community.member_count !== 1 ? 's' : ''}</span>
                  <span>&middot;</span>
                  <span>@{community.owner_username}</span>
                </div>
                {community.description && (
                  <p className="line-clamp-2 text-sm text-[#e8e8ed]/60">{community.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">\uD83C\uDF0D</div>
            <p className="text-lg font-medium text-[#e8e8ed]/70">{searchQuery ? 'No communities found' : 'No communities yet'}</p>
            <p className="mt-1 text-sm text-[#e8e8ed]/40">{searchQuery ? 'Try a different search term' : 'Create the first community!'}</p>
          </div>
        )}
      </main>

      {/* Create Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md mx-4 rounded-2xl bg-[#13151c] border border-[#1e1f2e] p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#e8e8ed]">Create Community</h2>
                <p className="text-sm text-[#e8e8ed]/50">Start a new community</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-full p-1.5 text-[#e8e8ed]/50 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex justify-center mb-4">
                <label className="cursor-pointer group">
                  <Avatar className="h-20 w-20 border-2 border-[#1e1f2e]">
                    <AvatarImage src={newImage || undefined} />
                    <AvatarFallback className="bg-[#1e1f2e] text-[#e8e8ed]/30">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </AvatarFallback>
                  </Avatar>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-[#e8e8ed]/60 mb-1.5 block">Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Community name" required className="h-10 w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all placeholder:text-[#e8e8ed]/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#e8e8ed]/60 mb-1.5 block">Description</label>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="What is this community about?" rows={3} className="w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 py-3 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all resize-none placeholder:text-[#e8e8ed]/30" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative h-6 w-11 rounded-full transition-colors ${newIsPrivate ? 'bg-[#4A7AFF]' : 'bg-[#1e1f2e]'}`}>
                  <input type="checkbox" checked={newIsPrivate} onChange={(e) => setNewIsPrivate(e.target.checked)} className="sr-only" />
                  <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${newIsPrivate ? 'translate-x-5' : ''}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#e8e8ed]">Private community</p>
                  <p className="text-xs text-[#e8e8ed]/50">Members must request to join</p>
                </div>
              </label>
              <button type="submit" disabled={submitting || !newName.trim()} className="button-gradient w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.01]">
                {submitting ? 'Creating...' : 'Create Community'}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
      
    </div>
  );
}

