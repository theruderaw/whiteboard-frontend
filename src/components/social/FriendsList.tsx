import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface Friend {
  id: string;
  username: string;
}

interface FriendsListProps {
  onSelectFriend: (friend: Friend) => void;
  selectedFriendId?: string;
}

const FriendsList: React.FC<FriendsListProps> = ({ onSelectFriend, selectedFriendId }) => {
  const { accessToken } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Friend[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchData = async () => {
    try {
      const [fRes, rRes] = await Promise.all([
        fetch(`${API_URL}/friends/`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/friends/requests`, { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);
      if (fRes.ok) setFriends(await fRes.json());
      if (rRes.ok) setRequests(await rRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (accessToken) fetchData();
    const interval = setInterval(fetchData, 10000); // Polling for requests
    return () => clearInterval(interval);
  }, [accessToken]);

  const acceptRequest = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/friends/accept/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const removeFriendOrRequest = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API_URL}/friends/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
      {requests.length > 0 && (
        <div className="animate-in fade-in slide-in-from-left duration-500">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-4 px-1">Pending Invitations</h3>
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="flex flex-col gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5 shadow-xl transition-all hover:border-brand-pink/30 group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink font-black text-sm">
                    {req.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-white/90">@{req.username}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRequest(req.id)}
                    className="flex-1 bg-brand-pink text-white text-[10px] font-black py-2 rounded-xl uppercase tracking-widest hover:bg-brand-berry shadow-lg shadow-brand-pink/20 transition-all active:scale-95"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => removeFriendOrRequest(req.id)}
                    className="px-4 bg-white/5 text-white/60 text-[10px] font-black py-2 rounded-xl uppercase tracking-widest hover:bg-red-500/20 hover:text-red-500 transition-all active:scale-95"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="animate-in fade-in slide-in-from-left duration-500 delay-200">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-4 px-1">My Network</h3>
        <div className="space-y-2">
          {friends.map(f => (
            <div key={f.id} className="group relative">
              <button
                onClick={() => onSelectFriend(f)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300
                  ${selectedFriendId === f.id 
                    ? "bg-brand-pink/10 text-brand-pink border border-brand-pink/20 shadow-lg shadow-brand-pink/5" 
                    : "bg-white/[0.02] border border-transparent hover:bg-white/5 hover:border-white/10 text-white/70 hover:text-white"}`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 transition-colors
                  ${selectedFriendId === f.id ? "bg-brand-pink text-white border-transparent" : "bg-brand-navy border-white/10 text-white/40"}`}>
                  {f.username[0].toUpperCase()}
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-bold truncate w-full">@{f.username}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Ready to chat</span>
                </div>
                {selectedFriendId === f.id && <div className="ml-auto h-2 w-2 rounded-full bg-brand-pink shadow-[0_0_8px_rgba(255,51,102,0.8)]" />}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFriendOrRequest(f.id);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-xl translate-x-2 group-hover:translate-x-0"
                title="Remove friend"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {friends.length === 0 && (
            <div className="text-center py-16 px-6 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
              <div className="text-3xl mb-4 opacity-20">📭</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Your network is empty</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsList;
