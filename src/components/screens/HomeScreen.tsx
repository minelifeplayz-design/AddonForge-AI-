import { motion } from 'motion/react';
import { Card, Button } from '../ui/Base';
import { Plus, ChevronRight, Zap, Folder, Users, Upload, Loader2, FileJson } from 'lucide-react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { useEffect, useState } from 'react';
import { collection, query, where, limit, getDocs, orderBy, doc, setDoc } from 'firebase/firestore';
import { db } from '../../contexts/FirebaseContext';
import { Project, AddonType, CommunityAddon } from '../../types';
import JSZip from 'jszip';
import { generateUUID } from '../../lib/minecraft';

export const HomeScreen = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const { user } = useFirebase();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [featuredAddons, setFeaturedAddons] = useState<CommunityAddon[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch projects
      const qProjects = query(
        collection(db, 'projects'),
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(3)
      );
      const snapProjects = await getDocs(qProjects).catch(() => ({ docs: [] }));
      setRecentProjects(snapProjects.docs.map(d => d.data() as Project));

      // Fetch community
      const qCommunity = query(
        collection(db, 'community_addons'),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const snapCommunity = await getDocs(qCommunity).catch(() => ({ docs: [] }));
      setFeaturedAddons(snapCommunity.docs.map(d => d.data() as CommunityAddon));
    };

    fetchData().catch(console.error);
  }, [user]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      const files: Record<string, string> = {};

      for (const [path, zipEntry] of Object.entries(content.files)) {
        if (!zipEntry.dir) {
          files[path] = await zipEntry.async('string');
        }
      }

      const projectId = generateUUID();
      const newProject: Project = {
        id: projectId,
        name: file.name.replace('.mcpack', '').replace('.zip', ''),
        description: 'Imported from external transmission',
        type: AddonType.BOTH,
        version: '1.0.0',
        minGameVersion: '1.20.0',
        userId: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        files
      };

      await setDoc(doc(db, 'projects', projectId), newProject);
      setRecentProjects(prev => [newProject, ...prev].slice(0, 3));
    } catch (error) {
      console.error('Import failed', error);
      alert('Failed to extract addon. Corrupted encryption detected.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mainframe</h2>
          <p className="text-xs text-neon-purple uppercase tracking-widest font-mono">Welcome, {user?.displayName?.split(' ')[0]}</p>
        </div>
        <div className="w-10 h-10 rounded-full border border-neon-purple/50 overflow-hidden neon-glow-purple">
          <img src={user?.photoURL || ''} alt="avatar" />
        </div>
      </header>

      {/* Quick Action */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-neon-purple/20 to-transparent border-neon-purple/30 p-6 flex flex-col justify-between">
          <div>
            <Zap className="text-neon-purple mb-4" size={24} />
            <h3 className="text-sm font-bold mb-1">Auto Forge</h3>
            <p className="text-[10px] text-gray-500 mb-4 line-clamp-2">Describe project idea for AI generation.</p>
          </div>
          <Button 
            variant="primary" 
            size="sm"
            className="w-full text-[10px] uppercase font-bold"
            onClick={() => onNavigate('create')}
          >
            INITIALIZE
          </Button>
        </Card>

        <Card className="bg-gradient-to-br from-neon-cyan/20 to-transparent border-neon-cyan/30 p-6 flex flex-col justify-between">
          <div>
            <Upload className="text-neon-cyan mb-4" size={24} />
            <h3 className="text-sm font-bold mb-1">Import File</h3>
            <p className="text-[10px] text-gray-500 mb-4 line-clamp-2">Inject .mcpack or .zip archives.</p>
          </div>
          <label className="cursor-pointer">
            <input type="file" accept=".mcpack,.zip" className="hidden" onChange={handleImport} disabled={isImporting} />
            <div className={`w-full flex items-center justify-center p-2 rounded-lg bg-neon-cyan text-white text-[10px] font-bold uppercase transition-all hover:bg-neon-cyan/90 ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
              {isImporting ? <Loader2 className="animate-spin" size={14} /> : 'SELECT ARCHIVE'}
            </div>
          </label>
        </Card>
      </div>

      {/* Recent Projects */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
            <Folder size={16} /> Recent Files
          </h4>
          <button onClick={() => onNavigate('projects')} className="text-xs text-neon-cyan hover:underline">View All</button>
        </div>
        
        <div className="space-y-3">
          {recentProjects.length > 0 ? (
            recentProjects.map((p) => (
              <Card key={p.id} className="p-4 flex items-center justify-between hover:bg-white/10 cursor-pointer transition-colors border-white/5">
                <div onClick={() => onNavigate('projects')} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-neon-purple/10 flex items-center justify-center text-neon-purple">
                    <FileJson size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold truncate max-w-[150px]">{p.name}</h5>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">v{p.version} • {p.type}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-600" />
              </Card>
            ))
          ) : (
            <div className="text-center py-6 glass rounded-2xl border-dashed border-white/10 opacity-50">
              <p className="text-xs">No active projects found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Community Pulse */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
            <Users size={16} /> Community Pulse
          </h4>
          <button onClick={() => onNavigate('community')} className="text-xs text-neon-cyan hover:underline">Marketplace</button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {featuredAddons.map((a) => (
            <Card key={a.id} className="min-w-[160px] p-4 space-y-3 border-white/5">
              <div className="w-full aspect-square rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-700">
                <Zap size={32} />
              </div>
              <div className="overflow-hidden">
                <h5 className="text-xs font-bold truncate">{a.name}</h5>
                <p className="text-[8px] text-neon-cyan uppercase font-mono truncate">By {a.authorName}</p>
              </div>
            </Card>
          ))}
          {featuredAddons.length === 0 && (
            <div className="w-full text-center py-8 opacity-50">
              <p className="text-xs italic">Scanning community frequencies...</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
