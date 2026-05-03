import { Home, Users, PlusSquare, FolderOpen, User } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'community', icon: Users, label: 'Community' },
    { id: 'create', icon: PlusSquare, label: 'Create', highlight: true },
    { id: 'projects', icon: FolderOpen, label: 'Projects' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-4 py-2 flex justify-between items-center z-50 rounded-t-3xl pb-safe">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors relative px-2 py-1",
            activeTab === tab.id ? "text-neon-purple font-medium" : "text-gray-500 hover:text-gray-300",
            tab.highlight && "bg-neon-purple/20 rounded-xl p-2 text-neon-purple border border-neon-purple/30"
          )}
        >
          <tab.icon size={tab.highlight ? 24 : 20} />
          <span className="text-[10px] uppercase tracking-wider">{tab.label}</span>
          {activeTab === tab.id && !tab.highlight && (
            <motion.div
              layoutId="navIndicator"
              className="absolute -bottom-1 w-1 h-1 bg-neon-purple rounded-full"
            />
          )}
        </button>
      ))}
    </nav>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-dark-bg selection:bg-neon-purple/30 text-gray-100 flex flex-col relative overflow-hidden cyber-grid">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-neon-purple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-64 h-64 bg-neon-cyan/10 rounded-full blur-[100px] pointer-events-none" />
      
      <main className="flex-1 pb-24 max-w-lg mx-auto w-full relative z-10 p-4">
        {children}
      </main>
    </div>
  );
};
