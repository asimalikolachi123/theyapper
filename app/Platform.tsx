"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import {
  Home, Compass, Search, Bell, MessageCircle, Bookmark, UserRound, Settings,
  Plus, ImagePlus, Heart, Repeat2, MessageSquare, Share2, MoreHorizontal,
  Sun, Moon, Send, ArrowLeft, Check, X, Sparkles, Users, Hash, Link2,
  Camera, LockKeyhole, Shield, SlidersHorizontal, LogOut, ChevronRight,
  CircleHelp, Layers, Globe, CheckCircle2, LoaderCircle, Trash2, Upload,
  Menu, AtSign, ExternalLink, BookmarkCheck, MessageSquareText, PenLine
} from "lucide-react";

type Profile = {
  id: string; username: string; display_name: string; bio?: string | null;
  avatar_url?: string | null; cover_url?: string | null; location?: string | null;
  website?: string | null; pronouns?: string | null; accent_color?: string | null;
  created_at?: string; updated_at?: string; followers_count?: number; following_count?: number;
};
type Post = {
  id: string; author_id: string; content: string; image_url?: string | null;
  image_urls?: string[] | null; context_tag?: string | null; context_url?: string | null;
  created_at: string; profiles?: Profile; likes_count?: number; replies_count?: number;
  liked?: boolean; saved?: boolean; reposted?: boolean;
};
type Notice = { id: string; kind: string; created_at: string; read_at?: string | null; actor?: Profile | null; post_id?: string | null };
type Props = { page: string; param?: string };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let sharedClient: SupabaseClient | null = null;
function getClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  if (!sharedClient) sharedClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  return sharedClient;
}
const timeAgo = (raw: string) => {
  const ms = Math.max(0, Date.now() - new Date(raw).getTime());
  if (ms < 60000) return "now";
  if (ms < 3600000) return Math.floor(ms / 60000) + "m";
  if (ms < 86400000) return Math.floor(ms / 3600000) + "h";
  if (ms < 604800000) return Math.floor(ms / 86400000) + "d";
  return new Date(raw).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
const titleFor = (page: string) => ({
  home: "Home", explore: "Explore", search: "Search", notifications: "Notifications",
  messages: "Messages", bookmarks: "Bookmarks", profile: "Profile", edit: "Edit profile",
  hashtag: "#" + (page === "hashtag" ? "topic" : ""), post: "Conversation",
  communities: "Topic Circles", community: "Community", create: "Create post",
  settings: "Settings", lists: "Your network", "notification-settings": "Notification settings"
} as Record<string,string>)[page] || "theYapper";
const navItems = [
  { href: "/", label: "Home", icon: Home }, { href: "/explore", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search }, { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/messages", label: "Messages", icon: MessageCircle }, { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/communities", label: "Topic Circles", icon: Users }
];

function Avatar({ profile, size = "md" }: { profile?: Profile | null; size?: "sm" | "md" | "lg" }) {
  const name = profile?.display_name || profile?.username || "Y";
  return <span className={"avatar avatar-" + size} style={profile?.accent_color ? { background: profile.accent_color + "20", color: profile.accent_color } : undefined}>
    {profile?.avatar_url ? <img src={profile.avatar_url} alt={name + " profile"} /> : name.trim().slice(0, 2).toUpperCase()}
  </span>;
}
function EmptyState({ icon: Icon = Sparkles, title, detail, action }: { icon?: any; title: string; detail: string; action?: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={22} /></span><h3>{title}</h3><p>{detail}</p>{action}</div>;
}
function PostCard({ post, onLike, onBookmark, onRepost, onReply, onOpen }: {
  post: Post; onLike: (p: Post) => void; onBookmark: (p: Post) => void;
  onRepost: (p: Post) => void; onReply: (p: Post) => void; onOpen: (p: Post) => void;
}) {
  const author = post.profiles;
  const images = post.image_urls?.length ? post.image_urls : (post.image_url ? [post.image_url] : []);
  return <article className="post-card">
    <a className="post-avatar-link" href={"/u/" + (author?.username || "")}><Avatar profile={author} /></a>
    <div className="post-body">
      <div className="post-topline">
        <a className="author-name" href={"/u/" + (author?.username || "")}>{author?.display_name || author?.username || "Member"}</a>
        <a className="author-handle" href={"/u/" + (author?.username || "")}>@{author?.username || "member"}</a>
        <span className="dot-sep">·</span><a className="post-time" href={"/post/" + post.id}>{timeAgo(post.created_at)}</a>
        <button className="quiet-icon more-action" aria-label="More post actions" onClick={() => onOpen(post)}><MoreHorizontal size={18}/></button>
      </div>
      {post.context_tag && post.context_tag !== "Open conversation" && <a className="context-chip" href="/explore"><Sparkles size={12}/>{post.context_tag}</a>}
      <div className="post-copy" onClick={() => onOpen(post)}>{renderPostText(post.content)}</div>
      {post.context_url && <a className="context-link" href={post.context_url} target="_blank" rel="noreferrer"><Link2 size={14}/><span>{post.context_url.replace(/^https?:\/\//, "").split("/")[0]}</span><ExternalLink size={12}/></a>}
      {images.length > 0 && <div className={"post-media media-count-" + Math.min(images.length, 4)}>{images.slice(0,4).map((src,i) => <a key={src + i} href={src} target="_blank" rel="noreferrer"><img src={src} alt={"Post image " + (i + 1)} loading="lazy" /></a>)}</div>}
      <div className="post-actions">
        <button onClick={() => onReply(post)} aria-label="Reply"><MessageSquare size={17}/><span>{post.replies_count || 0}</span></button>
        <button className={post.reposted ? "action-active" : ""} onClick={() => onRepost(post)} aria-label="Repost"><Repeat2 size={17}/><span>{post.reposted ? "Reposted" : "Repost"}</span></button>
        <button className={post.liked ? "liked" : ""} onClick={() => onLike(post)} aria-label="Like"><Heart size={17} fill={post.liked ? "currentColor" : "none"}/><span>{post.likes_count || 0}</span></button>
        <button className={post.saved ? "action-active" : ""} onClick={() => onBookmark(post)} aria-label="Bookmark"><Bookmark size={17} fill={post.saved ? "currentColor" : "none"}/></button>
        <button onClick={() => { void navigator.clipboard?.writeText(window.location.origin + "/post/" + post.id); }} aria-label="Copy post link"><Share2 size={16}/></button>
      </div>
    </div>
  </article>;
}
function renderPostText(text: string) {
  return (text || "").split(/([#@][a-zA-Z0-9_]+)/g).map((part, i) => {
    if (part.startsWith("#") && part.length > 1) return <a key={i} className="inline-tag" href={"/hashtag/" + encodeURIComponent(part.slice(1))} onClick={e => e.stopPropagation()}>{part}</a>;
    if (part.startsWith("@") && part.length > 1) return <a key={i} className="inline-mention" href={"/u/" + encodeURIComponent(part.slice(1))} onClick={e => e.stopPropagation()}>{part}</a>;
    return <span key={i}>{part}</span>;
  });
}

export default function Platform({ page, param = "" }: Props) {
  const client = getClient();
  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [notifications, setNotifications] = useState<Notice[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [dark, setDark] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [query, setQuery] = useState("");
  const [searchKind, setSearchKind] = useState("Posts");
  const [draft, setDraft] = useState("");
  const [intent, setIntent] = useState("Open conversation");
  const [contextUrl, setContextUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [replyDraft, setReplyDraft] = useState("");
  const [profileTarget, setProfileTarget] = useState<Profile | null>(null);
  const [edit, setEdit] = useState({ display_name: "", username: "", bio: "", location: "", website: "", pronouns: "", accent_color: "#6558e8", avatar_url: "", cover_url: "" });
  const [profileTab, setProfileTab] = useState("Posts");
  const [profileLikedIds, setProfileLikedIds] = useState<string[]>([]);
  const [messagePeople, setMessagePeople] = useState<Profile[]>([]);
  const [activeChat, setActiveChat] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [communityRows, setCommunityRows] = useState<any[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<any>(null);
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>([]);
  const [settingsTab, setSettingsTab] = useState("Account");
  const [noticeTab, setNoticeTab] = useState("All");
  const [savedCollection, setSavedCollection] = useState("All bookmarks");
  const [collectionName, setCollectionName] = useState("");
  const [collections, setCollections] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState({ likes:true, replies:true, follows:true, mentions:true, messages:true, community_activity:true });

  const say = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3200); };
  const hydrate = useCallback(async () => {
    if (!client) { setLoading(false); setErrorText("Supabase is not configured. Add the public project URL and publishable key in Vercel."); return; }
    setLoading(true); setErrorText("");
    const { data: sessionData } = await client.auth.getSession();
    const current = sessionData.session?.user || null; setUser(current);
    let followingNow: string[] = []; let bookmarksNow: string[] = [];
    if (current) {
      const [pr, fr, br, nr, cr, jr, prefs] = await Promise.all([
        client.from("profiles").select("*").eq("id", current.id).maybeSingle(),
        client.from("follows").select("following_id").eq("follower_id", current.id),
        client.from("bookmarks").select("post_id").eq("user_id", current.id),
        client.from("notifications").select("id,kind,created_at,read_at,post_id,actor:profiles!notifications_actor_id_fkey(id,username,display_name,avatar_url)").eq("recipient_id", current.id).order("created_at", { ascending: false }).limit(50),
        client.from("creator_collections").select("id,name,description,created_at").eq("owner_id", current.id).order("created_at", { ascending: false }),
        client.from("community_members").select("community_id").eq("user_id", current.id),
        client.from("notification_preferences").select("likes,replies,follows,mentions,messages,community_activity").eq("user_id", current.id).maybeSingle()
      ]);
      setMe(pr.data as Profile | null);
      followingNow = (fr.data || []).map((r: any) => r.following_id); bookmarksNow = (br.data || []).map((r: any) => r.post_id);
      setFollowing(followingNow); setSavedIds(bookmarksNow); setNotifications((nr.data || []) as any);
      setCollections(cr.data || []); setJoinedCommunityIds((jr.data || []).map((r: any) => r.community_id));
      if (prefs.data) setNotificationPrefs({ likes:prefs.data.likes, replies:prefs.data.replies, follows:prefs.data.follows, mentions:prefs.data.mentions, messages:prefs.data.messages, community_activity:prefs.data.community_activity });
    } else { setMe(null); setFollowing([]); setSavedIds([]); setNotifications([]); setCollections([]); setJoinedCommunityIds([]); }
    const [{ data: rawPosts, error: postsError }, { data: rawPeople }, { data: rawCommunities }] = await Promise.all([
      client.from("posts").select("id,author_id,content,image_url,image_urls,context_tag,context_url,created_at,profiles!posts_author_id_fkey(id,username,display_name,bio,avatar_url,cover_url,accent_color,created_at)").order("created_at", { ascending: false }).range(0, 29),
      client.from("profiles").select("id,username,display_name,bio,avatar_url,cover_url,accent_color,location,website,pronouns,created_at").order("created_at", { ascending: false }).limit(30),
      client.from("communities").select("id,slug,name,description,topic,created_at").order("created_at", { ascending: false }).limit(30)
    ]);
    if (postsError) { setErrorText(postsError.message); setPosts([]); }
    else {
      const rows = rawPosts || []; const ids = rows.map((p: any) => p.id);
      let likeRows: any[] = [], commentRows: any[] = [], repostRows: any[] = [];
      if (ids.length) {
        const [likes, replies, reposts] = await Promise.all([
          client.from("likes").select("post_id,user_id").in("post_id", ids),
          client.from("comments").select("post_id").in("post_id", ids),
          client.from("post_reposts").select("post_id,user_id").in("post_id", ids)
        ]);
        likeRows = likes.data || []; commentRows = replies.data || []; repostRows = reposts.data || [];
      }
      setPosts(rows.map((p: any) => ({
        ...p, profiles: p.profiles || null,
        likes_count: likeRows.filter((x: any) => x.post_id === p.id).length,
        replies_count: commentRows.filter((x: any) => x.post_id === p.id).length,
        liked: !!current && likeRows.some((x: any) => x.post_id === p.id && x.user_id === current.id),
        saved: bookmarksNow.includes(p.id),
        reposted: !!current && repostRows.some((x: any) => x.post_id === p.id && x.user_id === current.id)
      })));
    }
    setPeople(((rawPeople || []) as Profile[]).filter(p => p.id !== current?.id));
    setCommunityRows(rawCommunities || []);
    setLoading(false);
  }, [client]);

  useEffect(() => { void hydrate(); if (!client) return; const { data: { subscription } } = client.auth.onAuthStateChange(() => { window.setTimeout(() => void hydrate(), 0); }); return () => subscription.unsubscribe(); }, [client, hydrate]);
  useEffect(() => { try { setDark(window.localStorage.getItem("yapper-theme") === "dark"); } catch {} }, []);
  useEffect(() => { if (dark) { document.documentElement.dataset.theme = "dark"; } else { delete document.documentElement.dataset.theme; } try { window.localStorage.setItem("yapper-theme", dark ? "dark" : "light"); } catch {} }, [dark]);
  useEffect(() => { if (page !== "messages" || !client || !user) return; const channel = client.channel("messages-" + user.id).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload: any) => { const m = payload.new; if (m.sender_id === user.id || m.receiver_id === user.id) { setMessages(old => old.some(x => x.id === m.id) ? old : [...old, m]); void loadChats(); } }).subscribe(); return () => { void client.removeChannel(channel); }; }, [page, client, user?.id]);

  async function loadChats() {
    if (!client || !user) return;
    const { data, error } = await client.from("messages").select("id,sender_id,receiver_id,content,created_at,read_at").or("sender_id.eq." + user.id + ",receiver_id.eq." + user.id).order("created_at", { ascending: false }).limit(150);
    if (error) { say(error.message); return; }
    const rows = data || []; const ids = Array.from(new Set(rows.map((m: any) => m.sender_id === user.id ? m.receiver_id : m.sender_id)));
    const { data: profiles } = ids.length ? await client.from("profiles").select("id,username,display_name,avatar_url,accent_color").in("id", ids) : { data: [] as any[] };
    setMessagePeople((profiles || []) as Profile[]);
    const unread: Record<string, number> = {};
    rows.forEach((m: any) => { if (m.receiver_id === user.id && !m.read_at) unread[m.sender_id] = (unread[m.sender_id] || 0) + 1; });
    setUnreadCounts(unread);
    if (activeChat) await openChat(activeChat, false);
  }
  async function openChat(person: Profile, refreshList = true) {
    if (!client || !user) { setAuthMode("signin"); return; }
    setActiveChat(person);
    const { data, error } = await client.from("messages").select("id,sender_id,receiver_id,content,created_at,read_at").or("and(sender_id.eq." + user.id + ",receiver_id.eq." + person.id + "),and(sender_id.eq." + person.id + ",receiver_id.eq." + user.id + ")").order("created_at", { ascending: true }).limit(100);
    if (error) { say("Could not load this conversation: " + error.message); return; }
    setMessages(data || []);
    await client.from("messages").update({ read_at: new Date().toISOString() }).eq("sender_id", person.id).eq("receiver_id", user.id).is("read_at", null);
    if (refreshList) await loadChats();
  }
  async function sendMessage() {
    if (!client || !user || !activeChat || !messageDraft.trim()) return;
    const text = messageDraft.trim(); setMessageDraft("");
    const { data, error } = await client.from("messages").insert({ sender_id: user.id, receiver_id: activeChat.id, content: text }).select("id,sender_id,receiver_id,content,created_at,read_at").single();
    if (error) { setMessageDraft(text); say("Message not sent: " + error.message); return; }
    setMessages(old => old.some(m => m.id === data.id) ? old : [...old, data]); await loadChats();
  }
  async function authenticate() {
    if (!client) { say("Supabase is not configured."); return; }
    if (!email.trim() || !password) { say("Enter your email and password."); return; }
    setBusy(true);
    const result = authMode === "signup"
      ? await client.auth.signUp({ email: email.trim(), password, options: { data: { name: displayName.trim() || email.split("@")[0] } } })
      : await client.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) { say(result.error.message); return; }
    setAuthMode(null); say(authMode === "signup" ? "Account created. Follow any email confirmation steps." : "Welcome back."); await hydrate();
  }
  async function resetPassword() {
    if (!client || !email.trim()) { say("Enter your email address first."); return; }
    setBusy(true); const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + "/settings" }); setBusy(false);
    say(error ? error.message : "If that email is registered, a reset link has been sent.");
  }
  async function toggleLike(post: Post) {
    if (!client || !user) { setAuthMode("signin"); return; }
    const was = !!post.liked;
    setPosts(old => old.map(p => p.id === post.id ? { ...p, liked: !was, likes_count: Math.max(0, (p.likes_count || 0) + (was ? -1 : 1)) } : p));
    const { error } = was ? await client.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id) : await client.from("likes").insert({ post_id: post.id, user_id: user.id });
    if (error) { say(error.message); await hydrate(); }
  }
  async function toggleBookmark(post: Post) {
    if (!client || !user) { setAuthMode("signin"); return; }
    const was = savedIds.includes(post.id);
    const { error } = was ? await client.from("bookmarks").delete().eq("user_id", user.id).eq("post_id", post.id) : await client.from("bookmarks").insert({ user_id: user.id, post_id: post.id });
    if (error) { say(error.message); return; }
    setSavedIds(old => was ? old.filter(id => id !== post.id) : [...old, post.id]); setPosts(old => old.map(p => p.id === post.id ? { ...p, saved: !was } : p));
  }
  async function toggleRepost(post: Post) {
    if (!client || !user) { setAuthMode("signin"); return; }
    const was = !!post.reposted;
    const { error } = was ? await client.from("post_reposts").delete().eq("post_id", post.id).eq("user_id", user.id) : await client.from("post_reposts").insert({ post_id: post.id, user_id: user.id });
    if (error) { say(error.message); return; }
    setPosts(old => old.map(p => p.id === post.id ? { ...p, reposted: !was } : p)); say(was ? "Repost removed." : "Reposted to your profile.");
  }
  async function uploadToBucket(file: File, bucket: string, prefix: string) {
    if (!client || !user) { setAuthMode("signin"); throw new Error("Please sign in first."); }
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) throw new Error("Choose an image under 8 MB.");
    const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = user.id + "/" + prefix + "-" + crypto.randomUUID() + "." + extension;
    const { error } = await client.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  function selectImages(list: FileList | null) {
    const next = Array.from(list || []).slice(0, 4);
    if (next.some(f => !f.type.startsWith("image/") || f.size > 8 * 1024 * 1024)) { say("Each image must be an image file under 8 MB."); return; }
    setFiles(next); setPreviews(next.map(f => URL.createObjectURL(f)));
  }
  async function publishPost() {
    if (!client || !user) { setAuthMode("signin"); return; }
    if (!draft.trim() && files.length === 0) { say("Write something or attach an image first."); return; }
    if (draft.length > 500) { say("Posts can be up to 500 characters."); return; }
    setBusy(true); setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) uploaded.push(await uploadToBucket(file, "post-media", "post"));
      const tags = Array.from(new Set(Array.from(draft.matchAll(/#([a-zA-Z0-9_]{1,50})/g)).map(m => m[1].toLowerCase())));
      const mentions = Array.from(new Set(Array.from(draft.matchAll(/@([a-zA-Z0-9_]{3,24})/g)).map(m => m[1].toLowerCase())));
      const { data: post, error } = await client.from("posts").insert({
        author_id: user.id, content: draft.trim(), image_url: uploaded[0] || null,
        image_urls: uploaded, context_tag: intent, context_url: contextUrl.trim() || null
      }).select("id").single();
      if (error) throw error;
      if (tags.length) await client.from("post_hashtags").upsert(tags.map(tag => ({ post_id: post.id, hashtag: tag })), { onConflict: "post_id,hashtag", ignoreDuplicates: true });
      if (mentions.length) {
        const { data: mentioned } = await client.from("profiles").select("id,username").in("username", mentions);
        for (const profile of mentioned || []) if (profile.id !== user.id) await client.from("notifications").insert({ recipient_id: profile.id, actor_id: user.id, post_id: post.id, kind: "mention" });
      }
      setDraft(""); setContextUrl(""); setFiles([]); setPreviews([]); say("Your post is live."); await hydrate();
      if (page !== "home") window.location.href = "/";
    } catch (e: any) { say(e.message || "Could not publish this post."); }
    finally { setBusy(false); setUploading(false); }
  }
  async function toggleFollow(profile: Profile) {
    if (!client || !user) { setAuthMode("signin"); return; }
    if (profile.id === user.id) return;
    const was = following.includes(profile.id);
    const { error } = was ? await client.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id) : await client.from("follows").insert({ follower_id: user.id, following_id: profile.id });
    if (error) { say(error.message); return; }
    setFollowing(old => was ? old.filter(id => id !== profile.id) : [...old, profile.id]);
  }
  async function saveProfile() {
    if (!client || !user || !me) { say("Sign in to edit your profile."); return; }
    setBusy(true);
    const username = edit.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (username.length < 3 || username.length > 24) { setBusy(false); say("Username must be 3–24 characters."); return; }
    const { error } = await client.from("profiles").update({
      display_name: edit.display_name.trim() || username, username, bio: edit.bio.slice(0, 160),
      location: edit.location.trim() || null, website: edit.website.trim() || null,
      pronouns: edit.pronouns.trim() || null, accent_color: edit.accent_color,
      avatar_url: edit.avatar_url || null, cover_url: edit.cover_url || null
    }).eq("id", user.id);
    setBusy(false); if (error) { say(error.code === "23505" ? "That username is already taken." : error.message); return; }
    say("Profile updated."); await hydrate(); window.location.href = "/u/" + username;
  }
  async function openComments(post: Post) {
    if (!client) return;
    const { data, error } = await client.from("comments").select("id,content,created_at,author_id,profiles!comments_author_id_fkey(id,username,display_name,avatar_url)").eq("post_id", post.id).order("created_at", { ascending: true }).limit(100);
    if (error) say(error.message); setComments(data || []);
  }
  async function addReply(post: Post) {
    if (!client || !user) { setAuthMode("signin"); return; }
    if (!replyDraft.trim()) return;
    const { error } = await client.from("comments").insert({ post_id: post.id, author_id: user.id, content: replyDraft.trim() });
    if (error) { say(error.message); return; }
    setReplyDraft(""); await openComments(post); await hydrate(); say("Reply posted.");
  }
  async function saveNotificationPrefs() {
    if(!client || !user){setAuthMode("signin");return;}
    const {error}=await client.from("notification_preferences").upsert({user_id:user.id,...notificationPrefs,updated_at:new Date().toISOString()},{onConflict:"user_id"});
    if(error)say(error.message);else say("Notification preferences saved to your account.");
  }
  async function markNotificationsRead() {
    if (!client || !user) return;
    const { error } = await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).is("read_at", null);
    if (error) say(error.message); else setNotifications(old => old.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  }
  async function joinCommunity(c: any) {
    if (!client || !user) { setAuthMode("signin"); return; }
    const joined = joinedCommunityIds.includes(c.id);
    const { error } = joined ? await client.from("community_members").delete().eq("community_id", c.id).eq("user_id", user.id) : await client.from("community_members").insert({ community_id: c.id, user_id: user.id });
    if (error) { say(error.message); return; }
    setJoinedCommunityIds(old => joined ? old.filter(id => id !== c.id) : [...old, c.id]);
  }
  async function createCollection() {
    if (!client || !user || !collectionName.trim()) return;
    const { error } = await client.from("creator_collections").insert({ owner_id: user.id, name: collectionName.trim().slice(0, 60) });
    if (error) say(error.message); else { setCollectionName(""); await hydrate(); say("Collection created."); }
  }

  const allPosts = useMemo(() => {
    let result = posts;
    if (page === "home" && profileTab === "Following") result = result.filter(p => following.includes(p.author_id));
    if (page === "bookmarks") result = result.filter(p => savedIds.includes(p.id));
    if (page === "hashtag") result = result.filter(p => (p.content || "").toLowerCase().includes("#" + param.toLowerCase()));
    if (page === "profile" && profileTarget) {
      result = result.filter(p => p.author_id === profileTarget.id);
      if (profileTab === "Media") result = result.filter(p => (p.image_urls || []).length > 0 || p.image_url);
      if (profileTab === "Replies") result = [];
      if (profileTab === "Likes") result = posts.filter(p => profileLikedIds.includes(p.id));
    }
    if (page === "community" && activeCommunity) result = result.filter((p: any) => p.community_id === activeCommunity.id);
    return result;
  }, [posts, page, profileTab, following, savedIds, param, profileTarget, activeCommunity, profileLikedIds]);

  useEffect(() => {
    if (!client || !user || !["messages"].includes(page)) return;
    void loadChats();
  }, [client, user?.id, page]);

  useEffect(() => {
    if (!client || !param || !["profile", "community", "post", "messages"].includes(page)) return;
    if (page === "profile") {
      setProfileLikedIds([]);
      void client.from("profiles").select("*").eq("username", param).maybeSingle().then(async ({ data, error }) => {
        if (error) { say(error.message); setProfileTarget(null); return; }
        if (!data) { setProfileTarget(null); return; }
        const target = data as Profile;
        const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
          client.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", target.id),
          client.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", target.id)
        ]);
        const enriched = { ...target, followers_count: followersCount || 0, following_count: followingCount || 0 };
        setProfileTarget(enriched);
        const { data: likedRows, error: likedError } = await client.from("likes").select("post_id").eq("user_id", target.id).order("created_at", { ascending: false }).limit(100);
        if (!likedError) setProfileLikedIds((likedRows || []).map((row: any) => row.post_id));
        if (user?.id === target.id) setMe(enriched);
        if (user?.id === target.id) {
          setEdit({ display_name: data.display_name || "", username: data.username || "", bio: data.bio || "", location: data.location || "", website: data.website || "", pronouns: data.pronouns || "", accent_color: data.accent_color || "#6558e8", avatar_url: data.avatar_url || "", cover_url: data.cover_url || "" });
        }
      });
    }
    if (page === "community") void client.from("communities").select("*").eq("slug", param).maybeSingle().then(({ data }) => setActiveCommunity(data));
    if (page === "post") {
      void client.from("posts").select("id,author_id,content,image_url,image_urls,context_tag,context_url,created_at,profiles!posts_author_id_fkey(id,username,display_name,bio,avatar_url,cover_url,accent_color,created_at)").eq("id",param).maybeSingle().then(async ({data,error})=>{
        if(error){say(error.message);return;} if(!data){setDetailPost(null);return;}
        const row=data as any; const [{count:likes},{count:replies},{data:myLike},{data:mySave},{data:myRepost}]=await Promise.all([
          client.from("likes").select("*",{count:"exact",head:true}).eq("post_id",param),
          client.from("comments").select("*",{count:"exact",head:true}).eq("post_id",param),
          user?client.from("likes").select("post_id").eq("post_id",param).eq("user_id",user.id).maybeSingle():Promise.resolve({data:null}),
          user?client.from("bookmarks").select("post_id").eq("post_id",param).eq("user_id",user.id).maybeSingle():Promise.resolve({data:null}),
          user?client.from("post_reposts").select("post_id").eq("post_id",param).eq("user_id",user.id).maybeSingle():Promise.resolve({data:null})
        ]);
        setDetailPost({...row,likes_count:likes||0,replies_count:replies||0,liked:!!myLike,saved:!!mySave,reposted:!!myRepost} as Post); void openComments(row as Post);
      });
    }
    if (page === "messages" && user) {
      const target = people.find(p => p.username === param);
      if (target) void openChat(target);
    }
  }, [client, page, param, user?.id, people.length]);

  useEffect(() => {
    if(page !== "edit" || !me) return;
    setEdit({display_name:me.display_name||"",username:me.username||"",bio:me.bio||"",location:me.location||"",website:me.website||"",pronouns:me.pronouns||"",accent_color:me.accent_color||"#6558e8",avatar_url:me.avatar_url||"",cover_url:me.cover_url||""});
  }, [page,me?.id,me?.updated_at]);

  const unread = notifications.filter(n => !n.read_at).length;
  const currentProfile = page === "profile" ? profileTarget : me;
  const shownPosts = page === "search" ? posts.filter(p => (p.content || "").toLowerCase().includes(query.toLowerCase()) || (p.profiles?.username || "").toLowerCase().includes(query.toLowerCase())) : allPosts;
  const matchingPeople = people.filter(p => !query || (p.username + " " + p.display_name + " " + (p.bio || "")).toLowerCase().includes(query.toLowerCase())).slice(0, 12);
  const selectedPost = detailPost?.id === param ? detailPost : posts.find(p => p.id === param) || ({ id: param } as Post);
  const title = page === "hashtag" ? "#" + param : page === "profile" ? (profileTarget?.display_name || "Profile") : page === "community" ? (activeCommunity?.name || "Topic Circle") : titleFor(page);

  return <div className="app-frame">
    <aside className="left-sidebar">
      <a className="brand" href="/" aria-label="theYapper home"><span className="brand-symbol">y</span><span>theYapper<span className="brand-period">.</span></span></a>
      <nav className="desktop-nav" aria-label="Main navigation">
        {navItems.map(item => { const Icon = item.icon; const active = (page === "home" && item.href === "/") || item.href.slice(1) === page; return <a key={item.href} className={"nav-link" + (active ? " nav-link-active" : "")} href={item.href}><Icon size={20}/><span>{item.label}</span>{item.label === "Notifications" && unread > 0 && <i className="unread-dot"/>}</a>; })}
        <a className={"nav-link" + (page === "lists" ? " nav-link-active" : "")} href="/lists"><Users size={20}/><span>Your network</span></a>
        <a className={"nav-link" + (page === "settings" ? " nav-link-active" : "")} href="/settings"><Settings size={20}/><span>Settings</span></a>
      </nav>
      <a className="compose-nav" href="/create"><Plus size={19}/> Create post</a>
      <div className="sidebar-spacer"/>
      <button className="theme-toggle" onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}<span>{dark ? "Light appearance" : "Dark appearance"}</span></button>
      {user ? <a className="account-mini" href={me ? "/u/" + me.username : "/edit-profile"}><Avatar profile={me}/><span><b>{me?.display_name || user.email}</b><small>@{me?.username || user.email?.split("@")[0]}</small></span><ChevronRight size={16}/></a> : <button className="account-mini" onClick={() => setAuthMode("signin")}><Avatar/><span><b>Welcome to theYapper</b><small>Sign in to join in</small></span><ChevronRight size={16}/></button>}
    </aside>

    <main className="main-column">
      <header className="mobile-topbar">
        <button className="icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={20}/></button>
        <a className="brand brand-small" href="/"><span className="brand-symbol">y</span><span>theYapper<span className="brand-period">.</span></span></a>
        <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
      </header>
      {menuOpen && <div className="mobile-menu">{navItems.map(item => <a href={item.href} key={item.href}>{item.label}</a>)}<a href="/settings">Settings</a></div>}
      <header className="page-heading">
        <div>{page !== "home" && <a href="/" className="back-link"><ArrowLeft size={16}/> Back to Home</a>}<h1>{title}</h1><p>{page === "home" ? "Good conversations start here." : page === "explore" ? "Find people and ideas worth your attention." : page === "search" ? "Search people, posts and hashtags." : page === "messages" ? "Private conversations, kept private." : page === "notifications" ? "A thoughtful recap of what matters." : page === "communities" ? "Small circles. Better conversations." : "Your space, your pace."}</p></div>
        {page === "notifications" && <button className="outline-button small" onClick={() => void markNotificationsRead()}><Check size={15}/> Mark all read</button>}
      </header>

      {page === "home" && <><div className="feed-switch"><a className={profileTab === "For you" ? "selected" : ""} href="/" onClick={() => setProfileTab("For you")}>For you</a><button className={profileTab === "Following" ? "selected" : ""} onClick={() => setProfileTab("Following")}>Following</button></div><section className="composer">
        <Avatar profile={me} size="lg"/><div className="composer-content"><textarea aria-label="Write a post" placeholder={user ? "What would you like to yap about?" : "Join the conversation — sign in to post"} value={draft} maxLength={500} onChange={e => setDraft(e.target.value)}/>
        {contextUrl && <div className="context-preview"><Link2 size={14}/>{contextUrl}<button onClick={() => setContextUrl("")} aria-label="Remove context link"><X size={14}/></button></div>}
        {previews.length > 0 && <div className="composer-previews">{previews.map((src,i) => <div key={src}><img src={src} alt={"Preview " + (i + 1)}/><button onClick={() => { setFiles(old => old.filter((_,n) => n !== i)); setPreviews(old => old.filter((_,n) => n !== i)); }} aria-label="Remove image"><X size={14}/></button></div>)}</div>}
        <div className="composer-settings"><label>Conversation type <select value={intent} onChange={e => setIntent(e.target.value)}><option>Open conversation</option><option>Need advice</option><option>Teach me</option><option>Respectful debate</option><option>Just sharing</option><option>Build together</option></select></label><span>{draft.length}/500</span></div>
        <div className="composer-footer"><div className="composer-tools"><label className="tool-button"><ImagePlus size={17}/><span>Media</span><input type="file" accept="image/*" multiple hidden onChange={e => selectImages(e.target.files)}/></label><button className="tool-button" onClick={() => { const value = window.prompt("Add a source or context URL"); if (value && /^https?:\/\//i.test(value)) setContextUrl(value); else if (value) say("Use a full http:// or https:// URL."); }}><Link2 size={17}/><span>Context</span></button></div><button className="primary-button" disabled={busy || (!draft.trim() && files.length === 0)} onClick={() => void publishPost()}>{uploading ? <LoaderCircle size={16} className="spin"/> : <PenLine size={16}/>} Publish</button></div></div>
      </section><div className="section-label"><span>Latest conversations</span><span className="label-note"><Globe size={13}/> Real community posts</span></div><Feed posts={shownPosts} loading={loading} errorText={errorText} onLike={toggleLike} onBookmark={toggleBookmark} onRepost={toggleRepost} onReply={(p: Post) => { window.location.href = "/post/" + p.id; }} onOpen={(p: Post) => { window.location.href = "/post/" + p.id; }} onRetry={() => void hydrate()}/></>}

      {page === "explore" && <><section className="explore-banner"><span className="eyebrow"><Sparkles size={13}/> FIND YOUR NEXT GOOD IDEA</span><h2>Curiosity lives here.</h2><p>Explore thoughtful conversations by topic, not just by popularity.</p><a className="primary-button" href="/search"><Search size={16}/> Search the community</a></section><section className="topic-grid">{["Technology","Startups","Education","Gaming","Art & design","Science","Books","Wellbeing"].map((topic,i)=><a href={"/hashtag/" + encodeURIComponent(topic.toLowerCase().replace(/[^a-z0-9]+/g,""))} className="topic-tile" key={topic}><span className={"topic-symbol topic-symbol-" + (i%4)}>{["⌘","↗","✦","◉","✎","∿","▤","◎"][i]}</span><span><b>{topic}</b><small>Explore #{topic.toLowerCase().replace(/[^a-z0-9]+/g,"")}</small></span><ChevronRight size={17}/></a>)}</section><div className="section-label"><span>Creators to know</span><a href="/lists">View your network</a></div><PeopleList people={matchingPeople.slice(0,8)} following={following} onFollow={toggleFollow} onMessage={(p: Profile) => { window.location.href = "/messages/" + p.username; }}/><div className="section-label"><span>Recent conversations</span></div><Feed posts={shownPosts} loading={loading} errorText={errorText} onLike={toggleLike} onBookmark={toggleBookmark} onRepost={toggleRepost} onReply={(p: Post) => { window.location.href = "/post/" + p.id; }} onOpen={(p: Post) => { window.location.href = "/post/" + p.id; }} onRetry={() => void hydrate()}/></>}

      {page === "search" && <section className="search-page"><form className="search-form" onSubmit={e => { e.preventDefault(); }}><Search size={19}/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search people, posts, #topics..." aria-label="Search theYapper"/><button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={17}/></button></form><div className="search-tabs">{["Posts","People","Hashtags","Communities"].map(tab => <button className={searchKind===tab ? "selected" : ""} key={tab} onClick={() => setSearchKind(tab)}>{tab}</button>)}</div>{query.trim() ? searchKind === "People" ? <PeopleList people={matchingPeople} following={following} onFollow={toggleFollow} onMessage={(p: Profile) => { window.location.href = "/messages/" + p.username; }}/> : searchKind === "Hashtags" ? <div className="hashtag-results">{Array.from(new Set(posts.flatMap(p => Array.from((p.content || "").matchAll(/#([a-zA-Z0-9_]+)/g)).map(m => m[1])))).filter(tag => tag.toLowerCase().includes(query.replace(/^#/,"").toLowerCase())).map(tag => <a href={"/hashtag/" + tag} key={tag}><Hash size={18}/><span><b>#{tag}</b><small>Posts from the community</small></span><ChevronRight size={17}/></a>)}</div> : searchKind === "Communities" ? <CommunityList rows={communityRows.filter(c => (c.name + " " + c.topic + " " + c.description).toLowerCase().includes(query.toLowerCase()))} joined={joinedCommunityIds} onJoin={joinCommunity}/> : <Feed posts={shownPosts.filter(p => (p.content || "").toLowerCase().includes(query.toLowerCase()) || (p.profiles?.username || "").toLowerCase().includes(query.toLowerCase()))} loading={loading} errorText={errorText} onLike={toggleLike} onBookmark={toggleBookmark} onRepost={toggleRepost} onReply={(p: Post) => { window.location.href = "/post/" + p.id; }} onOpen={(p: Post) => { window.location.href = "/post/" + p.id; }} onRetry={() => void hydrate()}/> : <EmptyState icon={Search} title="Start with a word or topic" detail="Search uses posts and accounts that actually exist in theYapper database."/>}</section>}

      {page === "notifications" && <><div className="segmented-tabs">{["All","Mentions","Follows","Replies"].map(t => <button key={t} className={noticeTab===t?"active":""} onClick={() => setNoticeTab(t)}>{t}</button>)}</div>{!user ? <AuthPrompt onSignIn={() => setAuthMode("signin")}/> : notifications.filter(n => noticeTab==="All" || (noticeTab==="Mentions" ? n.kind==="mention" : noticeTab==="Follows" ? n.kind==="follow" : ["comment","reply"].includes(n.kind))).length ? <div className="notification-list">{notifications.filter(n => noticeTab==="All" || (noticeTab==="Mentions" ? n.kind==="mention" : noticeTab==="Follows" ? n.kind==="follow" : ["comment","reply"].includes(n.kind))).map(n => <a className={"notification-row" + (!n.read_at?" notification-unread":"")} key={n.id} href={n.post_id ? "/post/" + n.post_id : n.actor ? "/u/" + n.actor.username : "/notifications"}><Avatar profile={n.actor} size="sm"/><div><p><b>{n.actor?.display_name || n.actor?.username || "Someone"}</b> {notificationLabel(n.kind)}</p><small>{timeAgo(n.created_at)} ago</small></div><span className="notification-mark">{!n.read_at ? <i/> : <Check size={14}/>}</span></a>)}</div> : <EmptyState icon={Bell} title="All caught up" detail="When someone interacts with your posts or follows you, you’ll see it here."/>}</>}

      {page === "messages" && <div className="messages-layout"><aside className="conversation-sidebar"><div className="conversation-title"><b>Inbox</b><button className="icon-button" aria-label="New message" onClick={() => { window.location.href = "/lists"; }}><Plus size={17}/></button></div><input className="conversation-search" placeholder="Find a conversation…" onChange={e => setQuery(e.target.value)}/>{messagePeople.filter(p => (p.display_name + " " + p.username).toLowerCase().includes(query.toLowerCase())).map(p => <button key={p.id} className={"conversation-person" + (activeChat?.id===p.id?" current":"")} onClick={() => void openChat(p)}><Avatar profile={p}/><span><b>{p.display_name}</b><small>@{p.username}</small></span>{unreadCounts[p.id] ? <i className="unread-count">{unreadCounts[p.id]}</i> : null}</button>)}{!messagePeople.length && <p className="muted-note">Your conversations will appear here.</p>}</aside><section className="chat-panel">{activeChat ? <><header className="chat-header"><Avatar profile={activeChat} size="sm"/><span><b>{activeChat.display_name}</b><small>@{activeChat.username}</small></span><a className="icon-button" href={"/u/" + activeChat.username} aria-label="View profile"><UserRound size={17}/></a></header><div className="chat-messages">{messages.filter(m => (m.sender_id===user?.id&&m.receiver_id===activeChat.id)||(m.sender_id===activeChat.id&&m.receiver_id===user?.id)).map(m => <div key={m.id} className={"message-bubble" + (m.sender_id===user?.id?" message-mine":"")}><p>{m.content}</p><small>{timeAgo(m.created_at)}{m.sender_id===user?.id&&m.read_at?" · Read":""}</small></div>)}</div><form className="chat-composer" onSubmit={e => { e.preventDefault(); void sendMessage(); }}><input value={messageDraft} onChange={e => setMessageDraft(e.target.value)} placeholder="Write a message…" aria-label="Message text"/><button className="primary-button" disabled={!messageDraft.trim()}><Send size={16}/><span>Send</span></button></form></> : <EmptyState icon={MessageCircle} title="Your conversations, in one place" detail="Choose someone from your inbox to start or continue a private conversation."/>}</section></div>}

      {page === "bookmarks" && <><div className="collection-toolbar"><label><Bookmark size={16}/> Saved posts <select value={savedCollection} onChange={e => setSavedCollection(e.target.value)}><option>All bookmarks</option>{collections.map(c => <option key={c.id}>{c.name}</option>)}</select></label><form onSubmit={e => { e.preventDefault(); void createCollection(); }}><input value={collectionName} onChange={e => setCollectionName(e.target.value)} placeholder="New collection"/><button className="outline-button" disabled={!collectionName.trim()}><Plus size={15}/> Create</button></form></div>{savedIds.length ? <Feed posts={shownPosts} loading={loading} errorText={errorText} onLike={toggleLike} onBookmark={toggleBookmark} onRepost={toggleRepost} onReply={(p: Post) => { window.location.href = "/post/" + p.id; }} onOpen={(p: Post) => { window.location.href = "/post/" + p.id; }} onRetry={() => void hydrate()}/> : <EmptyState icon={Bookmark} title="Keep the good stuff close" detail="Bookmark a post to save it here. Create collections to organize ideas you want to return to."/>}</>}

      {page === "profile" && currentProfile && <><section className="profile-cover" style={currentProfile.cover_url ? { backgroundImage: "url(" + currentProfile.cover_url + ")" } : undefined}><span> </span></section><section className="profile-intro"><div className="profile-avatar-line"><Avatar profile={currentProfile} size="lg"/>{user?.id===currentProfile.id ? <a className="outline-button" href="/edit-profile"><PenLine size={15}/> Edit profile</a> : <div className="profile-actions"><button className="outline-button" onClick={() => void toggleFollow(currentProfile)}>{following.includes(currentProfile.id) ? "Following" : "Follow"}</button><a className="icon-button" href={"/messages/" + currentProfile.username} aria-label="Message"><MessageCircle size={17}/></a></div>}</div><h2>{currentProfile.display_name}</h2><p className="profile-handle">@{currentProfile.username}{currentProfile.pronouns ? " · " + currentProfile.pronouns : ""}</p><p className="profile-bio">{currentProfile.bio || "A new voice in theYapper community."}</p><div className="profile-links">{currentProfile.location && <span><Globe size={14}/>{currentProfile.location}</span>}{currentProfile.website && <a href={currentProfile.website} target="_blank" rel="noreferrer"><Link2 size={14}/>{currentProfile.website.replace(/^https?:\/\//,"")}</a>}<span>Joined {currentProfile.created_at ? new Date(currentProfile.created_at).toLocaleDateString(undefined,{month:"long",year:"numeric"}) : "the community"}</span></div><div className="profile-stats"><a href={"/lists?tab=followers&user=" + currentProfile.username}><b>{currentProfile.followers_count ?? 0}</b> Followers</a><a href={"/lists?tab=following&user=" + currentProfile.username}><b>{currentProfile.following_count || 0}</b> Following</a></div></section><div className="profile-tabs">{["Posts","Replies","Media","Likes"].map(t=><button key={t} className={profileTab===t?"selected":""} onClick={()=>setProfileTab(t)}>{t}</button>)}</div><Feed posts={shownPosts} loading={loading} errorText={errorText} onLike={toggleLike} onBookmark={toggleBookmark} onRepost={toggleRepost} onReply={(p: Post) => { window.location.href = "/post/" + p.id; }} onOpen={(p: Post) => { window.location.href = "/post/" + p.id; }} onRetry={() => void hydrate()}/></>}
      {page === "profile" && !currentProfile && <EmptyState icon={UserRound} title="Profile not found" detail="This username may not exist, or the profile could not be loaded."/>}

      {page === "edit" && <section className="settings-content"><div className="edit-photo-row"><div className="cover-edit" style={edit.cover_url?{backgroundImage:"url("+edit.cover_url+")"}:undefined}><label className="upload-cover"><Camera size={16}/> Change cover<input type="file" accept="image/*" hidden onChange={async e=>{const f=e.target.files?.[0];if(!f)return;setUploading(true);try{const url=await uploadToBucket(f,"profile-media","cover");setEdit(old=>({...old,cover_url:url}));}catch(err:any){say(err.message);}finally{setUploading(false);}}}/></label></div><div className="avatar-edit-row"><Avatar profile={{...me,...edit} as Profile} size="lg"/><label className="outline-button upload-avatar"><Camera size={15}/> Change photo<input type="file" accept="image/*" hidden onChange={async e=>{const f=e.target.files?.[0];if(!f)return;setUploading(true);try{const url=await uploadToBucket(f,"profile-media","avatar");setEdit(old=>({...old,avatar_url:url}));}catch(err:any){say(err.message);}finally{setUploading(false);}}}/></label></div></div><div className="form-grid"><label>Display name<input value={edit.display_name} maxLength={50} onChange={e=>setEdit({...edit,display_name:e.target.value})}/></label><label>Username<input value={edit.username} maxLength={24} onChange={e=>setEdit({...edit,username:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"")})}/><small>3–24 letters, numbers or underscores</small></label><label className="span-two">Bio<textarea value={edit.bio} maxLength={160} onChange={e=>setEdit({...edit,bio:e.target.value})}/><small>{edit.bio.length}/160</small></label><label>Location (optional)<input value={edit.location} onChange={e=>setEdit({...edit,location:e.target.value})}/></label><label>Website (optional)<input value={edit.website} onChange={e=>setEdit({...edit,website:e.target.value})} placeholder="https://"/></label><label>Pronouns (optional)<input value={edit.pronouns} onChange={e=>setEdit({...edit,pronouns:e.target.value})}/></label><label>Profile accent<input type="color" value={edit.accent_color} onChange={e=>setEdit({...edit,accent_color:e.target.value})}/></label></div><div className="form-actions"><a className="outline-button" href={me?"/u/"+me.username:"/"}>Cancel</a><button className="primary-button" disabled={busy||uploading} onClick={()=>void saveProfile()}>{busy?"Saving…":"Save profile"}</button></div></section>}

      {page === "post" && <section className="post-detail">{selectedPost.id && posts.some(p=>p.id===selectedPost.id) ? <PostCard post={selectedPost} onLike={toggleLike} onBookmark={toggleBookmark} onRepost={toggleRepost} onReply={() => document.getElementById("reply-box")?.focus()} onOpen={() => {}}/> : <EmptyState icon={MessageSquareText} title="Conversation" detail="The original post will appear here if it is available to your account."/>}<div className="reply-composer"><Avatar profile={me}/><form onSubmit={e=>{e.preventDefault();void addReply(selectedPost);}}><textarea id="reply-box" value={replyDraft} onChange={e=>setReplyDraft(e.target.value)} placeholder={user?"Add your reply…":"Sign in to reply"} maxLength={1000}/><button className="primary-button" disabled={!replyDraft.trim()}>Reply</button></form></div><div className="replies-list">{comments.map(c=><article className="reply-row" key={c.id}><Avatar profile={c.profiles}/><div><div className="reply-meta"><a href={"/u/"+c.profiles?.username}>{c.profiles?.display_name || c.profiles?.username || "Member"}</a><small>@{c.profiles?.username} · {timeAgo(c.created_at)}</small></div><p>{c.content}</p></div></article>)}</div></section>}

      {page === "hashtag" && <><section className="hashtag-hero"><span className="hashtag-mark"><Hash size={24}/></span><div><span className="eyebrow">TOPIC</span><h2>#{param}</h2><p>Conversations using this hashtag, from real posts.</p></div></section><Feed posts={shownPosts} loading={loading} errorText={errorText} onLike={toggleLike} onBookmark={toggleBookmark} onRepost={toggleRepost} onReply={(p: Post) => { window.location.href = "/post/" + p.id; }} onOpen={(p: Post) => { window.location.href = "/post/" + p.id; }} onRetry={() => void hydrate()}/></>}

      {page === "communities" && <><section className="explore-banner"><span className="eyebrow"><Users size={13}/> TOPIC CIRCLES</span><h2>Find your people.</h2><p>Join a smaller room for deeper conversations. Membership and posts are stored in your community database.</p></section><CommunityList rows={communityRows} joined={joinedCommunityIds} onJoin={joinCommunity} onOpen={(c: any)=>{window.location.href="/community/"+c.slug;}}/><div className="create-community"><h3>Start a Topic Circle</h3><p>Create a community around a shared interest. Be clear about its topic and rules.</p><form onSubmit={async e=>{e.preventDefault();if(!client||!user){setAuthMode("signin");return;}const fd=new FormData(e.currentTarget);const name=String(fd.get("name")||"").trim();const topic=String(fd.get("topic")||"").trim();const description=String(fd.get("description")||"").trim();const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");if(!name||!topic||!slug)return;const {error}=await client.from("communities").insert({name,slug,topic,description,created_by:user.id});if(error)say(error.message);else{say("Topic Circle created.");await hydrate();}}}><input name="name" required maxLength={50} placeholder="Circle name"/><input name="topic" required maxLength={40} placeholder="Topic"/><textarea name="description" maxLength={240} placeholder="What will members talk about?"/><button className="primary-button"><Plus size={16}/> Create circle</button></form></div></>}

      {page === "community" && activeCommunity && <><section className="community-hero"><span className="topic-symbol topic-symbol-2"><Users size={24}/></span><h2>{activeCommunity.name}</h2><p>{activeCommunity.description || "A Topic Circle for shared interests and thoughtful discussion."}</p><span className="context-chip">{activeCommunity.topic}</span><button className="primary-button" onClick={()=>void joinCommunity(activeCommunity)}>{joinedCommunityIds.includes(activeCommunity.id)?"Joined":"Join circle"}</button></section><section className="composer community-composer"><Avatar profile={me}/><div className="composer-content"><textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Share something with this circle…"/><button className="primary-button" disabled={!draft.trim()||!user} onClick={async()=>{if(!client||!user){setAuthMode("signin");return;}const {error}=await client.from("posts").insert({author_id:user.id,content:draft.trim(),community_id:activeCommunity.id});if(error)say(error.message);else{setDraft("");say("Posted to the circle.");await hydrate();}}}>Post to circle</button></div></section><Feed posts={shownPosts} loading={loading} errorText={errorText} onLike={toggleLike} onBookmark={toggleBookmark} onRepost={toggleRepost} onReply={(p: Post)=>{window.location.href="/post/"+p.id;}} onOpen={(p: Post)=>{window.location.href="/post/"+p.id;}} onRetry={()=>void hydrate()}/></>}
      {page === "community" && !activeCommunity && <EmptyState icon={Users} title="Circle not found" detail="Explore Topic Circles to discover communities that exist." action={<a className="primary-button" href="/communities">Explore circles</a>}/>}

      {page === "create" && <section className="create-page"><div className="create-page-intro"><span className="eyebrow"><PenLine size={13}/> NEW CONVERSATION</span><h2>Make it worth a reply.</h2><p>Share a thought, ask a question, or add context that helps others understand.</p></div><Avatar profile={me} size="lg"/><textarea className="create-large-textarea" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={500} placeholder="What's on your mind? Use @mentions and #hashtags to connect ideas."/><div className="composer-settings"><label>Conversation type <select value={intent} onChange={e=>setIntent(e.target.value)}><option>Open conversation</option><option>Need advice</option><option>Teach me</option><option>Respectful debate</option><option>Just sharing</option><option>Build together</option></select></label><span>{draft.length}/500</span></div><label className="context-field">Source or context URL (optional)<input value={contextUrl} onChange={e=>setContextUrl(e.target.value)} placeholder="https://source.example/article"/></label><label className="upload-drop"><Upload size={20}/><b>Add up to four images</b><span>JPG, PNG, WebP or GIF · up to 8 MB each</span><input type="file" accept="image/*" multiple hidden onChange={e=>selectImages(e.target.files)}/></label>{previews.length>0&&<div className="composer-previews">{previews.map((src,i)=><div key={src}><img src={src} alt={"Preview "+(i+1)}/><button onClick={()=>{setFiles(old=>old.filter((_,n)=>n!==i));setPreviews(old=>old.filter((_,n)=>n!==i));}}><X size={14}/></button></div>)}</div>}<div className="form-actions"><a href="/" className="outline-button">Cancel</a><button className="primary-button" disabled={busy||(!draft.trim()&&!files.length)} onClick={()=>void publishPost()}>{busy?"Publishing…":"Publish post"}</button></div></section>}

      {page === "settings" && <section className="settings-layout"><aside className="settings-menu">{["Account","Privacy","Security","Appearance","Accessibility","Blocked accounts"].map(t=><button key={t} className={settingsTab===t?"active":""} onClick={()=>setSettingsTab(t)}>{t}</button>)}<a href="/notification-settings">Notification settings <ChevronRight size={15}/></a></aside><div className="settings-content"><h2>{settingsTab}</h2>{settingsTab==="Appearance" ? <><div className="setting-row"><div><b>Theme</b><small>Choose how theYapper looks on this device.</small></div><button className="outline-button" onClick={()=>setDark(!dark)}>{dark?<Sun size={16}/>:<Moon size={16}/>} {dark?"Light mode":"Dark mode"}</button></div><div className="setting-row"><div><b>Profile accent</b><small>Your profile accent is shown on your profile and avatar.</small></div><a className="outline-button" href="/edit-profile">Customize</a></div></> : settingsTab==="Account" ? <><div className="setting-row"><div><b>Profile information</b><small>Update your display name, username, bio and links.</small></div><a href="/edit-profile" className="outline-button">Edit profile</a></div><div className="setting-row"><div><b>Signed in as</b><small>{user?.email || "Not signed in"}</small></div>{user&&<button className="outline-button" onClick={async()=>{await client?.auth.signOut();setUser(null);say("Signed out.");}}><LogOut size={15}/> Sign out</button>}</div></> : settingsTab==="Privacy" ? <><div className="setting-row"><div><b>Direct messages</b><small>Only signed-in users can send messages. Conversation access is restricted by database policies.</small></div><LockKeyhole size={18}/></div><div className="setting-row"><div><b>Mentions and tags</b><small>Public mentions currently create notifications. Fine-grained mention controls require additional database preferences.</small></div><Shield size={18}/></div></> : settingsTab==="Security" ? <><div className="setting-row"><div><b>Password reset</b><small>Receive a secure password reset email.</small></div><button className="outline-button" onClick={()=>void resetPassword()}>Send reset link</button></div><div className="setting-row"><div><b>Session</b><small>Sign out on this device.</small></div><button className="outline-button" onClick={async()=>{await client?.auth.signOut();setUser(null);say("Signed out.");}}>Sign out</button></div></> : settingsTab==="Accessibility" ? <><div className="setting-row"><div><b>Reduce motion</b><small>Use the operating system preference for reduced motion.</small></div><CheckCircle2 size={18}/></div><div className="setting-row"><div><b>Keyboard and contrast</b><small>All main actions have labels and visible focus states.</small></div><CircleHelp size={18}/></div></> : <EmptyState icon={Shield} title="No blocked accounts listed" detail="Account blocking and reporting workflows need moderation controls before they can be safely enabled."/>}</div></section>}

      {page === "notification-settings" && <section className="settings-content"><p className="settings-lede">Choose what deserves your attention. Preferences are saved to your account.</p>{([{key:"likes",label:"Likes",detail:"When someone likes your post."},{key:"replies",label:"Replies",detail:"When someone replies to you."},{key:"follows",label:"Follows",detail:"When a new person follows you."},{key:"mentions",label:"Mentions",detail:"When someone mentions your username."},{key:"messages",label:"Messages",detail:"When a new direct message arrives."},{key:"community_activity",label:"Community activity",detail:"When a circle you joined has activity."}] as const).map(item=><div className="setting-row" key={item.key}><div><b>{item.label}</b><small>{item.detail}</small></div><label className="switch"><input type="checkbox" checked={notificationPrefs[item.key]} onChange={e=>setNotificationPrefs(old=>({...old,[item.key]:e.target.checked}))}/><span/></label></div>)}<button className="primary-button" onClick={()=>void saveNotificationPrefs()}>Save preferences</button></section>}

      {page === "lists" && <><div className="section-label"><span>People you may know</span><span className="label-note">From real profiles</span></div><PeopleList people={matchingPeople} following={following} onFollow={toggleFollow} onMessage={(p: Profile)=>{window.location.href="/messages/"+p.username;}}/></>}
      <footer className="main-footer"><a href="/settings">Privacy</a><a href="/settings">Settings</a><span>theYapper · Better conversations</span></footer>
    </main>

    <aside className="right-sidebar">
      <a className="sidebar-search" href="/search"><Search size={17}/><span>Search theYapper</span><kbd>/</kbd></a>
      <section className="right-card welcome-card"><span className="eyebrow"><Sparkles size={13}/> THE YAPPER DIFFERENCE</span><h2>Less noise.<br/>More meaning.</h2><p>Find your people through ideas, not outrage. Join a Topic Circle or start a thoughtful conversation.</p><a className="primary-button full-button" href="/communities">Explore Topic Circles <ChevronRight size={16}/></a></section>
      <section className="right-card"><div className="right-card-heading"><h3>People to follow</h3><a href="/lists">See all</a></div><PeopleList people={people.slice(0,4)} following={following} onFollow={toggleFollow} compact onMessage={(p: Profile)=>{window.location.href="/messages/"+p.username;}}/></section>
      <section className="right-card"><div className="right-card-heading"><h3>Explore topics</h3><a href="/explore">Discover</a></div><div className="trending-list">{["technology","startups","education","design"].map((tag,i)=><a href={"/hashtag/"+tag} key={tag}><span><small>TOPIC {i+1}</small><b>#{tag}</b></span><Hash size={16}/></a>)}</div></section>
      <div className="sidebar-foot"><a href="/settings">About</a><a href="/settings">Privacy</a><a href="/settings">Guidelines</a><span>© {new Date().getFullYear()} theYapper</span></div>
    </aside>

    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">{[{href:"/",label:"Home",icon:Home},{href:"/search",label:"Search",icon:Search},{href:"/create",label:"Create",icon:Plus},{href:"/notifications",label:"Alerts",icon:Bell},{href:"/messages",label:"Messages",icon:MessageCircle}].map(item=>{const Icon=item.icon;const active=(page==="home"&&item.label==="Home")||page===item.label.toLowerCase()||(page==="notifications"&&item.label==="Alerts");return <a href={item.href} key={item.href} className={active?"active":""}><Icon size={20}/><span>{item.label}</span>{item.label==="Alerts"&&unread>0?<i className="mobile-unread"/>:null}</a>;})}</nav>

    {authMode && <div className="modal-backdrop" role="presentation" onClick={() => setAuthMode(null)}><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setAuthMode(null)} aria-label="Close"><X size={19}/></button><span className="brand-symbol modal-brand">y</span><h2 id="auth-title">{authMode==="signup"?"Find your people.":"Welcome back."}</h2><p>{authMode==="signup"?"Create your account and join a better conversation.":"Sign in to pick up where you left off."}</p><form onSubmit={e=>{e.preventDefault();void authenticate();}}>{authMode==="signup"&&<label>Display name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="How people will know you" maxLength={50}/></label>}<label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" required minLength={6} autoComplete={authMode==="signup"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label><button className="primary-button full-button" disabled={busy}>{busy?"Please wait…":authMode==="signup"?"Create account":"Sign in"}</button></form>{authMode==="signin"&&<button className="text-link" onClick={()=>void resetPassword()}>Forgot password?</button>}<div className="auth-switch">{authMode==="signup"?"Already have an account?":"New to theYapper?"} <a href={authMode==="signup"?"/login":"/signup"}>{authMode==="signup"?"Sign in":"Create account"}</a></div></section></div>}
    {toast && <div className="toast-message" role="status">{toast}</div>}
  </div>;
}

function Feed({ posts, loading, errorText, onLike, onBookmark, onRepost, onReply, onOpen, onRetry }: any) {
  if (loading) return <div className="loading-stack">{[1,2,3].map(n=><div className="skeleton-post" key={n}><span/><div><i/><i/><b/></div></div>)}</div>;
  if (errorText) return <EmptyState icon={CircleHelp} title="Could not load this page" detail={errorText} action={<button className="outline-button" onClick={onRetry}>Try again</button>}/>;
  if (!posts.length) return <EmptyState icon={MessageSquareText} title="A little quiet in here" detail="No matching posts yet. Start a conversation or follow a few people to shape your feed." action={<a className="primary-button" href="/create"><Plus size={16}/> Write a post</a>}/>;
  return <div className="feed-list">{posts.map((p: Post)=><PostCard key={p.id} post={p} onLike={onLike} onBookmark={onBookmark} onRepost={onRepost} onReply={onReply} onOpen={onOpen}/>)}</div>;
}
function PeopleList({ people, following, onFollow, onMessage, compact = false }: any) {
  if (!people?.length) return <p className="muted-note">More creators will appear as people join the community.</p>;
  return <div className={"people-list" + (compact?" people-compact":"")}>{people.map((p: Profile)=><div className="person-item" key={p.id}><a href={"/u/"+p.username}><Avatar profile={p} size="sm"/></a><div className="person-copy"><a href={"/u/"+p.username}><b>{p.display_name || p.username}</b></a><small>@{p.username}</small>{!compact&&p.bio&&<p>{p.bio}</p>}</div><button className={"follow-button"+(following.includes(p.id)?" is-following":"")} onClick={()=>onFollow(p)}>{following.includes(p.id)?"Following":"Follow"}</button>{!compact&&onMessage&&<button className="icon-button" onClick={()=>onMessage(p)} aria-label={"Message "+p.username}><MessageCircle size={16}/></button>}</div>)}</div>;
}
function CommunityList({ rows, joined, onJoin, onOpen }: any) {
  if (!rows?.length) return <EmptyState icon={Users} title="Your first circle is waiting" detail="No Topic Circles have been created yet. Start one around a real interest and invite others to join." />;
  return <div className="community-list">{rows.map((c: any)=><article className="community-card" key={c.id}><span className="community-mark"><Users size={21}/></span><div className="community-copy"><a href={"/community/"+c.slug} onClick={e=>{if(onOpen){e.preventDefault();onOpen(c);}}}><h3>{c.name}</h3></a><span className="context-chip">{c.topic}</span><p>{c.description || "A place to share ideas and learn from one another."}</p></div><button className={"outline-button"+(joined.includes(c.id)?" joined":"")} onClick={()=>void onJoin(c)}>{joined.includes(c.id)?"Joined":"Join"}</button></article>)}</div>;
}
function AuthPrompt({ onSignIn }: any) { return <EmptyState icon={LockKeyhole} title="Sign in to see your activity" detail="Your notifications are private to your account." action={<button className="primary-button" onClick={onSignIn}>Sign in</button>}/>; }
function notificationLabel(kind: string) {
  return ({ like: "liked your post.", comment: "replied to your post.", reply: "replied to your post.", follow: "started following you.", mention: "mentioned you in a post.", repost: "reposted your post.", message: "sent you a message request." } as Record<string,string>)[kind] || "interacted with you.";
}

export function AuthPage({ mode }: { mode: "signin" | "signup" }) {
  const client = getClient();
  const [kind, setKind] = useState<"signin" | "signup" | "reset">(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorText, setErrorText] = useState("");
  useEffect(() => {
    if (!client) return;
    let alive = true;
    void client.auth.getSession().then(({ data }) => {
      if (alive && data.session?.user) window.location.replace("/");
    });
    return () => { alive = false; };
  }, [client]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErrorText(""); setNotice("");
    if (!client) { setErrorText("Authentication is not configured. Check the Supabase public URL and publishable key in Vercel."); return; }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) { setErrorText("Enter your email address."); return; }
    if (kind === "reset") {
      setBusy(true);
      const { error } = await client.auth.resetPasswordForEmail(cleanEmail, { redirectTo: window.location.origin + "/settings" });
      setBusy(false);
      if (error) setErrorText(error.message); else setNotice("If an account uses this email, a password reset link has been sent.");
      return;
    }
    if (password.length < 8) { setErrorText("Use a password with at least 8 characters."); return; }
    if (kind === "signup" && password !== confirmPassword) { setErrorText("The passwords do not match."); return; }
    if (kind === "signup" && !/^[a-zA-Z0-9_]{3,24}$/.test(username)) { setErrorText("Username must be 3–24 letters, numbers or underscores."); return; }
    setBusy(true);
    try {
      if (kind === "signup") {
        const { data: existing, error: lookupError } = await client.from("profiles").select("id").eq("username", username.toLowerCase()).maybeSingle();
        if (lookupError) throw new Error("Could not validate username right now. Please try again.");
        if (existing) throw new Error("That username is already taken. Try another one.");
        const { data, error } = await client.auth.signUp({ email: cleanEmail, password, options: { data: { name: displayName.trim() || username, username: username.toLowerCase() }, emailRedirectTo: window.location.origin + "/" } });
        if (error) throw error;
        if (data.session) { window.location.replace("/"); return; }
        setNotice("Account created. Check your inbox to confirm your email, then sign in. Check spam if needed.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        window.location.replace("/"); return;
      }
    } catch (err) { setErrorText(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><a href="/" className="auth-page-brand"><span className="brand-symbol">y</span><span>theYapper<span className="brand-period">.</span></span></a><section className="auth-page-card"><div className="auth-page-mark"><Sparkles size={22}/></div><p className="eyebrow">{kind === "signup" ? "YOUR NEXT CONVERSATION STARTS HERE" : kind === "reset" ? "ACCOUNT RECOVERY" : "GOOD TO HAVE YOU BACK"}</p><h1>{kind === "signup" ? "Find your people." : kind === "reset" ? "Reset your password." : "Welcome back."}</h1><p className="auth-page-subtitle">{kind === "signup" ? "Make a space for your ideas, interests and real conversations." : kind === "reset" ? "We’ll email you a secure link to reset your password." : "Sign in to continue the conversations that matter to you."}</p>
    <form className="auth-page-form" onSubmit={submit}>
      {kind === "signup" && <><label>Display name<input required minLength={1} maxLength={60} autoComplete="name" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name"/></label><label>Username<div className="auth-username-input"><span>@</span><input required minLength={3} maxLength={24} autoComplete="username" value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))} placeholder="yourhandle"/></div><small>3–24 characters · letters, numbers and underscores</small></label></>}
      <label>Email address<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      {kind !== "reset" && <><label>Password<div className="auth-password-input"><input required type={showPassword ? "text" : "password"} minLength={8} autoComplete={kind === "signup" ? "new-password" : "current-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword ? "Hide" : "Show"}</button></div></label>{kind === "signup" && <label>Confirm password<input required type={showPassword ? "text" : "password"} minLength={8} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Enter password again"/></label>}</>}
      {errorText && <p className="auth-error" role="alert">{errorText}</p>}{notice && <p className="auth-success" role="status">{notice}</p>}
      <button className="primary-button auth-submit" disabled={busy}>{busy ? "Please wait…" : kind === "signup" ? "Create account" : kind === "reset" ? "Send reset link" : "Sign in"} <ChevronRight size={17}/></button>
    </form>
    {kind === "signin" && <button className="auth-forgot" onClick={()=>{setKind("reset");setErrorText("");setNotice("");}}>Forgot password?</button>}
    <div className="auth-page-switch">{kind === "signup" ? "Already have an account?" : kind === "reset" ? "Remembered it?" : "New to theYapper?"} <button onClick={()=>{setKind(kind === "signin" ? "signup" : "signin");setErrorText("");setNotice("");}}>{kind === "signup" || kind === "reset" ? "Sign in" : "Create account"}</button></div>
  </section><p className="auth-page-foot">A better place for thoughtful conversations.</p></main>;
}
