import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navigation: React.FC = () => {
  const { logout, user, accessToken } = useAuth();
  const location = useLocation();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [targetUser, setTargetUser] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "🎨" },
    { name: "Social", path: "/social", icon: "👥" },
  ];

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser.trim()) return;
    try {
      const res = await fetch(`${API_URL}/friends/request/by-username/${targetUser.trim()}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        alert(`Request sent to @${targetUser}`);
        setTargetUser("");
        setShowQuickAdd(false);
      } else {
        const err = await res.json();
        alert(err.detail || "User not found");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-8 bg-brand-black border-r border-white/5 z-50">
      <div className="mb-12">
        <div className="h-10 w-10 bg-brand-pink rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-brand-pink/20">W</div>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`group relative p-4 rounded-2xl transition-all duration-300 ${location.pathname === item.path ? "bg-brand-pink/10 text-brand-pink" : "text-white/60 hover:text-white hover:bg-white/5"}`}
          >
            <span className="text-xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{item.icon}</span>
            {location.pathname === item.path && <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-pink rounded-r-full shadow-[0_0_10px_rgba(255,51,102,0.5)]" />}
            <div className="absolute left-full ml-4 px-3 py-1 bg-brand-navy border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-2xl">
              {item.name}
            </div>
          </Link>
        ))}

        <button
          onClick={() => setShowQuickAdd(true)}
          className="group relative p-4 rounded-2xl text-brand-pink bg-brand-pink/5 hover:bg-brand-pink hover:text-white transition-all duration-300 shadow-lg shadow-brand-pink/5"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <div className="absolute left-full ml-4 px-3 py-1 bg-brand-pink border border-brand-pink/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-2xl">
            Quick Add Friend
          </div>
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-[10px] text-white/40 overflow-hidden">
          {user?.username[0].toUpperCase()}
        </div>
        <button onClick={logout} className="p-4 text-white/20 hover:text-red-500 transition-colors" title="Logout">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="w-full max-w-sm bg-brand-navy border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tighter italic">Quick Add <span className="text-brand-pink">Friend</span></h3>
            <form onSubmit={handleQuickAdd} className="space-y-6">
              <input 
                type="text" autoFocus value={targetUser} onChange={(e) => setTargetUser(e.target.value)} 
                placeholder="Username (e.g. rudra)" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-pink transition-all"
              />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowQuickAdd(false)} className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-white/60 text-[10px] font-black uppercase">Cancel</button>
                <button type="submit" disabled={!targetUser.trim()} className="flex-1 px-6 py-3 rounded-xl bg-brand-pink text-white text-[10px] font-black uppercase shadow-lg shadow-brand-pink/20">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
