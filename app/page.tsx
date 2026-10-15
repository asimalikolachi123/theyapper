"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Bell, Bookmark, Check, ChevronDown, Compass, Feather, Hash, Heart, Home,
  ImagePlus, LogIn, LogOut, MessageCircle, MoreHorizontal, Search, Send,
  Settings, Sparkles, UserRound, Users, X as XIcon, Repeat2, Flame
} from "lucide-react";

type Post = { id: string; name: string; handle: string; avatar: string; time: string; text: string; image?: string; likes: number; replies: number; reposts: number; liked?: boolean; verified?: boolean; tag?: string };
const demoPosts: Post[] = [
  { id:"p1", name:"Maya Chen", handle:"mayacreates", avatar:"MC", time:"8m", text:"The best products don't try to do everything. They make one important thing feel effortless. ✨", likes:128, replies:18, reposts:24, verified:true, tag:"Product" },
  { id:"p2", name:"theYapper", handle:"theyapper", avatar:"Y", time:"22m", text:"A little reminder: your first version doesn't have to be perfect. It just has to help someone. Build, listen, improve. 💭", likes:86, replies:12, reposts:19, verified:true },
  { id:"p3", name:"Arjun Patel", handle:"arjunbuilds", avatar:"AP", time:"1h", text:"Spent the morning learning something new and the afternoon breaking what I built. Honestly? Great day. What are you working on?", likes:43, replies:9, reposts:6, tag:"Building" },
  { id:"p4", name:"Sara Williams", handle:"sarawrites", avatar:"SW", time:"2h", text:"A good conversation can change your whole week. Make room for more of them. 🌱", likes:201, replies:31, reposts:42, verified:true },
];
const people = [{name:"Maya Chen",handle:"mayacreates",avatar:"MC",about:"Building thoughtful products"},{name:"Arjun Patel",handle:"arjunbuilds",avatar:"AP",about:"Developer • learning in public"},{name:"Sara Williams",handle:"sarawrites",avatar:"SW",about:"Words, ideas & community"}];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let client: SupabaseClient | null = null;
function getSupabase() { if (!supabaseUrl || !supabaseKey) return null; if (!client) client = createClient(supabaseUrl, supabaseKey); return client; }
function Avatar({label,large=false}:{label:string;large?:boolean}) { return <div className={`avatar ${large?"avatar-lg":""} avatar-${label.length%5}`}>{label.slice(0,2).toUpperCase()}</div>; }

