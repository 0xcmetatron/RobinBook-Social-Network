'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';

import { RichText, EmojiPicker } from '@/components/rich-text';
import { LinkPreview, extractUrls } from '@/components/link-preview';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface User {
  id: number; username: string; full_name: string; profile_image: string | null; isAdmin: boolean;
}

interface SearchUser {
  id: number; username: string; full_name: string | null; profile_image: string | null; bio: string | null;
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

interface Notification {
  id: number; type: string; message: string; created_at: string; is_read: number;
  actor_username: string; actor_image: string | null;
}

export default function FeedPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [postPrivacy, setPostPrivacy] = useState('public');
  const [settings, setSettings] = useState<any>(null);
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Reactions
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

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Friend Requests
  interface FriendRequest { id: number; sender_id: number; username: string; full_name: string | null; profile_image: string | null; created_at: string; }
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendReqOpen, setFriendReqOpen] = useState(false);
  const friendReqRef = useRef<HTMLDivElement>(null);

  // Emoji picker for posts
  const [showPostEmoji, setShowPostEmoji] = useState(false);
  const postEmojiRef = useRef<HTMLDivElement>(null);
  const [commentEmojiPost, setCommentEmojiPost] = useState<number | null>(null);
  const commentEmojiRef = useRef<HTMLDivElement>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetch('/api/init').catch(() => {}); checkAuth(); fetchSettings(); fetchPosts(); fetchNotifications(); fetchFriendRequests(); }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (friendReqRef.current && !friendReqRef.current.contains(e.target as Node)) setFriendReqOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (postEmojiRef.current && !postEmojiRef.current.contains(e.target as Node)) setShowPostEmoji(false);
      if (commentEmojiRef.current && !commentEmojiRef.current.contains(e.target as Node)) setCommentEmojiPost(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) { setUser(await res.json()); }
      else router.push('/');
    } catch { router.push('/'); }
    finally { setLoading(false); }
  };

  const fetchSettings = async () => {
    try { const res = await fetch('/api/admin/settings'); if (res.ok) setSettings(await res.json()); } catch {}
  };

  const fetchPosts = async () => {
    try { const res = await fetch('/api/posts'); if (res.ok) setPosts(await res.json()); } catch {}
  };

  const fetchNotifications = async () => {
    try { const res = await fetch('/api/notifications'); if (res.ok) setNotifications(await res.json()); } catch {}
  };

  const fetchFriendRequests = async () => {
    try { const res = await fetch('/api/friends/request'); if (res.ok) { const data = await res.json(); setFriendRequests(data.received || []); } } catch {}
  };

  const handleFriendRespond = async (requestId: number, action: string) => {
    try {
      const res = await fetch('/api/friends/respond', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, action }) });
      if (res.ok) { setFriendRequests((prev) => prev.filter((r) => r.id !== requestId)); fetchFriendRequests(); }
    } catch {}
  };

  const markNotificationsRead = async () => {
    try { await fetch('/api/notifications', { method: 'PUT' }); } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchComments = async (postId: number) => {
    try { const res = await fetch(`/api/posts/${postId}/comments`); if (res.ok) { const data = await res.json(); setComments((prev) => ({ ...prev, [postId]: data })); } } catch {}
  };

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = () => setPostImage((reader.result as string).split(',')[1]); reader.readAsDataURL(file); }
  };

  const handleCreatePost = async () => {
    if (!postContent && !postImage) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: postContent, image: postImage, privacy: postPrivacy }) });
      if (res.ok) { setPostContent(''); setPostImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; fetchPosts(); }
      else { const err = await res.json(); toast({ title: 'Error', description: err.error || 'Failed to create post', variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Failed to create post', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const handleReaction = async (postId: number, reaction: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reaction }) });
      if (res.ok) fetchPosts();
    } catch {}
    setActiveReactionPost(null);
  };

  const showReactionMenu = (postId: number) => {
    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    setActiveReactionPost(postId);
  };

  const hideReactionMenu = (postId: number) => {
    reactionTimeoutRef.current = setTimeout(() => setActiveReactionPost(null), 300);
  };

  const toggleComments = async (postId: number) => {
    const isExpanding = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: isExpanding }));
    if (isExpanding && !comments[postId]) await fetchComments(postId);
  };

  const handleAddComment = async (postId: number) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      if (res.ok) { setCommentInputs((prev) => ({ ...prev, [postId]: '' })); await fetchComments(postId); await fetchPosts(); }
    } catch {}
  };

  // Search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!value.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    setSearchOpen(true); setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try { const res = await fetch(`/api/users/search?q=${encodeURIComponent(value)}`); const data = await res.json(); setSearchResults(Array.isArray(data) ? data : []); } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
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
      <Navbar />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-2xl px-4 py-4 space-y-4">
        {/* Create Post */}
        <div className="card-hover rounded-2xl bg-[#13151c] border border-[#1e1f2e] p-4 relative z-30">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={user?.profile_image || undefined} />
              <AvatarFallback className="bg-[#4A7AFF] text-white">{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <textarea
                ref={postTextareaRef}
                placeholder={`What's on your mind, ${user?.full_name || user?.username}?`}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl bg-[#1e1f2e] text-[#e8e8ed] text-base placeholder-[#e8e8ed]/30 p-3 border-0 outline-none focus:ring-1 focus:ring-[#4A7AFF] transition-all min-h-[60px]"
              />
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
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" id="image-upload" />
              <label htmlFor="image-upload" className="cursor-pointer rounded-lg px-3 py-2 text-sm text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all flex items-center gap-2">
                <svg className="h-5 w-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Photo
              </label>
              <div className="relative" ref={postEmojiRef}>
                <button type="button" onClick={() => setShowPostEmoji(!showPostEmoji)} className="rounded-lg px-3 py-2 text-sm text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] transition-all flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Emoji
                </button>
                {showPostEmoji && (
                  <div className="absolute left-0 top-full z-50 mt-1">
                    <EmojiPicker
                      onSelect={(emoji) => { setPostContent((prev) => prev + emoji); setShowPostEmoji(false); }}
                      primaryColor="#4A7AFF"
                      cardColor="#13151c"
                      textColor="#e8e8ed"
                      borderColor="#1e1f2e"
                      accentColor="#1e1f2e"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
                    <Select value={postPrivacy} onValueChange={setPostPrivacy}>
                      <SelectTrigger className="w-[120px] h-9 bg-[#1e1f2e] border-0 text-[#e8e8ed] text-xs focus:ring-1 focus:ring-[#4A7AFF] rounded-lg">
                        <SelectValue placeholder="Privacy" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#13151c] border-[#1e1f2e] text-[#e8e8ed]">
                        <SelectItem value="public" className="cursor-pointer hover:bg-[#1e1f2e] focus:bg-[#1e1f2e] focus:text-[#e8e8ed]">🌍 Public</SelectItem>
                        <SelectItem value="friends" className="cursor-pointer hover:bg-[#1e1f2e] focus:bg-[#1e1f2e] focus:text-[#e8e8ed]">👥 Friends</SelectItem>
                        <SelectItem value="only_me" className="cursor-pointer hover:bg-[#1e1f2e] focus:bg-[#1e1f2e] focus:text-[#e8e8ed]">🔒 Only me</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      onClick={handleCreatePost}
                      disabled={submitting || (!postContent && !postImage)}
                      className="button-gradient rounded-xl px-6 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post, idx) => (
            <div key={post.id} className={`card-hover rounded-2xl bg-[#13151c] border border-[#1e1f2e] animate-fade-in-up stagger-${Math.min(idx + 1, 6)} relative z-10`}>
              {/* Post Header */}
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
                {(user?.id === post.user_id || user?.isAdmin) && (
                  <button onClick={() => setDeletePostId(post.id)} className="text-[#e8e8ed]/30 hover:text-[#e74c3c] transition-colors p-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>

              {/* Post Content */}
              <div className="px-4 pb-2 space-y-3">
                {post.content && (
                  <p className="whitespace-pre-wrap text-base text-[#e8e8ed] leading-relaxed">
                    <RichText content={post.content} />
                  </p>
                )}
                {post.content && extractUrls(post.content).length > 0 && !post.image_url && (
                  <LinkPreview url={extractUrls(post.content)[0]} />
                )}
                {post.image_url && (
                  <img src={post.image_url} alt="Post" className="w-full rounded-xl object-cover" />
                )}
              </div>

              {/* Like/Comment Counts */}
              {(post.like_count > 0 || post.comment_count > 0) && (
                <div className="flex items-center justify-between px-4 pb-2 text-xs text-[#e8e8ed]/50">
                  <span className="flex items-center gap-1 cursor-pointer hover:underline" onClick={() => post.like_count > 0 && openReactionModal(post.id)}>
                    <span>{post.like_count} {post.like_count > 0 && (REACTION_EMOJI[post.userReaction || 'like'])}</span>
                  </span>
                  <span className="cursor-pointer hover:underline" onClick={() => toggleComments(post.id)}>{post.comment_count > 0 ? `${post.comment_count} comment${post.comment_count !== 1 ? 's' : ''}` : ''}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center border-t border-[#1e1f2e] mx-4">
                {/* Reaction Button */}
                <div
                  className="relative flex-1"
                  onMouseEnter={() => showReactionMenu(post.id)}
                  onMouseLeave={() => hideReactionMenu(post.id)}
                >
                  <button
                    onClick={() => handleReaction(post.id, 'like')}
                    className={`flex w-full items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                      post.userLiked ? 'text-[#e74c3c]' : 'text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e]'
                    }`}
                  >
                    <span className={post.userLiked ? 'reaction-pop' : ''}>
                      {post.userReaction ? REACTION_EMOJI[post.userReaction] || '\u2764\uFE0F' : '\u2764\uFE0F'}
                    </span>
                    {post.userReaction && post.userReaction !== 'like' ? post.userReaction.charAt(0).toUpperCase() + post.userReaction.slice(1) : 'Like'}
                  </button>

                  {/* Reaction Picker */}
                  {activeReactionPost === post.id && (
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-scale-in"
                      onMouseEnter={() => { if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current); }}
                      onMouseLeave={() => hideReactionMenu(post.id)}
                    >
                      <div className="reaction-menu">
                        {REACTIONS.map((r) => (
                          <button
                            key={r.type}
                            onClick={() => handleReaction(post.id, r.type)}
                            className="reaction-btn"
                            title={r.label}
                          >
                            {r.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e] rounded-lg transition-all"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Comment
                </button>
              </div>

              {/* Comments */}
              {expandedComments[post.id] && (
                <div className="border-t border-[#1e1f2e] p-4 space-y-3 bg-[#0A0B10]/50">
                  <div className="flex gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={user?.profile_image || undefined} />
                      <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <div className="relative flex-1 flex items-center gap-1 bg-[#1e1f2e] rounded-full">
                        <input
                          placeholder="Write a comment..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
                          className="flex-1 h-9 bg-transparent text-[#e8e8ed] text-sm placeholder-[#e8e8ed]/30 px-4 border-0 outline-none"
                        />
                        <div className="relative">
                          <button type="button" onClick={() => setCommentEmojiPost(commentEmojiPost === post.id ? null : post.id)} className="mr-1 text-[#e8e8ed]/40 hover:text-[#f59e0b] transition-colors p-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                          {commentEmojiPost === post.id && (
                            <div className="absolute right-0 top-full z-50 mt-1" ref={commentEmojiRef}>
                              <EmojiPicker
                                onSelect={(emoji) => { setCommentInputs((prev) => ({ ...prev, [post.id]: (prev[post.id] || '') + emoji })); setCommentEmojiPost(null); }}
                                primaryColor="#4A7AFF"
                                cardColor="#13151c"
                                textColor="#e8e8ed"
                                borderColor="#1e1f2e"
                                accentColor="#1e1f2e"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="button-gradient shrink-0 h-9 rounded-full px-4 text-white text-sm font-medium disabled:opacity-50"
                      >
                        Post
                      </button>
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
                              <p className="text-sm font-semibold text-[#e8e8ed] cursor-pointer hover:underline" onClick={() => router.push(`/profile/${comment.user_id}`)}>
                                {comment.full_name || comment.username}
                              </p>
                              <p className="text-sm text-[#e8e8ed]/80"><RichText content={comment.content} /></p>
                              {extractUrls(comment.content).length > 0 && <div className="mt-1"><LinkPreview url={extractUrls(comment.content)[0]} compact /></div>}
                              {(user?.id === comment.user_id || user?.isAdmin) && (
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
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">\uD83C\uDF1F</div>
              <p className="text-lg font-medium text-[#e8e8ed]/70">No posts yet</p>
              <p className="mt-1 text-sm text-[#e8e8ed]/40">Be the first to share something!</p>
            </div>
          )}
        </div>
      </main>

      {searchOpen && <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />}

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

      
        <AlertDialog open={deletePostId !== null} onOpenChange={(open) => !open && setDeletePostId(null)}>
          <AlertDialogContent className="bg-[#13151c] border border-[#1e1f2e] text-[#e8e8ed]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#e8e8ed]/60">
                Are you sure you want to delete this post? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-[#1e1f2e] text-[#e8e8ed] hover:bg-[#1e1f2e]">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (deletePostId) { handleDeletePost(deletePostId); setDeletePostId(null); } }} className="bg-[#e74c3c] text-white hover:bg-[#c0392b]">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteCommentData !== null} onOpenChange={(open) => !open && setDeleteCommentData(null)}>
          <AlertDialogContent className="bg-[#13151c] border border-[#1e1f2e] text-[#e8e8ed]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#e8e8ed]/60">
                Are you sure you want to delete this comment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-[#1e1f2e] text-[#e8e8ed] hover:bg-[#1e1f2e]">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (deleteCommentData) { handleDeleteComment(deleteCommentData.postId, deleteCommentData.commentId); setDeleteCommentData(null); } }} className="bg-[#e74c3c] text-white hover:bg-[#c0392b]">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      <Footer />
      
    </div>
  );
}

