import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

type User = { id: string; username: string };

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
};

interface ChatPanelProps {
  onClose?: () => void;
  roomId?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onClose, roomId }) => {
  const { user, accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoomChat, setIsRoomChat] = useState<boolean>(true); // Default to room chat
  const [activeTab, setActiveTab] = useState<'chat' | 'friends'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomMessages, setRoomMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [large, setLarge] = useState<boolean>(false);
  
  const roomSocketRef = useRef<WebSocket | null>(null);
  const chatSocketRef = useRef<WebSocket | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const WS_URL = API_URL.replace("http", "ws");

  // Widths – default 380px, large 560px
  const panelWidth = large ? 560 : 380;

  // Fetch initial data
  useEffect(() => {
    if (!accessToken) return;
    const fetchData = async () => {
      try {
        const [uRes, fRes, rRes] = await Promise.all([
          fetch(`${API_URL}/auth/users`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${API_URL}/friends/`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${API_URL}/friends/requests`, { headers: { Authorization: `Bearer ${accessToken}` } })
        ]);
        if (uRes.ok) setUsers(await uRes.json());
        if (fRes.ok) setFriends(await fRes.json());
        if (rRes.ok) setFriendRequests(await rRes.json());
      } catch (err) {
        console.error("Failed to fetch initial chat data", err);
      }
    };
    fetchData();
  }, [accessToken]);

  // Search users
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/users/search?q=${searchQuery}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) setSearchResults(await res.json());
      } catch (err) {
        console.error("Search failed", err);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, accessToken]);

  const sendFriendRequest = async (friendId: string) => {
    try {
      const res = await fetch(`${API_URL}/friends/request/${friendId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        alert("Friend request sent!");
        setSearchQuery("");
      } else {
        const err = await res.json();
        alert(`Failed to send request: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to send friend request", err);
      alert("A network error occurred. Please try again.");
    }
  };

  const acceptFriendRequest = async (friendId: string) => {
    try {
      const res = await fetch(`${API_URL}/friends/accept/${friendId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        // Refresh friends and requests
        const [fRes, rRes] = await Promise.all([
          fetch(`${API_URL}/friends/`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${API_URL}/friends/requests`, { headers: { Authorization: `Bearer ${accessToken}` } })
        ]);
        if (fRes.ok) setFriends(await fRes.json());
        if (rRes.ok) setFriendRequests(await rRes.json());
      }
    } catch (err) {
      console.error("Failed to accept friend request", err);
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const res = await fetch(`${API_URL}/friends/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        setFriends(prev => prev.filter(f => f.id !== friendId));
        if (selectedUser?.id === friendId) setSelectedUser(null);
      }
    } catch (err) {
      console.error("Failed to remove friend", err);
    }
  };

  // WebSocket Connection - Room
  useEffect(() => {
    if (!roomId) return;

    const socket = new WebSocket(`${WS_URL}/ws/${roomId}`);
    roomSocketRef.current = socket;

    socket.onmessage = (event) => {
      const message = jsonSafeParse(event.data);
      if (message && message.type === 'chat') {
        setRoomMessages((prev) => [...prev, message.data]);
      }
    };

    return () => {
      socket.close();
    };
  }, [roomId]);

  // WebSocket Connection - 1-to-1 Global Chat
  useEffect(() => {
    if (!user?.id) return;

    const socket = new WebSocket(`${WS_URL}/ws/chat/${user.id}`);
    chatSocketRef.current = socket;

    socket.onmessage = (event) => {
      const message = jsonSafeParse(event.data);
      if (message && message.type === 'chat') {
        // If the message is for the currently selected user, add it to messages
        // Otherwise, we might want to show a notification (omitted for now)
        if (selectedUser && (message.data.sender_id === selectedUser.id || message.data.sender_id === user.id)) {
          setMessages((prev) => [...prev, message.data]);
        }
      }
    };

    return () => {
      socket.close();
    };
  }, [user?.id, selectedUser]);

  const jsonSafeParse = (data: string) => {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  // Fetch chat history when selectedUser changes (for 1-to-1)
  useEffect(() => {
    if (isRoomChat) return; // No history for room chat yet (ephemeral)
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
  }, [selectedUser, accessToken, isRoomChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !accessToken) return;

    if (!isRoomChat && selectedUser) {
      // 1-to-1 Chat
      const chatData = {
        id: crypto.randomUUID(),
        sender_id: user?.id,
        receiver_id: selectedUser.id,
        content: newMessage,
        timestamp: new Date().toISOString()
      };

      // Send via WS for instant delivery
      if (chatSocketRef.current?.readyState === WebSocket.OPEN) {
        chatSocketRef.current.send(JSON.stringify({
          type: 'chat',
          receiver_id: selectedUser.id,
          data: chatData
        }));
      }

      // Also persist to DB via REST (optional if WS handles it, but let's keep it robust)
      try {
        await fetch(`${API_URL}/messages/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ receiver_id: selectedUser.id, content: newMessage }),
        });
      } catch (err) {
        console.error("Failed to persist message", err);
      }

      setMessages((prev) => [...prev, chatData as any]);
      setNewMessage("");
    } else if (isRoomChat && roomId && roomSocketRef.current?.readyState === WebSocket.OPEN) {
      // Room Chat
      const chatData = {
        id: crypto.randomUUID(),
        sender_id: user?.id,
        content: newMessage,
        timestamp: new Date().toISOString()
      };
      
      roomSocketRef.current.send(JSON.stringify({
        type: 'chat',
        data: chatData
      }));
      
      setRoomMessages((prev) => [...prev, chatData as any]);
      setNewMessage("");
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
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-brand-pink transition-colors"
            title="Exit"
          >
            ✕
          </button>
        )}
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
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/40 hover:text-brand-pink transition-colors"
              title="Exit Chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-pink">Secure Chat</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLarge(!large)}
            className="p-1 rounded hover:bg-white/5"
            title={large ? "Shrink" : "Expand"}
          >
            {/* Size toggle icon */}
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
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

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-2 pt-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors 
            ${activeTab === 'chat' ? "text-brand-pink border-b-2 border-brand-pink" : "text-white/30 hover:text-white/50"}`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors 
            ${activeTab === 'friends' ? "text-brand-pink border-b-2 border-brand-pink" : "text-white/30 hover:text-white/50"}`}
        >
          Friends {friendRequests.length > 0 && `(${friendRequests.length})`}
        </button>
      </div>

      {activeTab === 'chat' ? (
        <>
          {/* Contacts list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              onClick={() => {
                setIsRoomChat(true);
                setSelectedUser(null);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors 
                ${isRoomChat ? "bg-brand-pink/20 text-brand-pink" : "bg-white/5 hover:bg-white/10 text-white/70"}`}
            >
              🌐 Room Chat
            </button>
            <div className="pt-2 pb-1 px-3 text-[10px] font-black uppercase tracking-widest text-white/20">
              Friends
            </div>
            {friends.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setIsRoomChat(false);
                  setSelectedUser(f);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors 
                  ${selectedUser?.id === f.id ? "bg-brand-pink/20 text-brand-pink" : "bg-white/5 hover:bg-white/10 text-white/70"}`}
              >
                @{f.username}
              </button>
            ))}
          </div>

          {/* Message view */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/30">
            {isRoomChat ? (
              roomMessages.length > 0 ? (
                roomMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-xl text-sm 
                        ${msg.sender_id === user?.id ? "bg-brand-pink text-white" : "bg-brand-navy/60 text-white/80"}`}
                    >
                      <div className="text-[10px] font-black uppercase tracking-tighter opacity-50 mb-1">
                        {users.find(u => u.id === msg.sender_id)?.username || "User"}
                      </div>
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
                <div className="text-center text-white/40 mt-8 italic">No messages in this space yet</div>
              )
            ) : selectedUser ? (
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
              <div className="text-center text-white/40 mt-8">Select a friend to start chatting</div>
            )}
          </div>

          {/* Send message form */}
          {(selectedUser || isRoomChat) && (
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
              <div className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isRoomChat ? "Message the room..." : "Type a message..."}
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
        </>
      ) : (
        /* Friends Tab */
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users to add..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-pink transition-colors"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-brand-navy border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                {searchResults.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                    <span className="text-sm font-medium">@{u.username}</span>
                    <button
                      onClick={() => sendFriendRequest(u.id)}
                      className="text-[10px] font-black uppercase tracking-widest text-brand-pink hover:text-brand-berry transition-colors"
                    >
                      Add Friend
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Pending Requests */}
            {friendRequests.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 px-1">Friend Requests</h3>
                <div className="space-y-2">
                  {friendRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-sm">@{req.username}</span>
                      <button
                        onClick={() => acceptFriendRequest(req.id)}
                        className="bg-brand-pink/20 text-brand-pink text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider hover:bg-brand-pink hover:text-white transition-all"
                      >
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Friends */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 px-1">My Friends</h3>
              <div className="space-y-2">
                {friends.length > 0 ? (
                  friends.map(f => (
                    <div key={f.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 group">
                      <span className="text-sm">@{f.username}</span>
                      <button
                        onClick={() => removeFriend(f.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/20 text-sm py-8 italic">No friends added yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
