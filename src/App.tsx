import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

const AppContent = () => {
  const { user, accessToken, isLoading } = useAuth();

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
    <div className="h-screen bg-brand-black text-white selection:bg-brand-pink/30 font-sans antialiased overflow-hidden relative">
      {/* --- DEV TOOLS OVERLAY --- */}
      <div className="fixed top-4 right-4 z-50 group">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 hover:border-brand-pink/50 transition-all cursor-help">
          <div className={`h-1.5 w-1.5 rounded-full ${user ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-brand-pink shadow-[0_0_8px_#ee2689] animate-pulse'}`} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">
            {user ? 'Session Active' : 'Offline'}
          </span>
        </div>
        
        <div className="absolute top-full right-0 mt-3 w-56 p-5 bg-brand-black/90 backdrop-blur-3xl rounded-[2rem] border border-white/10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all pointer-events-none shadow-2xl">
          <h3 className="text-[9px] font-black text-brand-blue uppercase tracking-widest mb-3">Auth Debug</h3>
          <div className="space-y-2 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-white/30">User</span>
              <span className="text-white/80">{user?.username || 'NULL'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/30">Token</span>
              <span className="text-brand-pink">{accessToken ? 'OK' : 'FAIL'}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="relative flex flex-col items-center justify-center h-full p-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-navy/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-berry/15 blur-[120px] rounded-full" />
        </div>

        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;