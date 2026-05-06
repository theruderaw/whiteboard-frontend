import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";

interface Room {
  id: string;
  name: string;
}

interface RoomsChatListProps {
  onSelectRoom: (room: Room) => void;
  selectedRoomId?: string;
}

const RoomsChatList: React.FC<RoomsChatListProps> = ({ onSelectRoom, selectedRoomId }) => {
  const { accessToken } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchRooms = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/rooms/`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        setRooms(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch rooms", err);
    }
  }, [accessToken, API_URL]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-left duration-500 delay-300">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Workspace Channels</h3>
      </div>

      <div className="space-y-2">
        {rooms.map(r => (
          <button
            key={r.id}
            onClick={() => onSelectRoom(r)}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300
              ${selectedRoomId === r.id 
                ? "bg-brand-pink/10 text-brand-pink border border-brand-pink/20 shadow-lg shadow-brand-pink/5" 
                : "bg-white/[0.02] border border-transparent hover:bg-white/5 hover:border-white/10 text-white/70 hover:text-white"}`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 transition-colors
              ${selectedRoomId === r.id ? "bg-brand-pink text-white border-transparent" : "bg-brand-navy border-white/10 text-white/40"}`}>
              #
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-bold truncate w-full">{r.name}</span>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Room Chat</span>
            </div>
            {selectedRoomId === r.id && <div className="ml-auto h-2 w-2 rounded-full bg-brand-pink shadow-[0_0_8px_rgba(255,51,102,0.8)]" />}
          </button>
        ))}
        {rooms.length === 0 && (
          <div className="text-center py-8 px-4 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/50">No active rooms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsChatList;
