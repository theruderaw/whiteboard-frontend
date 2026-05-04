import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Whiteboard from "../components/Whiteboard";

interface DashboardProps {
  onRoomChange?: (roomId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onRoomChange }) => {
  const { user, accessToken } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Fetch rooms list
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_URL}/rooms`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
          if (data.length > 0) {
            setCurrentRoom(data[0]);
            onRoomChange?.(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch rooms", err);
      }
    };
    if (accessToken) fetchRooms();
  }, [accessToken, onRoomChange]);

  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    setCurrentRoom(room);
    onRoomChange?.(roomId);
  };

  return (
    <div className="flex flex-col h-full w-full px-8 py-8 animate-in fade-in duration-1000">
      {/* Top Context Bar */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10 shadow-xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Active Workspace:</span>
            <select 
              value={currentRoom?.id || ""} 
              onChange={(e) => handleRoomSelect(e.target.value)}
              className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer text-brand-pink"
            >
              {rooms.map(room => (
                <option key={room.id} value={room.id} className="bg-brand-black">{room.name}</option>
              ))}
            </select>
          </div>
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{user?.username} / ONLINE</p>
        </div>

        <Link 
          to="/social"
          className="flex items-center gap-3 bg-brand-pink text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-pink/20 hover:bg-brand-berry transition-all active:scale-95 group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          Add Friend
        </Link>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        
        {/* Main Content Area (Whiteboard) */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {currentRoom ? (
            <Whiteboard roomId={currentRoom.id} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/20 uppercase font-black tracking-[0.5em]">
              Initializing Workspace...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
