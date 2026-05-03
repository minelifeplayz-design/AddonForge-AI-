import { motion } from 'motion/react';
import { Button } from '../ui/Base';
import { useFirebase } from '../../contexts/FirebaseContext';
import { Zap, ShieldCheck, Cpu } from 'lucide-react';

export const WelcomeScreen = ({ onFinish }: { onFinish: () => void }) => {
  const { signIn, user } = useFirebase();

  const handleStart = async () => {
    if (!user) {
      await signIn();
    }
    onFinish();
  };

  const features = [
    { icon: Zap, title: "AI Automation", desc: "Generate full addons from simple prompts." },
    { icon: Cpu, title: "Guided Building", desc: "Step-by-step assistant for manual modding." },
    { icon: ShieldCheck, title: "Valid Output", desc: "Auto-generated manifests and zip exports." }
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-white relative overflow-hidden flex flex-col p-8 cyber-grid">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-neon-purple/20 rounded-full blur-[120px]" />
      
      <div className="flex-1 flex flex-col justify-center items-center text-center gap-8 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center p-6 neon-glow-purple rotate-12">
            <Cpu size={48} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon-cyan rounded-full neon-glow-cyan animate-pulse" />
        </motion.div>

        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold tracking-tighter bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent"
          >
            ADDON<span className="text-neon-purple">FORGE</span> AI
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-[280px]"
          >
            The ultimate AI-powered workspace for Minecraft PE creators.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid gap-6 w-full max-w-sm mt-8"
        >
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-4 text-left glass p-4 rounded-2xl border-white/5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neon-cyan">
                <f.icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="pb-12"
      >
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full rounded-2xl h-16 text-lg"
          onClick={handleStart}
        >
          {user ? 'ENTER WORKSPACE' : 'SIGN IN WITH GOOGLE'}
        </Button>
        <p className="text-[10px] text-center text-gray-600 mt-4 uppercase tracking-widest">
          By continuing you agree to the forge protocols
        </p>
      </motion.div>
    </div>
  );
};
