import { useState, useEffect, useCallback, useRef } from "react";

// ‚îÄ‚îÄ Supabase Config ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
const SUPABASE_URL = "https://lkoukaktzjhvczhhxmxl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb3VrYWt0empodmN6aGh4bXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNzY0NDIsImV4cCI6MjA4Njk1MjQ0Mn0._APrpolybMG96gybs_yj4QQNZOzkDDJiMPe7PKd9N-A";

function createClient(url, key) {
  let accessToken = null, refreshToken = null, currentUser = null;
  const hdrs = () => ({ "apikey": key, "Authorization": `Bearer ${accessToken || key}`, "Content-Type": "application/json", "Prefer": "return=representation" });

  const rest = async (table, { method = "GET", body, query = "", single = false } = {}) => {
    const h = { ...hdrs() };
    if (method === "POST" || method === "PATCH") h["Prefer"] = "return=representation";
    const res = await fetch(`${url}/rest/v1/${table}${query ? "?" + query : ""}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || err.msg || "API error " + res.status); }
    const data = await res.json().catch(() => null);
    return single && Array.isArray(data) ? data[0] || null : data;
  };

  const auth = {
    signUp: async (email, password, username) => {
      const res = await fetch(`${url}/auth/v1/signup`, { method: "POST", headers: { "apikey": key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password, data: { username } }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || data.error);
      if (data.access_token) { accessToken = data.access_token; refreshToken = data.refresh_token; currentUser = data.user; localStorage.setItem("rmm_session", JSON.stringify({ accessToken, refreshToken, user: currentUser })); }
      return data;
    },
    signIn: async (email, password) => {
      const res = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: "POST", headers: { "apikey": key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error_description || data.error.message || data.error);
      accessToken = data.access_token; refreshToken = data.refresh_token; currentUser = data.user;
      localStorage.setItem("rmm_session", JSON.stringify({ accessToken, refreshToken, user: currentUser }));
      return data;
    },
    signOut: () => { accessToken = null; refreshToken = null; currentUser = null; localStorage.removeItem("rmm_session"); },
    getUser: () => currentUser,
    restore: () => { try { const s = JSON.parse(localStorage.getItem("rmm_session")); if (s) { accessToken = s.accessToken; refreshToken = s.refreshToken; currentUser = s.user; } return currentUser; } catch { return null; } },
  };

  const storage = {
    upload: async (bucket, path, file) => {
      const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, { method: "POST", headers: { "apikey": key, "Authorization": `Bearer ${accessToken || key}` }, body: file });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Upload failed"); }
      return { path };
    },
    getPublicUrl: (bucket, path) => `${url}/storage/v1/object/public/${bucket}/${path}`,
  };
  return { rest, auth, storage };
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ‚îÄ‚îÄ Design Tokens (Cream / Serif / Premium) ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
const C = {
  bg: "#F5F0E8", card: "#FFFFFF", cardAlt: "#FAF7F2", border: "#E8E0D4",
  text: "#2C2218", textSec: "#7A6F63", textMuted: "#A89E93",
  accent: "#8B2020", accentLight: "#B03030", gold: "#C49A2A",
  green: "#4A7A3E", greenBg: "#EDF5EA", inputBg: "#FAF7F2", inputBorder: "#D4C9B8",
  white: "#FFFFFF", success: "#4A7A3E", error: "#8B2020",
};
const serif = "Georgia, 'Times New Roman', serif";
const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const CUTS = ["Ribeye","NY Strip","Filet Mignon","Tomahawk","Brisket","T-Bone","Tri-Tip","Wagyu A5","Porterhouse","Flank","Picanha","Chuck Eye","Skirt Steak"];
const METHODS = ["Charcoal Grill","Cast Iron","Smoker","Reverse Sear","Sous Vide","Open Fire","Pellet Grill","Gas Grill","Broiler"];
const SPECIES = [
  "Whitetail","Mule Deer","Elk","Moose","Antelope","Bear","Wild Hog","Javelina","Mountain Lion","Bighorn Sheep",
  "Axis Deer","Nilgai","Gemsbok","Sable Antelope","Nyala","Kudu","Eland","Oryx","Scimitar Oryx","Addax",
  "Blackbuck","Fallow Deer","Red Deer","Sika Deer","Pere David's Deer","Aoudad (Barbary Sheep)","Ibex",
  "Waterbuck","Bongo","Wildebeest","Springbok","Impala","Markhor","Transcaspian Urial",
  "Red Lechwe","Zebra","Water Buffalo","Corsican Ram","Texas Dall Ram","Catalina Goat","Four Horn Ram",
  "Wild Turkey","Pheasant","Quail","Dove","Duck","Goose","Sandhill Crane","Chukar","Grouse","Pigeon",
  "Coyote","Bobcat","Fox","Raccoon","Armadillo","Rattlesnake","Feral Cat",
  "Alligator","Rabbit","Squirrel","Prairie Dog",
].sort();

// ‚îÄ‚îÄ Styles ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
const inputStyle = { width: "100%", padding: "12px 14px", background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: 10, color: C.text, fontSize: 14, fontFamily: sans, outline: "none", boxSizing: "border-box" };
const labelStyle = { color: C.textSec, fontSize: 11, fontWeight: 600, fontFamily: sans, marginBottom: 5, display: "block", letterSpacing: 1, textTransform: "uppercase" };

// ‚îÄ‚îÄ Searchable Species Input ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
function SearchableSelect({ options, value, onChange, placeholder }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const filtered = q ? options.filter(o => o.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : options.slice(0, 8);
  useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: 14 }}>
      <input value={open ? q : value} onChange={e => { setQ(e.target.value); onChange(""); setOpen(true); }} onFocus={() => { setOpen(true); setQ(value || ""); }}
        placeholder={placeholder} style={{ ...inputStyle, borderColor: open ? C.accent : C.inputBorder }} />
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, marginTop: 4, maxHeight: 200, overflowY: "auto", zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
          {filtered.map(o => (
            <div key={o} onClick={() => { onChange(o); setQ(o); setOpen(false); }}
              style={{ padding: "11px 14px", cursor: "pointer", color: C.text, fontSize: 14, fontFamily: sans, borderBottom: `1px solid ${C.border}` }}
              onMouseEnter={e => e.currentTarget.style.background = C.cardAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{o}</div>
          ))}
        </div>
      )}
      {value && !open && <button onClick={() => { onChange(""); setQ(""); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 16 }}>‚úï</button>}
    </div>
  );
}

// ‚îÄ‚îÄ Shared UI ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
function Avatar({ url, fallback, size = 36 }) {
  const bg = C.accent + "22";
  if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${C.border}` }} />;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, color: C.accent, flexShrink: 0, fontWeight: 700, fontFamily: serif, border: `2px solid ${C.border}` }}>{(fallback || "?")[0].toUpperCase()}</div>;
}

