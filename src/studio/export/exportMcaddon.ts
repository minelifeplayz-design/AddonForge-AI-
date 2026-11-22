import JSZip from "jszip";
import type { StudioProject } from "../types";
function addPack(zip: JSZip, project: StudioProject, prefix: "behavior_pack/" | "resource_pack/") {
  for (const [path, content] of Object.entries(project.files)) if (path.startsWith(prefix)) zip.file(path.slice(prefix.length), content);
}
export async function exportMcaddon(project: StudioProject): Promise<Blob> {
  const behaviorPack = new JSZip();
  const resourcePack = new JSZip();
  addPack(behaviorPack, project, "behavior_pack/");
  addPack(resourcePack, project, "resource_pack/");
  const [bpBlob, rpBlob] = await Promise.all([
    behaviorPack.generateAsync({ type: "blob" }),
    resourcePack.generateAsync({ type: "blob" })
  ]);
  const addon = new JSZip();
  addon.file(`${project.namespace}_BP.mcpack`, bpBlob);
  addon.file(`${project.namespace}_RP.mcpack`, rpBlob);
  return addon.generateAsync({ type: "blob" });
}
