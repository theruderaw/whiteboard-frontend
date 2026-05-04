import React, { useState } from "react";
import UserSearch from "../components/social/UserSearch";
import FriendsList from "../components/social/FriendsList";
import RoomsChatList from "../components/social/RoomsChatList";
import ChatWindow from "../components/social/ChatWindow";

const Social: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; isRoom: boolean } | null>(null);

  return (
    <div className="flex h-screen w-full bg-brand-black text-white font-sans selection:bg-brand-pink/30 antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-96 flex flex-col shrink-0 border-r border-white/5 bg-white/[0.01] px-8 py-8 animate-in fade-in slide-in-from-left duration-700">
        <UserSearch onSelectUser={(u) => setSelectedItem({ id: u.id, name: u.username, isRoom: false })} />
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 mt-8">
          <FriendsList 
            onSelectFriend={(u) => setSelectedItem({ id: u.id, name: u.username, isRoom: false })} 
            selectedFriendId={!selectedItem?.isRoom ? selectedItem?.id : undefined} 
          />
          <RoomsChatList 
            onSelectRoom={(r) => setSelectedItem({ id: r.id, name: r.name, isRoom: true })}
            selectedRoomId={selectedItem?.isRoom ? selectedItem?.id : undefined}
          />
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-brand-black">
        <ChatWindow selectedItem={selectedItem} />
      </main>
    </div>
  );
};

export default Social;
