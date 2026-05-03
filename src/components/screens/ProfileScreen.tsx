import { useFirebase } from '../../contexts/FirebaseContext';
import { Card, Button } from '../ui/Base';
import { User, LogOut, Settings, Shield, Award, Terminal } from 'lucide-react';

export const ProfileScreen = () => {
  const { user, signOut } = useFirebase();

  const stats = [
    { label: 'Forged', value: '12', icon: Terminal },
    { label: 'Broadcasts', value: '4', icon: Award },
    { label: 'Trust Rank', value: 'Alpha', icon: Shield }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Identity</h2>
        <p className="text-gray-500 text-sm">Operator profile and network clearance.</p>
      </div>

      <Card className="flex flex-col items-center text-center p-8 border-neon-purple/20 bg-gradient-to-b from-neon-purple/10 to-transparent">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full border-2 border-neon-purple p-1 neon-glow-purple">
            <img src={user?.photoURL || ''} alt="profile" className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="absolute bottom-1 right-1 w-6 h-6 bg-neon-cyan rounded-full border-2 border-dark-bg flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold">{user?.displayName}</h3>
        <p className="text-xs text-gray-400 font-mono mt-1">{user?.email}</p>
        
        <div className="grid grid-cols-3 gap-8 w-full mt-8 border-t border-white/5 pt-8">
           {stats.map((s, i) => (
             <div key={i} className="flex flex-col items-center gap-1">
               <s.icon size={16} className="text-neon-cyan mb-1" />
               <span className="text-lg font-bold">{s.value}</span>
               <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none">{s.label}</span>
             </div>
           ))}
        </div>
      </Card>

      <div className="space-y-3">
        <button className="w-full flex items-center justify-between p-4 glass rounded-2xl border-white/5 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-4">
            <Settings size={20} className="text-gray-500" />
            <span className="text-sm font-medium">Workspace Config</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-neon-purple" />
        </button>

        <button className="w-full flex items-center justify-between p-4 glass rounded-2xl border-white/5 hover:bg-white/10 transition-colors">
           <div className="flex items-center gap-4">
            <Shield size={20} className="text-gray-500" />
            <span className="text-sm font-medium">Security Protocols</span>
          </div>
        </button>
      </div>

      <Button 
        variant="ghost" 
        className="w-full text-red-500 gap-2 border border-red-500/10 hover:bg-red-500/5 mt-8 h-14 rounded-2xl"
        onClick={signOut}
      >
        <LogOut size={18} /> DE-AUTHORIZE SESSION
      </Button>

      <p className="text-[10px] text-center text-gray-700 uppercase tracking-[0.2em] pt-4">
        AddonForge AI • build_v1.0.82
      </p>
    </div>
  );
};
