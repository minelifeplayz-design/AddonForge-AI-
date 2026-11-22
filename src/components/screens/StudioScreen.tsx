import { useMemo, useState } from "react";
import { ArrowLeft, Box, CheckCircle2, Download, FilePlus2, FolderPlus, Package, Plus, ShieldAlert, Sparkles, Sword, Wrench } from "lucide-react";
import { addItemToProject, createProject, CREATOR_REGISTRY, exportMcaddon, validateProject } from "../../studio";
import type { ItemDefinitionInput, StudioProject } from "../../studio";

const STORAGE_KEY = "bedrock-creator-studio.projects.v1";

function readProjects(): StudioProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as StudioProject[] : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: StudioProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export const StudioScreen = () => {
  const [projects, setProjects] = useState<StudioProject[]>(readProjects);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", namespace: "myaddon", description: "" });
  const [itemForm, setItemForm] = useState({ id: "ruby", displayName: "Ruby", textureKey: "ruby", maxStackSize: "64", category: "items" as ItemDefinitionInput["category"] });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const activeProject = projects.find((project) => project.id === activeId) ?? null;
  const diagnostics = useMemo(() => activeProject ? validateProject(activeProject) : [], [activeProject]);
  const itemPaths = activeProject ? Object.keys(activeProject.files).filter((path) => path.startsWith("behavior_pack/items/")) : [];

  const updateProjects = (next: StudioProject[]) => {
    setProjects(next);
    saveProjects(next);
  };

  const handleCreateProject = () => {
    try {
      const project = createProject(projectForm);
      updateProjects([project, ...projects]);
      setActiveId(project.id);
      setShowNewProject(false);
      setNotice("Project created. Both pack manifests are ready.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create project.");
    }
  };

  const handleAddItem = () => {
    if (!activeProject) return;
    try {
      const input: ItemDefinitionInput = {
        identifier: `${activeProject.namespace}:${itemForm.id.trim().toLowerCase()}`,
        displayName: itemForm.displayName,
        textureKey: itemForm.textureKey.trim(),
        maxStackSize: Number(itemForm.maxStackSize),
        category: itemForm.category,
        formatVersion: activeProject.settings.formatVersion
      };
      const updated = addItemToProject(activeProject, input);
      updateProjects(projects.map((project) => project.id === updated.id ? updated : project));
      setNotice("Item definition, language entry and texture atlas entry generated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not generate item.");
    }
  };

  const handleExport = async () => {
    if (!activeProject) return;
    setBusy(true);
    setNotice("");
    try {
      const blob = await exportMcaddon(activeProject);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${activeProject.namespace}.mcaddon`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setNotice("Addon package generated. Check your browser or app downloads.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  if (activeProject) {
    return (
      <div className="space-y-5 pb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => { setActiveId(null); setNotice(""); }} className="p-2 glass rounded-xl"><ArrowLeft size={18} /></button>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold truncate">{activeProject.name}</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{activeProject.namespace} · Behavior + Resource Packs</p>
          </div>
          <button onClick={handleExport} disabled={busy} className="px-3 py-2 rounded-xl bg-neon-purple text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50">
            <Download size={15} /> {busy ? "Exporting" : "Export"}
          </button>
        </div>

        <section className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><Sword size={17} className="text-neon-purple" /> Item Creator</h3>
            <span className="text-[10px] text-green-400 uppercase">Available</span>
          </div>
          <p className="text-xs text-gray-400">Configure an item. The studio generates the Bedrock item JSON and localization/atlas entries.</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider col-span-2">Identifier path
              <div className="mt-1 flex items-center glass rounded-xl px-3">
                <span className="text-gray-500 text-xs">{activeProject.namespace}:</span>
                <input value={itemForm.id} onChange={(e) => setItemForm({ ...itemForm, id: e.target.value })} className="bg-transparent outline-none p-3 min-w-0 flex-1 text-sm text-white" />
              </div>
            </label>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider col-span-2">Display name
              <input value={itemForm.displayName} onChange={(e) => setItemForm({ ...itemForm, displayName: e.target.value })} className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" />
            </label>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Texture key
              <input value={itemForm.textureKey} onChange={(e) => setItemForm({ ...itemForm, textureKey: e.target.value })} className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" />
            </label>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Max stack
              <input type="number" min="1" max="99" value={itemForm.maxStackSize} onChange={(e) => setItemForm({ ...itemForm, maxStackSize: e.target.value })} className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" />
            </label>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider col-span-2">Creative category
              <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as ItemDefinitionInput["category"] })} className="mt-1 w-full glass rounded-xl p-3 text-sm text-white bg-[#101018] outline-none">
                <option value="items">Items</option><option value="equipment">Equipment</option><option value="nature">Nature</option><option value="construction">Construction</option>
              </select>
            </label>
          </div>
          <button onClick={handleAddItem} className="w-full rounded-xl bg-neon-purple/20 border border-neon-purple/30 p-3 text-sm font-bold text-white flex items-center justify-center gap-2"><Plus size={16} /> Generate Item</button>
          <p className="text-[10px] text-amber-300/80">Texture note: the texture atlas entry is generated, but the matching PNG must be added to resource_pack/textures/items before the item has its custom icon in Minecraft.</p>
          {itemPaths.length > 0 && <div className="border-t border-white/10 pt-3 space-y-2"><p className="text-[10px] uppercase tracking-widest text-gray-500">Generated items ({itemPaths.length})</p>{itemPaths.map((path) => <div key={path} className="text-xs text-gray-300 flex items-center gap-2"><CheckCircle2 size={13} className="text-green-400" />{path.split("/").pop()}</div>)}</div>}
        </section>

        <section className="glass rounded-2xl p-4 space-y-3">
          <h3 className="font-bold flex items-center gap-2"><ShieldAlert size={17} /> Diagnostics</h3>
          {diagnostics.map((diagnostic, index) => <div key={diagnostic.code + index} className="flex gap-2 text-xs"><span className={diagnostic.severity === "error" ? "text-red-400" : diagnostic.severity === "warning" ? "text-amber-400" : "text-green-400"}>●</span><div><p className="text-gray-200">{diagnostic.message}</p>{diagnostic.path && <p className="text-gray-500">{diagnostic.path}</p>}</div></div>)}
          <p className="text-[10px] text-gray-500">Structural checks do not replace importing and testing the addon in Minecraft.</p>
        </section>

        <section className="glass rounded-2xl p-4 space-y-2">
          <h3 className="font-bold flex items-center gap-2"><Wrench size={17} /> Creator Library</h3>
          <div className="grid grid-cols-2 gap-2">
            {CREATOR_REGISTRY.map((creator) => <div key={creator.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-3"><p className="text-xs font-semibold">{creator.label}</p><p className={creator.stage === "ready" ? "text-[9px] text-green-400 mt-1 uppercase" : "text-[9px] text-gray-500 mt-1 uppercase"}>{creator.stage === "ready" ? "Available" : "Planned"}</p></div>)}
          </div>
        </section>
        {notice && <p className="text-xs text-neon-cyan">{notice}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-neon-purple/15 flex items-center justify-center text-neon-purple"><Package size={25} /></div>
        <h2 className="text-3xl font-bold tracking-tight">Creator Studio</h2>
        <p className="text-sm text-gray-400">Build Bedrock add-ons with configuration tools. Code is optional.</p>
      </div>
      <button onClick={() => setShowNewProject(true)} className="w-full rounded-2xl bg-neon-purple p-4 flex items-center justify-center gap-2 font-bold text-white"><FolderPlus size={18} /> New Add-on Project</button>
      {showNewProject && <section className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-bold">Project details</h3><button onClick={() => setShowNewProject(false)} className="text-gray-500 text-xs">Cancel</button></div>
        <label className="text-[10px] uppercase tracking-widest text-gray-500">Project name<input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="My First Add-on" className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" /></label>
        <label className="text-[10px] uppercase tracking-widest text-gray-500">Namespace<input value={projectForm.namespace} onChange={(e) => setProjectForm({ ...projectForm, namespace: e.target.value })} placeholder="myaddon" className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" /></label>
        <label className="text-[10px] uppercase tracking-widest text-gray-500">Description<textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="What does your add-on do?" className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" rows={2} /></label>
        <button onClick={handleCreateProject} className="w-full rounded-xl bg-neon-cyan/20 border border-neon-cyan/30 p-3 text-sm font-bold text-white flex items-center justify-center gap-2"><FilePlus2 size={16} /> Create Project</button>
      </section>}
      {notice && <p className="text-xs text-neon-cyan">{notice}</p>}
      <div className="space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-bold">Your projects</h3><span className="text-[10px] text-gray-500">{projects.length} saved</span></div>
        {projects.length === 0 ? <div className="glass rounded-2xl p-8 text-center space-y-2"><Box size={30} className="mx-auto text-gray-500" /><p className="text-sm text-gray-300">No projects yet</p><p className="text-xs text-gray-500">Create your first Behavior Pack + Resource Pack project.</p></div> : projects.map((project) => <button key={project.id} onClick={() => { setActiveId(project.id); setNotice(""); }} className="w-full glass rounded-2xl p-4 text-left flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-neon-cyan/10 text-neon-cyan flex items-center justify-center"><Package size={20} /></div><div className="min-w-0 flex-1"><p className="font-bold text-sm truncate">{project.name}</p><p className="text-[10px] text-gray-500">{project.namespace} · {Object.keys(project.files).length} files</p></div><Sparkles size={16} className="text-neon-purple" /></button>)}
      </div>
      <p className="text-[10px] text-gray-500">Projects in this early web foundation are saved in this app's local browser storage. Native Android folder access and SAF export are scheduled for the Android integration phase.</p>
    </div>
  );
};
