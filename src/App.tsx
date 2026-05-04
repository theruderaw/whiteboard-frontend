// src/App.tsx - cleaned version with toggleable ChatPanel (default hidden)
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Social from "./pages/Social";
import Layout from "./components/Layout";
import ChatPanel from "./components/ChatPanel";
import { useState } from "react";

const AppContent = () => {
  const { user, isLoading } = useAuth();
  const [showChat, setShowChat] = useState<boolean>(false); // default hidden
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-black">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-4 border-brand-pink animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink/50">
            Booting
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-brand-black text-white selection:bg-brand-pink/30 font-sans antialiased relative">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={user ? <Layout><Dashboard onRoomChange={setActiveRoomId} /></Layout> : <Navigate to="/" />} />
        <Route path="/social" element={user ? <Layout><Social /></Layout> : <Navigate to="/" />} />
      </Routes>
      
      {/* Toggle button for ChatPanel */}
      {user && (
        <button
          onClick={() => setShowChat((prev) => !prev)}
          className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-brand-pink hover:bg-brand-berry transition-colors shadow-lg"
          title={showChat ? "Hide Chat" : "Show Chat"}
        >
          {showChat ? "✕" : "💬"}
        </button>
      )}
      {/* Render ChatPanel when enabled */}
      {user && showChat && (
        <ChatPanel 
          onClose={() => setShowChat(false)} 
          roomId={activeRoomId || undefined} 
        />
      )}
    </div>
  );
};

const App = () => (
  <Router>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </Router>
);

export default App;