export default function HomePage() {
  const [posts,setPosts] = useState<Post[]>(demoPosts);
  const [draft,setDraft] = useState("");
  const [search,setSearch] = useState("");
  const [tab,setTab] = useState("For you");
  const [following,setFollowing] = useState<string[]>([]);
  const [saved,setSaved] = useState<string[]>([]);
  const [activeNav,setActiveNav] = useState("Home");
  const [dark,setDark] = useState(false);
  const [modal,setModal] = useState<"login"|"signup"|null>(null);
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [user,setUser] = useState<{email:string;name:string}|null>(null);
  const [notice,setNotice] = useState("");
  const [imageUrl,setImageUrl] = useState("");
  const [busy,setBusy] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({data}) => { if(data.session?.user) setUser({email:data.session.user.email||"",name:data.session.user.user_metadata?.name||data.session.user.email?.split("@")[0]||"Yapper"}); });
    const {data:{subscription}} = sb.auth.onAuthStateChange((_event,session) => setUser(session?.user ? {email:session.user.email||"",name:session.user.user_metadata?.name||session.user.email?.split("@")[0]||"Yapper"} : null));
    sb.from("posts").select("id,content,image_url,created_at,user_id,profiles(username,display_name,avatar_url)").order("created_at",{ascending:false}).limit(30).then(({data}) => {
      if (data?.length) setPosts(data.map((p:any)=>({id:p.id,name:p.profiles?.display_name||p.profiles?.username||"Yapper",handle:p.profiles?.username||"member",avatar:(p.profiles?.display_name||"Y").slice(0,2),time:relativeTime(p.created_at),text:p.content||"",image:p.image_url||undefined,likes:0,replies:0,reposts:0})));
    });
    return () => subscription.unsubscribe();
  }, []);
  const visiblePosts = useMemo(()=>posts.filter(p => (tab==="Following"?following.includes(p.handle)||p.handle==="theyapper":true) && (!search || (p.text+" "+p.name+" "+p.handle).toLowerCase().includes(search.toLowerCase()))),[posts,tab,search,following]);
  function notify(s:string) { setNotice(s); window.setTimeout(()=>setNotice(""),2800); }
  async function auth() {
    const sb=getSupabase(); if(!sb){notify("Add your Supabase environment variables to enable accounts.");return;}
    if(!email||!password){notify("Enter your email and password.");return;}
    setBusy(true);
    const result=modal==="signup" ? await sb.auth.signUp({email,password,options:{data:{name:email.split("@")[0]}}}) : await sb.auth.signInWithPassword({email,password});
    setBusy(false);
    if(result.error) notify(result.error.message); else {setModal(null);notify(modal==="signup"?"Check your email to confirm your account.":"Welcome back!");}
  }
  async function publish() {
    if(!draft.trim()) return;
    const sb=getSupabase();
    if(sb && !user){setModal("login");notify("Sign in to publish a post.");return;}
    if(sb && user) {
      const {data:profile}=await sb.from("profiles").select("id").eq("id",(await sb.auth.getUser()).data.user?.id).maybeSingle();
      const {data,error}=await sb.from("posts").insert({user_id:profile?.id|| (await sb.auth.getUser()).data.user?.id,content:draft.trim(),image_url:imageUrl.trim()||null}).select("id,created_at").single();
      if(error){notify("Couldn't publish: "+error.message);return;}
      setPosts([{id:data.id,name:user.name,handle:user.email.split("@")[0],avatar:user.name.slice(0,2),time:"now",text:draft.trim(),image:imageUrl.trim()||undefined,likes:0,replies:0,reposts:0},...posts]);
    } else setPosts([{id:"local-"+Date.now(),name:"You",handle:"you",avatar:"YO",time:"now",text:draft.trim(),image:imageUrl.trim()||undefined,likes:0,replies:0,reposts:0},...posts]);
    setDraft("");setImageUrl("");notify("Your post is live!");
  }
  async function logout(){const sb=getSupabase();if(sb)await sb.auth.signOut();setUser(null);notify("Signed out.");}
  function toggleLike(id:string){setPosts(old=>old.map(p=>p.id===id?{...p,liked:!p.liked,likes:p.likes+(p.liked?-1:1)}:p));}
  function toggleFollow(handle:string){setFollowing(old=>old.includes(handle)?old.filter(h=>h!==handle):[...old,handle]);}
  const nav=[{name:"Home",icon:Home},{name:"Explore",icon:Compass},{name:"Notifications",icon:Bell},{name:"Messages",icon:MessageCircle},{name:"Bookmarks",icon:Bookmark},{name:"Profile",icon:UserRound}];
  return <main className={dark?"app dark":"app"}>
    <aside className="left-rail">
      <a className="brand" href="#" aria-label="theYapper home"><span className="brand-mark">y</span><span className="brand-name">theYapper<span className="brand-dot">.</span></span></a>
      <nav className="nav-list">{nav.map(({name,icon:Icon})=><button key={name} className={`nav-item ${activeNav===name?"nav-active":""}`} onClick={()=>{setActiveNav(name);if(name==="Bookmarks")setTab("Bookmarks");else if(name==="Home")setTab("For you");else if(name==="Explore")setTab("Explore");else if(name==="Profile"&&!user)setModal("login");else if(["Messages","Notifications"].includes(name))notify("This section is coming soon.");}}><Icon size={21} strokeWidth={activeNav===name?2.5:1.8}/><span>{name}</span>{name==="Notifications"&&<i className="nav-dot"/>}</button>)}</nav>
      <button className="primary-btn side-compose" onClick={()=>document.getElementById("composer")?.focus()}><Feather size={18}/> <span>Yap something</span></button>
      <div className="rail-bottom"><button className="nav-item" onClick={()=>setDark(!dark)}><Sparkles size={20}/><span>{dark?"Light appearance":"Dark appearance"}</span></button>
        {user?<button className="account-chip" onClick={logout}><Avatar label={user.name}/><span className="account-copy"><b>{user.name}</b><small>@{user.email.split("@")[0]}</small></span><LogOut size={16}/></button>:<button className="account-chip" onClick={()=>setModal("login")}><Avatar label="Y"/><span className="account-copy"><b>Join the conversation</b><small>Sign in or create account</small></span><LogIn size={16}/></button>}
      </div>
    </aside>
    <section className="feed-column">
      <header className="mobile-header"><span className="brand-mark">y</span><b>theYapper<span className="brand-dot">.</span></b><button className="icon-btn" onClick={()=>setDark(!dark)}><Sparkles size={19}/></button></header>
      <div className="feed-header"><div><h1>{activeNav==="Explore"?"Explore":activeNav==="Profile"?"Your profile":activeNav==="Home"?"Your feed":activeNav}</h1><p>{activeNav==="Home"?"A little corner of the internet, just for you.":"Find your people and join the conversation."}</p></div><button className="icon-btn" onClick={()=>setDark(!dark)} aria-label="Toggle appearance"><Sparkles size={18}/></button></div>
      <div className="feed-tabs"><button className={tab==="For you"?"selected":""} onClick={()=>setTab("For you")}>For you</button><button className={tab==="Following"?"selected":""} onClick={()=>setTab("Following")}>Following</button><button className={tab==="Explore"?"selected":""} onClick={()=>setTab("Explore")}>Discover <Flame size={14}/></button></div>
      <div className="composer-wrap"><Avatar label={user?.name||"YO"} large/><div className="composer-main"><textarea id="composer" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="What's on your mind?" maxLength={500} aria-label="Write a post"/>{imageUrl&&<div className="image-preview"><img src={imageUrl} alt="Post preview"/><button onClick={()=>setImageUrl("")} aria-label="Remove image"><XIcon size={16}/></button></div>}<div className="composer-footer"><div className="composer-tools"><button title="Attach image by URL" onClick={()=>{const u=window.prompt("Paste a public image URL");if(u)setImageUrl(u)}}><ImagePlus size={18}/><span>Image</span></button><span className="char-count">{draft.length}/500</span></div><button className="primary-btn post-btn" disabled={!draft.trim()} onClick={publish}><Send size={15}/> Post</button></div></div></div>
      <div className="posts-label"><span>{tab==="Following"?"From your circle":tab==="Bookmarks"?"Your bookmarks":"The conversation"}</span><span className="live-pill"><i/> Live community</span></div>
      {visiblePosts.filter(p=>tab!=="Bookmarks"||saved.includes(p.id)).map(p=><article className="post" key={p.id}><Avatar label={p.avatar} large/><div className="post-content"><div className="post-meta"><b>{p.name}</b>{p.verified&&<span className="verified" title="Verified"><Check size={10}/></span>}<span className="handle">@{p.handle}</span><span className="meta-dot">·</span><span className="post-time">{p.time}</span><button className="more-btn" aria-label="More post options" onClick={()=>notify("More post options coming soon.")}><MoreHorizontal size={20}/></button></div>{p.tag&&<span className="topic-tag"><Hash size={12}/>{p.tag}</span>}<p className="post-text">{p.text}</p>{p.image&&<img className="post-image" src={p.image} alt="Post attachment"/>}<div className="post-actions"><button onClick={()=>notify("Replies are coming soon.")}><MessageCircle size={17}/><span>{p.replies}</span></button><button onClick={()=>notify("Reposts are coming soon.")}><Repeat2 size={17}/><span>{p.reposts}</span></button><button className={p.liked?"liked":""} onClick={()=>toggleLike(p.id)}><Heart size={17} fill={p.liked?"currentColor":"none"}/><span>{p.likes}</span></button><button className={saved.includes(p.id)?"saved":""} onClick={()=>setSaved(old=>old.includes(p.id)?old.filter(x=>x!==p.id):[...old,p.id])} aria-label="Bookmark post"><Bookmark size={17} fill={saved.includes(p.id)?"currentColor":"none"}/></button><button onClick={()=>{navigator.clipboard?.writeText(window.location.href+"#"+p.id);notify("Page link copied.")}} aria-label="Share post"><Send size={16}/></button></div></div></article>)}
      {visiblePosts.length===0&&<div className="empty-state"><Search size={26}/><b>Nothing here just yet</b><span>Try another search or check back soon.</span></div>}
      <footer className="feed-footer">Made for people, not algorithms. <span>theYapper © 2026</span></footer>
    </section>
    <aside className="right-rail">
      <label className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search theYapper"/></label>
      <section className="side-card welcome-card"><div className="card-eyebrow"><Sparkles size={14}/> YOUR SPACE ON THE INTERNET</div><h2>Good conversations start here.</h2><p>Share your thoughts, find your people, and make something meaningful together.</p>{user?<div className="signed-in"><Check size={16}/> Signed in as {user.name}</div>:<div className="welcome-actions"><button className="primary-btn" onClick={()=>setModal("signup")}>Create account <ChevronDown size={15}/></button><button className="text-btn" onClick={()=>setModal("login")}>I already have an account</button></div>}</section>
      <section className="side-card"><div className="side-card-head"><h3>People to know</h3><button onClick={()=>notify("More suggestions soon.")}>See all</button></div>{people.map(p=><div className="person-row" key={p.handle}><Avatar label={p.avatar}/><div className="person-info"><b>{p.name}</b><span>@{p.handle}</span><small>{p.about}</small></div><button className={following.includes(p.handle)?"follow-btn following":"follow-btn"} onClick={()=>toggleFollow(p.handle)}>{following.includes(p.handle)?"Following":"Follow"}</button></div>)}</section>
      <section className="side-card trends-card"><div className="side-card-head"><h3>Topics you might like</h3><Compass size={17}/></div>{[["#BuildInPublic","1,240 yaps"],["#DesignThinking","890 yaps"],["#TechForGood","652 yaps"]].map(([tag,count])=><button className="trend-row" key={tag} onClick={()=>setSearch(tag.slice(1))}><span><b>{tag}</b><small>{count} today</small></span><MoreHorizontal size={17}/></button>)}</section>
      <div className="legal-links"><span>About</span><span>Guidelines</span><span>Privacy</span><span>Terms</span><span>© 2026 theYapper</span></div>
    </aside>
    <div className="mobile-nav">{nav.slice(0,5).map(({name,icon:Icon})=><button key={name} className={activeNav===name?"mobile-nav-active":""} onClick={()=>{setActiveNav(name);if(name==="Explore")setTab("Explore");else if(name==="Home")setTab("For you");else if(name==="Notifications")notify("Notifications are coming soon.");else if(name==="Messages")notify("Messages are coming soon.");else setTab("Bookmarks");}}><Icon size={21}/></button>)}<button onClick={()=>setModal(user?null:"login")}>{user?<Avatar label={user.name}/>:<UserRound size={21}/>}</button></div>
    {notice&&<div className="toast"><Check size={16}/>{notice}</div>}
    {modal&&<div className="modal-backdrop" onClick={()=>setModal(null)}><section className="auth-modal" onClick={e=>e.stopPropagation()}><button className="modal-close icon-btn" onClick={()=>setModal(null)}><XIcon size={19}/></button><span className="brand-mark modal-mark">y</span><h2>{modal==="signup"?"Find your people.":"Welcome back."}</h2><p>{modal==="signup"?"Create your account and join the conversation.":"Sign in to keep the conversation going."}</p><form onSubmit={e=>{e.preventDefault();void auth()}}><label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required/></label><button className="primary-btn auth-submit" disabled={busy}>{busy?"Please wait…":modal==="signup"?"Create account":"Sign in"}</button></form><div className="auth-switch">{modal==="signup"?"Already have an account?":"New to theYapper?"} <button onClick={()=>setModal(modal==="signup"?"login":"signup")}>{modal==="signup"?"Sign in":"Create account"}</button></div><small className="auth-note">Accounts require your own Supabase project configuration. Never share your password with anyone.</small></section></div>}
  </main>;
}
function relativeTime(value:string){const mins=Math.max(1,Math.floor((Date.now()-new Date(value).getTime())/60000));return mins<60?mins+"m":Math.floor(mins/60)+"h";}
