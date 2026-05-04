import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end mb-8 px-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter leading-none mb-1">
            COLLABORATIVE<span className="text-brand-pink">WHITEBOARD</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-brand-blue/30" />
            <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.3em]">{user?.username}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="group relative px-8 py-3 rounded-2xl overflow-hidden transition-all active:scale-95"
        >
          <div className="absolute inset-0 bg-white/5 group-hover:bg-brand-berry/20 transition-colors" />
          <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-brand-pink transition-colors">
            Terminate Session
          </span>
        </button>
      </header>

      <div className="relative group mx-auto max-w-4xl">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-pink to-brand-blue rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000" />
        <div className="relative aspect-video bg-black/40 backdrop-blur-2xl rounded-[2rem] border border-white/10 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-pink/50 to-transparent opacity-50" />
          <div className="h-16 w-16 mb-4 rounded-full bg-brand-pink/5 border border-brand-pink/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <svg className="w-8 h-8 text-brand-pink drop-shadow-[0_0_8px_rgba(238,38,137,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest mb-1">Whiteboard Canvas</h2>
          <p className="text-white/30 text-[10px] font-medium tracking-[0.2em]">DASHBOARD VIEW</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
