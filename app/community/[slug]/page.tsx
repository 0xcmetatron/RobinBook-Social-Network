'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/navbar';
import { useRouter, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RichText, EmojiPicker } from '@/components/rich-text';
import { LinkPreview, extractUrls } from '@/components/link-preview';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const REACTIONS = [
  { type: 'like', emoji: '\uD83D\uDC4D', label: 'Like' },
  { type: 'love', emoji: '\u2764\uFE0F', label: 'Love' },
  { type: 'haha', emoji: '\uD83D\uDE06', label: 'Haha' },
  { type: 'wow', emoji: '\uD83D\uDE32', label: 'Wow' },
  { type: 'sad', emoji: '\uD83D\uDE22', label: 'Sad' },
  { type: 'angry', emoji: '\uD83D\uDE21', label: 'Angry' },
];

const REACTION_EMOJI: Record<string, string> = {
  like: '\uD83D\uDC4D', love: '\u2764\uFE0F', haha: '\uD83D\uDE06',
  wow: '\uD83D\uDE32', sad: '\uD83D\uDE22', angry: '\uD83D\uDE21',
};

interface CommunityData {
  id: number; name: string; slug: string; description: string | null; image: string | null;
  is_private: number; owner_id: number; owner_username: string; owner_full_name: string;
  owner_profile_image: string | null; member_count: number; created_at: string; post_permission?: string; banner_url?: string;
}

interface Member {
  id: number; username: string; full_name: string | null; profile_image: string | null;
  status: string; joined_at: string;
}

interface Post {
  id: number; user_id: number; content: string; image_url: string | null; created_at: string;
  username: string; full_name: string; profile_image: string | null;
  like_count: number; comment_count: number; userLiked: boolean; userReaction: string | null;
}

interface Comment {
  id: number; user_id: number; content: string; created_at: string;
  username: string; full_name: string; profile_image: string | null;
}

