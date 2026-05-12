import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../hooks/chat/useChat";
import ChatMessages from "./chat/ChatMessages";
import ChatInput from "./chat/ChatInput";

interface ChatPanelProps {
  roomId?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ roomId }) => {
  const { user, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'friends'>('chat');
  const { messages, sendMessage, scrollRef, setIsRoomChat, selectedUser, setSelectedUser } = useChat(roomId, user, accessToken);

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
    <div className="w-[360px] h-[500px] flex flex-col relative">
      <div className="flex border-b border-white/10">
        <button
          onClick={() => { setActiveTab('chat'); setIsRoomChat(true); setSelectedUser(null); }}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all
            ${activeTab === 'chat' ? "text-brand-pink border-b-2 border-brand-pink bg-brand-pink/5" : "text-white/30 hover:text-white/60"}`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all
            ${activeTab === 'friends' ? "text-brand-pink border-b-2 border-brand-pink bg-brand-pink/5" : "text-white/30 hover:text-white/60"}`}
        >
          DMs
        </button>
      </div>

      {activeTab === 'chat' ? (
        <div className="flex-1 flex flex-col min-h-0">
          <ChatMessages messages={messages} currentUserId={user?.id} isRoomChat={true} scrollRef={scrollRef} />
          <ChatInput onSendMessage={sendMessage} placeholder="Message the room..." />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {selectedUser ? (
            <>
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <button onClick={() => { setSelectedUser(null); setIsRoomChat(true); }} className="text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white flex items-center gap-2">
                  Back
                </button>
                <span className="text-xs font-bold text-white">@{selectedUser.username}</span>
              </div>
              <ChatMessages messages={messages} currentUserId={user?.id} isRoomChat={false} scrollRef={scrollRef} />
              <ChatInput onSendMessage={sendMessage} placeholder={`Message @${selectedUser.username}...`} />
            </>
          ) : (
            <div className="p-3 space-y-1 overflow-y-auto">
              {friends.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setSelectedUser(f); setIsRoomChat(false); }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-all text-left"
                >
                  <div className="h-6 w-6 rounded-md bg-brand-pink/10 flex items-center justify-center font-black text-[10px] text-brand-pink">
                    {f.username[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-white/70">@{f.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
