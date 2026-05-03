import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { collection, query, getDocs, orderBy, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, useFirebase } from '../../contexts/FirebaseContext';
import { CommunityAddon, Project } from '../../types';
import { Card, Button } from '../ui/Base';
import { Users, Download, Share2, Search, ExternalLink, Shield } from 'lucide-react';

export const CommunityScreen = () => {
  const { user } = useFirebase();
  const [addons, setAddons] = useState<CommunityAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchAddons = async () => {
      const q = query(
        collection(db, 'community_addons'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => d.data() as CommunityAddon);
      // Filter out expired (3 days policy)
      const now = Date.now();
      setAddons(data.filter(a => a.expiresAt > now));
      setLoading(false);
    };

    const fetchUserProjects = async () => {
      if (!user) return;
      const q = query(collection(db, 'projects'), orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      setUserProjects(snap.docs.map(d => d.data() as Project));
    };

    fetchAddons().catch(console.error);
    fetchUserProjects().catch(console.error);
  }, [user]);

  const handleShare = async (project: Project) => {
    if (!user) return;
    const downloadUrl = `https://mock-download-url.com/${project.id}.mcpack`; // In real app, upload to storage
    const newShare: Omit<CommunityAddon, 'id'> = {
      projectId: project.id,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      name: project.name,
      description: project.description,
      downloadUrl,
      createdAt: Date.now(),
      expiresAt: Date.now() + (3 * 24 * 60 * 60 * 1000) // 3 days
    };

    const docRef = await addDoc(collection(db, 'community_addons'), newShare);
    // Update local state
    setAddons(prev => [{ ...newShare, id: docRef.id }, ...prev]);
    setShowShareModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Market</h2>
          <p className="text-gray-500 text-sm">Community-verified artifact transmissions.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowShareModal(true)}>
          <Share2 size={14} className="mr-2" /> BROADCAST
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
        <input 
          type="text" 
          placeholder="Filter frequencies..."
          className="w-full glass rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 border-white/5"
        />
      </div>

      <div className="grid gap-4 pb-20">
        {loading ? (
          <div className="space-y-4">
             {[1, 2].map(i => <div key={i} className="h-40 glass rounded-3xl animate-pulse" />)}
          </div>
        ) : addons.map((a) => (
          <Card key={a.id} className="p-0 border-white/5 overflow-hidden flex flex-col">
            <div className="p-5 flex-1 space-y-4">
               <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{a.name}</h3>
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-neon-cyan/20 flex items-center justify-center text-[10px] text-neon-cyan border border-neon-cyan/20">
                          <Shield size={10} />
                       </div>
                       <span className="text-[10px] text-neon-cyan uppercase font-mono tracking-wider">{a.authorName}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-red-400 bg-red-400/10 px-2 py-1 rounded border border-red-400/20 uppercase font-mono">
                    Expires in {Math.ceil((a.expiresAt - Date.now()) / (1000 * 60 * 60))}H
                  </div>
               </div>
               <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                 {a.description}
               </p>
            </div>
            <div className="p-4 bg-white/[0.03] border-t border-white/5 flex gap-2">
               <Button variant="outline" size="sm" className="flex-1 text-[10px] uppercase font-bold border-white/10">
                 <Download size={14} className="mr-2" /> Download Source
               </Button>
               <Button variant="ghost" size="sm" className="aspect-square p-0 border border-white/5">
                 <ExternalLink size={14} />
               </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
          <Card className="relative w-full max-w-sm glass border-white/20 p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold">Broadcast Transmission</h3>
              <p className="text-xs text-gray-500 mt-1">Addons will be public for 72 hours only.</p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {userProjects.map(p => (
                <button 
                  key={p.id}
                  onClick={() => handleShare(p)}
                  className="w-full text-left p-4 glass hover:bg-white/10 transition-colors border-white/5 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-neon-purple" />
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <ExternalLink size={14} className="text-gray-600" />
                </button>
              ))}
            </div>

            <Button variant="ghost" className="w-full text-gray-500" onClick={() => setShowShareModal(false)}>
              ABORT UPLINK
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
