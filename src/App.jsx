import { useState, useEffect, useCallback, useRef } from "react";

// ── Supabase Config ────────────────────────────────────────────────────────
const SUPABASE_URL = "https://lkoukaktzjhvczhhxmxl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb3VrYWt0empodmN6aGh4bXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNzY0NDIsImV4cCI6MjA4Njk1MjQ0Mn0._APrpolybMG96gybs_yj4QQNZOzkDDJiMPe7PKd9N-A";

// Lightweight Supabase client (no SDK needed)
function createClient(url, key) {
  let accessToken = null;
  let refreshToken = null;
  let currentUser = null;

  const headers = () => ({
    "apikey": key,
    "Authorization": `Bearer ${accessToken || key}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  });

  const rest = async (table, { method = "GET", body, query = "", single = false, count = false } = {}) => {
    const h = { ...headers() };
    if (count) h["Prefer"] = "count=exact";
    if (method === "POST" || method === "PATCH") h["Prefer"] = "return=representation";
    const res = await fetch(`${url}/rest/v1/${table}${query ? `?${query}` : ""}`, {
      method, headers: h, body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.msg || `API error ${res.status}`);
    }
    const data = await res.json().catch(() => null);
    if (single && Array.isArray(data)) return data[0] || null;
    return data;
  };

  const auth = {
    signUp: async (email, password, username) => {
      const res = await fetch(`${url}/auth/v1/signup`, {
        method: "POST", headers: { "apikey": key, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, data: { username } }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || data.error);
      if (data.access_token) {
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        currentUser = data.user;
        localStorage.setItem("rmm_session", JSON.stringify({ accessToken, refreshToken, user: currentUser }));
      }
      return data;
    },
    signIn: async (email, password) => {
      const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: "POST", headers: { "apikey": key, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error_description || data.error.message || data.error);
      accessToken = data.access_token;
      refreshToken = data.refresh_token;
      currentUser = data.user;
      localStorage.setItem("rmm_session", JSON.stringify({ accessToken, refreshToken, user: currentUser }));
      return data;
    },
    signOut: () => {
      accessToken = null; refreshToken = null; currentUser = null;
      localStorage.removeItem("rmm_session");
    },
    getUser: () => currentUser,
    restore: () => {
      try {
        const s = JSON.parse(localStorage.getItem("rmm_session"));
        if (s) { accessToken = s.accessToken; refreshToken = s.refreshToken; currentUser = s.user; }
        return currentUser;
      } catch { return null; }
    },
  };

  const storage = {
    upload: async (bucket, path, file) => {
      const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
        method: "POST",
        headers: { "apikey": key, "Authorization": `Bearer ${accessToken || key}` },
        body: file,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Upload failed ${res.status}`);
      }
      return { path };
    },
    getPublicUrl: (bucket, path) => `${url}/storage/v1/object/public/${bucket}/${path}`,
  };

  return { rest, auth, storage };
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Constants ──────────────────────────────────────────────────────────────
const COLORS = { red: "#7B1E1E", charcoal: "#1C1C1C", bone: "#F4F1EA", orange: "#C85A1E", darkBg: "#111111", cardBg: "#1A1A1A", inputBg: "#252525", textMuted: "#888", border: "#2A2A2A", success: "#2E7D32", error: "#C62828" };
const CUTS = ["Ribeye", "NY Strip", "Filet Mignon", "Tomahawk", "Brisket", "T-Bone", "Tri-Tip", "Wagyu A5", "Porterhouse", "Flank", "Picanha", "Chuck Eye", "Skirt Steak"];
const METHODS = ["Charcoal Grill", "Cast Iron", "Smoker", "Reverse Sear", "Sous Vide", "Open Fire", "Pellet Grill", "Gas Grill", "Broiler"];
const SPECIES = ["Whitetail", "Elk", "Mule Deer", "Wild Turkey", "Pheasant", "Duck", "Wild Hog", "Moose", "Antelope", "Quail", "Dove", "Bear"];

// ── Shared Components ──────────────────────────────────────────────────────
function ScoreBadge({ score, size = "md" }) {
  if (!score && score !== 0) return null;
  const s = size === "lg" ? 48 : size === "sm" ? 28 : 36;
  const fs = size === "lg" ? 18 : size === "sm" ? 11 : 14;
  const color = score >= 9 ? "#FFD700" : score >= 7.5 ? COLORS.orange : score >= 6 ? "#999" : "#666";
  return (
    <div style={{ width: s, height: s, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ color, fontWeight: 800, fontSize: fs }}>{Number(score).toFixed(1)}</span>
    </div>
  );
}

