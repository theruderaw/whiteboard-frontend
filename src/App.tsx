import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Social from "./pages/Social";
import Layout from "./components/Layout";

const AppContent = () => {
  const { user, isLoading } = useAuth();

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
    <div className="h-screen w-screen w-full flex flex-col overflow-hidden bg-brand-black text-white selection:bg-brand-pink/30 font-sans antialiased relative">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <div className="flex-1 flex items-center justify-center p-4"><Login /></div>} />
        <Route path="/dashboard" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/" />} />
        <Route path="/social" element={user ? <Layout><Social /></Layout> : <Navigate to="/" />} />
      </Routes>
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