export default function CommunityPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [user, setUser] = useState<any>(null);
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [memberStatus, setMemberStatus] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  
  const handleDeletePost = async (postId: number) => {
    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (typeof fetchPosts !== 'undefined') fetchPosts();
    } catch {}
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    try {
      await fetch(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
      if (typeof fetchComments !== 'undefined') fetchComments(postId);
    } catch {}
  };

  const [deleteCommentData, setDeleteCommentData] = useState<{postId: number, commentId: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPostEmoji, setShowPostEmoji] = useState(false);
  const postEmojiRef = useRef<HTMLDivElement>(null);

  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [commentEmoji, setCommentEmoji] = useState<Record<number, boolean>>({});
  const commentEmojiRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const [activeReactionPost, setActiveReactionPost] = useState<number | null>(null);
  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reactionModalPostId, setReactionModalPostId] = useState<number | null>(null);
  const [reactionModalData, setReactionModalData] = useState<any[]>([]);
  const [loadingReactions, setLoadingReactions] = useState(false);

  const openReactionModal = async (postId: number) => {
    setReactionModalPostId(postId);
    setLoadingReactions(true);
    try {
      const res = await fetch(`/api/posts/${postId}/reactions`);
      if (res.ok) setReactionModalData(await res.json());
    } catch {}
    setLoadingReactions(false);
  };

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editPostPermission, setEditPostPermission] = useState<'all'|'admin'>('all');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editBanner, setEditBanner] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => { checkAuth(); fetchCommunity(); }, [slug]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (postEmojiRef.current && !postEmojiRef.current.contains(e.target as Node)) setShowPostEmoji(false);
      Object.entries(commentEmojiRefs.current).forEach(([postId, ref]) => {
        if (ref && !ref.contains(e.target as Node)) setCommentEmoji((prev) => ({ ...prev, [Number(postId)]: false }));
      });
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const checkAuth = async () => {
    try { const res = await fetch('/api/auth/me'); if (res.ok) setUser(await res.json()); else router.push('/'); }
    catch { router.push('/'); }
  };

  const fetchCommunity = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setCommunity(data.community);
        setMemberStatus(data.memberStatus);
        setMembers(data.members || []);
        setEditName(data.community.name);
        setEditDescription(data.community.description || '');
        setEditIsPrivate(data.community.is_private === 1);
          setEditPostPermission(data.community.post_permission || 'all');
      } else if (res.status === 404) setNotFound(true);
    } catch {} finally { setLoading(false); }
  };

  const fetchPosts = async () => {
    try { const res = await fetch(`/api/communities/${slug}/posts`); if (res.ok) setPosts(await res.json()); } catch {}
  };

  useEffect(() => { if (community) fetchPosts(); }, [community?.id]);

  const fetchComments = async (postId: number) => {
    try { const res = await fetch(`/api/posts/${postId}/comments`); if (res.ok) { const data = await res.json(); setComments((prev) => ({ ...prev, [postId]: data })); } } catch {}
  };

  const handleJoin = async () => {
    try {
      const res = await fetch(`/api/communities/${slug}/join`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.action === 'left') { setMemberStatus(null); setMembers((prev) => prev.filter((m) => m.id !== user?.id)); }
        else if (data.action === 'requested') setMemberStatus('pending'); else if (data.action === 'canceled') setMemberStatus(null);
        else if (data.action === 'joined') { setMemberStatus('member'); fetchCommunity(); }
      }
    } catch {}
  };

  const handleRespond = async (userId: number, action: 'approve' | 'reject') => {
    try { const res = await fetch(`/api/communities/${slug}/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action }) }); if (res.ok) fetchCommunity(); } catch {}
  };

  const handleRemoveMember = async (userId: number) => {
    try { await fetch(`/api/communities/${slug}/members?userId=${userId}`, { method: 'DELETE' }); fetchCommunity(); } catch {}
  };

  const handleCreatePost = async () => {
    if (!postContent && !postImage) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/communities/${slug}/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: postContent, image: postImage }) });
      if (res.ok) { setPostContent(''); setPostImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; fetchPosts(); }
      else { const err = await res.json(); toast({ title: 'Error', description: err.error || 'Failed to post', variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Failed to post', variant: 'destructive' }); } finally { setSubmitting(false); }
  };

  const handleReaction = async (postId: number, reaction: string) => {
    try { const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reaction }) }); if (res.ok) fetchPosts(); } catch {}
    setActiveReactionPost(null);
  };

  const showReactionMenu = (postId: number) => { if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current); setActiveReactionPost(postId); };
  const hideReactionMenu = (postId: number) => { reactionTimeoutRef.current = setTimeout(() => setActiveReactionPost(null), 300); };

  const toggleComments = async (postId: number) => {
    const isExpanding = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: isExpanding }));
    if (isExpanding && !comments[postId]) await fetchComments(postId);
  };

  const handleAddComment = async (postId: number) => {
    const content = commentInputs[postId]; if (!content?.trim()) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      if (res.ok) { setCommentInputs((prev) => ({ ...prev, [postId]: '' })); await fetchComments(postId); await fetchPosts(); }
    } catch {}
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingSettings(true);
    try {
      await fetch(`/api/communities/${slug}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName, description: editDescription, is_private: editIsPrivate, image: editImage, banner: editBanner, post_permission: editPostPermission }) });
      fetchCommunity(); toast({ title: 'Success', description: 'Settings saved!' });
    } catch { toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' }); } finally { setSavingSettings(false); }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = () => setPostImage((reader.result as string)?.split(',')[1] || null); reader.readAsDataURL(file); }
  };

  const handleEditBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) { const reader = new FileReader(); reader.onload = () => setEditBanner((reader.result as string)?.split(',')[1] || null); reader.readAsDataURL(file); }
    };
    const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = () => setEditImage((reader.result as string)?.split(',')[1] || null); reader.readAsDataURL(file); }
  };

  const isOwner = user?.id === community?.owner_id;

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

  if (notFound || !community) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0A0B10] text-[#e8e8ed]">
        <p className="text-lg font-medium">Community not found</p>
        <button onClick={() => router.push('/community')} className="button-gradient rounded-xl px-6 py-2.5 text-sm font-semibold text-white">Back to Communities</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B10] text-[#e8e8ed]">
      <Navbar />

      <div className="mx-auto max-w-4xl">
        {/* Cover */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-[#4A7AFF]/30 to-[#22c55e]/30">
          {community.image && <img src={community.image} alt={community.name} className="h-full w-full object-cover opacity-30" />}
          <div className="absolute inset-0 flex items-end p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-[#13151c]">
                <AvatarImage src={community.image || undefined} />
                <AvatarFallback className="bg-[#4A7AFF] text-white text-3xl">{community.name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-white">{community.name}</h2>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    {community.is_private ? (
                      <><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> Private</>
                    ) : (
                      <><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Public</>
                    )}
                  </span>
                  <span>{community.member_count} member{community.member_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions & Description */}
        <div className="flex items-center gap-3 px-4 py-3">
          {!isOwner && (
            <button onClick={handleJoin} className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
              memberStatus === 'member' ? 'bg-[#1e1f2e] text-[#e8e8ed]/70 hover:text-[#e8e8ed]' : 'button-gradient text-white'
            }`}>
              {memberStatus === 'member' ? 'Leave' : memberStatus === 'pending' ? 'Requested' : community.is_private ? 'Request to Join' : 'Join'}
            </button>
          )}
          {isOwner && (
            <button onClick={() => setActiveTab('settings')} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#e8e8ed]/70 hover:text-[#e8e8ed] bg-[#1e1f2e] hover:bg-[#1e1f2e]/80 transition-all flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Settings
            </button>
          )}
          {community.description && (
            <p className="flex-1 text-sm text-[#e8e8ed]/60">{community.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[#1e1f2e] px-4">
          <button onClick={() => setActiveTab('posts')} className={`relative px-4 py-3 text-sm font-medium transition-all ${activeTab === 'posts' ? 'text-[#4A7AFF] border-b-2 border-[#4A7AFF]' : 'text-[#e8e8ed]/50 hover:text-[#e8e8ed]'}`}>
            Posts
          </button>
          <button onClick={() => setActiveTab('members')} className={`relative px-4 py-3 text-sm font-medium transition-all ${activeTab === 'members' ? 'text-[#4A7AFF] border-b-2 border-[#4A7AFF]' : 'text-[#e8e8ed]/50 hover:text-[#e8e8ed]'}`}>
            Members ({community.member_count})
          </button>
          {isOwner && (
            <button onClick={() => setActiveTab('settings')} className={`relative px-4 py-3 text-sm font-medium transition-all ${activeTab === 'settings' ? 'text-[#4A7AFF] border-b-2 border-[#4A7AFF]' : 'text-[#e8e8ed]/50 hover:text-[#e8e8ed]'}`}>
              Settings
            </button>
          )}
        </div>

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
            {((memberStatus === 'member' && community?.post_permission !== 'admin') || isOwner) ? (
              <div className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] p-4 relative z-30">
                <div className="flex gap-3">
                    <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                      {user?.profile_image ? (
                        <img className="aspect-square h-full w-full" src={user.profile_image} />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center rounded-full bg-[#4A7AFF] text-white">
                          {user?.username?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </span>
                    <div className="flex-1">
                      <textarea placeholder={`Share with ${community?.name || ''}...`} value={postContent} onChange={(e) => setPostContent(e.target.value)} rows={2} className="w-full resize-none rounded-xl bg-[#1e1f2e] text-[#e8e8ed] text-base placeholder-[#e8e8ed]/30 p-3 border-0 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all min-h-[60px]" />
                    </div>
                  </div>
                  {postImage && (
                    <div className="relative mt-3">
                      <img src={`data:image/png;base64,${postImage}`} alt="Preview" className="max-h-64 w-full rounded-xl object-cover" />
                      <button onClick={() => { setPostImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1.5 hover:bg-black/80 transition-all">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1e1f2e]">
                    <div className="flex items-center gap-1">
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" id="community-img" />
                      <label htmlFor="community-img" className="cursor-pointer rounded-lg px-3 py-2 text-sm text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all flex items-center gap-2">
                        <svg className="h-5 w-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Photo
                      </label>
                      <div ref={postEmojiRef} className="relative">
                        <button onClick={() => setShowPostEmoji(!showPostEmoji)} className="rounded-lg px-3 py-2 text-sm text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all flex items-center gap-2" type="button">
                          <svg className="h-5 w-5 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Emoji
                        </button>
                        {showPostEmoji && (
                          <div className="absolute top-full left-0 mt-1 z-50">
                            <EmojiPicker onSelect={(emoji: string) => { setPostContent((prev) => prev + emoji); setShowPostEmoji(false); }} primaryColor="#4A7AFF" cardColor="#13151c" textColor="#e8e8ed" borderColor="#1e1f2e" accentColor="#4A7AFF" />
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={handleCreatePost} disabled={submitting || (!postContent && !postImage)} className="button-gradient rounded-xl px-6 py-2 text-sm font-semibold text-white disabled:opacity-50">
                      {submitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[#e8e8ed]/50">
                <p>{memberStatus === 'pending' ? 'Waiting for approval to join...' : 'Join this community to post'}</p>
              </div>
            )}

            {posts.map((post) => (
              <div key={post.id} className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] relative z-10">
                <div className="flex items-start justify-between p-4 pb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 cursor-pointer" onClick={() => router.push(`/profile/${post.user_id}`)}>
                      <AvatarImage src={post.profile_image || undefined} />
                      <AvatarFallback className="bg-[#4A7AFF] text-white text-sm">{post.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-[#e8e8ed] cursor-pointer hover:underline" onClick={() => router.push(`/profile/${post.user_id}`)}>
                        {post.full_name || post.username}
                      </p>
                      <p className="text-xs text-[#e8e8ed]/40">{new Date(post.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {(user?.id === post.user_id || user?.isAdmin || isOwner) && (
                    <button onClick={() => setDeletePostId(post.id)} className="text-[#e8e8ed]/30 hover:text-[#e74c3c] transition-colors p-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>

                <div className="px-4 pb-2 space-y-3">
                  {post.content && <RichText content={post.content} />}
                  {post.image_url && <img src={post.image_url} alt="Post" className="w-full rounded-xl object-cover" />}
                  {!post.image_url && post.content && extractUrls(post.content).length > 0 && (
                    <LinkPreview url={extractUrls(post.content)[0]} />
                  )}
                </div>

                {(post.like_count > 0 || post.comment_count > 0) && (
                  <div className="flex items-center justify-between px-4 pb-2 text-xs text-[#e8e8ed]/50">
                    <span className="flex items-center gap-1 cursor-pointer hover:underline" onClick={() => post.like_count > 0 && openReactionModal(post.id)}>
                      <span>{post.like_count} {post.like_count > 0 && (REACTION_EMOJI[post.userReaction || 'like'])}</span>
                    </span>
                    <span className="cursor-pointer hover:underline" onClick={() => toggleComments(post.id)}>{post.comment_count > 0 ? `${post.comment_count} comment${post.comment_count !== 1 ? 's' : ''}` : ''}</span>
                  </div>
                )}

                <div className="flex items-center border-t border-[#1e1f2e] mx-4">
                  <div className="relative flex-1" onMouseEnter={() => showReactionMenu(post.id)} onMouseLeave={() => hideReactionMenu(post.id)}>
                    <button onClick={() => handleReaction(post.id, 'like')} className={`flex w-full items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${post.userLiked ? 'text-[#e74c3c]' : 'text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e]'}`}>
                      <span className={post.userLiked ? 'reaction-pop' : ''}>{post.userReaction ? REACTION_EMOJI[post.userReaction] || '\u2764\uFE0F' : '\u2764\uFE0F'}</span>
                      {post.userReaction && post.userReaction !== 'like' ? post.userReaction.charAt(0).toUpperCase() + post.userReaction.slice(1) : 'Like'}
                    </button>
                    {activeReactionPost === post.id && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-scale-in" onMouseEnter={() => { if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current); }} onMouseLeave={() => hideReactionMenu(post.id)}>
                        <div className="reaction-menu">{REACTIONS.map((r) => (<button key={r.type} onClick={() => handleReaction(post.id, r.type)} className="reaction-btn" title={r.label}>{r.emoji}</button>))}</div>
                      </div>
                    )}
                  </div>
                  <button onClick={() => toggleComments(post.id)} className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] rounded-lg transition-all">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Comment
                  </button>
                </div>

                {expandedComments[post.id] && (
                  <div className="border-t border-[#1e1f2e] p-4 space-y-3 bg-[#0A0B10]/50">
                    <div className="flex gap-2">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={user?.profile_image || undefined} />
                        <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                          <input placeholder="Write a comment..." value={commentInputs[post.id] || ''} onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }} className="w-full h-9 rounded-full bg-[#1e1f2e] text-[#e8e8ed] text-sm placeholder-[#e8e8ed]/30 px-10 border-0 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all" />
                          <div ref={(el) => { commentEmojiRefs.current[post.id] = el; }} className="absolute left-0 top-0 h-full">
                            <button onClick={() => setCommentEmoji((prev) => ({ ...prev, [post.id]: !prev[post.id] }))} className="h-full px-2 text-[#e8e8ed]/50 hover:text-[#e8e8ed] transition-all" type="button">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            {commentEmoji[post.id] && (
                              <div className="absolute bottom-full left-0 mb-2 z-50">
                                <EmojiPicker onSelect={(emoji: string) => { setCommentInputs((prev) => ({ ...prev, [post.id]: (prev[post.id] || '') + emoji })); setCommentEmoji((prev) => ({ ...prev, [post.id]: false })); }} primaryColor="#4A7AFF" cardColor="#13151c" textColor="#e8e8ed" borderColor="#1e1f2e" accentColor="#4A7AFF" />
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={() => handleAddComment(post.id)} disabled={!commentInputs[post.id]?.trim()} className="button-gradient shrink-0 h-9 rounded-full px-4 text-white text-sm font-medium disabled:opacity-50">Post</button>
                      </div>
                    </div>
                    {comments[post.id] && comments[post.id].length > 0 && (
                      <div className="space-y-2">
                        {comments[post.id].map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <Avatar className="h-8 w-8 shrink-0 cursor-pointer" onClick={() => router.push(`/profile/${comment.user_id}`)}>
                              <AvatarImage src={comment.profile_image || undefined} />
                              <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{comment.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="rounded-2xl bg-[#1e1f2e] px-3 py-2 relative group">
                                <p className="text-sm font-semibold text-[#e8e8ed] cursor-pointer hover:underline" onClick={() => router.push(`/profile/${comment.user_id}`)}>{comment.full_name || comment.username}</p>
                                <p className="text-sm text-[#e8e8ed]/80"><RichText content={comment.content} /></p>
                                {extractUrls(comment.content).length > 0 && <div className="mt-1"><LinkPreview url={extractUrls(comment.content)[0]} compact /></div>}
                                {(user?.id === comment.user_id || user?.isAdmin || isOwner) && (
                                  <button onClick={() => setDeleteCommentData({postId: post.id, commentId: comment.id})} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[#e8e8ed]/30 hover:text-[#e74c3c] transition-all p-1">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                )}
                              </div>
                              <p className="mt-0.5 px-3 text-xs text-[#e8e8ed]/40">{new Date(comment.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {posts.length === 0 && (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">\uD83D\uDCAC</div>
                <p className="text-lg font-medium text-[#e8e8ed]/70">No posts yet</p>
                <p className="mt-1 text-sm text-[#e8e8ed]/40">Share something with the community!</p>
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
            <div className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] p-4 space-y-1">
              {members.filter((m) => m.status === 'member').map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-[#1e1f2e] transition-colors">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/profile/${member.id}`)}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profile_image || undefined} />
                      <AvatarFallback className="bg-[#4A7AFF] text-white">{member.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-[#e8e8ed]">{member.full_name || member.username}</p>
                      {member.id === community.owner_id && <p className="flex items-center gap-1 text-xs text-[#f59e0b]"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> Owner</p>}
                    </div>
                  </div>
                  {(isOwner && member.id !== user?.id) && (
                    <button onClick={() => handleRemoveMember(member.id)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#e74c3c] hover:bg-[#e74c3c]/10 transition-all">Remove</button>
                  )}
                </div>
              ))}
            </div>

            {isOwner && community?.is_private === 1 && (
                <>
                  <h3 className="text-lg font-bold text-[#e8e8ed]">Pending Requests</h3>
                <div className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] p-4">
                  {members.filter((m) => m.status === 'pending').length === 0 ? (
                    <p className="text-center text-sm text-[#e8e8ed]/50">No pending requests</p>
                  ) : (
                    <div className="space-y-1">
                      {members.filter((m) => m.status === 'pending').map((member) => (
                        <div key={member.id} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-[#1e1f2e] transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.profile_image || undefined} />
                              <AvatarFallback className="bg-[#4A7AFF] text-white">{member.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-semibold text-[#e8e8ed]">{member.full_name || member.username}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleRespond(member.id, 'approve')} className="rounded-lg bg-[#22c55e] text-white p-2 text-xs hover:bg-[#22c55e]/80 transition-all">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button onClick={() => handleRespond(member.id, 'reject')} className="rounded-lg bg-[#e74c3c] text-white p-2 text-xs hover:bg-[#e74c3c]/80 transition-all">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && isOwner && (
          <div className="max-w-lg mx-auto px-4 py-4">
            <form onSubmit={handleSaveSettings} className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] p-6 space-y-5">
              <h2 className="text-lg font-bold text-[#e8e8ed]">Community Settings</h2>
              <div className="flex justify-center">
                <label className="cursor-pointer group">
                  <Avatar className="h-20 w-20 border-2 border-[#1e1f2e]">
                    <AvatarImage src={editImage ? `data:image/png;base64,${editImage}` : (community.image || undefined)} />
                    <AvatarFallback className="bg-[#1e1f2e] text-[#e8e8ed]/30 text-2xl">{community.name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <input type="file" accept="image/*" onChange={handleEditImageSelect} className="hidden" id="edit-image" />
                </label>
              </div>
              <div className="space-y-2 mb-4">
                  <label className="text-xs font-medium text-[#e8e8ed]/60 mb-1.5 block">Cover Banner</label>
                  <label className="cursor-pointer block relative h-32 w-full overflow-hidden rounded-xl bg-[#1e1f2e] border-2 border-dashed border-[#1e1f2e] hover:border-[#4A7AFF]/50 transition-all">
                    {editBanner || community.banner_url ? (
                      <img src={editBanner ? `data:image/png;base64,${editBanner}` : community.banner_url} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-[#e8e8ed]/30">
                        <svg className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-sm">Upload Cover Image</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleEditBannerSelect} className="hidden" />
                  </label>
                </div>
                <div><label className="text-xs font-medium text-[#e8e8ed]/60 mb-1.5 block">Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-10 w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#e8e8ed]/60 mb-1.5 block">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 py-3 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all resize-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`relative h-6 w-11 rounded-full transition-colors ${editIsPrivate ? 'bg-[#4A7AFF]' : 'bg-[#1e1f2e]'}`}>
                    <input type="checkbox" checked={editIsPrivate} onChange={(e) => setEditIsPrivate(e.target.checked)} className="sr-only" />
                    <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${editIsPrivate ? 'translate-x-5' : ''}`} />
                  </div>
                  <p className="text-sm text-[#e8e8ed]">Private community (members must request to join)</p>
                </label>
                <div>
                  <label className="text-xs font-medium text-[#e8e8ed]/60 mb-1.5 block">Who can post</label>
                  <select value={editPostPermission} onChange={(e) => setEditPostPermission(e.target.value as any)} className="w-full rounded-xl bg-[#1e1f2e] border border-[#1e1f2e] text-[#e8e8ed] text-sm px-4 py-3 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all">
                    <option value="all">Any member can post</option>
                    <option value="admin">Only admins can post</option>
                  </select>
                </div>
              <button type="submit" disabled={savingSettings} className="button-gradient w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50">
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        )}
      </div>
      {/* Reactions Modal */}
      {reactionModalPostId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setReactionModalPostId(null)}>
          <div className="w-full max-w-sm mx-4 rounded-2xl bg-[#13151c] border border-[#1e1f2e] overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#1e1f2e]">
              <h2 className="text-lg font-bold text-[#e8e8ed]">Reactions</h2>
              <button onClick={() => setReactionModalPostId(null)} className="rounded-full p-1 text-[#e8e8ed]/50 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {loadingReactions ? (
                <div className="flex justify-center p-4"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4A7AFF] border-t-transparent" /></div>
              ) : reactionModalData.length === 0 ? (
                <p className="p-4 text-center text-sm text-[#e8e8ed]/50">No reactions yet</p>
              ) : (
                reactionModalData.map((reaction, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 hover:bg-[#1e1f2e] rounded-xl transition-colors cursor-pointer" onClick={() => { setReactionModalPostId(null); router.push(`/profile/${reaction.user_id}`); }}>
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={reaction.profile_image || undefined} />
                        <AvatarFallback className="bg-[#4A7AFF] text-white text-sm">{reaction.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 text-sm bg-[#13151c] rounded-full leading-none">{REACTION_EMOJI[reaction.reaction_type] || '\u2764\uFE0F'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#e8e8ed]">{reaction.full_name || reaction.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Post Modal */}
      <AlertDialog open={deletePostId !== null} onOpenChange={(open) => !open && setDeletePostId(null)}>
        <AlertDialogContent className="bg-[#13151c] border-[#1e1f2e] text-[#e8e8ed]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#e8e8ed]/60">
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1e1f2e] border-0 text-[#e8e8ed] hover:bg-[#2a2d3d] hover:text-[#e8e8ed]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deletePostId) { handleDeletePost(deletePostId); setDeletePostId(null); } }} className="bg-[#e74c3c] text-white hover:bg-[#c0392b]">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Modal */}
      <AlertDialog open={deleteCommentData !== null} onOpenChange={(open) => !open && setDeleteCommentData(null)}>
        <AlertDialogContent className="bg-[#13151c] border-[#1e1f2e] text-[#e8e8ed]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#e8e8ed]/60">
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1e1f2e] border-0 text-[#e8e8ed] hover:bg-[#2a2d3d] hover:text-[#e8e8ed]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteCommentData) { handleDeleteComment(deleteCommentData.postId, deleteCommentData.commentId); setDeleteCommentData(null); } }} className="bg-[#e74c3c] text-white hover:bg-[#c0392b]">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}