function CategoryBadge({ category, subcategory }) {
  const isHunting = category === "hunting";
  const label = isHunting ? "🦌 HUNT" : subcategory === "restaurant" ? "🍽 RESTAURANT" : "🏠 HOME";
  const bg = isHunting ? "#2E4A1E" : subcategory === "restaurant" ? "#4A2E1E" : "#3A2E1E";
  return <span style={{ background: bg, color: COLORS.bone, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.5 }}>{label}</span>;
}

function Avatar({ url, fallback, size = 36 }) {
  if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: COLORS.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45, color: COLORS.textMuted, flexShrink: 0, fontWeight: 700 }}>{(fallback || "?")[0].toUpperCase()}</div>;
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}` }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{ flex: 1, padding: "10px 0", background: "none", border: "none", borderBottom: active === t.key ? `2px solid ${COLORS.orange}` : "2px solid transparent", color: active === t.key ? COLORS.bone : COLORS.textMuted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{t.label}</button>
      ))}
    </div>
  );
}

function RatingBar({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ color: COLORS.textMuted, fontSize: 11, width: 80, textAlign: "right" }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: COLORS.inputBg, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value * 10}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.red}, ${COLORS.orange})`, borderRadius: 3 }} />
      </div>
      <span style={{ color: COLORS.bone, fontSize: 12, fontWeight: 700, width: 28 }}>{Number(value).toFixed(1)}</span>
    </div>
  );
}

