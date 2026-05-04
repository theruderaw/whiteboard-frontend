import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

interface User {
  id: string;
  username: string;
}

interface UserSearchProps {
  onSelectUser: (user: User) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onSelectUser }) => {
  const { accessToken } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/users/search?q=${query}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) setResults(await res.json());
      } catch (err) {
        console.error("Search error", err);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [query, accessToken]);

  const sendRequest = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/friends/request/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        alert("Request sent!");
        setQuery("");
      } else {
        const err = await res.json();
        alert(`Failed to send request: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred. Please try again.");
    }
  };

  return (
    <div className="relative mb-8">
      <div className="flex flex-col gap-2 mb-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-1">Connect with Peers</label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-pink focus:bg-white/[0.05] transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-brand-navy border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-2">
            {results.map(u => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group">
                <button 
                  onClick={() => onSelectUser(u)}
                  className="flex items-center gap-3 text-sm font-bold text-left text-white/90 group-hover:text-white transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-brand-pink/10 flex items-center justify-center text-brand-pink font-black text-xs">
                    {u.username[0].toUpperCase()}
                  </div>
                  @{u.username}
                </button>
                <button
                  onClick={() => sendRequest(u.id)}
                  className="px-4 py-2 bg-brand-pink/10 hover:bg-brand-pink text-brand-pink hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
