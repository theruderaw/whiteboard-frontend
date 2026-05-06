import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navigation: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "🎨" },
    { name: "Social", path: "/social", icon: "👥" },
  ];

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-8 bg-brand-black border-r border-white/5 z-50">
      {/* Logo */}
      <div className="mb-12">
        <div className="h-10 w-10 bg-brand-pink rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-brand-pink/20">
          W
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 flex flex-col gap-6">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`group relative p-4 rounded-2xl transition-all duration-300 
              ${location.pathname === item.path 
                ? "bg-brand-pink/10 text-brand-pink" 
                : "text-white/60 hover:text-white hover:bg-white/5"}`}
          >
            <span className="text-xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{item.icon}</span>
            {location.pathname === item.path && (
              <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-pink rounded-r-full shadow-[0_0_10px_rgba(255,51,102,0.5)]" />
            )}
            
            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-1 bg-brand-navy border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap shadow-2xl">
              {item.name}
            </div>
          </Link>
        ))}

        {/* Dedicated Add Friend Action */}
        <Link
          to="/social"
          className="group relative p-4 rounded-2xl text-brand-pink bg-brand-pink/5 hover:bg-brand-pink hover:text-white transition-all duration-300 shadow-lg shadow-brand-pink/5"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <div className="absolute left-full ml-4 px-3 py-1 bg-brand-pink border border-brand-pink/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap shadow-2xl">
            Quick Add Friend
          </div>
        </Link>
      </div>

      {/* User / Logout */}
      <div className="flex flex-col gap-6">
        <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-[10px] text-white/40 overflow-hidden">
          {user?.username[0].toUpperCase()}
        </div>
        <button
          onClick={logout}
          className="p-4 text-white/20 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
