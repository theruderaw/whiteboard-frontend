import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface Member {
  user_id: string;
  username: string;
  role: string;
}

interface User {
  id: string;
  username: string;
}

interface MemberPanelProps {
  roomId: string;
}

const MemberPanel: React.FC<MemberPanelProps> = ({ roomId }) => {
  const { accessToken } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/members`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) setMembers(await res.json());
    } catch (err) {
      console.error("Failed to fetch members", err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [roomId, accessToken]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/users/search?q=${searchQuery}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) setSearchResults(await res.json());
      } catch (err) {
        console.error("Search failed", err);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, accessToken]);

  const addMember = async (userId: string) => {
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/members/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        setSearchQuery("");
        fetchMembers();
      }
    } catch (err) {
      console.error("Add member failed", err);
    }
  };

  const removeMember = async (userId: string) => {
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/members/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) fetchMembers();
    } catch (err) {
      console.error("Remove member failed", err);
    }
  };

  return (
    <div className="w-[320px] h-[450px] flex flex-col relative overflow-hidden">
      <div className="p-4 flex-1 overflow-y-auto space-y-6 min-h-0">
        <div className="space-y-2">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-white/30">Invite</h3>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Username..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-pink transition-all"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-brand-navy border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
                {searchResults.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-3 py-2 border-b border-white/5 hover:bg-white/10">
                    <span className="text-xs">@{u.username}</span>
                    <button onClick={() => addMember(u.id)} className="text-[9px] font-black text-brand-pink uppercase">Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-white/30">Active ({members.length})</h3>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.user_id} className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-brand-pink/10 flex items-center justify-center text-[10px] font-black text-brand-pink">
                    {m.username[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-white/90">@{m.username}</span>
                </div>
                {m.role !== 'admin' && (
                  <button onClick={() => removeMember(m.user_id)} className="text-[9px] uppercase font-black text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">X</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberPanel;
