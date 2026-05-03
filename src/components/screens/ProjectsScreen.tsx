import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, useFirebase } from '../../contexts/FirebaseContext';
import { Project } from '../../types';
import { Card, Button } from '../ui/Base';
import { Folder, Search, MoreVertical, ExternalLink, Trash2 } from 'lucide-react';
import { EditorScreen } from './EditorScreen';

export const ProjectsScreen = () => {
  const { user } = useFirebase();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );
      const snap = await getDocs(q);
      setProjects(snap.docs.map(d => d.data() as Project));
      setLoading(false);
    };
    fetchProjects().catch(console.error);
  }, [user]);

  if (selectedProject) {
    return <EditorScreen project={selectedProject} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Vault</h2>
        <p className="text-gray-500 text-sm">Access and manage your forged addons.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
        <input 
          type="text" 
          placeholder="Search components..."
          className="w-full glass rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/30 border-white/5"
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 glass rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 pb-20">
          {projects.length > 0 ? (
            projects.map((p) => (
              <Card key={p.id} className="p-0 border-white/5 hover:border-white/10 transition-colors group">
                <div onClick={() => setSelectedProject(p)} className="p-4 flex items-start justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-neon-purple/10 flex items-center justify-center text-neon-purple group-hover:neon-glow-purple transition-all">
                      <Folder size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold">{p.name}</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        {p.type} mod • {Object.keys(p.files || {}).length} files
                      </p>
                    </div>
                  </div>
                  <button className="p-2 text-gray-600 hover:text-white transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
                <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500 uppercase font-mono">
                  <span>Last Sync: {new Date(p.updatedAt).toLocaleDateString()}</span>
                  <ExternalLink size={12} className="text-neon-cyan" />
                </div>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-40">
              <Folder size={48} />
              <p className="text-sm">No artifacts detected in current frequency.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
