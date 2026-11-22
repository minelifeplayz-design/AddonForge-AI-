import { useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Braces, CheckCircle2, Code2, GitBranch, Plus, Save, Trash2, Zap } from "lucide-react";
import { applyVisualGraph, createDefaultVisualGraph, generateVisualScript, validateVisualGraph, VISUAL_NODE_CATALOG } from "../../studio/visual";
import type { VisualGraph, VisualNode, VisualNodeKind } from "../../studio/visual";
import type { StudioProject } from "../../studio";

interface Props { project: StudioProject; onSave: (project: StudioProject) => void; onBack: () => void; }
const makeId = () => `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const defaultValue = (kind: VisualNodeKind) => kind === "sendMessage" ? "Welcome, {player}!" : kind === "setVariable" ? "yes" : kind === "variableEquals" ? "yes" : kind === "itemTypeIdEquals" ? "minecraft:diamond" : kind === "consoleLog" ? "Visual script ran." : "";
const defaultVariable = (kind: VisualNodeKind) => kind === "setVariable" || kind === "variableEquals" ? "welcomeSeen" : "";

export function VisualScriptingEditor({ project, onSave, onBack }: Props) {
  const [graph, setGraph] = useState<VisualGraph>(() => {
    try {
      return project.files["behavior_pack/visual_logic/graph.json"]
        ? JSON.parse(project.files["behavior_pack/visual_logic/graph.json"]) as VisualGraph
        : createDefaultVisualGraph();
    } catch {
      return createDefaultVisualGraph();
    }
  });
  const [newKind, setNewKind] = useState<VisualNodeKind>("sendMessage");
  const [saved, setSaved] = useState(false);
  const diagnostics = useMemo(() => validateVisualGraph(graph).filter((entry) => entry.severity === "error"), [graph]);
  const code = useMemo(() => {
    try { return generateVisualScript(graph); } catch { return "// Fix the visual graph errors to generate JavaScript."; }
  }, [graph]);

  const updateNode = (id: string, changes: Partial<VisualNode>) => {
    setSaved(false);
    setGraph((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === id ? { ...node, ...changes } : node) }));
  };
  const addNode = () => {
    const catalog = VISUAL_NODE_CATALOG.find((entry) => entry.kind === newKind);
    if (!catalog || catalog.type === "event") {
      if (catalog?.type === "event") {
        setGraph((current) => ({ ...current, nodes: current.nodes.map((node, index) => index === 0 ? { ...node, kind: newKind } : node) }));
        setSaved(false);
      }
      return;
    }
    const node: VisualNode = { id: makeId(), type: catalog.type, kind: catalog.kind, value: defaultValue(catalog.kind), variable: defaultVariable(catalog.kind) };
    setGraph((current) => ({ ...current, nodes: [...current.nodes, node] }));
    setSaved(false);
  };
  const moveNode = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (index === 0 || target <= 0 || target >= graph.nodes.length) return;
    setGraph((current) => {
      const nodes = [...current.nodes];
      [nodes[index], nodes[target]] = [nodes[target], nodes[index]];
      return { ...current, nodes };
    });
    setSaved(false);
  };
  const removeNode = (id: string) => {
    setGraph((current) => ({ ...current, nodes: current.nodes.filter((node, index) => index === 0 || node.id !== id) }));
    setSaved(false);
  };
  const save = () => {
    if (diagnostics.length) return;
    try {
      const updated = applyVisualGraph(project, graph);
      onSave(updated);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <header className="flex items-center gap-3">
        <button onClick={onBack} aria-label="Back to project" className="p-2 glass rounded-xl"><ArrowLeft size={18} /></button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold">Visual Scripting</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{project.namespace} · Node editor</p>
        </div>
        <button onClick={save} disabled={diagnostics.length > 0} className="px-3 py-2 rounded-xl bg-neon-purple text-white text-xs font-bold flex items-center gap-2 disabled:opacity-40"><Save size={14} /> Save graph</button>
      </header>

      <section className="glass rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2"><GitBranch size={17} className="text-neon-cyan" /><h2 className="font-bold text-sm">How the flow works</h2></div>
        <p className="text-xs text-gray-400">The event starts the script. Each block below runs from top to bottom. A condition stops the remaining flow when it is false. Move blocks to change execution order.</p>
        <label className="block text-[10px] uppercase tracking-widest text-gray-500">Stable @minecraft/server version
          <select value={graph.apiVersion} onChange={(event) => { setGraph((current) => ({ ...current, apiVersion: event.target.value })); setSaved(false); }} className="mt-1 w-full glass rounded-xl p-3 text-sm text-white bg-[#101018]">
            {["2.0.0","2.1.0","2.2.0","2.3.0","2.4.0","2.5.0","2.6.0","2.7.0","2.8.0","2.9.0","2.10.0","2.11.0"].map((version) => <option key={version} value={version}>{version}</option>)}
          </select>
        </label>
      </section>

      <section className="space-y-0">
        {graph.nodes.map((node, index) => {
          const catalog = VISUAL_NODE_CATALOG.find((entry) => entry.kind === node.kind);
          const eventNode = node.type === "event";
          return (
            <div key={node.id}>
              <article className={`rounded-2xl border p-3 space-y-3 ${eventNode ? "border-neon-cyan/40 bg-cyan-950/20" : node.type === "condition" ? "border-amber-400/30 bg-amber-950/15" : "border-neon-purple/30 bg-purple-950/15"}`}>
                <div className="flex items-center gap-2">
                  {eventNode ? <Zap size={16} className="text-neon-cyan" /> : node.type === "condition" ? <GitBranch size={16} className="text-amber-300" /> : <Braces size={16} className="text-neon-purple" />}
                  <span className="text-[10px] uppercase tracking-widest text-gray-400">{eventNode ? "Event · Start" : node.type === "condition" ? "Condition · Gate" : "Action · Execute"}</span>
                  <span className="ml-auto text-[10px] text-gray-600">#{index + 1}</span>
                  {!eventNode && <div className="flex items-center">
                    <button onClick={() => moveNode(index, -1)} disabled={index <= 1} aria-label="Move block up" className="p-1 text-gray-400 disabled:opacity-20"><ArrowUp size={14} /></button>
                    <button onClick={() => moveNode(index, 1)} disabled={index === graph.nodes.length - 1} aria-label="Move block down" className="p-1 text-gray-400 disabled:opacity-20"><ArrowDown size={14} /></button>
                    <button onClick={() => removeNode(node.id)} aria-label="Remove block" className="p-1 text-gray-400 hover:text-red-300"><Trash2 size={14} /></button>
                  </div>}
                </div>
                <h3 className="text-sm font-semibold">{catalog?.label ?? "Unknown node"}</h3>
                <p className="text-[11px] text-gray-400">{catalog?.description}</p>
                {eventNode ? (
                  <select value={node.kind} onChange={(event) => updateNode(node.id, { kind: event.target.value as VisualNodeKind })} className="w-full glass rounded-xl p-3 text-sm text-white bg-[#101018]">
                    <option value="playerSpawn">Player spawns / respawns</option><option value="itemUse">Player uses an item</option>
                  </select>
                ) : (
                  <>
                    {(node.kind === "itemTypeIdEquals") && <label className="block text-[10px] uppercase tracking-widest text-gray-500">Item identifier<input value={node.value} onChange={(event) => updateNode(node.id, { value: event.target.value })} placeholder="minecraft:diamond" className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" autoCapitalize="none" /></label>}
                    {(node.kind === "sendMessage" || node.kind === "setVariable" || node.kind === "consoleLog" || node.kind === "variableEquals") && <label className="block text-[10px] uppercase tracking-widest text-gray-500">{node.kind === "sendMessage" ? "Message · use {player} for player name" : node.kind === "consoleLog" ? "Log message" : node.kind === "setVariable" ? "Value to store" : "Expected value"}<input value={node.value} onChange={(event) => updateNode(node.id, { value: event.target.value })} className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" /></label>}
                    {(node.kind === "setVariable" || node.kind === "variableEquals") && <label className="block text-[10px] uppercase tracking-widest text-gray-500">Variable name<input value={node.variable} onChange={(event) => updateNode(node.id, { variable: event.target.value })} placeholder="myVariable" className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" autoCapitalize="none" /></label>}
                  </>
                )}
              </article>
              {index < graph.nodes.length - 1 && <div className="h-9 flex items-center justify-center"><div className="h-full w-px bg-white/20" /><span className="absolute mt-8 rounded-full bg-[#16131f] border border-white/10 px-2 py-0.5 text-[9px] text-gray-400">FLOW ↓</span></div>}
            </div>
          );
        })}
      </section>

      <section className="glass rounded-2xl p-4 space-y-3">
        <h2 className="font-bold text-sm flex items-center gap-2"><Plus size={16} /> Add a block</h2>
        <select value={newKind} onChange={(event) => setNewKind(event.target.value as VisualNodeKind)} className="w-full glass rounded-xl p-3 text-sm text-white bg-[#101018]">
          {VISUAL_NODE_CATALOG.filter((entry) => entry.type !== "event").map((entry) => <option key={entry.kind} value={entry.kind}>{entry.type.toUpperCase()} · {entry.label}</option>)}
        </select>
        <button onClick={addNode} className="w-full rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 p-3 text-sm font-bold text-white"><Plus size={15} className="inline mr-2" />Add connected block</button>
      </section>

      {diagnostics.length > 0 && <section className="rounded-xl border border-red-400/30 bg-red-950/20 p-3 space-y-2"><p className="text-xs font-bold text-red-300">Fix these graph errors before saving</p>{diagnostics.map((entry, index) => <p key={entry.code + index} className="text-xs text-red-200">• {entry.message}</p>)}</section>}
      {saved && <p className="text-xs text-green-300 flex items-center gap-2"><CheckCircle2 size={14} /> Graph and generated JavaScript saved to this project.</p>}

      <section className="glass rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2"><Code2 size={16} className="text-neon-cyan" /><h2 className="font-bold text-sm">Generated JavaScript preview</h2></div>
        <pre className="max-h-80 overflow-auto rounded-xl bg-black/40 border border-white/5 p-3 text-[10px] leading-relaxed text-green-200 whitespace-pre-wrap break-all">{code}</pre>
        <p className="text-[10px] text-gray-500">Saved to behavior_pack/scripts/main.js. The Behavior Pack manifest is updated with the script module and selected @minecraft/server dependency.</p>
      </section>
    </div>
  );
}