function ScoreDisplay({ score, size = "md" }) {
  if (!score && score !== 0) return null;
  const s = Number(score).toFixed(1);
  const fs = size === "lg" ? 22 : size === "sm" ? 12 : 16;
  const color = score >= 9 ? C.gold : score >= 7 ? C.accent : C.textSec;
  return <span style={{ color, fontWeight: 700, fontSize: fs, fontFamily: serif }}>{s}</span>;
}

function CategoryPill({ category, subcategory }) {
  const isH = category === "hunting";
  const label = isH ? "Hunt" : subcategory === "restaurant" ? "Restaurant" : "Home";
  const bg = isH ? C.greenBg : C.cardAlt;
  const color = isH ? C.green : C.textSec;
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, fontFamily: sans, letterSpacing: 0.3 }}>{label}</span>;
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", borderBottom: `2px solid ${C.border}`, marginBottom: 0 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          flex: 1, padding: "14px 0 12px", background: "none", border: "none",
          borderBottom: active === t.key ? `3px solid ${C.accent}` : "3px solid transparent",
          color: active === t.key ? C.text : C.textMuted, fontWeight: 600, fontSize: 14,
          cursor: "pointer", fontFamily: sans, transition: "all 0.2s",
        }}>{t.icon && <span style={{ marginRight: 6 }}>{t.icon}</span>}{t.label}</button>
      ))}
    </div>
  );
}

