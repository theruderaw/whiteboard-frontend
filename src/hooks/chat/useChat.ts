import { useState, useEffect, useRef, useCallback } from "react";

export const useChat = (roomId: string | undefined, user: any, accessToken: string | null) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [roomMessages, setRoomMessages] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isRoomChat, setIsRoomChat] = useState<boolean>(true);
  const chatSocketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const WS_URL = API_URL.replace("http", "ws");

  const fetchHistory = useCallback(async () => {
    if (!accessToken) return;
    try {
      if (roomId) {
        const res = await fetch(`${API_URL}/messages/${roomId}?is_room=true`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) setRoomMessages(await res.json());
      }
      if (selectedUser) {
        const res = await fetch(`${API_URL}/messages/${selectedUser.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) setMessages(await res.json());
      }
    } catch (err) { console.error(err); }
  }, [roomId, selectedUser, accessToken]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!user?.id || !accessToken) return;

    let reconnectTimeoutId: any = null;
    let reconnectAttempts = 0;
    let socket: WebSocket | null = null;
    let isDestroyed = false;

    const connect = () => {
      if (isDestroyed) return;

      console.log(`[Chat] Connecting socket for user ${user.id}, attempt: ${reconnectAttempts + 1}`);
      socket = new WebSocket(`${WS_URL}/ws/chat/${user.id}`);
      chatSocketRef.current = socket;

      socket.onopen = () => {
        console.log("[Chat] Socket connected successfully.");
        reconnectAttempts = 0;
        if (roomId) {
          socket?.send(JSON.stringify({ type: "join_room", room_id: roomId }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'chat') {
            if (msg.room_id) setRoomMessages(prev => [...prev, msg.data]);
            else setMessages(prev => [...prev, msg.data]);
          }
        } catch (e) { console.error("[Chat] Parse error:", e); }
      };

      socket.onerror = (err) => {
        console.warn("[Chat] WebSocket Error:", err);
      };

      socket.onclose = (event) => {
        if (isDestroyed) return;
        console.warn(`[Chat] WebSocket Closed. Code: ${event.code}. Reconnecting in backoff delay...`);
        
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        reconnectTimeoutId = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      isDestroyed = true;
      clearTimeout(reconnectTimeoutId);
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
      }
      chatSocketRef.current = null;
    };
  }, [user?.id, roomId, accessToken, WS_URL]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, roomMessages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    const chatData = {
      id: crypto.randomUUID(),
      sender_id: user?.id,
      sender_username: user?.username,
      content,
      timestamp: new Date().toISOString(),
      ...(isRoomChat ? { room_id: roomId } : { receiver_id: selectedUser?.id })
    };

    if (chatSocketRef.current?.readyState === WebSocket.OPEN) {
      chatSocketRef.current.send(JSON.stringify({
        type: 'chat',
        ...(isRoomChat ? { room_id: roomId } : { receiver_id: selectedUser?.id }),
        data: chatData
      }));
    }

    fetch(`${API_URL}/messages/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ content, ...(isRoomChat ? { room_id: roomId } : { receiver_id: selectedUser?.id }) }),
    });

    if (isRoomChat) setRoomMessages(prev => [...prev, chatData]);
    else setMessages(prev => [...prev, chatData]);
  };

  return {
    messages: isRoomChat ? roomMessages : messages,
    sendMessage,
    scrollRef,
    isRoomChat,
    setIsRoomChat,
    selectedUser,
    setSelectedUser
  };
};
