import JSZip from "jszip";
import type { StudioProject } from "../types";

function addPack(zip: JSZip, project: StudioProject, prefix: "behavior_pack/" | "resource_pack/") {
  for (const [path, content] of Object.entries(project.files)) {
    if (!path.startsWith(prefix)) continue;
    const outputPath = path.slice(prefix.length);
    const dataUrl = /^data:([^;,]+);base64,([\\s\\S]*)$/.exec(content);
    if (dataUrl) zip.file(outputPath, dataUrl[2], { base64: true });
    else zip.file(outputPath, content);
  }
}

export async function exportMcaddon(project: StudioProject): Promise<Blob> {
  const behaviorPack = new JSZip();
  const resourcePack = new JSZip();
  addPack(behaviorPack, project, "behavior_pack/");
  addPack(resourcePack, project, "resource_pack/");
  if (Object.keys(behaviorPack.files).length === 0 || Object.keys(resourcePack.files).length === 0) {
    throw new Error("Both Behavior Pack and Resource Pack must contain files before export.");
  }
  const [bpBytes, rpBytes] = await Promise.all([
    behaviorPack.generateAsync({ type: "uint8array" }),
    resourcePack.generateAsync({ type: "uint8array" })
  ]);
  const addon = new JSZip();
  addon.file(`${project.namespace}_BP.mcpack`, bpBytes);
  addon.file(`${project.namespace}_RP.mcpack`, rpBytes);
  return addon.generateAsync({ type: "blob" });
}