function Toast({ message, type = "info", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === "error" ? COLORS.error : type === "success" ? COLORS.success : COLORS.charcoal;
  return (
    <div style={{ position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", background: bg, color: "white", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.5)", maxWidth: 340, textAlign: "center" }}>{message}</div>
  );
}

function Spinner() {
  return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div style={{ width: 32, height: 32, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.orange, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style></div>;
}

const inputStyle = { width: "100%", padding: "12px 14px", background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.bone, fontSize: 14, outline: "none", boxSizing: "border-box" };
const labelStyle = { color: COLORS.textMuted, fontSize: 11, fontWeight: 700, marginBottom: 4, display: "block", letterSpacing: 0.5 };
const btnPrimary = { width: "100%", padding: 14, background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.orange})`, border: "none", borderRadius: 8, color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer", letterSpacing: 0.5 };

// ── Post Card ──────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onProfileClick, onLikeToggle }) {
  const [showRatings, setShowRatings] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const isLiked = post.user_liked;
  const timeAgo = () => {
    const d = Math.floor((Date.now() - new Date(post.created_at)) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
  };

  const loadComments = async () => {
    if (!showComments) {
      setShowComments(true);
      setLoadingComments(true);
      try {
        const data = await supabase.rest("comments", {
          query: `post_id=eq.${post.id}&select=*,profiles(username,avatar_url)&order=created_at.asc`
        });
        setComments(data || []);
      } catch (e) { console.error(e); }
      setLoadingComments(false);
    } else {
      setShowComments(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !currentUserId) return;
    try {
      const data = await supabase.rest("comments", {
        method: "POST", body: { user_id: currentUserId, post_id: post.id, content: newComment.trim() }
      });
      if (data?.[0]) {
        setComments(prev => [...prev, { ...data[0], profiles: { username: "You", avatar_url: null } }]);
        setNewComment("");
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ background: COLORS.cardBg, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10 }}>
        <div onClick={() => onProfileClick?.(post.user_id)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <Avatar url={post.avatar_url} fallback={post.username} size={32} />
          <div>
            <div style={{ color: COLORS.bone, fontWeight: 700, fontSize: 13 }}>{post.username}</div>
            <div style={{ color: COLORS.textMuted, fontSize: 10 }}>
              {post.location && `📍 ${post.location} · `}{timeAgo()}
            </div>
          </div>
        </div>
        <CategoryBadge category={post.category} subcategory={post.subcategory} />
      </div>

      {/* Image */}
      <div style={{ width: "100%", aspectRatio: "4/3", background: COLORS.inputBg, position: "relative" }}>
        {post.image_url ? (
          <img src={post.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 64, opacity: 0.2 }}>{post.category === "hunting" ? "🦌" : "🥩"}</span>
          </div>
        )}
        {post.overall_score && (
          <div style={{ position: "absolute", bottom: 10, right: 10 }}>
            <ScoreBadge score={post.overall_score} size="lg" />
          </div>
        )}
        {post.trophy_score && (
          <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.7)", padding: "4px 10px", borderRadius: 6 }}>
            <span style={{ color: "#FFD700", fontWeight: 800, fontSize: 14 }}>🏆 {post.trophy_score}"</span>
          </div>
        )}
      </div>

      {/* Actions & Content */}
      <div style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <button onClick={() => onLikeToggle?.(post.id, isLiked)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
            <span style={{ color: isLiked ? "#E53E3E" : COLORS.textMuted, fontSize: 18 }}>{isLiked ? "♥" : "♡"}</span>
            <span style={{ color: COLORS.bone, fontSize: 13, fontWeight: 600 }}>{post.like_count || 0}</span>
          </button>
          <button onClick={loadComments} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
            <span style={{ color: COLORS.textMuted, fontSize: 13 }}>💬 {post.comment_count || 0}</span>
          </button>
          {post.cut_type && <span style={{ color: COLORS.textMuted, fontSize: 11, marginLeft: "auto", background: COLORS.inputBg, padding: "2px 8px", borderRadius: 4 }}>{post.cut_type}</span>}
          {post.species && <span style={{ color: COLORS.textMuted, fontSize: 11, marginLeft: "auto", background: COLORS.inputBg, padding: "2px 8px", borderRadius: 4 }}>{post.species}</span>}
        </div>

        <div style={{ color: COLORS.bone, fontSize: 13, lineHeight: 1.4 }}>
          <strong>{post.username}</strong> {post.caption}
        </div>

        {post.cook_method && <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 4 }}>🔥 {post.cook_method}{post.internal_temp ? ` · ${post.internal_temp}°F` : ""}</div>}

        {/* Expandable ratings */}
        {post.crust_score && (
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setShowRatings(!showRatings)} style={{ background: "none", border: "none", color: COLORS.orange, fontSize: 11, cursor: "pointer", padding: 0, fontWeight: 600 }}>
              {showRatings ? "Hide ratings ▲" : "View ratings ▼"}
            </button>
            {showRatings && (
              <div style={{ marginTop: 8 }}>
                <RatingBar label="Crust" value={post.crust_score} />
                <RatingBar label="Cook" value={post.cook_score} />
                <RatingBar label="Presentation" value={post.presentation_score} />
              </div>
            )}
          </div>
        )}

        {post.restaurant_name && (
          <div style={{ marginTop: 6, color: COLORS.orange, fontSize: 11 }}>📍 {post.restaurant_name}</div>
        )}

        {/* Comments section */}
        {showComments && (
          <div style={{ marginTop: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
            {loadingComments ? <Spinner /> : comments.map(c => (
              <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <Avatar url={c.profiles?.avatar_url} fallback={c.profiles?.username} size={24} />
                <div style={{ fontSize: 12, color: COLORS.bone }}>
                  <strong style={{ color: COLORS.orange }}>{c.profiles?.username}</strong> {c.content}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && submitComment()} placeholder="Add a comment..." style={{ ...inputStyle, padding: "8px 10px", fontSize: 12, flex: 1 }} />
              <button onClick={submitComment} style={{ background: COLORS.orange, border: "none", borderRadius: 8, color: "white", fontWeight: 700, fontSize: 12, padding: "8px 12px", cursor: "pointer" }}>Post</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Login / Signup ─────────────────────────────────────────────────────────
function AuthPage({ onAuth, toast }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (isSignup && !username)) { toast("Please fill in all fields", "error"); return; }
    setLoading(true);
    try {
      if (isSignup) {
        await supabase.auth.signUp(email, password, username);
        toast("Account created! Welcome to RateMyMeat 🥩", "success");
      } else {
        await supabase.auth.signIn(email, password);
        toast("Welcome back! 🔥", "success");
      }
      onAuth(supabase.auth.getUser());
    } catch (e) {
      toast(e.message, "error");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.darkBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🥩</div>
        <h1 style={{ color: COLORS.bone, fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: -1 }}>RateMyMeat</h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, margin: "8px 0 0" }}>Score it. Post it. Prove it.</p>
      </div>
      <div style={{ width: "100%", maxWidth: 340 }}>
        {isSignup && (
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
        )}
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{ ...inputStyle, marginBottom: 16 }} />
        <button onClick={handleSubmit} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
          {loading ? "..." : isSignup ? "CREATE ACCOUNT" : "LOG IN"}
        </button>
        <button onClick={() => setIsSignup(!isSignup)} style={{ width: "100%", marginTop: 12, background: "none", border: "none", color: COLORS.orange, fontSize: 13, cursor: "pointer" }}>
          {isSignup ? "Already have an account? Log in" : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}

// ── Feed Page ──────────────────────────────────────────────────────────────
function FeedPage({ currentUserId, onProfileClick, toast }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState("trending");
  const [filterCat, setFilterCat] = useState("all");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      let order = "created_at";
      if (feedTab === "top") order = "overall_score";
      const data = await supabase.rest("post_feed", {
        query: `${filterCat !== "all" ? `category=eq.${filterCat}&` : ""}order=${order}.desc.nullslast&limit=50`
      });
      // Check which posts the current user has liked
      let likedPostIds = new Set();
      if (currentUserId && data?.length) {
        const likes = await supabase.rest("likes", {
          query: `user_id=eq.${currentUserId}&post_id=in.(${data.map(p => p.id).join(",")})`
        });
        likedPostIds = new Set((likes || []).map(l => l.post_id));
      }
      setPosts((data || []).map(p => ({ ...p, user_liked: likedPostIds.has(p.id) })));
    } catch (e) {
      console.error(e);
      toast?.("Failed to load feed", "error");
    }
    setLoading(false);
  }, [feedTab, filterCat, currentUserId, toast]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleLikeToggle = async (postId, isLiked) => {
    if (!currentUserId) return;
    try {
      if (isLiked) {
        await supabase.rest("likes", { method: "DELETE", query: `user_id=eq.${currentUserId}&post_id=eq.${postId}` });
      } else {
        await supabase.rest("likes", { method: "POST", body: { user_id: currentUserId, post_id: postId } });
      }
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, user_liked: !isLiked, like_count: isLiked ? Math.max(0, (p.like_count || 0) - 1) : (p.like_count || 0) + 1 } : p));
    } catch (e) { console.error(e); }
  };

  const sorted = [...posts].sort((a, b) => {
    if (feedTab === "trending") return (b.like_count || 0) - (a.like_count || 0);
    return 0; // DB already sorted
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", overflowX: "auto" }}>
        {[["all", "All"], ["steak", "🥩 Steak"], ["hunting", "🦌 Hunting"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilterCat(k)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${filterCat === k ? COLORS.orange : COLORS.border}`, background: filterCat === k ? `${COLORS.orange}22` : "transparent", color: filterCat === k ? COLORS.orange : COLORS.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>
        ))}
      </div>
      <TabBar tabs={[{ key: "trending", label: "🔥 Trending" }, { key: "new", label: "🆕 New" }, { key: "top", label: "🏆 Top Rated" }]} active={feedTab} onChange={setFeedTab} />
      <div style={{ padding: "12px 16px" }}>
        {loading ? <Spinner /> : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: COLORS.textMuted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🥩</div>
            <div style={{ fontWeight: 700 }}>No posts yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Be the first to rate some meat!</div>
          </div>
        ) : sorted.map(p => (
          <PostCard key={p.id} post={p} currentUserId={currentUserId} onProfileClick={onProfileClick} onLikeToggle={handleLikeToggle} />
        ))}
      </div>
    </div>
  );
}

