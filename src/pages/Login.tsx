import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, error, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null; // Let the main app handle global loading

  return (
    <div className="w-full max-w-md animate-in fade-in zoom-in slide-in-from-top-4 duration-700">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-brand-pink/10 to-brand-blue/10 border border-white/5 mb-4 shadow-inner">
          <svg className="w-10 h-10 text-brand-pink filter drop-shadow-[0_0_15px_rgba(238,38,137,0.3)]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter mb-2 leading-tight uppercase">
          Collaborative <span className="text-brand-pink">Whiteboard</span>
        </h1>
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">
          developed by {" "}
          <a 
            href="https://github.com/theruderaw" 
            target="_blank" 
            rel="noreferrer"
            className="text-brand-blue hover:text-brand-pink transition-colors underline underline-offset-4"
          >
            rudra sen mallik
          </a>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-4 bg-gradient-to-r from-brand-pink/20 to-brand-blue/20 rounded-[2.5rem] blur-2xl opacity-50" />
        <div className="relative space-y-4 p-8 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-blue">Access Key</label>
              <span className="text-[9px] text-white/20 font-mono">ID_STR</span>
            </div>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 bg-black/40 rounded-xl border border-white/5 focus:border-brand-pink/50 focus:ring-4 focus:ring-brand-pink/10 outline-none transition-all placeholder:text-white/10 font-medium text-sm"
              placeholder="Username"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-blue">Secret Cipher</label>
              <span className="text-[9px] text-white/20 font-mono">AES_256</span>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-black/40 rounded-xl border border-white/5 focus:border-brand-pink/50 focus:ring-4 focus:ring-brand-pink/10 outline-none transition-all placeholder:text-white/10 text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-brand-berry/10 border border-brand-berry/30 text-brand-pink text-[11px] font-bold text-center uppercase tracking-widest animate-pulse">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="relative w-full py-5 mt-2 group/btn transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-pink to-brand-berry rounded-2xl shadow-[0_0_30px_rgba(238,38,137,0.3)] group-hover/btn:shadow-[0_0_50px_rgba(238,38,137,0.5)] transition-all" />
            <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.4em]">
              {isSubmitting ? "Syncing..." : "Sign In"}
            </span>
          </button>
        </div>
      </form>
      
      <p className="text-center mt-8 text-[10px] font-bold uppercase tracking-[0.3em] text-white/10 hover:text-white/30 transition-colors cursor-default">
        Session Persistence Active
      </p>
    </div>
  );
};

export default Login;
