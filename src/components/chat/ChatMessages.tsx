import React from "react";

interface Message {
  id: string;
  sender_id: string;
  sender_username?: string;
  content: string;
  timestamp: string;
}

interface ChatMessagesProps {
  messages: Message[];
  currentUserId?: string;
  isRoomChat: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, currentUserId, isRoomChat, scrollRef }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/30">
      {messages.length > 0 ? (
        messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] px-4 py-2 rounded-xl text-sm ${msg.sender_id === currentUserId ? "bg-brand-pink text-white" : "bg-brand-navy/60 text-white/80"}`}>
              {isRoomChat && msg.sender_id !== currentUserId && (
                <div className="text-[10px] font-black uppercase tracking-tighter opacity-50 mb-1">
                  @{msg.sender_username || "User"}
                </div>
              )}
              {msg.content}
              <div className="text-[10px] mt-1 opacity-50 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-white/20 mt-8 italic text-xs uppercase tracking-widest">No history yet</div>
      )}
      <div ref={scrollRef} />
    </div>
  );
};

export default ChatMessages;
