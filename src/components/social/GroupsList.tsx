import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";

interface Group {
  id: string;
  name: string;
}

interface GroupsListProps {
  onSelectGroup: (group: Group) => void;
  selectedGroupId?: string;
}

const GroupsList: React.FC<GroupsListProps> = ({ onSelectGroup, selectedGroupId }) => {
  const { accessToken } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchGroups = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/rooms/`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        setGroups(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch rooms", err);
    }
  }, [accessToken, API_URL]);

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 10000);
    return () => clearInterval(interval);
  }, [fetchGroups]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/rooms/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: newGroupName, is_private: false }),
      });
      if (res.ok) {
        setNewGroupName("");
        setIsCreating(false);
        fetchGroups();
      }
    } catch (err) {
      console.error("Failed to create room", err);
    }
  };

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-left duration-500 delay-300">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Active Workspaces</h3>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="text-brand-pink hover:text-brand-berry transition-colors p-1"
        >
          <svg className={`w-4 h-4 transition-transform ${isCreating ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateGroup} className="mb-4 animate-in zoom-in duration-200">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-brand-pink mb-2"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-brand-pink/10 hover:bg-brand-pink text-brand-pink hover:text-white text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all"
          >
            Create Channel
          </button>
        </form>
      )}

      <div className="space-y-2">
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => onSelectGroup(g)}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300
              ${selectedGroupId === g.id 
                ? "bg-brand-pink/10 text-brand-pink border border-brand-pink/20 shadow-lg shadow-brand-pink/5" 
                : "bg-white/[0.02] border border-transparent hover:bg-white/5 hover:border-white/10 text-white/70 hover:text-white"}`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 transition-colors
              ${selectedGroupId === g.id ? "bg-brand-pink text-white border-transparent" : "bg-brand-navy border-white/10 text-white/40"}`}>
              #
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-bold truncate w-full">{g.name}</span>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Unified Workspace</span>
            </div>
            {selectedGroupId === g.id && <div className="ml-auto h-2 w-2 rounded-full bg-brand-pink shadow-[0_0_8px_rgba(255,51,102,0.8)]" />}
          </button>
        ))}
        {groups.length === 0 && !isCreating && (
          <div className="text-center py-8 px-4 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/20">No active groups</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsList;