function RatingBar({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ color: C.textSec, fontSize: 12, width: 85, textAlign: "right", fontFamily: sans }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value * 10}%`, height: "100%", background: `linear-gradient(90deg, ${C.accent}, ${C.gold})`, borderRadius: 3 }} />
      </div>
      <span style={{ color: C.text, fontSize: 13, fontWeight: 700, width: 30, fontFamily: serif }}>{Number(value).toFixed(1)}</span>
    </div>
  );
}

function Toast({ message, type = "info", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: type === "error" ? C.error : C.success, color: "white", padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: sans, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>{message}</div>;
}

function Spinner() {
  return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>;
}

// ‚îÄ‚îÄ Post Card ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
function PostCard({ post, currentUserId, onProfileClick, onLikeToggle }) {
  const [showRatings, setShowRatings] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingC, setLoadingC] = useState(false);
  const isLiked = post.user_liked;

  const timeAgo = () => { const d = Math.floor((Date.now() - new Date(post.created_at)) / 86400000); return d === 0 ? "Today" : d === 1 ? "Yesterday" : d + "d ago"; };

  const loadComments = async () => {
    if (!showComments) {
      setShowComments(true); setLoadingC(true);
      try { const data = await supabase.rest("comments", { query: `post_id=eq.${post.id}&select=*,profiles(username,avatar_url)&order=created_at.asc` }); setComments(data || []); } catch (e) { console.error(e); }
      setLoadingC(false);
    } else setShowComments(false);
  };

  const submitComment = async () => {
    if (!newComment.trim() || !currentUserId) return;
    try {
      const data = await supabase.rest("comments", { method: "POST", body: { user_id: currentUserId, post_id: post.id, content: newComment.trim() } });
      if (data?.[0]) { setComments(prev => [...prev, { ...data[0], profiles: { username: "You", avatar_url: null } }]); setNewComment(""); }
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ background: C.card, borderRadius: 14, overflow: "hidden", marginBottom: 14, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 10 }}>
        <div onClick={() => onProfileClick?.(post.user_id)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <Avatar url={post.avatar_url} fallback={post.username} size={36} />
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 14, fontFamily: sans }}>@{post.username}</div>
            <div style={{ color: C.textMuted, fontSize: 11, fontFamily: sans }}>{post.location && `${post.location} ¬∑ `}{timeAgo()}</div>
          </div>
        </div>
        <CategoryPill category={post.category} subcategory={post.subcategory} />
      </div>

      {/* Image */}
      <div style={{ width: "100%", aspectRatio: "4/3", background: C.cardAlt, position: "relative" }}>
        {post.image_url ? <img src={post.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 56, opacity: 0.15 }}>{post.category === "hunting" ? "ü¶å" : "ü•©"}</span>
          </div>}
        {post.overall_score && (
          <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", padding: "6px 14px", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <ScoreDisplay score={post.overall_score} size="lg" />
          </div>
        )}
        {post.trophy_score && (
          <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(255,255,255,0.92)", padding: "6px 14px", borderRadius: 10 }}>
            <span style={{ color: C.gold, fontWeight: 800, fontSize: 15, fontFamily: serif }}>üèÜ {post.trophy_score}"</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <button onClick={() => onLikeToggle?.(post.id, isLiked)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
            <span style={{ color: isLiked ? C.accent : C.textMuted, fontSize: 18 }}>{isLiked ? "‚ô•" : "‚ô°"}</span>
            <span style={{ color: C.text, fontSize: 13, fontWeight: 600, fontFamily: sans }}>{post.like_count || 0}</span>
          </button>
          <button onClick={loadComments} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ color: C.textMuted, fontSize: 13, fontFamily: sans }}>üí¨ {post.comment_count || 0}</span>
          </button>
          {post.cut_type && <span style={{ marginLeft: "auto", color: C.textSec, fontSize: 11, background: C.cardAlt, padding: "3px 10px", borderRadius: 20, fontFamily: sans }}>{post.cut_type}</span>}
          {post.species && <span style={{ marginLeft: "auto", color: C.green, fontSize: 11, background: C.greenBg, padding: "3px 10px", borderRadius: 20, fontFamily: sans }}>{post.species}</span>}
        </div>

        <div style={{ color: C.text, fontSize: 14, lineHeight: 1.5, fontFamily: sans }}>
          <strong>@{post.username}</strong> {post.caption}
        </div>
        {post.cook_method && <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4, fontFamily: sans }}>{post.cook_method}{post.internal_temp ? ` ¬∑ ${post.internal_temp}¬∞F` : ""}</div>}

        {post.crust_score && (
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setShowRatings(!showRatings)} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", padding: 0, fontWeight: 600, fontFamily: sans }}>
              {showRatings ? "Hide ratings ‚ñ≤" : "View ratings ‚ñº"}
            </button>
            {showRatings && <div style={{ marginTop: 8 }}><RatingBar label="Crust" value={post.crust_score} /><RatingBar label="Cook" value={post.cook_score} /><RatingBar label="Presentation" value={post.presentation_score} /></div>}
          </div>
        )}
        {post.restaurant_name && <div style={{ marginTop: 6, color: C.accent, fontSize: 12, fontFamily: sans }}>üìç {post.restaurant_name}</div>}

        {showComments && (
          <div style={{ marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
            {loadingC ? <Spinner /> : comments.map(c => (
              <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <Avatar url={c.profiles?.avatar_url} fallback={c.profiles?.username} size={24} />
                <div style={{ fontSize: 13, color: C.text, fontFamily: sans }}><strong style={{ color: C.accent }}>@{c.profiles?.username}</strong> {c.content}</div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && submitComment()} placeholder="Add a comment..." style={{ ...inputStyle, padding: "8px 12px", fontSize: 13, flex: 1 }} />
              <button onClick={submitComment} style={{ background: C.accent, border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: 12, padding: "8px 14px", cursor: "pointer", fontFamily: sans }}>Post</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ‚îÄ‚îÄ Auth Page ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
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
      if (isSignup) { await supabase.auth.signUp(email, password, username); toast("Account created! Welcome to Rate My Meat", "success"); }
      else { await supabase.auth.signIn(email, password); toast("Welcome back!", "success"); }
      onAuth(supabase.auth.getUser());
    } catch (e) { toast(e.message, "error"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: sans }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.accent + "18", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: `2px solid ${C.accent}33` }}>
          <span style={{ fontSize: 28 }}>ü•©</span>
        </div>
        <h1 style={{ color: C.text, fontSize: 36, fontWeight: 400, margin: 0, fontFamily: serif }}>Rate My Meat</h1>
        <p style={{ color: C.textSec, fontSize: 14, margin: "8px 0 0", fontStyle: "italic", fontFamily: serif }}>Score it. Post it. Prove it.</p>
      </div>
      <div style={{ width: "100%", maxWidth: 340 }}>
        {isSignup && <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />}
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{ ...inputStyle, marginBottom: 16 }} />
        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: 14, background: C.accent, border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: sans, opacity: loading ? 0.6 : 1, letterSpacing: 0.3 }}>
          {loading ? "..." : isSignup ? "CREATE ACCOUNT" : "LOG IN"}
        </button>
        <button onClick={() => setIsSignup(!isSignup)} style={{ width: "100%", marginTop: 12, background: "none", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", fontFamily: sans }}>
          {isSignup ? "Already have an account? Log in" : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}

// ‚îÄ‚îÄ Feed Page ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
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
      const data = await supabase.rest("post_feed", { query: `${filterCat !== "all" ? `category=eq.${filterCat}&` : ""}order=${order}.desc.nullslast&limit=50` });
      let likedPostIds = new Set();
      if (currentUserId && data?.length) {
        const likes = await supabase.rest("likes", { query: `user_id=eq.${currentUserId}&post_id=in.(${data.map(p => p.id).join(",")})` });
        likedPostIds = new Set((likes || []).map(l => l.post_id));
      }
      setPosts((data || []).map(p => ({ ...p, user_liked: likedPostIds.has(p.id) })));
    } catch (e) { console.error(e); toast?.("Failed to load feed", "error"); }
    setLoading(false);
  }, [feedTab, filterCat, currentUserId, toast]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleLikeToggle = async (postId, isLiked) => {
    if (!currentUserId) return;
    try {
      if (isLiked) await supabase.rest("likes", { method: "DELETE", query: `user_id=eq.${currentUserId}&post_id=eq.${postId}` });
      else await supabase.rest("likes", { method: "POST", body: { user_id: currentUserId, post_id: postId } });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, user_liked: !isLiked, like_count: isLiked ? Math.max(0, (p.like_count || 0) - 1) : (p.like_count || 0) + 1 } : p));
    } catch (e) { console.error(e); }
  };

  const sorted = [...posts].sort((a, b) => feedTab === "trending" ? (b.like_count || 0) - (a.like_count || 0) : 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, padding: "14px 16px 8px", overflowX: "auto" }}>
        {[["all", "All"], ["steak", "Steak"], ["hunting", "Hunting"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilterCat(k)} style={{ padding: "7px 16px", borderRadius: 20, border: `1.5px solid ${filterCat === k ? C.accent : C.border}`, background: filterCat === k ? C.accent + "10" : "transparent", color: filterCat === k ? C.accent : C.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: sans }}>{l}</button>
        ))}
      </div>
      <TabBar tabs={[{ key: "trending", label: "Trending", icon: "üî•" }, { key: "new", label: "New" }, { key: "top", label: "Top Rated", icon: "üèÜ" }]} active={feedTab} onChange={setFeedTab} />
      <div style={{ padding: "14px 16px" }}>
        {loading ? <Spinner /> : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: 50, color: C.textMuted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>ü•©</div>
            <div style={{ fontWeight: 600, fontFamily: sans }}>No posts yet</div>
            <div style={{ fontSize: 13, marginTop: 4, fontFamily: serif, fontStyle: "italic" }}>Be the first to rate some meat</div>
          </div>
        ) : sorted.map(p => <PostCard key={p.id} post={p} currentUserId={currentUserId} onProfileClick={onProfileClick} onLikeToggle={handleLikeToggle} />)}
      </div>
    </div>
  );
}

// ‚îÄ‚îÄ Create Post ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
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
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `${currentUserId}/${Date.now()}.${ext}`;
      await supabase.storage.upload("post-images", path, imageFile);
      const image_url = supabase.storage.getPublicUrl("post-images", path);
      const overall = category === "steak" ? +((crust + cook + pres) / 3).toFixed(1) : null;
      await supabase.rest("posts", { method: "POST", body: {
        user_id: currentUserId, image_url, category, subcategory: category === "steak" ? subcategory : null,
        caption, location: location || null, restaurant_name: (category === "steak" && subcategory === "restaurant") ? restaurantName : null,
        cut_type: category === "steak" ? cutType : null, cook_method: category === "steak" ? cookMethod : null,
        internal_temp: (category === "steak" && internalTemp) ? parseInt(internalTemp) : null,
        species: category === "hunting" ? species : null, trophy_score: (category === "hunting" && trophyScore) ? parseInt(trophyScore) : null,
        crust_score: category === "steak" ? crust : null, cook_score: category === "steak" ? cook : null,
        presentation_score: category === "steak" ? pres : null, overall_score: overall,
      }});
      toast("Posted! üî•", "success");
      onPost?.();
    } catch (e) { toast(e.message || "Failed to create post", "error"); }
    setLoading(false);
  };

  return (
    <div style={{ padding: 16, fontFamily: sans }}>
      <h2 style={{ color: C.text, margin: "0 0 4px", fontSize: 28, fontWeight: 400, fontFamily: serif }}>New Post</h2>
      <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 18px", fontStyle: "italic", fontFamily: serif }}>Share your latest cook or harvest</p>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
      <div onClick={() => fileRef.current?.click()} style={{ width: "100%", aspectRatio: "4/3", background: imagePreview ? `url(${imagePreview}) center/cover` : C.cardAlt, borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 18, border: `2px dashed ${C.border}`, cursor: "pointer", overflow: "hidden" }}>
        {!imagePreview && <><span style={{ fontSize: 36, marginBottom: 6 }}>üì∑</span><span style={{ color: C.textMuted, fontSize: 13 }}>Tap to add photo</span></>}
      </div>

      <label style={labelStyle}>Category</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["steak", "ü•© Steak"], ["hunting", "ü¶å Hunting"]].map(([k, l]) => (
          <button key={k} onClick={() => setCategory(k)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `2px solid ${category === k ? C.accent : C.border}`, background: category === k ? C.accent + "0C" : "transparent", color: category === k ? C.accent : C.textMuted, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: sans }}>{l}</button>
        ))}
      </div>

      {category === "steak" && (<>
        <label style={labelStyle}>Type</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["home", "üè† Home"], ["restaurant", "üçΩ Restaurant"]].map(([k, l]) => (
            <button key={k} onClick={() => setSubcategory(k)} style={{ flex: 1, padding: 9, borderRadius: 10, border: `1.5px solid ${subcategory === k ? C.accent : C.border}`, background: subcategory === k ? C.accent + "0C" : "transparent", color: subcategory === k ? C.accent : C.textMuted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: sans }}>{l}</button>
          ))}
        </div>
        {subcategory === "restaurant" && <><label style={labelStyle}>Restaurant Name</label><input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} placeholder="e.g. Pappas Bros Steakhouse" style={{ ...inputStyle, marginBottom: 14 }} /></>}
        <label style={labelStyle}>Cut Type</label>
        <select value={cutType} onChange={e => setCutType(e.target.value)} style={{ ...inputStyle, marginBottom: 14 }}><option value="">Select cut...</option>{CUTS.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <label style={labelStyle}>Cook Method</label>
        <select value={cookMethod} onChange={e => setCookMethod(e.target.value)} style={{ ...inputStyle, marginBottom: 14 }}><option value="">Select method...</option>{METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <label style={labelStyle}>Internal Temp ¬∞F (optional)</label>
        <input type="number" value={internalTemp} onChange={e => setInternalTemp(e.target.value)} placeholder="e.g. 130" style={{ ...inputStyle, marginBottom: 14 }} />
        <label style={labelStyle}>Your Ratings</label>
        <div style={{ background: C.cardAlt, borderRadius: 12, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` }}>
          {[["Crust", crust, setCrust], ["Cook Accuracy", cook, setCook], ["Presentation", pres, setPres]].map(([label, val, setter]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: C.textSec, fontSize: 13 }}>{label}</span>
                <span style={{ color: C.accent, fontWeight: 700, fontSize: 15, fontFamily: serif }}>{val}</span>
              </div>
              <input type="range" min="1" max="10" step="0.5" value={val} onChange={e => setter(+e.target.value)} style={{ width: "100%", accentColor: C.accent }} />
            </div>
          ))}
          <div style={{ textAlign: "center", marginTop: 4, padding: "10px", background: C.white, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <span style={{ color: C.textMuted, fontSize: 11, fontFamily: sans, letterSpacing: 1 }}>OVERALL</span>
            <div style={{ color: C.accent, fontSize: 32, fontWeight: 400, fontFamily: serif }}>{((crust + cook + pres) / 3).toFixed(1)}</div>
          </div>
        </div>
      </>)}

      {category === "hunting" && (<>
        <label style={labelStyle}>Species</label>
        <SearchableSelect options={SPECIES} value={species} onChange={setSpecies} placeholder="Search species... (e.g. Axis Deer, Nilgai)" />
        <label style={labelStyle}>Trophy Score (optional)</label>
        <input type="number" value={trophyScore} onChange={e => setTrophyScore(e.target.value)} placeholder='e.g. 165"' style={{ ...inputStyle, marginBottom: 14 }} />
      </>)}

      <label style={labelStyle}>Location (optional)</label>
      <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Austin, TX" style={{ ...inputStyle, marginBottom: 14 }} />
      <label style={labelStyle}>Caption</label>
      <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Describe your meat..." rows={3} style={{ ...inputStyle, resize: "vertical", marginBottom: 18 }} />
      <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: 14, background: C.accent, border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: sans, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Posting..." : "POST"}
      </button>
    </div>
  );
}

