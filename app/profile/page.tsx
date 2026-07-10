'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';


interface User {
  id: number; username: string; email: string; full_name: string | null; bio: string | null;
  profile_image: string | null; cover_image: string | null; isAdmin: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { checkAuth(); fetchSettings(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) { const d = await res.json(); setUser(d); setFullName(d.full_name || ''); setBio(d.bio || ''); }
      else router.push('/');
    } catch { router.push('/'); }
    finally { setLoading(false); }
  };

  const fetchSettings = async () => { try { await fetch('/api/admin/settings'); } catch {} };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = () => setProfileImage((reader.result as string).split(',')[1]); reader.readAsDataURL(file); }
  };

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = () => setCoverImage((reader.result as string).split(',')[1]); reader.readAsDataURL(file); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: fullName, bio, profile_image: profileImage, cover_image: coverImage }) });
      if (res.ok) { toast({ title: 'Success', description: 'Profile updated!' }); checkAuth(); setProfileImage(null); setCoverImage(null); }
      else toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

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

      <div className="mx-auto max-w-2xl px-4 py-6">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* Cover Photo */}
          <div className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] overflow-hidden">
            <div className="relative h-48 w-full bg-[#1e1f2e]">
              {(coverImage || user?.cover_image) ? (
                <img src={coverImage ? `data:image/png;base64,${coverImage}` : (user?.cover_image || '')} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <svg className="h-12 w-12 text-[#e8e8ed]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverImageSelect} className="hidden" id="cover-upload" />
              <label htmlFor="cover-upload" className="absolute bottom-3 right-3 z-30 cursor-pointer rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80 transition-all">
                <svg className="mr-1.5 inline-block h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Change Cover
              </label>
            </div>

            {/* Profile Picture */}
            <div className="relative px-6 pb-6">
              <div className="flex justify-center -mt-16 mb-4">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-[#13151c] ring-2 ring-[#4A7AFF]/30">
                    <AvatarImage src={profileImage ? `data:image/png;base64,${profileImage}` : (user?.profile_image || undefined)} />
                    <AvatarFallback className="bg-[#4A7AFF] text-white text-4xl">{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" id="profile-upload" />
                  <label htmlFor="profile-upload" className="absolute inset-0 z-30 flex cursor-pointer items-center justify-center rounded-full bg-black/0 group-hover:bg-black/50 transition-all">
                    <span className="hidden group-hover:block">
                      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <p className="text-[10px] text-white mt-1">Change</p>
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#e8e8ed]/60 mb-1.5 block">Username</label>
                  <input value={user?.username || ''} disabled className="h-10 w-full rounded-xl bg-[#1e1f2e] text-[#e8e8ed]/50 text-sm px-4 border-0 outline-none cursor-not-allowed" />
                  <p className="mt-1 text-xs text-[#e8e8ed]/30">Username cannot be changed</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#e8e8ed]/60 mb-1.5 block">Email</label>
                  <input value={user?.email || ''} disabled className="h-10 w-full rounded-xl bg-[#1e1f2e] text-[#e8e8ed]/50 text-sm px-4 border-0 outline-none cursor-not-allowed" />
                  <p className="mt-1 text-xs text-[#e8e8ed]/30">Email cannot be changed</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#e8e8ed]/60 mb-1.5 block">Full Name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="h-10 w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all placeholder:text-[#e8e8ed]/30" />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#e8e8ed]/60 mb-1.5 block">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={4} className="w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 py-3 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all resize-none placeholder:text-[#e8e8ed]/30" />
                </div>

                <button type="submit" disabled={submitting} className="button-gradient w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.01]">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
      
    </div>
  );
}

