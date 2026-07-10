'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/navbar';
import { useRouter, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface ProfileUser {
  id: number; username: string; full_name: string | null; profile_image: string | null;
  cover_image: string | null; bio: string | null; created_at: string;
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

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [friendStatus, setFriendStatus] = useState<string>('none');
  const [unfriendModalOpen, setUnfriendModalOpen] = useState(false);
  const [friendDirection, setFriendDirection] = useState<string>('');
  const [loadingFriend, setLoadingFriend] = useState(false);

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
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const [deleteCommentData, setDeleteCommentData] = useState<{postId: number, commentId: number} | null>(null);

  
  const handleDeletePost = async (postId: number) => {
    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (typeof fetchProfile !== 'undefined') fetchProfile();
    } catch {}
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    try {
      await fetch(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
      if (typeof fetchComments !== 'undefined') fetchComments(postId);
    } catch {}
  };

  const openReactionModal = async (postId: number) => {
    setReactionModalPostId(postId);
    setLoadingReactions(true);
    try {
      const res = await fetch(`/api/posts/${postId}/reactions`);
      if (res.ok) setReactionModalData(await res.json());
    } catch {}
    setLoadingReactions(false);
  };

  useEffect(() => { checkAuth(); fetchProfile(); }, [userId]);

  useEffect(() => {
    if (profileUser && currentUser && currentUser.id !== profileUser.id) {
      fetch(`/api/friends/status?userId=${profileUser.id}`).then(r => r.ok && r.json()).then(data => {
        if (data) { setFriendStatus(data.status); setFriendDirection(data.direction || ''); }
      }).catch(() => {});
    }
  }, [profileUser, currentUser]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      Object.entries(commentEmojiRefs.current).forEach(([postId, ref]) => {
        if (ref && !ref.contains(e.target as Node)) {
          setCommentEmoji((prev) => ({ ...prev, [Number(postId)]: false }));
        }
      });
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const checkAuth = async () => {
    try { const res = await fetch('/api/auth/me'); if (res.ok) setCurrentUser(await res.json()); else router.push('/'); }
    catch { router.push('/'); }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) { const data = await res.json(); setProfileUser(data.user); setPosts(data.posts); setPostCount(data.postCount); }
      else if (res.status === 404) setNotFound(true);
    } catch {} finally { setLoading(false); }
  };

  const fetchComments = async (postId: number) => {
    try { const res = await fetch(`/api/posts/${postId}/comments`); if (res.ok) { const data = await res.json(); setComments((prev) => ({ ...prev, [postId]: data })); } } catch {}
  };

  const handleReaction = async (postId: number, reaction: string) => {
    try { const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reaction }) }); if (res.ok) fetchProfile(); } catch {}
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
      if (res.ok) { setCommentInputs((prev) => ({ ...prev, [postId]: '' })); await fetchComments(postId); await fetchProfile(); }
    } catch {}
  };

  const confirmUnfriend = async () => {
      setLoadingFriend(true);
      try {
        const res = await fetch('/api/friends/respond', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: profileUser!.id, action: 'remove' }) });
        if (res.ok) { setFriendStatus('none'); setFriendDirection(''); toast({ title: 'Friend removed' }); }
      } catch {} finally { setLoadingFriend(false); setUnfriendModalOpen(false); }
    };
    
    const handleFriendAction = async () => {
    setLoadingFriend(true);
    try {
      if (friendStatus === 'none') {
        const res = await fetch('/api/friends/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: profileUser!.id }) });
        if (res.ok) { setFriendStatus('pending'); setFriendDirection('sent'); toast({ title: 'Friend request sent' }); }
        else { const e = await res.json(); toast({ title: e.error || 'Failed to send request', variant: 'destructive' }); }
      } else if (friendStatus === 'pending' && friendDirection === 'sent') {
        const res = await fetch('/api/friends/respond', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: profileUser!.id, action: 'cancel' }) });
        if (res.ok) { setFriendStatus('none'); setFriendDirection(''); toast({ title: 'Request canceled' }); }
            } else if (friendStatus === 'pending' && friendDirection === 'received') {
        const res = await fetch('/api/friends/respond', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: null, userId: profileUser!.id, action: 'accept' }) });
        if (res.ok) { setFriendStatus('accepted'); setFriendDirection(''); toast({ title: 'Friend request accepted' }); }
      } else if (friendStatus === 'accepted') {
        setUnfriendModalOpen(true);
        return; // Don't set loading friend yet
      }
    } catch {} finally { setLoadingFriend(false); }
  };

  const isOwnProfile = currentUser?.id === profileUser?.id;

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

  if (notFound || !profileUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0A0B10] text-[#e8e8ed]">
        <p className="text-lg font-medium">User not found</p>
        <button onClick={() => router.push('/feed')} className="button-gradient rounded-xl px-6 py-2.5 text-sm font-semibold text-white">Back to Feed</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B10] text-[#e8e8ed]">
      <Navbar />

      <div className="mx-auto max-w-4xl">
        {/* Cover */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-[#4A7AFF]/30 to-[#22c55e]/30">
          {profileUser.cover_image && <img src={profileUser.cover_image} alt="Cover" className="h-full w-full object-cover" />}
        </div>

        {/* Profile Info */}
        <div className="relative px-4 pb-4">
          <div className="flex flex-col items-center sm:flex-row sm:items-end sm:gap-4" style={{ marginTop: '-64px' }}>
            <Avatar className="h-32 w-32 border-4 border-[#13151c] ring-2 ring-[#4A7AFF]/30">
              <AvatarImage src={profileUser.profile_image || undefined} />
              <AvatarFallback className="bg-[#4A7AFF] text-white text-4xl">{profileUser.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="mt-3 flex-1 text-center sm:mb-2 sm:text-left">
              <h2 className="text-2xl font-bold text-[#e8e8ed]">{profileUser.full_name || profileUser.username}</h2>
              <p className="text-sm text-[#e8e8ed]/50">@{profileUser.username}</p>
            </div>
            {isOwnProfile && (
              <button onClick={() => router.push('/profile')} className="mt-2 sm:mb-2 rounded-xl bg-[#1e1f2e] px-4 py-2 text-sm font-semibold text-[#e8e8ed]/70 hover:text-[#e8e8ed] hover:bg-[#1e1f2e]/80 transition-all">
                Edit Profile
              </button>
            )}
            {!isOwnProfile && (
              <button onClick={handleFriendAction} disabled={loadingFriend} className={`mt-2 sm:mb-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 ${friendStatus === 'accepted' ? 'bg-[#22c55e]/20 text-[#22c55e]' : friendStatus === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 'button-gradient text-white'}`}>
                {loadingFriend ? '...' : friendStatus === 'accepted' ? 'Friends' : friendStatus === 'pending' && friendDirection === 'sent' ? 'Cancel Request' : friendStatus === 'pending' && friendDirection === 'received' ? 'Accept Request' : 'Add Friend'}
              </button>
            )}
          </div>

          <div className="mt-4 rounded-2xl bg-[#13151c] border border-[#1e1f2e] p-4">
            {profileUser.bio && (
              <p className="mb-3 text-sm leading-relaxed text-[#e8e8ed]">{profileUser.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#e8e8ed]/60">
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Joined {new Date(profileUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <span className="font-medium">
                <span className="text-[#e8e8ed]">{postCount}</span> post{postCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        <h3 className="text-lg font-bold text-[#e8e8ed]">Posts</h3>

        {posts.map((post) => (
          <div key={post.id} className="rounded-2xl bg-[#13151c] border border-[#1e1f2e] relative z-10">
            <div className="flex items-start justify-between p-4 pb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.profile_image || undefined} />
                  <AvatarFallback className="bg-[#4A7AFF] text-white text-sm">{post.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-[#e8e8ed]">{post.full_name || post.username}</p>
                  <p className="text-xs text-[#e8e8ed]/40">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
              {(currentUser?.id === post.user_id || currentUser?.isAdmin) && (
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
                    <AvatarImage src={currentUser?.profile_image || undefined} />
                    <AvatarFallback className="bg-[#4A7AFF] text-white text-xs">{currentUser?.username?.[0]?.toUpperCase()}</AvatarFallback>
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
                              {(currentUser?.id === comment.user_id || currentUser?.isAdmin) && (
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
            <div className="text-4xl mb-3">\uD83D\uDCCB</div>
            <p className="text-lg font-medium text-[#e8e8ed]/70">No posts yet</p>
            <p className="mt-1 text-sm text-[#e8e8ed]/40">This user has not posted anything.</p>
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

