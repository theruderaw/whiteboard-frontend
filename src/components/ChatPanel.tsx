import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../hooks/chat/useChat";
import ChatMessages from "./chat/ChatMessages";
import ChatInput from "./chat/ChatInput";

interface ChatPanelProps {
  onClose?: () => void;
  roomId?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onClose, roomId }) => {
  const { user, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'friends'>('chat');
  const { messages, sendMessage, scrollRef, setIsRoomChat, selectedUser, setSelectedUser } = useChat(roomId, user, accessToken);

  // Friends/Users State
  const [friends, setFriends] = useState<any[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!accessToken) return;
    fetch(`${API_URL}/friends/`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(res => res.json())
      .then(setFriends)
      .catch(console.error);
  }, [accessToken, API_URL]);

  return (
    <div className="fixed inset-y-0 right-0 w-[380px] bg-black/90 backdrop-blur-2xl border-l border-white/10 flex flex-col z-50 shadow-2xl animate-in slide-in-from-right duration-500">
      {/* Header Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => { setActiveTab('chat'); setIsRoomChat(true); setSelectedUser(null); }}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all
            ${activeTab === 'chat' ? "text-brand-pink border-b-2 border-brand-pink bg-brand-pink/5" : "text-white/30 hover:text-white/60"}`}
        >
          Room Chat
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all
            ${activeTab === 'friends' ? "text-brand-pink border-b-2 border-brand-pink bg-brand-pink/5" : "text-white/30 hover:text-white/60"}`}
        >
          Direct Messages
        </button>
        <button onClick={onClose} className="px-4 text-white/60 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {activeTab === 'chat' ? (
        <>
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-pink">Live Feed: Workspace 1</h4>
          </div>
          <ChatMessages messages={messages} currentUserId={user?.id} isRoomChat={true} scrollRef={scrollRef} />
          <ChatInput onSendMessage={sendMessage} placeholder="Message the room..." />
        </>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedUser ? (
            <>
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <button onClick={() => { setSelectedUser(null); setIsRoomChat(true); }} className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white flex items-center gap-2 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to List
                </button>
                <span className="text-xs font-bold text-white">@{selectedUser.username}</span>
              </div>
              <ChatMessages messages={messages} currentUserId={user?.id} isRoomChat={false} scrollRef={scrollRef} />
              <ChatInput onSendMessage={sendMessage} placeholder={`Message @${selectedUser.username}...`} />
            </>
          ) : (
            <div className="p-4 space-y-2 overflow-y-auto">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4 px-2">Your Contacts</h3>
              {friends.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setSelectedUser(f); setIsRoomChat(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left group"
                >
                  <div className="h-8 w-8 rounded-lg bg-brand-pink/10 flex items-center justify-center font-black text-xs text-brand-pink border border-brand-pink/20">
                    {f.username[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">@{f.username}</span>
                </button>
              ))}
              {friends.length === 0 && <p className="text-center py-8 text-[9px] font-black uppercase tracking-widest text-white/10">No friends yet</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
