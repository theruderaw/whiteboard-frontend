import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

type User = { id: string; username: string };

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
};

const ChatPanel: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [large, setLarge] = useState<boolean>(false);

  // Widths – default 380px, large 560px
  const panelWidth = large ? 560 : 380;

  // Fetch users list
  useEffect(() => {
    const fetchUsers = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch(`${API_URL}/auth/users`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) setUsers(await res.json());
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, [accessToken]);

  // Fetch chat history when selectedUser changes
  useEffect(() => {
    if (!selectedUser || !accessToken) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/messages/${selectedUser.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) setMessages(await res.json());
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedUser, accessToken]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !accessToken) return;
    try {
      const res = await fetch(`${API_URL}/messages/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ receiver_id: selectedUser.id, content: newMessage }),
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

  // Render collapsed bar
  if (collapsed) {
    return (
      <div className="fixed inset-y-0 right-0 w-12 flex flex-col items-center bg-black/70 backdrop-blur-xl border-l border-white/10">
        <button
          className="mt-4 p-2 rounded-full bg-brand-pink/70 hover:bg-brand-pink transition"
          onClick={() => setCollapsed(false)}
          title="Expand chat"
        >
          {/* Chevron right */}
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-y-0 right-0 flex flex-col bg-black/80 backdrop-blur-xl border-l border-white/10"
      style={{ width: `${panelWidth}px` }}
    >
      {/* Header with collapse / size toggle */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-pink">Secure Chat</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setLarge(!large)}
            className="p-1 rounded hover:bg-white/5"
            title={large ? "Shrink" : "Expand"}
          >
            {/* Gear icon */}
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2} fill="none" />
            </svg>
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded hover:bg-white/5"
            title="Collapse"
          >
            {/* Chevron left */}
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => setSelectedUser(u)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors 
              ${selectedUser?.id === u.id ? "bg-brand-pink/20 text-brand-pink" : "bg-white/5 hover:bg-white/10 text-white/70"}`}
          >
            @{u.username}
          </button>
        ))}
      </div>

      {/* Message view */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/30">
        {selectedUser ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-xl text-sm 
                  ${msg.sender_id === user?.id ? "bg-brand-pink text-white" : "bg-brand-navy/60 text-white/80"}`}
              >
                {msg.content}
                <div className="text-xs mt-1 opacity-70 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-white/40 mt-8">Select a contact to start chatting</div>
        )}
      </div>

      {/* Send message form */}
      {selectedUser && (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
          <div className="relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-2 pr-12 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-pink"
            />
            <button
              type="submit"
              className="absolute right-2 top-1 bottom-1 flex items-center justify-center w-8 h-8 bg-brand-pink rounded-full hover:bg-brand-berry transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChatPanel;
