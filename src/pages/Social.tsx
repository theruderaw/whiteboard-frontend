import React, { useState } from "react";
import UserSearch from "../components/social/UserSearch";
import FriendsList from "../components/social/FriendsList";
import ChatWindow from "../components/social/ChatWindow";

const Social: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);

  return (
    <div className="flex flex-col h-screen w-full px-8 py-8 bg-brand-black text-white font-sans selection:bg-brand-pink/30 antialiased overflow-hidden">
      {/* Social Content */}
      <div className="flex flex-1 gap-8 min-h-0 overflow-hidden mb-4">
        {/* Sidebar */}
        <aside className="w-80 flex flex-col shrink-0 animate-in fade-in slide-in-from-left duration-700 delay-100">
          <UserSearch onSelectUser={setSelectedUser} />
          <FriendsList onSelectFriend={setSelectedUser} selectedFriendId={selectedUser?.id} />
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          <ChatWindow selectedUser={selectedUser} />
        </main>
      </div>
    </div>
  );
};

export default Social;
