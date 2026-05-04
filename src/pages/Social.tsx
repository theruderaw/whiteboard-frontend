import React, { useState } from "react";
import UserSearch from "../components/social/UserSearch";
import FriendsList from "../components/social/FriendsList";
import ChatWindow from "../components/social/ChatWindow";

const Social: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);

  return (
    <div className="flex h-screen w-full bg-brand-black text-white font-sans selection:bg-brand-pink/30 antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-96 flex flex-col shrink-0 border-r border-white/5 bg-white/[0.01] px-8 py-8 animate-in fade-in slide-in-from-left duration-700">
        <UserSearch onSelectUser={setSelectedUser} />
        <FriendsList onSelectFriend={setSelectedUser} selectedFriendId={selectedUser?.id} />
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-brand-black">
        <ChatWindow selectedUser={selectedUser} />
      </main>
    </div>
  );
};

export default Social;
