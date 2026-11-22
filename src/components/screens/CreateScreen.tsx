import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button } from '../ui/Base';
import { Zap, Cpu, ArrowLeft, Loader2, Rocket, FileJson, CheckCircle2 } from 'lucide-react';
import { AddonType, Project } from '../../types';
import { createManifest, getBaseFolderStructure, generateUUID } from '../../lib/minecraft';
import { generateAddonFiles } from '../../services/geminiService';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../contexts/FirebaseContext';

type CreationStep = 'mode' | 'setup' | 'generating' | 'success';

export const CreateScreen = ({ onComplete }: { onComplete: () => void }) => {
  const { user } = useFirebase();
  const [step, setStep] = useState<CreationStep>('mode');
  const [mode, setMode] = useState<'auto' | 'guided'>('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    minGameVersion: '1.20.0',
    type: AddonType.BOTH,
    idea: ''
  });

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      let projectFiles: Record<string, string> = {};
      let finalType = formData.type;

      if (mode === 'auto') {
        setStep('generating');
        const aiResult = await generateAddonFiles(formData.idea);
        projectFiles = aiResult.files;
        finalType = aiResult.type;
      } else {
        // Guided: create base structure
        const paths = getBaseFolderStructure(formData.name, formData.type);
        paths.forEach(path => {
          if (path.endsWith('.json')) {
            if (path.includes('manifest.json')) {
              const packType = path.includes('behavior_packs') ? 'data' : 'resources';
              projectFiles[path] = JSON.stringify(
                createManifest(formData.name, formData.description, formData.version, formData.minGameVersion, packType),
                null,
                2
              );
            } else {
              projectFiles[path] = '{}';
            }
          } else {
            projectFiles[path] = ''; // directory
          }
        });
      }

      const projectId = generateUUID();
      const newProject: Project = {
        id: projectId,
        name: formData.name || 'Untitled Addon',
        description: formData.description || formData.idea,
        type: finalType,
        version: formData.version,
        minGameVersion: formData.minGameVersion,
        userId: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        files: projectFiles
      };

      await setDoc(doc(db, 'projects', projectId), newProject);
      setStep('success');
    } catch (err: any) {
      setError(err.message);
      setStep('setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col pt-4">
      <AnimatePresence mode="wait">
        {step === 'mode' && (
          <motion.div
            key="mode"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter">Choose Your Path</h2>
              <p className="text-gray-500 text-sm">Select how you want to forge your next addon.</p>
            </div>

            <div className="grid gap-4">
              <Card 
                onClick={() => { setMode('auto'); setStep('setup'); }}
                className={`p-6 border-2 transition-all cursor-pointer hover:border-neon-purple/50 ${mode === 'auto' ? 'border-neon-purple bg-neon-purple/5' : 'border-white/5'}`}
              >
                <div className="flex gap-6 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-neon-purple/10 flex items-center justify-center text-neon-purple flex-shrink-0 neon-glow-purple">
                    <Zap size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Auto Forge</h3>
                    <p className="text-sm text-gray-400">Describe your idea, and AI will generate the entire addon structure and files for you.</p>
                  </div>
                </div>
              </Card>

              <Card 
                onClick={() => { setMode('guided'); setStep('setup'); }}
                className={`p-6 border-2 transition-all cursor-pointer hover:border-black/50 ${mode === 'guided' ? 'border-neon-cyan bg-neon-cyan/5' : 'border-white/5'}`}
              >
                <div className="flex gap-6 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-neon-cyan/10 flex items-center justify-center text-neon-cyan flex-shrink-0 neon-glow-cyan">
                    <Cpu size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Guided Architect</h3>
                    <p className="text-sm text-gray-400">Build manually with AI assistance. We set up the structure, you edit the code.</p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {step === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('mode')} className="p-2 glass rounded-lg text-gray-500"><ArrowLeft size={20} /></button>
              <h2 className="text-2xl font-bold tracking-tight">Project Config</h2>
            </div>

            <div className="space-y-4 pb-8">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Addon Name</label>
                <input 
                  type="text"
                  placeholder="Super Sword Mod"
                  className="w-full glass rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 border-white/10"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {mode === 'auto' ? (
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Describe Your Idea</label>
                  <textarea 
                    rows={4}
                    placeholder="A mod that adds a dragon that breathes neon fire..."
                    className="w-full glass rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 border-white/10"
                    value={formData.idea}
                    onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
                  />
                </div>
              ) : (
                <>
                   <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Mod Type</label>
                    <select 
                      className="w-full glass rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 border-white/10 appearance-none bg-dark-bg"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as AddonType })}
                    >
                      <option value={AddonType.BEHAVIOR}>Behavior Pack</option>
                      <option value={AddonType.RESOURCE}>Resource Pack</option>
                      <option value={AddonType.BOTH}>Full Addon (Both)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Description</label>
                    <textarea 
                      rows={3}
                      placeholder="Enter mod description..."
                      className="w-full glass rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 border-white/10"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

              <Button 
                variant="primary" 
                size="lg" 
                className="w-full mt-4 h-14"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : (mode === 'auto' ? 'INITIATE AI GENERATION' : 'CREATE FOLDER STRUCTURE')}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-8 py-20"
          >
            <div className="relative">
               <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="w-32 h-32 rounded-full border-4 border-dashed border-neon-purple/30 p-2"
              >
                <div className="w-full h-full rounded-full border-4 border-neon-purple neon-glow-purple" />
              </motion.div>
              <Rocket size={32} className="absolute inset-0 m-auto text-white animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">Generating Addon...</h3>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-gray-400">Our AI architect is constructing manifest.json</p>
                <p className="text-sm text-gray-500">Injecting behavior logic and resource models</p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-20"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 neon-glow-cyan border border-green-500/20">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">Forge Complete</h3>
              <p className="text-sm text-gray-500">The addon has been successfully structured and saved to your local storage.</p>
            </div>
            <Button variant="primary" size="lg" className="w-full max-w-[200px]" onClick={onComplete}>
              OPEN PROJECT
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
