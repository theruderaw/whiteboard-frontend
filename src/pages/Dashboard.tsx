import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Whiteboard from "../components/Whiteboard";
import ChatPanel from "../components/ChatPanel";
import MemberPanel from "../components/MemberPanel";

interface DashboardProps {
  onRoomChange?: (roomId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onRoomChange }) => {
  const { user, accessToken } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchRooms = async () => {
    console.log("Fetching rooms from:", `${API_URL}/rooms/`);
    try {
      const res = await fetch(`${API_URL}/rooms/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("Rooms fetch status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("Rooms data received:", data);
        setRooms(data);
        if (data.length > 0 && !currentRoom) {
          setCurrentRoom(data[0]);
          onRoomChange?.(data[0].id);
        }
      } else {
        console.error("Failed to fetch rooms:", await res.text());
      }
    } catch (err) {
      console.error("Failed to fetch rooms", err);
    }
  };

  useEffect(() => {
    if (accessToken) fetchRooms();
    else console.warn("No access token for rooms fetch");
  }, [accessToken, onRoomChange, API_URL]);

  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    setCurrentRoom(room);
    onRoomChange?.(roomId);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/rooms/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: newRoomName, is_private: true }),
      });

      if (res.ok) {
        const newRoom = await res.json();
        setNewRoomName("");
        setShowCreateModal(false);
        await fetchRooms();
        setCurrentRoom(newRoom);
        onRoomChange?.(newRoom.id);
      }
    } catch (err) {
      console.error("Failed to create room", err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full px-8 py-8 animate-in fade-in duration-1000 relative">
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
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-3 bg-white/5 hover:bg-brand-pink/20 rounded-2xl border border-white/10 text-brand-pink transition-all active:scale-90"
            title="Create New Workspace"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{user?.username} / ONLINE</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl
              ${showChat ? "bg-brand-pink text-white shadow-brand-pink/20" : "bg-white/5 text-white/40 hover:text-white border border-white/10"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Chat
          </button>
          <button 
            onClick={() => setShowMembers(!showMembers)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl
              ${showMembers ? "bg-brand-pink text-white shadow-brand-pink/20" : "bg-white/5 text-white/40 hover:text-white border border-white/10"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Members
          </button>
          <Link 
            to="/social"
            className="flex items-center gap-3 bg-brand-navy text-white/60 hover:text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:border-white/20 transition-all active:scale-95"
          >
            Social Hub
          </Link>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden relative">
        {/* Main Content Area (Whiteboard) */}
        <div className={`flex-1 flex flex-col gap-4 min-w-0 transition-all duration-500 
          ${showChat ? "mr-[380px]" : ""} ${showMembers ? "mr-[320px]" : ""}`}>
          {currentRoom ? (
            <Whiteboard roomId={currentRoom.id} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/20 uppercase font-black tracking-[0.5em]">
              Initializing Workspace...
            </div>
          )}
        </div>

        {/* Side Panels */}
        <div className="fixed inset-y-0 right-0 flex pointer-events-none">
          {showChat && currentRoom && (
            <div className="pointer-events-auto h-full shadow-2xl relative z-40">
              <ChatPanel 
                roomId={currentRoom.id} 
                onClose={() => setShowChat(false)} 
              />
            </div>
          )}
          {showMembers && currentRoom && (
            <div className="pointer-events-auto h-full shadow-2xl relative z-50">
              <MemberPanel 
                roomId={currentRoom.id} 
                onClose={() => setShowMembers(false)} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-brand-navy/90 border border-white/10 rounded-3xl p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">New Workspace</h2>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-8">Initialize a collaborative environment</p>
            
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-pink mb-2">Workspace Name</label>
                <input
                  type="text"
                  autoFocus
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Project Apollo"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/5 transition-all"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-8 py-4 rounded-2xl bg-white/5 text-white/60 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newRoomName.trim()}
                  className="flex-1 px-8 py-4 rounded-2xl bg-brand-pink text-white font-black text-[10px] uppercase tracking-widest hover:bg-brand-berry shadow-xl shadow-brand-pink/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
