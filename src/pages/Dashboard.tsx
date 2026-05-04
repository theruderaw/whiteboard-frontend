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
      // Poll for new messages every 3 seconds
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
    <div className="w-full max-w-6xl h-[85vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end mb-6 px-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter leading-none mb-1">
            COLLABORATIVE<span className="text-brand-pink">WHITEBOARD</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-brand-blue/30" />
            <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.3em]">{user?.username}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="group relative px-6 py-2 rounded-xl overflow-hidden transition-all active:scale-95"
        >
          <div className="absolute inset-0 bg-white/5 group-hover:bg-brand-berry/20 transition-colors" />
          <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-brand-pink transition-colors">
            Logout
          </span>
        </button>
      </header>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* User Sidebar */}
        <div className="w-64 bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 flex flex-col">
          <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-4 px-2">Contacts</h3>
          <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
                  selectedUser?.id === u.id 
                    ? "bg-brand-pink/20 border border-brand-pink/40 text-brand-pink" 
                    : "bg-white/5 border border-transparent hover:border-white/10 text-white/60"
                }`}
              >
                <div className="text-sm font-bold truncate">@{u.username}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 flex flex-col overflow-hidden relative">
          {selectedUser ? (
            <>
              <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="text-sm font-black uppercase tracking-widest">Chat with {selectedUser.username}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] px-5 py-3 rounded-2xl text-sm ${
                      msg.sender_id === user.id 
                        ? "bg-brand-pink text-white rounded-br-none" 
                        : "bg-brand-navy/40 border border-white/10 text-white/80 rounded-bl-none"
                    }`}>
                      {msg.content}
                      <div className={`text-[9px] mt-1 opacity-40 font-mono ${
                        msg.sender_id === user.id ? "text-right" : "text-left"
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-6 border-t border-white/5">
                <div className="relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-6 py-4 pr-16 focus:border-brand-pink transition-all outline-none text-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-4 bg-brand-pink rounded-lg hover:bg-brand-berry transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="h-16 w-16 mb-6 rounded-full bg-brand-pink/5 border border-brand-pink/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-pink opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest mb-2">Private Messaging</h3>
              <p className="text-white/30 text-xs max-w-xs leading-relaxed">Select a contact from the sidebar to start a secure conversation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