// ── Create Post ────────────────────────────────────────────────────────────
function CreatePostPage({ currentUserId, onPost, toast }) {
  const [category, setCategory] = useState("steak");
  const [subcategory, setSubcategory] = useState("home");
  const [caption, setCaption] = useState("");
  const [cutType, setCutType] = useState("");
  const [cookMethod, setCookMethod] = useState("");
  const [internalTemp, setInternalTemp] = useState("");
  const [species, setSpecies] = useState("");
  const [trophyScore, setTrophyScore] = useState("");
  const [location, setLocation] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [crust, setCrust] = useState(8);
  const [cook, setCook] = useState(8);
  const [pres, setPres] = useState(8);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast("Image must be under 10MB", "error"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!imageFile) { toast("Please add a photo", "error"); return; }
    if (category === "steak" && subcategory === "restaurant" && !restaurantName) { toast("Please enter the restaurant name", "error"); return; }
    setLoading(true);
    try {
      // Upload image
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `${currentUserId}/${Date.now()}.${ext}`;
      await supabase.storage.upload("post-images", path, imageFile);
      const image_url = supabase.storage.getPublicUrl("post-images", path);

      const overall = category === "steak" ? +((crust + cook + pres) / 3).toFixed(1) : null;

      const postData = {
        user_id: currentUserId,
        image_url,
        category,
        subcategory: category === "steak" ? subcategory : null,
        caption,
        location: location || null,
        restaurant_name: (category === "steak" && subcategory === "restaurant") ? restaurantName : null,
        cut_type: category === "steak" ? cutType : null,
        cook_method: category === "steak" ? cookMethod : null,
        internal_temp: (category === "steak" && internalTemp) ? parseInt(internalTemp) : null,
        species: category === "hunting" ? species : null,
        trophy_score: (category === "hunting" && trophyScore) ? parseInt(trophyScore) : null,
        crust_score: category === "steak" ? crust : null,
        cook_score: category === "steak" ? cook : null,
        presentation_score: category === "steak" ? pres : null,
        overall_score: overall,
      };

      await supabase.rest("posts", { method: "POST", body: postData });
      toast("Posted! 🔥", "success");
      onPost?.();
    } catch (e) {
      toast(e.message || "Failed to create post", "error");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: COLORS.bone, margin: "0 0 16px", fontSize: 20, fontWeight: 900 }}>New Post</h2>

      {/* Image upload */}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
      <div onClick={() => fileRef.current?.click()} style={{ width: "100%", aspectRatio: "4/3", background: imagePreview ? `url(${imagePreview}) center/cover` : COLORS.inputBg, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 16, border: `2px dashed ${COLORS.border}`, cursor: "pointer", overflow: "hidden" }}>
        {!imagePreview && <>
          <span style={{ fontSize: 40, marginBottom: 8 }}>📷</span>
          <span style={{ color: COLORS.textMuted, fontSize: 13 }}>Tap to add photo</span>
        </>}
      </div>

      <label style={labelStyle}>CATEGORY</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[["steak", "🥩 Steak"], ["hunting", "🦌 Hunting"]].map(([k, l]) => (
          <button key={k} onClick={() => setCategory(k)} style={{ flex: 1, padding: 10, borderRadius: 8, border: `2px solid ${category === k ? COLORS.orange : COLORS.border}`, background: category === k ? `${COLORS.orange}15` : "transparent", color: category === k ? COLORS.orange : COLORS.textMuted, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {category === "steak" && (
        <>
          <label style={labelStyle}>TYPE</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[["home", "🏠 Home"], ["restaurant", "🍽 Restaurant"]].map(([k, l]) => (
              <button key={k} onClick={() => setSubcategory(k)} style={{ flex: 1, padding: 8, borderRadius: 8, border: `1px solid ${subcategory === k ? COLORS.orange : COLORS.border}`, background: subcategory === k ? `${COLORS.orange}15` : "transparent", color: subcategory === k ? COLORS.orange : COLORS.textMuted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{l}</button>
            ))}
          </div>

          {subcategory === "restaurant" && (
            <><label style={labelStyle}>RESTAURANT NAME</label>
            <input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} placeholder="e.g. Pappas Bros Steakhouse" style={{ ...inputStyle, marginBottom: 12 }} /></>
          )}

          <label style={labelStyle}>CUT TYPE</label>
          <select value={cutType} onChange={e => setCutType(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }}>
            <option value="">Select cut...</option>
            {CUTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <label style={labelStyle}>COOK METHOD</label>
          <select value={cookMethod} onChange={e => setCookMethod(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }}>
            <option value="">Select method...</option>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <label style={labelStyle}>INTERNAL TEMP (°F, optional)</label>
          <input type="number" value={internalTemp} onChange={e => setInternalTemp(e.target.value)} placeholder="e.g. 130" style={{ ...inputStyle, marginBottom: 12 }} />

          <label style={labelStyle}>YOUR RATINGS</label>
          <div style={{ background: COLORS.inputBg, borderRadius: 10, padding: 14, marginBottom: 12 }}>
            {[["Crust", crust, setCrust], ["Cook Accuracy", cook, setCook], ["Presentation", pres, setPres]].map(([label, val, setter]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: COLORS.textMuted, fontSize: 12 }}>{label}</span>
                  <span style={{ color: COLORS.orange, fontWeight: 800, fontSize: 14 }}>{val}</span>
                </div>
                <input type="range" min="1" max="10" step="0.5" value={val} onChange={e => setter(+e.target.value)} style={{ width: "100%", accentColor: COLORS.orange }} />
              </div>
            ))}
            <div style={{ textAlign: "center", marginTop: 8, padding: 8, background: COLORS.cardBg, borderRadius: 8 }}>
              <span style={{ color: COLORS.textMuted, fontSize: 11 }}>OVERALL</span>
              <div style={{ color: COLORS.orange, fontSize: 28, fontWeight: 900 }}>{((crust + cook + pres) / 3).toFixed(1)}</div>
            </div>
          </div>
        </>
      )}

      {category === "hunting" && (
        <>
          <label style={labelStyle}>SPECIES</label>
          <select value={species} onChange={e => setSpecies(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }}>
            <option value="">Select species...</option>
            {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <label style={labelStyle}>TROPHY SCORE (optional)</label>
          <input type="number" value={trophyScore} onChange={e => setTrophyScore(e.target.value)} placeholder='e.g. 165"' style={{ ...inputStyle, marginBottom: 12 }} />
        </>
      )}

      <label style={labelStyle}>LOCATION (optional)</label>
      <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Austin, TX" style={{ ...inputStyle, marginBottom: 12 }} />

      <label style={labelStyle}>CAPTION</label>
      <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Describe your meat..." rows={3} style={{ ...inputStyle, resize: "vertical", marginBottom: 16 }} />

      <button onClick={handleSubmit} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Posting..." : "POST 🔥"}
      </button>
    </div>
  );
}

// ── Leaderboard ────────────────────────────────────────────────────────────
function LeaderboardPage({ onProfileClick, toast }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (tab === "users") {
          const data = await supabase.rest("user_leaderboard", { query: "order=avg_score.desc.nullslast&limit=50" });
          setUsers(data || []);
        } else {
          const data = await supabase.rest("restaurant_leaderboard", { query: "order=avg_score.desc.nullslast&limit=50" });
          setRestaurants(data || []);
        }
      } catch (e) { console.error(e); toast?.("Failed to load leaderboard", "error"); }
      setLoading(false);
    };
    load();
  }, [tab, toast]);

  const medalColor = (i) => i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : COLORS.textMuted;

  return (
    <div>
      <h2 style={{ color: COLORS.bone, padding: "16px 16px 0", margin: 0, fontSize: 20, fontWeight: 900 }}>🏆 Leaderboard</h2>
      <TabBar tabs={[{ key: "users", label: "Grillers" }, { key: "restaurants", label: "Restaurants" }]} active={tab} onChange={setTab} />
      <div style={{ padding: 16 }}>
        {loading ? <Spinner /> : tab === "users" ? (
          users.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: COLORS.textMuted }}>No ranked users yet. Start posting!</div> :
          users.map((u, i) => (
            <div key={u.id} onClick={() => onProfileClick?.(u.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: COLORS.cardBg, borderRadius: 10, marginBottom: 8, cursor: "pointer", border: i === 0 ? "1px solid #FFD70055" : "none" }}>
              <span style={{ color: medalColor(i), fontWeight: 900, fontSize: 18, width: 28, textAlign: "center" }}>{i + 1}</span>
              <Avatar url={u.avatar_url} fallback={u.username} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ color: COLORS.bone, fontWeight: 700, fontSize: 14 }}>{u.username}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 11 }}>{u.total_posts} posts{u.location ? ` · ${u.location}` : ""}</div>
              </div>
              <ScoreBadge score={u.avg_score} />
            </div>
          ))
        ) : (
          restaurants.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: COLORS.textMuted }}>No restaurant ratings yet.</div> :
          restaurants.map((r, i) => (
            <div key={r.restaurant_name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: COLORS.cardBg, borderRadius: 10, marginBottom: 8, border: i === 0 ? "1px solid #FFD70055" : "none" }}>
              <span style={{ color: medalColor(i), fontWeight: 900, fontSize: 18, width: 28, textAlign: "center" }}>{i + 1}</span>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: COLORS.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🍽</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: COLORS.bone, fontWeight: 700, fontSize: 14 }}>{r.restaurant_name}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 11 }}>📍 {r.location} · {r.total_reviews} reviews</div>
              </div>
              <ScoreBadge score={r.avg_score} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Profile ────────────────────────────────────────────────────────────────
