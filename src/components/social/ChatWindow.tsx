import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
}

interface ChatWindowProps {
  selectedUser: { id: string; username: string } | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ selectedUser }) => {
  const { user, accessToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const WS_URL = API_URL.replace("http", "ws");

  useEffect(() => {
    if (!selectedUser || !accessToken) {
      setMessages([]);
      return;
    }

    // Fetch history
    fetch(`${API_URL}/messages/${selectedUser.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(console.error);

    // WS Connection
    const socket = new WebSocket(`${WS_URL}/ws/chat/${user?.id}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'chat' && (msg.data.sender_id === selectedUser.id || msg.data.sender_id === user?.id)) {
        setMessages(prev => [...prev, msg.data]);
      }
    };

    return () => socket.close();
  }, [selectedUser, accessToken, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const chatData = {
      id: crypto.randomUUID(),
      sender_id: user?.id,
      receiver_id: selectedUser.id,
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat',
        receiver_id: selectedUser.id,
        data: chatData
      }));
    }

    // Persist
    fetch(`${API_URL}/messages/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ receiver_id: selectedUser.id, content: newMessage }),
    }).catch(console.error);

    setMessages(prev => [...prev, chatData as any]);
    setNewMessage("");
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/40 uppercase font-black tracking-[0.5em] animate-in fade-in duration-700 bg-white/[0.01] rounded-3xl border border-white/5 border-dashed m-4">
        <div className="h-32 w-32 rounded-full border-2 border-white/10 flex items-center justify-center mb-8 bg-brand-navy/30">
          <svg className="w-12 h-12 text-brand-pink/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        Select a conversation
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white/[0.02] rounded-3xl border border-white/10 overflow-hidden animate-in slide-in-from-right duration-500 shadow-2xl m-4">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-brand-pink/20 flex items-center justify-center font-black text-brand-pink border border-brand-pink/20 text-lg">
              {selectedUser.username[0].toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-4 border-brand-navy shadow-lg" />
          </div>
          <div>
            <h3 className="font-black text-xl text-white/95">@{selectedUser.username}</h3>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Secure Connection Established</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="p-3 rounded-xl bg-white/5 text-white/30 hover:text-brand-pink hover:bg-brand-pink/10 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 bg-gradient-to-b from-transparent to-black/20">
        {messages.length > 0 ? messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] group relative
              ${msg.sender_id === user?.id ? "items-end" : "items-start"}`}>
              <div className={`px-6 py-4 rounded-3xl text-sm shadow-2xl transition-all duration-300
                ${msg.sender_id === user?.id 
                  ? "bg-brand-pink text-white rounded-tr-none shadow-brand-pink/10 hover:shadow-brand-pink/20" 
                  : "bg-brand-navy/80 text-white/90 rounded-tl-none border border-white/10 hover:border-white/20"}`}>
                <p className="leading-relaxed">{msg.content}</p>
              </div>
              <div className={`text-[9px] mt-2 font-black uppercase tracking-widest opacity-0 group-hover:opacity-40 transition-opacity
                ${msg.sender_id === user?.id ? "text-right" : "text-left"}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center h-full text-white/10 italic py-20 uppercase font-black tracking-widest text-[10px]">
            Beginning of secure history
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-8 bg-black/60 backdrop-blur-xl border-t border-white/5">
        <div className="relative group">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message @${selectedUser.username}...`}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-8 py-5 pr-20 text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/5 transition-all"
          />
          <button
            type="submit"
            className="absolute right-3 top-3 bottom-3 aspect-square bg-brand-pink rounded-xl flex items-center justify-center hover:bg-brand-berry transition-all shadow-xl active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-105"
            disabled={!newMessage.trim()}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