// ‚îÄ‚îÄ Leaderboard ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
function LeaderboardPage({ onProfileClick, toast }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [hunters, setHunters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (tab === "users") { const d = await supabase.rest("user_leaderboard", { query: "order=avg_score.desc.nullslast&limit=50" }); setUsers(d || []); }
        else if (tab === "hunters") { const d = await supabase.rest("hunting_leaderboard", { query: "order=total_hunts.desc.nullslast&limit=50" }); setHunters(d || []); }
        else { const d = await supabase.rest("restaurant_leaderboard", { query: "order=avg_score.desc.nullslast&limit=50" }); setRestaurants(d || []); }
      } catch (e) { console.error(e); toast?.("Failed to load leaderboard", "error"); }
      setLoading(false);
    };
    load();
  }, [tab, toast]);

  const medal = (i) => i === 0 ? C.accent : i === 1 ? "#A89E93" : i === 2 ? C.gold : C.textMuted;

  const Row = ({ rank, avatar, name, sub, right, onClick }) => (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: C.white, borderBottom: `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default" }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: rank <= 3 ? medal(rank - 1) + "18" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: rank <= 3 ? `2px solid ${medal(rank - 1)}` : "none" }}>
        <span style={{ color: medal(rank - 1), fontWeight: 800, fontSize: 14, fontFamily: serif }}>{rank}</span>
      </div>
      <Avatar url={avatar} fallback={name} size={40} />
      <div style={{ flex: 1 }}>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 14, fontFamily: sans }}>@{name}</div>
        <div style={{ color: C.textMuted, fontSize: 11, fontFamily: sans }}>{sub}</div>
      </div>
      {right}
    </div>
  );

  return (
    <div>
      <div style={{ textAlign: "center", padding: "20px 16px 0" }}>
        <h2 style={{ color: C.text, margin: 0, fontSize: 28, fontWeight: 400, fontFamily: serif }}>Rankings</h2>
        <p style={{ color: C.textSec, fontSize: 13, margin: "4px 0 0", fontStyle: "italic", fontFamily: serif }}>Top performers across the community</p>
      </div>
      <TabBar tabs={[{ key: "users", label: "Grillers", icon: "ü•©" }, { key: "hunters", label: "Hunters", icon: "ü¶å" }, { key: "restaurants", label: "Restaurants", icon: "üçΩ" }]} active={tab} onChange={setTab} />
      <div>
        {loading ? <Spinner /> : tab === "users" ? (
          users.length === 0 ? <div style={{ textAlign: "center", padding: 50, color: C.textMuted, fontFamily: sans }}>No ranked grillers yet</div> :
          <div style={{ background: C.white, borderRadius: 0 }}>
            <div style={{ display: "flex", padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ flex: 1, color: C.textMuted, fontSize: 11, fontFamily: sans, fontWeight: 600, letterSpacing: 1 }}>GRILLER</span>
              <span style={{ width: 60, textAlign: "center", color: C.textMuted, fontSize: 11, fontFamily: sans, fontWeight: 600, letterSpacing: 1 }}>POSTS</span>
              <span style={{ width: 50, textAlign: "center", color: C.textMuted, fontSize: 11, fontFamily: sans, fontWeight: 600, letterSpacing: 1 }}>AVG</span>
            </div>
            {users.map((u, i) => (
              <Row key={u.id} rank={i + 1} avatar={u.avatar_url} name={u.username} onClick={() => onProfileClick?.(u.id)}
                sub={`${u.location || ""}${u.location ? " ¬∑ " : ""}${u.total_posts} posts`}
                right={<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 50, textAlign: "center", color: C.textSec, fontSize: 14, fontFamily: sans, fontWeight: 600 }}>{u.total_posts}</span>
                  <ScoreDisplay score={u.avg_score} />
                </div>} />
            ))}
          </div>
        ) : tab === "hunters" ? (
          hunters.length === 0 ? <div style={{ textAlign: "center", padding: 50, color: C.textMuted, fontFamily: sans }}>No hunting posts yet. Get out there!</div> :
          <div style={{ background: C.white }}>
            <div style={{ display: "flex", padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ flex: 1, color: C.textMuted, fontSize: 11, fontFamily: sans, fontWeight: 600, letterSpacing: 1 }}>HUNTER</span>
              <span style={{ width: 60, textAlign: "center", color: C.textMuted, fontSize: 11, fontFamily: sans, fontWeight: 600, letterSpacing: 1 }}>HUNTS</span>
              <span style={{ width: 60, textAlign: "center", color: C.textMuted, fontSize: 11, fontFamily: sans, fontWeight: 600, letterSpacing: 1 }}>SPECIES</span>
            </div>
            {hunters.map((h, i) => (
              <Row key={h.id} rank={i + 1} avatar={h.avatar_url} name={h.username} onClick={() => onProfileClick?.(h.id)}
                sub={h.location || ""}
                right={<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 50, textAlign: "center", color: C.green, fontSize: 16, fontFamily: serif, fontWeight: 700 }}>{h.total_hunts}</span>
                  <span style={{ width: 50, textAlign: "center", color: C.textSec, fontSize: 13, fontFamily: sans }}>{h.unique_species} sp.</span>
                </div>} />
            ))}
          </div>
        ) : (
          restaurants.length === 0 ? <div style={{ textAlign: "center", padding: 50, color: C.textMuted, fontFamily: sans }}>No restaurant ratings yet</div> :
          <div style={{ background: C.white }}>
            {restaurants.map((r, i) => (
              <Row key={r.restaurant_name} rank={i + 1} avatar={null} name={r.restaurant_name}
                sub={`üìç ${r.location} ¬∑ ${r.total_reviews} reviews`}
                right={<ScoreDisplay score={r.avg_score} />} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ‚îÄ‚îÄ Profile Page ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const p = await supabase.rest("profiles", { query: `id=eq.${userId}`, single: true });
        setProfile(p); setEditBio(p?.bio || ""); setEditLocation(p?.location || "");
        const userPosts = await supabase.rest("post_feed", { query: `user_id=eq.${userId}&order=created_at.desc` });
        setPosts(userPosts || []);
        const followers = await supabase.rest("follows", { query: `following_id=eq.${userId}&select=id` });
        const following = await supabase.rest("follows", { query: `follower_id=eq.${userId}&select=id` });
        setFollowerCount(followers?.length || 0); setFollowingCount(following?.length || 0);
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
      if (isFollowing) { await supabase.rest("follows", { method: "DELETE", query: `follower_id=eq.${currentUserId}&following_id=eq.${userId}` }); setFollowerCount(c => Math.max(0, c - 1)); }
      else { await supabase.rest("follows", { method: "POST", body: { follower_id: currentUserId, following_id: userId } }); setFollowerCount(c => c + 1); }
      setIsFollowing(!isFollowing);
    } catch (e) { console.error(e); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast("Image must be under 5MB", "error"); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar_${Date.now()}.${ext}`;
      await supabase.storage.upload("post-images", path, file);
      const avatar_url = supabase.storage.getPublicUrl("post-images", path);
      await supabase.rest("profiles", { method: "PATCH", query: `id=eq.${userId}`, body: { avatar_url } });
      setProfile(prev => ({ ...prev, avatar_url }));
      toast("Profile picture updated!", "success");
    } catch (e) { toast(e.message || "Upload failed", "error"); }
    setUploadingAvatar(false);
  };

  const saveProfile = async () => {
    try {
      await supabase.rest("profiles", { method: "PATCH", query: `id=eq.${userId}`, body: { bio: editBio, location: editLocation } });
      setProfile(prev => ({ ...prev, bio: editBio, location: editLocation }));
      setEditMode(false); toast("Profile updated!", "success");
    } catch (e) { toast(e.message, "error"); }
  };

  if (loading) return <Spinner />;
  if (!profile) return <div style={{ textAlign: "center", padding: 50, color: C.textMuted, fontFamily: sans }}>User not found</div>;

  const steakPosts = posts.filter(p => p.overall_score);
  const avgScore = steakPosts.length ? (steakPosts.reduce((s, p) => s + Number(p.overall_score), 0) / steakPosts.length).toFixed(1) : "‚Äì";

  return (
    <div style={{ fontFamily: sans }}>
      <div style={{ padding: "28px 16px 20px", textAlign: "center", background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <input ref={avatarFileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
        <div onClick={() => isOwnProfile && avatarFileRef.current?.click()} style={{ display: "inline-block", position: "relative", cursor: isOwnProfile ? "pointer" : "default" }}>
          <Avatar url={profile.avatar_url} fallback={profile.username} size={80} />
          {isOwnProfile && (
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, border: `2px solid ${C.white}`, color: "white" }}>
              {uploadingAvatar ? "‚Ä¶" : "üì∑"}
            </div>
          )}
        </div>
        <h2 style={{ color: C.text, margin: "12px 0 4px", fontSize: 24, fontWeight: 400, fontFamily: serif }}>@{profile.username}</h2>

        {editMode ? (
          <div style={{ maxWidth: 280, margin: "10px auto 0", textAlign: "left" }}>
            <label style={labelStyle}>Bio</label>
            <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={2} style={{ ...inputStyle, marginBottom: 10, fontSize: 13 }} />
            <label style={labelStyle}>Location</label>
            <input value={editLocation} onChange={e => setEditLocation(e.target.value)} style={{ ...inputStyle, marginBottom: 12, fontSize: 13 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveProfile} style={{ flex: 1, padding: 9, background: C.accent, border: "none", borderRadius: 8, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Save</button>
              <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: 9, background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textSec, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        ) : (<>
          <p style={{ color: C.textSec, fontSize: 14, margin: "0 0 2px", fontStyle: "italic", fontFamily: serif }}>{profile.bio || "No bio yet"}</p>
          {profile.location && <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>üìç {profile.location}</p>}
        </>)}

        <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 18 }}>
          {[["Posts", posts.length], ["Avg", avgScore], ["Followers", followerCount], ["Following", followingCount]].map(([l, v]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ color: C.text, fontWeight: 400, fontSize: 22, fontFamily: serif }}>{v}</div>
              <div style={{ color: C.textMuted, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          {isOwnProfile ? (
            <button onClick={() => setEditMode(true)} style={{ padding: "8px 28px", background: C.cardAlt, border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: sans }}>Edit Profile</button>
          ) : (
            <button onClick={toggleFollow} style={{ padding: "8px 28px", background: isFollowing ? C.cardAlt : C.accent, border: isFollowing ? `1.5px solid ${C.border}` : "none", borderRadius: 10, color: isFollowing ? C.textSec : "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: sans }}>
              {isFollowing ? "Following ‚úì" : "Follow"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, padding: "2px" }}>
        {posts.map(p => (
          <div key={p.id} style={{ aspectRatio: "1", background: C.cardAlt, position: "relative", overflow: "hidden" }}>
            {p.image_url ? <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 28, opacity: 0.15 }}>{p.category === "hunting" ? "ü¶å" : "ü•©"}</span></div>}
            {p.overall_score && <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(255,255,255,0.88)", padding: "2px 7px", borderRadius: 6 }}><ScoreDisplay score={p.overall_score} size="sm" /></div>}
          </div>
        ))}
      </div>
      {posts.length === 0 && <div style={{ textAlign: "center", padding: 50, color: C.textMuted, fontSize: 13 }}>No posts yet</div>}
    </div>
  );
}

// ‚îÄ‚îÄ Search Page ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
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
    <div style={{ padding: "14px 16px", fontFamily: sans }}>
      <input placeholder="Search cuts, users, restaurants..." value={query} onChange={e => setQuery(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
      <TabBar tabs={[{ key: "posts", label: "Posts" }, { key: "users", label: "Users" }]} active={searchTab} onChange={setSearchTab} />
      <div style={{ marginTop: 12 }}>
        {loading ? <Spinner /> : searchTab === "posts" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
            {posts.map(p => (
              <div key={p.id} style={{ aspectRatio: "1", background: C.cardAlt, position: "relative", overflow: "hidden", borderRadius: 6 }}>
                {p.image_url ? <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 22, opacity: 0.15 }}>{p.category === "hunting" ? "ü¶å" : "ü•©"}</span></div>}
                {p.overall_score && <div style={{ position: "absolute", bottom: 3, right: 3, background: "rgba(255,255,255,0.88)", padding: "1px 6px", borderRadius: 5 }}><ScoreDisplay score={p.overall_score} size="sm" /></div>}
              </div>
            ))}
          </div>
        ) : users.map(u => (
          <div key={u.id} onClick={() => onProfileClick?.(u.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
            <Avatar url={u.avatar_url} fallback={u.username} size={42} />
            <div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>@{u.username}</div>
              <div style={{ color: C.textMuted, fontSize: 12 }}>{u.bio || u.location || "RateMyMeat member"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ‚îÄ‚îÄ Settings Page ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
function SettingsPage({ onLogout }) {
  return (
    <div style={{ padding: 16, fontFamily: sans }}>
      <h2 style={{ color: C.text, margin: "0 0 16px", fontSize: 28, fontWeight: 400, fontFamily: serif }}>Settings</h2>
      <div style={{ background: C.white, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
        {["Account", "Notifications", "Privacy", "Help & Support", "About Rate My Meat"].map(item => (
          <div key={item} style={{ padding: "15px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.text, fontSize: 14 }}>{item}</span>
            <span style={{ color: C.textMuted }}>‚Ä∫</span>
          </div>
        ))}
      </div>
      <button onClick={onLogout} style={{ width: "100%", marginTop: 24, padding: 14, background: "transparent", border: `1.5px solid ${C.accent}`, borderRadius: 10, color: C.accent, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: sans }}>Log Out</button>
      <p style={{ textAlign: "center", color: C.textMuted, fontSize: 11, marginTop: 20, fontFamily: serif, fontStyle: "italic" }}>Rate My Meat v1.0 Beta</p>
    </div>
  );
}

// ‚îÄ‚îÄ Main App ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
export default function RateMyMeat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("feed");
  const [viewingUserId, setViewingUserId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [restoring, setRestoring] = useState(true);

  const toast = useCallback((message, type = "info") => setToastMsg({ message, type, key: Date.now() }), []);

  useEffect(() => { const user = supabase.auth.restore(); if (user) setCurrentUser(user); setRestoring(false); }, []);

  const handleProfileClick = useCallback((userId) => { setViewingUserId(userId); setPage("profile"); }, []);
  const handleLogout = () => { supabase.auth.signOut(); setCurrentUser(null); setPage("feed"); };

  if (restoring) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;
  if (!currentUser) return <><AuthPage onAuth={u => { setCurrentUser(u); setPage("feed"); }} toast={toast} />{toastMsg && <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(null)} key={toastMsg.key} />}</>;

  const profileUserId = page === "profile" ? (viewingUserId || currentUser.id) : currentUser.id;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", fontFamily: sans, position: "relative", paddingBottom: 72 }}>
      {/* Top Bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: C.bg, borderBottom: `1.5px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accent + "15", display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${C.accent}33` }}>
            <span style={{ fontSize: 16 }}>ü•©</span>
          </div>
          <div>
            <span style={{ color: C.text, fontWeight: 400, fontSize: 18, fontFamily: serif }}>Rate My Meat</span>
          </div>
        </div>
        <div onClick={() => { setViewingUserId(null); setPage("profile"); }} style={{ cursor: "pointer" }}>
          <Avatar url={null} fallback={currentUser?.user_metadata?.username || "U"} size={32} />
        </div>
      </div>

      {/* Content */}
      {page === "feed" && <FeedPage currentUserId={currentUser.id} onProfileClick={handleProfileClick} toast={toast} />}
      {page === "search" && <SearchPage onProfileClick={handleProfileClick} toast={toast} />}
      {page === "create" && <CreatePostPage currentUserId={currentUser.id} onPost={() => setPage("feed")} toast={toast} />}
      {page === "leaderboard" && <LeaderboardPage onProfileClick={handleProfileClick} toast={toast} />}
      {page === "profile" && <ProfilePage userId={profileUserId} isOwnProfile={profileUserId === currentUser.id} currentUserId={currentUser.id} onProfileClick={handleProfileClick} toast={toast} />}
      {page === "settings" && <SettingsPage onLogout={handleLogout} />}

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.white, borderTop: `1.5px solid ${C.border}`, display: "flex", zIndex: 100 }}>
        {[
          { key: "feed", icon: "üè†", label: "Feed" },
          { key: "search", icon: "üîç", label: "Nearby" },
          { key: "create", icon: "‚ûï", label: "Post" },
          { key: "leaderboard", icon: "üèÜ", label: "Ranks" },
          { key: "profile", icon: "üë§", label: "Me" },
        ].map(n => (
          <button key={n.key} onClick={() => { setPage(n.key); if (n.key === "profile") setViewingUserId(null); }} style={{
            flex: 1, padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            <span style={{ fontSize: n.key === "create" ? 22 : 17, opacity: page === n.key ? 1 : 0.4 }}>{n.icon}</span>
            <span style={{ fontSize: 10, color: page === n.key ? C.accent : C.textMuted, fontWeight: 600, fontFamily: sans }}>{n.label}</span>
          </button>
        ))}
      </div>

      {toastMsg && <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(null)} key={toastMsg.key} />}
    </div>
  );
}

