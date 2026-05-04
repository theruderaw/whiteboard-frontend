import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Dashboard = () => {
  const { user, accessToken, logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch users list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/users`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    if (accessToken) fetchUsers();
  }, [accessToken]);

  // Fetch chat history when selectedUser changes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/messages/${selectedUser.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };
    if (selectedUser && accessToken) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, accessToken]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const res = await fetch(`${API_URL}/messages/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          receiver_id: selectedUser.id,
          content: newMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto px-4 py-6 animate-in fade-in duration-1000">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-black italic tracking-tighter leading-none">
            COLLABORATIVE<span className="text-brand-pink">WHITEBOARD</span>
          </h1>
          <div className="h-8 w-px bg-white/10 hidden md:block" />
          <div className="hidden md:flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{user?.username} / ACTIVE_SESSION</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="group relative px-5 py-2 rounded-xl overflow-hidden transition-all active:scale-95"
        >
          <div className="absolute inset-0 bg-white/5 group-hover:bg-brand-berry/20 transition-colors" />
          <span className="relative z-10 text-[9px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-brand-pink transition-colors">
            Logout
          </span>
        </button>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        
        {/* Main Content Area (Whiteboard Placeholder) */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="relative z-10 flex flex-col items-center text-center p-8">
              <div className="h-20 w-20 mb-8 rounded-full bg-brand-pink/5 border border-brand-pink/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                <svg className="w-10 h-10 text-brand-pink drop-shadow-[0_0_15px_rgba(238,38,137,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-[0.3em] mb-3">Whiteboard Engine</h2>
              <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.4em] max-w-sm leading-relaxed">
                Waiting for Canvas Initialization...
                <br />
                Real-time Sync Active
              </p>
            </div>

            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px'}} />
          </div>
        </div>

        {/* Messaging Side Panel */}
        <div className="w-[380px] flex flex-col gap-4 shrink-0">
          <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 flex flex-col overflow-hidden shadow-2xl">
            
            {/* Panel Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-blue">Secure Comms</span>
              <div className="flex gap-1.5">
                <div className="h-1 w-4 bg-brand-pink rounded-full" />
                <div className="h-1 w-1 bg-white/10 rounded-full" />
              </div>
            </div>

            {/* Contacts Mini-Bar */}
            <div className="px-4 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5 shrink-0">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`shrink-0 h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    selectedUser?.id === u.id 
                      ? "bg-brand-pink text-white shadow-[0_0_15px_rgba(238,38,137,0.3)]" 
                      : "bg-white/5 text-white/40 hover:bg-white/10"
                  }`}
                >
                  {u.username}
                </button>
              ))}
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {selectedUser ? (
                <>
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                      <div className="h-1 w-8 bg-white mb-2 rounded-full" />
                      <p className="text-[9px] font-black uppercase tracking-widest">No Transmissions Found</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${msg.sender_id === user.id ? "items-end" : "items-start"}`}
                      >
                        <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                          msg.sender_id === user.id 
                            ? "bg-brand-pink/90 text-white rounded-br-none" 
                            : "bg-brand-navy/60 border border-white/10 text-white/90 rounded-bl-none"
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[8px] mt-1 font-black uppercase tracking-widest opacity-20 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                  <div className="h-12 w-12 rounded-full border border-white/5 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Select Contact to Initialize Chat</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            {selectedUser && (
              <form onSubmit={handleSendMessage} className="p-4 bg-white/[0.01] border-t border-white/5">
                <div className="relative group/input">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Input Transmission..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 pr-12 focus:border-brand-pink/50 transition-all outline-none text-[13px] placeholder:text-white/10"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 w-10 bg-brand-pink rounded-xl hover:bg-brand-berry transition-all flex items-center justify-center active:scale-90"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
