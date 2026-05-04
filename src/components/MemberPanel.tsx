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
  onClose: () => void;
}

const MemberPanel: React.FC<MemberPanelProps> = ({ roomId, onClose }) => {
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
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to add member");
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
    <div className="fixed inset-y-0 right-0 w-[320px] bg-black/90 backdrop-blur-2xl border-l border-white/10 flex flex-col z-[60] animate-in slide-in-from-right duration-500 shadow-2xl">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-pink">Room Members</h2>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-8">
        {/* Add Member Search */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Invite Collaborator</h3>
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-brand-pink transition-all"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-brand-navy border border-white/10 rounded-xl shadow-2xl z-[70] overflow-hidden">
                {searchResults.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-xs">@{u.username}</span>
                    <button
                      onClick={() => addMember(u.id)}
                      className="text-[10px] font-black uppercase tracking-widest text-brand-pink hover:text-brand-berry"
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Members List */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Active Members ({members.length})</h3>
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.user_id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-brand-pink/10 flex items-center justify-center text-xs font-black text-brand-pink border border-brand-pink/20">
                    {m.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/90">@{m.username}</p>
                    <p className="text-[9px] font-black uppercase tracking-tighter text-white/20">{m.role}</p>
                  </div>
                </div>
                {m.role !== 'admin' && (
                  <button
                    onClick={() => removeMember(m.user_id)}
                    className="text-[9px] font-black uppercase tracking-widest text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                  >
                    Remove
                  </button>
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
