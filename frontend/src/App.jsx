import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Feather, Search, Plus, MessageCircle, Heart, Clock3, LogIn, LogOut, X, Send, Pencil, Trash2, Sparkles, ArrowUpRight } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("thoughtfulToken");
const getUser = () => { try { return JSON.parse(localStorage.getItem("thoughtfulUser") || "null"); } catch { return null; } };
const dateText = (date) => new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const readTime = (content) => `${Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))} min read`;
const initials = (name = "Reader") => name.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();

export default function App() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(getUser);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);
  const [modal, setModal] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [postForm, setPostForm] = useState({ title: "", content: "", tags: "" });
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(null);

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}), ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed. Please try again.");
    return data;
  }
  async function loadPosts() {
    try { setPosts(await request("/posts")); }
    catch (e) { setNotice(e.message + " Make sure the backend and MongoDB are running."); }
  }
  useEffect(() => { loadPosts(); }, []);
  const filtered = useMemo(() => posts.filter(p => `${p.title} ${p.content} ${(p.tags || []).join(" ")} ${p.authorName}`.toLowerCase().includes(search.toLowerCase())), [posts, search]);
  const selected = active ? posts.find(p => p._id === active) || active : null;

  function openAuth(mode = "login") { setAuthMode(mode); setForm({ name: "", email: "", password: "" }); setModal("auth"); }
  async function submitAuth(e) {
    e.preventDefault(); setBusy(true); setNotice("");
    try {
      const data = await request(`/auth/${authMode}`, { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem("thoughtfulToken", data.token); localStorage.setItem("thoughtfulUser", JSON.stringify(data.user));
      setUser(data.user); setModal(""); setNotice(`Welcome ${data.user.name}!`); await loadPosts();
    } catch (e) { setNotice(e.message); } finally { setBusy(false); }
  }
  function logout() { localStorage.removeItem("thoughtfulToken"); localStorage.removeItem("thoughtfulUser"); setUser(null); setNotice("You have been logged out."); setActive(null); }
  function openNewPost() { if (!user) return openAuth(); setEditing(null); setPostForm({ title: "", content: "", tags: "" }); setModal("post"); }
  function openEditPost(post) { setEditing(post); setPostForm({ title: post.title, content: post.content, tags: (post.tags || []).join(", ") }); setModal("post"); setActive(null); }
  async function submitPost(e) {
    e.preventDefault(); setBusy(true); setNotice("");
    const payload = { ...postForm, tags: postForm.tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5) };
    try {
      await request(editing ? `/posts/${editing._id}` : "/posts", { method: editing ? "PUT" : "POST", body: JSON.stringify(payload) });
      setModal(""); setNotice(editing ? "Your story was updated." : "Your story is published!"); await loadPosts();
    } catch (e) { setNotice(e.message); } finally { setBusy(false); }
  }
  async function deletePost(post) {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try { await request(`/posts/${post._id}`, { method: "DELETE" }); setActive(null); setNotice("Post deleted."); await loadPosts(); }
    catch (e) { setNotice(e.message); }
  }
  async function openPost(post) {
    try { const full = await request(`/posts/${post._id}`); setActive(full); }
    catch (e) { setNotice(e.message); }
  }
  async function addComment(e) {
    e.preventDefault(); if (!user) return openAuth();
    try { const updated = await request(`/posts/${selected._id}/comments`, { method: "POST", body: JSON.stringify({ text: comment }) }); setActive(updated); setComment(""); await loadPosts(); }
    catch (e) { setNotice(e.message); }
  }
  async function deleteComment(commentId) {
    try { const updated = await request(`/posts/${selected._id}/comments/${commentId}`, { method: "DELETE" }); setActive(updated); await loadPosts(); }
    catch (e) { setNotice(e.message); }
  }

  return <div className="app-shell">
    <header className="topbar"><div className="nav-wrap">
      <button className="brand" onClick={() => setActive(null)} aria-label="Thoughtful home"><span className="brand-mark"><Feather size={21}/></span><span>thoughtful<span className="brand-dot">.</span><small>IDEAS WORTH SHARING</small></span></button>
      <nav><button className={!active ? "nav-link active" : "nav-link"} onClick={() => setActive(null)}>Explore</button><button className="nav-link" onClick={openNewPost}><Plus size={16}/> Write</button></nav>
      <div className="nav-actions"><label className="searchbox"><Search size={17}/><input placeholder="Search stories..." value={search} onChange={e => { setSearch(e.target.value); setActive(null); }}/><kbd>⌘ K</kbd></label>
        {user ? <div className="user-menu"><span className="avatar">{initials(user.name)}</span><span className="user-name">{user.name}</span><button className="icon-btn" title="Log out" onClick={logout}><LogOut size={17}/></button></div> : <button className="sign-in" onClick={() => openAuth()}>Sign in <ArrowUpRight size={16}/></button>}
      </div>
    </div></header>

    <main>
      <section className="hero"><div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> A LITTLE SPACE FOR BIG IDEAS</div><h1>Stories make us<br/><em>more human.</em></h1><p>A thoughtful corner of the internet to share what you know, explore what you don't, and connect through the words that matter.</p><div className="hero-actions"><button className="primary-btn" onClick={openNewPost}><Feather size={17}/> Start writing</button><button className="text-btn" onClick={() => document.getElementById("stories")?.scrollIntoView({ behavior: "smooth" })}>Explore stories <span>↓</span></button></div><div className="hero-note"><span className="avatar-stack"><i>R</i><i>M</i><i>A</i></span><span>Good ideas grow when shared.</span></div></div>
        <div className="hero-art"><div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div><div className="art-paper"><span className="paper-scribble">“</span><div className="paper-line line-long"></div><div className="paper-line"></div><div className="paper-line line-mid"></div><div className="paper-seal"><Feather size={24}/></div><div className="paper-bottom">A NOTE TO SELF</div></div><div className="floating-tag tag-top">✳ &nbsp; curiosity</div><div className="floating-tag tag-bottom">keep creating ↗</div><span className="spark spark-one">✳</span><span className="spark spark-two">✦</span></div>
      </section>

      {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")}><X size={16}/></button></div>}
      <section className="stories-section" id="stories"><div className="section-heading"><div><div className="eyebrow muted">THE COMMUNITY JOURNAL</div><h2>{search ? "Search results" : "Fresh from the community"}<span className="heading-dot">.</span></h2><p>{search ? `${filtered.length} stories matching “${search}”` : "Ideas, experiences, and little discoveries from curious minds."}</p></div><div className="sort-note"><span className="status-dot"></span> Latest stories</div></div>
        {filtered.length ? <div className="post-grid">{filtered.map((post, index) => <article className={`post-card card-${index % 3}`} key={post._id}><div className="card-top"><span className="category">{post.tags?.[0] || ["REFLECTIONS", "LIFE & WORK", "IDEAS"][index % 3]}</span><span className="card-number">0{index + 1}</span></div><button className="post-title" onClick={() => openPost(post)}>{post.title}</button><p className="post-excerpt">{post.content}</p><div className="tag-row">{(post.tags || []).slice(0, 3).map(tag => <span key={tag}>#{tag}</span>)}</div><div className="post-meta"><div className="author"><span className="avatar small">{initials(post.authorName)}</span><span><b>{post.authorName}</b><small>{dateText(post.createdAt)}</small></span></div><div className="meta-right"><span><Clock3 size={14}/>{readTime(post.content)}</span><span><MessageCircle size={14}/>{post.commentsCount ?? " "} </span></div></div><button className="card-open" onClick={() => openPost(post)} aria-label={`Read ${post.title}`}>Read story <ArrowUpRight size={15}/></button></article>)}</div> : <div className="empty-state"><div className="empty-icon"><BookOpen size={27}/></div><h3>{search ? "No stories found" : "The first page is yours."}</h3><p>{search ? "Try another keyword, or clear your search." : "There are no posts yet. Start the conversation by publishing your first story."}</p><button className="primary-btn" onClick={openNewPost}><Plus size={17}/> Write the first story</button></div>}
      </section>
      <section className="write-banner"><div className="banner-icon"><Feather size={24}/></div><div><span className="eyebrow">YOUR VOICE BELONGS HERE</span><h2>Have a story to tell?</h2><p>It doesn't have to be perfect. It just has to be yours.</p></div><button className="banner-btn" onClick={openNewPost}>Share your story <ArrowUpRight size={16}/></button><span className="banner-star">✳</span></section>
    </main>
    <footer><button className="footer-brand" onClick={() => setActive(null)}><Feather size={17}/> thoughtful.</button><span>Made for the love of a good story.</span><span>© 2026 Thoughtful Journal</span></footer>

    {modal === "auth" && <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setModal("")}><div className="modal auth-modal"><button className="modal-close" onClick={() => setModal("")}><X size={19}/></button><div className="modal-icon"><Feather size={23}/></div><div className="eyebrow muted">{authMode === "login" ? "WELCOME BACK" : "JOIN THE COMMUNITY"}</div><h2>{authMode === "login" ? "Good to see you." : "Make yourself at home."}</h2><p className="modal-sub">{authMode === "login" ? "Sign in to continue the conversation." : "Create an account and share your first story."}</p><form onSubmit={submitAuth}>{authMode === "register" && <label>Your name<input required value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="How should we call you?"/></label>}<label>Email address<input type="email" required value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="you@example.com"/></label><label>Password<input type="password" minLength="6" required value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="At least 6 characters"/></label><button className="primary-btn full" disabled={busy}>{busy ? "Please wait..." : authMode === "login" ? <><LogIn size={17}/> Sign in</> : "Create account"}</button></form><p className="switch-auth">{authMode === "login" ? "New around here?" : "Already part of the community?"} <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "Create an account" : "Sign in"}</button></p></div></div>}
    {modal === "post" && <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setModal("")}><div className="modal post-modal"><button className="modal-close" onClick={() => setModal("")}><X size={19}/></button><div className="eyebrow muted">{editing ? "REFINE YOUR WORDS" : "THE WORLD IS LISTENING"}</div><h2>{editing ? "Edit your story" : "Write a new story."}</h2><p className="modal-sub">A good story starts with one honest sentence.</p><form onSubmit={submitPost}><label>Story title<input maxLength="140" required value={postForm.title} onChange={e => setPostForm({...postForm, title:e.target.value})} placeholder="Give your story a title"/></label><label>Your story<textarea required rows="9" maxLength="20000" value={postForm.content} onChange={e => setPostForm({...postForm, content:e.target.value})} placeholder="Start wherever you are. Write what you wish someone had told you..."/></label><label>Topics <span className="optional">(optional, comma separated)</span><input value={postForm.tags} onChange={e => setPostForm({...postForm, tags:e.target.value})} placeholder="creativity, life, learning"/></label><button className="primary-btn full" disabled={busy}>{busy ? "Saving..." : <><Feather size={17}/>{editing ? "Save changes" : "Publish story"}</>}</button></form></div></div>}
    {selected && <div className="overlay detail-overlay" onMouseDown={e => e.target === e.currentTarget && setActive(null)}><article className="detail-modal"><button className="modal-close" onClick={() => setActive(null)}><X size={19}/></button><div className="detail-top"><span className="category">{selected.tags?.[0] || "COMMUNITY STORY"}</span><span className="detail-date">{dateText(selected.createdAt)}</span></div><h1>{selected.title}</h1><div className="detail-author"><span className="avatar">{initials(selected.authorName)}</span><div><b>{selected.authorName}</b><small>{readTime(selected.content)} · Thoughtful community</small></div>{user && user.id === selected.author && <div className="owner-actions"><button className="icon-btn" title="Edit post" onClick={() => openEditPost(selected)}><Pencil size={16}/></button><button className="icon-btn danger" title="Delete post" onClick={() => deletePost(selected)}><Trash2 size={16}/></button></div>}</div><div className="detail-content">{selected.content}</div>{selected.tags?.length > 0 && <div className="tag-row detail-tags">{selected.tags.map(t => <span key={t}>#{t}</span>)}</div>}<div className="comments-section"><h3><MessageCircle size={19}/> Conversation <span>{selected.comments?.length || 0}</span></h3>{user ? <form className="comment-form" onSubmit={addComment}><span className="avatar small">{initials(user.name)}</span><input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add something thoughtful..." maxLength="1000" required/><button aria-label="Send comment" disabled={!comment.trim()}><Send size={17}/></button></form> : <div className="comment-login">Want to join the conversation? <button onClick={() => openAuth()}>Sign in</button></div>}{selected.comments?.length ? <div className="comment-list">{selected.comments.map(c => <div className="comment" key={c._id}><span className="avatar small">{initials(c.authorName)}</span><div className="comment-body"><div className="comment-by"><b>{c.authorName}</b><small>{dateText(c.createdAt)}</small>{user?.id === c.author && <button onClick={() => deleteComment(c._id)} title="Delete comment"><Trash2 size={13}/></button>}</div><p>{c.text}</p></div></div>)}</div> : <p className="no-comments">No comments yet. Be the first to share a thought.</p>}</div></article></div>}
  </div>;
}
