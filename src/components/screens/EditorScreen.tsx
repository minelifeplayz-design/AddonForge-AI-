import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../../types';
import { Card, Button } from '../ui/Base';
import { 
  ArrowLeft, FileJson, Folder, Save, Share2, 
  Download, Zap, HelpCircle, X, ChevronRight,
  Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../contexts/FirebaseContext';
import { validateJSON } from '../../lib/minecraft';
import { getAIGuidance } from '../../services/geminiService';
import JSZip from 'jszip';
import ReactMarkdown from 'react-markdown';

interface EditorScreenProps {
  project: Project;
  onBack: () => void;
}

export const EditorScreen = ({ project, onBack }: EditorScreenProps) => {
  const [files, setFiles] = useState<Record<string, string>>(project.files || {});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFile) {
      setFileContent(files[selectedFile] || '');
      setValidationError(null);
    }
  }, [selectedFile, files]);

  const handleSaveFile = () => {
    if (!selectedFile) return;

    if (selectedFile.endsWith('.json')) {
      const { isValid, error } = validateJSON(fileContent);
      if (!isValid) {
        setValidationError(error || 'Invalid JSON syntax');
        return;
      }
    }

    setFiles(prev => ({ ...prev, [selectedFile]: fileContent }));
    setValidationError(null);
  };

  const handleSync = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        files,
        updatedAt: Date.now()
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    const zip = new JSZip();
    Object.entries(files).forEach(([path, content]) => {
      zip.file(path, content);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}.mcpack`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const guidance = await getAIGuidance(files, aiQuestion);
      setAiResult(guidance);
    } catch (e) {
      setAiResult("Failed to contact AI headquarters. Check your connection.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-bg z-[100] flex flex-col pt-safe cyber-grid">
      {/* Top Banner */}
      <div className="glass border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-sm font-bold truncate max-w-[140px]">{project.name}</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{project.type} pack</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowAI(true)} className="text-neon-purple border border-neon-purple/20">
            <Zap size={14} className="mr-1" /> ASK AI
          </Button>
          <Button variant="primary" size="sm" onClick={handleSync} disabled={isSaving}>
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-1/3 border-r border-white/5 overflow-y-auto p-2 space-y-1 bg-black/20">
          <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest px-2 py-4">Structure</div>
          {Object.keys(files).sort().map(path => (
            <button
              key={path}
              onClick={() => setSelectedFile(path)}
              className={`w-full text-left p-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${selectedFile === path ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <FileJson size={14} className={selectedFile === path ? 'text-neon-purple' : 'text-gray-600'} />
              <span className="truncate">{path.split('/').pop()}</span>
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-black/40 relative">
          {selectedFile ? (
            <>
              <div className="p-3 border-b border-white/5 flex justify-between items-center bg-white/5">
                <span className="text-[10px] text-gray-500 font-mono truncate max-w-[120px]">{selectedFile}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setFileContent(files[selectedFile] || '')}>Reset</Button>
                  <Button variant="secondary" size="sm" className="h-6 text-[10px]" onClick={handleSaveFile}>Update</Button>
                </div>
              </div>
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                spellCheck={false}
                className="flex-1 bg-transparent p-4 text-xs font-mono text-gray-300 focus:outline-none resize-none leading-relaxed"
                placeholder="Select a file to begin forging logic..."
              />
              {validationError && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-red-500/20 border-t border-red-500/30 flex items-start gap-2 text-[10px] text-red-400">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 p-8 gap-4">
              <FileJson size={64} />
              <p className="text-sm font-bold">Forge selection required.</p>
              <p className="text-xs">Pick a component from the left terminal to modify its source code.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-4 glass border-t border-white/10 flex gap-4">
        <Button variant="outline" className="flex-1 gap-2 border-white/10" onClick={handleExport}>
          <Download size={18} /> EXPORT .MCPACK
        </Button>
        <Button variant="outline" className="aspect-square p-0 w-12 border-white/10 rounded-xl">
          <Share2 size={18} />
        </Button>
      </div>

      {/* AI Assistant Overlay */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 flex flex-col"
          >
            <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setShowAI(false)} />
            <div className="h-[70vh] glass rounded-t-[32px] border-t border-white/20 p-6 flex flex-col gap-6 relative">
              <button 
                onClick={() => setShowAI(false)}
                className="absolute top-4 right-4 p-2 glass rounded-full text-gray-500"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon-purple flex items-center justify-center text-white neon-glow-purple">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="font-bold">AI ARCHITECT</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Protocol Version 2.0.4</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {aiResult ? (
                  <div className="glass p-4 rounded-xl text-sm leading-relaxed prose prose-invert prose-xs max-w-none prose-p:my-2 prose-code:bg-white/10 prose-code:px-1 prose-code:rounded">
                    <ReactMarkdown>{aiResult}</ReactMarkdown>
                    <Button variant="ghost" size="sm" className="mt-4 text-neon-cyan" onClick={() => setAiResult(null)}>ASK ANOTHER QUESTION</Button>
                  </div>
                ) : (
                  <div className="space-y-4 py-8">
                     <p className="text-sm text-gray-400">What can the Architect assist you with today?</p>
                     <div className="grid gap-2">
                        {["How to create a custom sword?", "Explain manifest.json structure", "Add a custom mob"].map(q => (
                          <button key={q} onClick={() => setAiQuestion(q)} className="w-full text-left p-3 glass rounded-xl text-xs hover:bg-white/10 transition-colors border-white/5">
                            {q}
                          </button>
                        ))}
                     </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 items-center glass p-2 rounded-2xl border-white/10">
                <input 
                  type="text" 
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Query instructions..." 
                  className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && askAI()}
                />
                <Button 
                  variant="primary" 
                  className="rounded-xl h-10 w-10 p-0 shrink-0"
                  onClick={askAI}
                  disabled={aiLoading}
                >
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={18} />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