function ProfilePage({ userId, isOwnProfile, currentUserId, onProfileClick, toast }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const p = await supabase.rest("profiles", { query: `id=eq.${userId}`, single: true });
        setProfile(p);
        setEditBio(p?.bio || "");
        setEditLocation(p?.location || "");

        const userPosts = await supabase.rest("post_feed", { query: `user_id=eq.${userId}&order=created_at.desc` });
        setPosts(userPosts || []);

        // Follower/following counts
        const followers = await supabase.rest("follows", { query: `following_id=eq.${userId}&select=id` });
        const following = await supabase.rest("follows", { query: `follower_id=eq.${userId}&select=id` });
        setFollowerCount(followers?.length || 0);
        setFollowingCount(following?.length || 0);

        if (currentUserId && currentUserId !== userId) {
          const f = await supabase.rest("follows", { query: `follower_id=eq.${currentUserId}&following_id=eq.${userId}&select=id` });
          setIsFollowing(f?.length > 0);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [userId, currentUserId]);

  const toggleFollow = async () => {
    if (!currentUserId) return;
    try {
      if (isFollowing) {
        await supabase.rest("follows", { method: "DELETE", query: `follower_id=eq.${currentUserId}&following_id=eq.${userId}` });
        setFollowerCount(c => Math.max(0, c - 1));
      } else {
        await supabase.rest("follows", { method: "POST", body: { follower_id: currentUserId, following_id: userId } });
        setFollowerCount(c => c + 1);
      }
      setIsFollowing(!isFollowing);
    } catch (e) { console.error(e); }
  };

  const saveProfile = async () => {
    try {
      await supabase.rest("profiles", { method: "PATCH", query: `id=eq.${userId}`, body: { bio: editBio, location: editLocation } });
      setProfile(prev => ({ ...prev, bio: editBio, location: editLocation }));
      setEditMode(false);
      toast("Profile updated!", "success");
    } catch (e) { toast(e.message, "error"); }
  };

  if (loading) return <Spinner />;
  if (!profile) return <div style={{ textAlign: "center", padding: 40, color: COLORS.textMuted }}>User not found</div>;

  const steakPosts = posts.filter(p => p.overall_score);
  const avgScore = steakPosts.length ? (steakPosts.reduce((s, p) => s + Number(p.overall_score), 0) / steakPosts.length).toFixed(1) : "–";

  return (
    <div>
      <div style={{ padding: "24px 16px", textAlign: "center" }}>
        <Avatar url={profile.avatar_url} fallback={profile.username} size={72} />
        <h2 style={{ color: COLORS.bone, margin: "10px 0 4px", fontSize: 20, fontWeight: 900 }}>{profile.username}</h2>

        {editMode ? (
          <div style={{ maxWidth: 280, margin: "0 auto", textAlign: "left" }}>
            <label style={labelStyle}>BIO</label>
            <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={2} style={{ ...inputStyle, marginBottom: 8, fontSize: 12 }} />
            <label style={labelStyle}>LOCATION</label>
            <input value={editLocation} onChange={e => setEditLocation(e.target.value)} style={{ ...inputStyle, marginBottom: 10, fontSize: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveProfile} style={{ flex: 1, padding: 8, background: COLORS.orange, border: "none", borderRadius: 6, color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Save</button>
              <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: 8, background: COLORS.inputBg, border: "none", borderRadius: 6, color: COLORS.textMuted, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0 }}>{profile.bio || "No bio yet"}</p>
            {profile.location && <p style={{ color: COLORS.textMuted, fontSize: 11, margin: "4px 0 0" }}>📍 {profile.location}</p>}
          </>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
          {[["Posts", posts.length], ["Avg Score", avgScore], ["Followers", followerCount], ["Following", followingCount]].map(([l, v]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ color: COLORS.bone, fontWeight: 900, fontSize: 18 }}>{v}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 10 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          {isOwnProfile ? (
            <button onClick={() => setEditMode(true)} style={{ padding: "8px 24px", background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.bone, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Edit Profile</button>
          ) : (
            <button onClick={toggleFollow} style={{ padding: "8px 24px", background: isFollowing ? COLORS.inputBg : `linear-gradient(135deg, ${COLORS.red}, ${COLORS.orange})`, border: isFollowing ? `1px solid ${COLORS.border}` : "none", borderRadius: 8, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {isFollowing ? "Following ✓" : "Follow"}
            </button>
          )}
        </div>
      </div>

      {/* Post grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, padding: "0 2px" }}>
        {posts.map(p => (
          <div key={p.id} style={{ aspectRatio: "1", background: COLORS.inputBg, position: "relative", overflow: "hidden" }}>
            {p.image_url ? (
              <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 28, opacity: 0.2 }}>{p.category === "hunting" ? "🦌" : "🥩"}</span>
              </div>
            )}
            {p.overall_score && <div style={{ position: "absolute", bottom: 3, right: 3 }}><ScoreBadge score={p.overall_score} size="sm" /></div>}
          </div>
        ))}
      </div>

      {posts.length === 0 && <div style={{ textAlign: "center", padding: 40, color: COLORS.textMuted, fontSize: 13 }}>No posts yet</div>}
    </div>
  );
}

// ── Search ─────────────────────────────────────────────────────────────────
function SearchPage({ onProfileClick, toast }) {
  const [query, setQuery] = useState("");
  const [searchTab, setSearchTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      if (searchTab === "posts") {
        const q = query ? `or=(caption.ilike.*${query}*,cut_type.ilike.*${query}*,species.ilike.*${query}*,restaurant_name.ilike.*${query}*)&` : "";
        const data = await supabase.rest("post_feed", { query: `${q}order=created_at.desc&limit=30` });
        setPosts(data || []);
      } else {
        const q = query ? `username=ilike.*${query}*&` : "";
        const data = await supabase.rest("profiles", { query: `${q}order=created_at.desc&limit=30` });
        setUsers(data || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query, searchTab]);

  useEffect(() => { const t = setTimeout(search, 300); return () => clearTimeout(t); }, [search]);

  return (
    <div style={{ padding: "12px 16px" }}>
      <input placeholder="Search cuts, users, restaurants..." value={query} onChange={e => setQuery(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
      <TabBar tabs={[{ key: "posts", label: "Posts" }, { key: "users", label: "Users" }]} active={searchTab} onChange={setSearchTab} />
      <div style={{ marginTop: 12 }}>
        {loading ? <Spinner /> : searchTab === "posts" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
            {posts.map(p => (
              <div key={p.id} style={{ aspectRatio: "1", background: COLORS.inputBg, position: "relative", overflow: "hidden", borderRadius: 4 }}>
                {p.image_url ? <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 24, opacity: 0.2 }}>{p.category === "hunting" ? "🦌" : "🥩"}</span></div>}
                {p.overall_score && <div style={{ position: "absolute", bottom: 3, right: 3 }}><ScoreBadge score={p.overall_score} size="sm" /></div>}
              </div>
            ))}
          </div>
        ) : (
          users.map(u => (
            <div key={u.id} onClick={() => onProfileClick?.(u.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", cursor: "pointer", borderBottom: `1px solid ${COLORS.border}` }}>
              <Avatar url={u.avatar_url} fallback={u.username} size={40} />
              <div>
                <div style={{ color: COLORS.bone, fontWeight: 700, fontSize: 14 }}>{u.username}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 12 }}>{u.bio || u.location || "RateMyMeat member"}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────────────────
function SettingsPage({ onLogout }) {
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: COLORS.bone, margin: "0 0 16px", fontSize: 20, fontWeight: 900 }}>Settings</h2>
      <div style={{ background: COLORS.cardBg, borderRadius: 10, overflow: "hidden" }}>
        {["Account", "Notifications", "Privacy", "Help & Support", "About RateMyMeat"].map(item => (
          <div key={item} style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: COLORS.bone, fontSize: 14 }}>{item}</span>
            <span style={{ color: COLORS.textMuted }}>›</span>
          </div>
        ))}
      </div>
      <button onClick={onLogout} style={{ width: "100%", marginTop: 24, padding: 14, background: "transparent", border: `1px solid ${COLORS.red}`, borderRadius: 8, color: COLORS.red, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Log Out
      </button>
      <p style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 11, marginTop: 24 }}>RateMyMeat v1.0 MVP Beta</p>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function RateMyMeat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("feed");
  const [viewingUserId, setViewingUserId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [restoring, setRestoring] = useState(true);

  const toast = useCallback((message, type = "info") => setToastMsg({ message, type, key: Date.now() }), []);

  // Restore session on mount
  useEffect(() => {
    const user = supabase.auth.restore();
    if (user) setCurrentUser(user);
    setRestoring(false);
  }, []);

  const handleProfileClick = useCallback((userId) => {
    setViewingUserId(userId);
    setPage("profile");
  }, []);

  const handleLogout = () => {
    supabase.auth.signOut();
    setCurrentUser(null);
    setPage("feed");
  };

  if (restoring) return <div style={{ background: COLORS.darkBg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  if (!currentUser) return (
    <>
      <AuthPage onAuth={(user) => { setCurrentUser(user); setPage("feed"); }} toast={toast} />
      {toastMsg && <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(null)} key={toastMsg.key} />}
    </>
  );

  const profileUserId = page === "profile" ? (viewingUserId || currentUser.id) : currentUser.id;
  const isOwnProfile = profileUserId === currentUser.id;

  return (
    <div style={{ background: COLORS.darkBg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", position: "relative", paddingBottom: 70 }}>
      {/* Top Bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: `${COLORS.darkBg}ee`, backdropFilter: "blur(10px)", borderBottom: `1px solid ${COLORS.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🥩</span>
          <span style={{ color: COLORS.bone, fontWeight: 900, fontSize: 18, letterSpacing: -0.5 }}>RateMyMeat</span>
        </div>
        <span style={{ color: COLORS.orange, fontSize: 11, fontWeight: 700, background: `${COLORS.orange}22`, padding: "3px 8px", borderRadius: 4 }}>MVP BETA</span>
      </div>

      {/* Content */}
      {page === "feed" && <FeedPage currentUserId={currentUser.id} onProfileClick={handleProfileClick} toast={toast} />}
      {page === "search" && <SearchPage onProfileClick={handleProfileClick} toast={toast} />}
      {page === "create" && <CreatePostPage currentUserId={currentUser.id} onPost={() => setPage("feed")} toast={toast} />}
      {page === "leaderboard" && <LeaderboardPage onProfileClick={handleProfileClick} toast={toast} />}
      {page === "profile" && <ProfilePage userId={profileUserId} isOwnProfile={isOwnProfile} currentUserId={currentUser.id} onProfileClick={handleProfileClick} toast={toast} />}
      {page === "settings" && <SettingsPage onLogout={handleLogout} />}

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: `${COLORS.cardBg}ee`, backdropFilter: "blur(10px)", borderTop: `1px solid ${COLORS.border}`, display: "flex", zIndex: 100 }}>
        {[
          { key: "feed", icon: "🏠", label: "Feed" },
          { key: "search", icon: "🔍", label: "Search" },
          { key: "create", icon: "➕", label: "Post" },
          { key: "leaderboard", icon: "🏆", label: "Ranks" },
          { key: "profile", icon: "👤", label: "Me" },
        ].map(n => (
          <button key={n.key} onClick={() => { setPage(n.key); if (n.key === "profile") setViewingUserId(null); }} style={{ flex: 1, padding: "8px 0 6px", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: n.key === "create" ? 24 : 18, filter: page === n.key ? "none" : "grayscale(0.8) opacity(0.5)" }}>{n.icon}</span>
            <span style={{ fontSize: 9, color: page === n.key ? COLORS.orange : COLORS.textMuted, fontWeight: 700 }}>{n.label}</span>
          </button>
        ))}
      </div>

      {toastMsg && <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(null)} key={toastMsg.key} />}
    </div>
  );
}
