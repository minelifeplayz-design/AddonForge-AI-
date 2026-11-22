import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { ArrowLeft, CheckCircle2, Download, FilePlus2, FolderPlus, ImagePlus, Package, Plus, ShieldAlert, Trash2, Wrench } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { addItemToProject, createProject, CREATOR_REGISTRY, exportMcaddon, validateProject } from "../../studio";
import { loadProjects, persistProjects } from "../../studio/storage/projectStore";
import type { ItemDefinitionInput, StudioProject } from "../../studio";
import { VisualScriptingEditor } from "./VisualScriptingEditor";

const EMPTY_ITEM = { id: "ruby", displayName: "Ruby", textureKey: "ruby", maxStackSize: "64", category: "items" as ItemDefinitionInput["category"], textureDataUrl: "", textureFileName: "" };

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The selected image could not be decoded."));
    reader.readAsDataURL(file);
  });
}

async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await readFileAsDataUrl(new File([blob], "export.mcaddon", { type: "application/octet-stream" }));
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Could not encode the add-on archive.");
  return dataUrl.slice(comma + 1);
}

export function StudioScreen() {
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", namespace: "myaddon", description: "" });
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showVisualEditor, setShowVisualEditor] = useState(false);

  useEffect(() => {
    let active = true;
    loadProjects()
      .then((saved) => { if (active) setProjects(saved); })
      .catch((error: unknown) => {
        if (active) {
          setNotice(error instanceof Error ? error.message : "Could not load saved projects.");
          setNoticeIsError(true);
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const activeProject = projects.find((project) => project.id === activeId) ?? null;
  const diagnostics = useMemo(() => activeProject ? validateProject(activeProject) : [], [activeProject]);
  const itemPaths = activeProject ? Object.keys(activeProject.files).filter((path) => path.startsWith("behavior_pack/items/")) : [];

  const updateProjects = (next: StudioProject[]) => {
    setProjects(next);
    void persistProjects(next).then(() => {
      setNotice("Project saved on this device.");
      setNoticeIsError(false);
    }).catch((error: unknown) => {
      setNotice(error instanceof Error ? error.message : "Could not save project data.");
      setNoticeIsError(true);
    });
  };

  const handleCreateProject = () => {
    try {
      const project = createProject(projectForm);
      updateProjects([project, ...projects]);
      setActiveId(project.id);
      setShowNewProject(false);
      setProjectForm({ name: "", namespace: "myaddon", description: "" });
      setNotice("Project created. Behavior Pack and Resource Pack manifests are ready.");
      setNoticeIsError(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create project.");
      setNoticeIsError(true);
    }
  };

  const handleTextureSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.type !== "image/png" || !file.name.toLowerCase().endsWith(".png")) {
        throw new Error("Choose a PNG image. Bedrock item textures must be PNG files.");
      }
      if (file.size <= 0 || file.size > 4 * 1024 * 1024) {
        throw new Error("Texture must be between 1 byte and 4 MB.");
      }
      const dataUrl = await readFileAsDataUrl(file);
      if (!dataUrl.startsWith("data:image/png;base64,iVBORw0KGgo")) {
        throw new Error("The selected file does not have a valid PNG signature.");
      }
      setItemForm((current) => ({ ...current, textureDataUrl: dataUrl, textureFileName: file.name }));
      setNotice("PNG texture loaded. It will be embedded in the Resource Pack.");
      setNoticeIsError(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not import texture.");
      setNoticeIsError(true);
    }
  };

  const handleAddItem = () => {
    if (!activeProject) return;
    try {
      const input: ItemDefinitionInput = {
        identifier: `${activeProject.namespace}:${itemForm.id.trim().toLowerCase()}`,
        displayName: itemForm.displayName,
        textureKey: itemForm.textureKey.trim().toLowerCase(),
        maxStackSize: Number(itemForm.maxStackSize),
        category: itemForm.category,
        formatVersion: activeProject.settings.formatVersion,
        textureDataUrl: itemForm.textureDataUrl
      };
      const updated = addItemToProject(activeProject, input);
      updateProjects(projects.map((project) => project.id === updated.id ? updated : project));
      setItemForm(EMPTY_ITEM);
      setNotice("Item JSON, language key, atlas entry and PNG texture were added.");
      setNoticeIsError(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not generate item.");
      setNoticeIsError(true);
    }
  };

  const handleExport = async () => {
    if (!activeProject) return;
    const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
    if (errors.length) {
      setNotice(`Export blocked: fix ${errors.length} error(s) shown in Diagnostics first.`);
      setNoticeIsError(true);
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const blob = await exportMcaddon(activeProject);
      const fileName = `${activeProject.namespace}.mcaddon`;
      if (Capacitor.isNativePlatform()) {
        const data = await blobToBase64(blob);
        const saved = await Filesystem.writeFile({
          path: `exports/${fileName}`,
          data,
          directory: Directory.Cache,
          recursive: true
        });
        await Share.share({
          title: fileName,
          text: `Minecraft Bedrock add-on created with Bedrock Creator Studio.`,
          files: [saved.uri],
          dialogTitle: "Save or share add-on"
        });
        setNotice("Add-on archive created. Choose a destination in the Android share sheet.");
      } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        setNotice("Add-on archive downloaded.");
      }
      setNoticeIsError(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Export failed.");
      setNoticeIsError(true);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteProject = (project: StudioProject) => {
    if (!window.confirm(`Delete "${project.name}" from this device? This cannot be undone.`)) return;
    const next = projects.filter((entry) => entry.id !== project.id);
    setActiveId(null);
    updateProjects(next);
    setNotice("Project deleted from this device.");
  };

  if (loading) {
    return <div className="min-h-[70vh] grid place-items-center"><div className="text-center space-y-3"><div className="mx-auto h-10 w-10 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" /><p className="text-xs text-gray-400">Opening local project library…</p></div></div>;
  }

  if (activeProject && showVisualEditor) {\n    return <VisualScriptingEditor project={activeProject} onBack={() => setShowVisualEditor(false)} onSave={(updated) => updateProjects(projects.map((project) => project.id === updated.id ? updated : project))} />;\n  }\n\n  if (activeProject) {
    return (
      <div className="space-y-5 pb-8">
        <header className="flex items-center gap-3">
          <button aria-label="Back to projects" onClick={() => { setActiveId(null); setNotice(""); }} className="p-2 glass rounded-xl"><ArrowLeft size={18} /></button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold truncate">{activeProject.name}</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{activeProject.namespace} · Behavior + Resource Packs</p>
          </div>
          <button onClick={handleExport} disabled={busy} className="px-3 py-2 rounded-xl bg-neon-purple text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50">
            <Download size={15} /> {busy ? "Exporting…" : "Export"}
          </button>
        </header>

        <button onClick={() => setShowVisualEditor(true)} className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-left border border-neon-cyan/25">\n          <div className="h-10 w-10 rounded-xl bg-neon-cyan/10 text-neon-cyan flex items-center justify-center"><Wrench size={19} /></div>\n          <div className="min-w-0 flex-1"><p className="text-sm font-bold">Visual Scripting</p><p className="text-[11px] text-gray-400">Build event, condition and action flows without writing JavaScript</p></div>\n          <span className="text-[10px] text-green-400 uppercase">Available</span>\n        </button>\n\n        <section className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2"><Package size={17} className="text-neon-purple" /> Item Creator</h2>
            <span className="text-[10px] text-green-400 uppercase">Available</span>
          </div>
          <p className="text-xs text-gray-400">Create a custom Bedrock item with its definition, display name, atlas entry and real PNG asset.</p>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider">Identifier path
            <div className="mt-1 flex items-center glass rounded-xl px-3">
              <span className="text-gray-500 text-xs">{activeProject.namespace}:</span>
              <input value={itemForm.id} onChange={(event) => setItemForm({ ...itemForm, id: event.target.value })} className="bg-transparent outline-none p-3 min-w-0 flex-1 text-sm text-white" autoCapitalize="none" />
            </div>
          </label>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider">Display name
            <input value={itemForm.displayName} onChange={(event) => setItemForm({ ...itemForm, displayName: event.target.value })} className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Texture key
              <input value={itemForm.textureKey} onChange={(event) => setItemForm({ ...itemForm, textureKey: event.target.value })} className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" autoCapitalize="none" />
            </label>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Max stack
              <input type="number" min="1" max="99" value={itemForm.maxStackSize} onChange={(event) => setItemForm({ ...itemForm, maxStackSize: event.target.value })} className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" />
            </label>
          </div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider">Creative category
            <select value={itemForm.category} onChange={(event) => setItemForm({ ...itemForm, category: event.target.value as ItemDefinitionInput["category"] })} className="mt-1 w-full glass rounded-xl p-3 text-sm text-white bg-[#101018] outline-none">
              <option value="items">Items</option><option value="equipment">Equipment</option><option value="nature">Nature</option><option value="construction">Construction</option>
            </select>
          </label>
          <div className="glass rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2"><ImagePlus size={16} className="text-neon-cyan" /><span className="text-xs font-semibold text-gray-200">Item texture (PNG required)</span></div>
            <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 p-3 text-xs text-gray-300">
              <Plus size={15} /> Choose PNG texture
              <input type="file" accept="image/png,.png" className="sr-only" onChange={handleTextureSelected} />
            </label>
            {itemForm.textureDataUrl && <div className="flex items-center gap-3"><img src={itemForm.textureDataUrl} alt="Selected item texture preview" className="h-14 w-14 rounded-lg bg-black/30 object-contain pixelated" /><div className="min-w-0 flex-1"><p className="text-xs text-green-300 truncate">{itemForm.textureFileName}</p><p className="text-[10px] text-gray-500">PNG embedded in the add-on package</p></div><button aria-label="Remove selected texture" onClick={() => setItemForm({ ...itemForm, textureDataUrl: "", textureFileName: "" })} className="p-2 text-gray-400"><Trash2 size={15} /></button></div>}
          </div>
          <button onClick={handleAddItem} disabled={!itemForm.textureDataUrl} className="w-full rounded-xl bg-neon-purple/20 border border-neon-purple/30 p-3 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"><Plus size={16} /> Generate Item</button>
          {itemPaths.length > 0 && <div className="border-t border-white/10 pt-3 space-y-2"><p className="text-[10px] uppercase tracking-widest text-gray-500">Generated items ({itemPaths.length})</p>{itemPaths.map((path) => <div key={path} className="text-xs text-gray-300 flex items-center gap-2"><CheckCircle2 size={13} className="text-green-400" />{path.split("/").pop()}</div>)}</div>}
        </section>

        <section className="glass rounded-2xl p-4 space-y-3">
          <h2 className="font-bold flex items-center gap-2"><ShieldAlert size={17} /> Diagnostics</h2>
          {diagnostics.map((diagnostic, index) => <div key={diagnostic.code + index} className="flex gap-2 text-xs"><span className={diagnostic.severity === "error" ? "text-red-400" : diagnostic.severity === "warning" ? "text-amber-400" : "text-green-400"}>●</span><div><p className="text-gray-200">{diagnostic.message}</p>{diagnostic.path && <p className="text-gray-500">{diagnostic.path}</p>}{diagnostic.suggestion && <p className="text-gray-500">{diagnostic.suggestion}</p>}</div></div>)}
          <p className="text-[10px] text-gray-500">These checks validate the generated file structure and references. An in-game Minecraft import test is still required for final runtime certification.</p>
        </section>

        <section className="glass rounded-2xl p-4 space-y-2">
          <h2 className="font-bold flex items-center gap-2"><Wrench size={17} /> Creator Library</h2>
          <div className="grid grid-cols-2 gap-2">
            {CREATOR_REGISTRY.map((creator) => <div key={creator.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-3"><p className="text-xs font-semibold">{creator.label}</p><p className={creator.stage === "ready" ? "text-[9px] text-green-400 mt-1 uppercase" : "text-[9px] text-gray-500 mt-1 uppercase"}>{creator.stage === "ready" ? "Available" : "Planned"}</p><p className="text-[10px] text-gray-500 mt-1">{creator.description}</p></div>)}
          </div>
        </section>
        {notice && <p role="status" className={noticeIsError ? "text-xs text-red-300" : "text-xs text-neon-cyan"}>{notice}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-neon-purple/15 flex items-center justify-center text-neon-purple"><Package size={25} /></div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-neon-cyan">Minecraft Bedrock Add-on Tools</p>
        <h1 className="text-3xl font-bold tracking-tight">Bedrock Creator Studio</h1>
        <p className="text-sm text-gray-400">Build add-on projects with visual configuration. JavaScript is not required for the currently available item workflow.</p>
      </header>

      <button onClick={() => setShowNewProject(true)} className="w-full rounded-2xl bg-neon-purple p-4 flex items-center justify-center gap-2 font-bold text-white"><FolderPlus size={18} /> New Add-on Project</button>
      {showNewProject && <section className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-bold">Project details</h2><button onClick={() => setShowNewProject(false)} className="text-gray-500 text-xs">Cancel</button></div>
        <label className="block text-[10px] uppercase tracking-widest text-gray-500">Project name<input value={projectForm.name} onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })} placeholder="My First Add-on" className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" /></label>
        <label className="block text-[10px] uppercase tracking-widest text-gray-500">Namespace<input value={projectForm.namespace} onChange={(event) => setProjectForm({ ...projectForm, namespace: event.target.value })} placeholder="myaddon" className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" autoCapitalize="none" /></label>
        <label className="block text-[10px] uppercase tracking-widest text-gray-500">Description<textarea value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} placeholder="What does your add-on do?" className="mt-1 w-full glass rounded-xl p-3 text-sm text-white outline-none" rows={2} /></label>
        <button onClick={handleCreateProject} className="w-full rounded-xl bg-neon-cyan/20 border border-neon-cyan/30 p-3 text-sm font-bold text-white flex items-center justify-center gap-2"><FilePlus2 size={16} /> Create Project</button>
      </section>}

      {notice && <p role="status" className={noticeIsError ? "text-xs text-red-300" : "text-xs text-neon-cyan"}>{notice}</p>}
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-bold">Your projects</h2><span className="text-[10px] text-gray-500">{projects.length} saved on device</span></div>
        {projects.length === 0 ? <div className="glass rounded-2xl p-8 text-center space-y-2"><Package size={30} className="mx-auto text-gray-500" /><p className="text-sm text-gray-300">No projects yet</p><p className="text-xs text-gray-500">Create your first paired Behavior Pack and Resource Pack project.</p></div> : projects.map((project) => <div key={project.id} className="glass rounded-2xl p-4 flex items-center gap-3"><button onClick={() => { setActiveId(project.id); setNotice(""); }} className="min-w-0 flex-1 text-left flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-neon-cyan/10 text-neon-cyan flex items-center justify-center"><Package size={20} /></div><div className="min-w-0"><p className="font-bold text-sm truncate">{project.name}</p><p className="text-[10px] text-gray-500">{project.namespace} · {Object.keys(project.files).length} files</p></div></button><button aria-label={`Delete ${project.name}`} onClick={() => handleDeleteProject(project)} className="p-2 text-gray-500 hover:text-red-300"><Trash2 size={16} /></button></div>)}
      </section>

      <section className="glass rounded-2xl p-4 space-y-2">
        <h2 className="font-bold text-sm">Quick workflow</h2>
        <ol className="list-decimal pl-5 space-y-1 text-xs text-gray-400"><li>Create a project and namespace.</li><li>Open it and create an item.</li><li>Select a PNG texture from your device.</li><li>Run diagnostics and export the .mcaddon file.</li><li>Open the exported file with Minecraft to import both packs.</li></ol>
      </section>
      <p className="text-[10px] text-gray-500">Projects are stored in this app's local IndexedDB database. Use the Android share sheet to save or share exported add-ons. Creator modules marked Planned are not available yet.</p>
    </div>
  );
}
