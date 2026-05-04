import React from "react";
import Navigation from "./Navigation";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-brand-black text-white font-sans antialiased">
      <Navigation />
      <main className="flex-1 ml-20 h-screen overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
