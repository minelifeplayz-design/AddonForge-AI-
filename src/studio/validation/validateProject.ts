import type { Diagnostic, StudioProject } from "../types";
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
export function validateProject(project: StudioProject): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const paths = Object.keys(project.files);
  if (!project.name.trim()) diagnostics.push({ severity: "error", code: "PROJECT_NAME_EMPTY", message: "Project name is empty." });
  if (!/^[a-z0-9_]{1,32}$/.test(project.namespace)) diagnostics.push({ severity: "error", code: "NAMESPACE_INVALID", message: "Project namespace is invalid." });
  if (project.behaviorPackUuid === project.resourcePackUuid) diagnostics.push({ severity: "error", code: "UUID_COLLISION", message: "Behavior Pack and Resource Pack UUIDs must be different." });
  for (const path of paths) {
    if (!path.endsWith(".json")) continue;
    try {
      const parsed: unknown = JSON.parse(project.files[path]);
      if (!isObject(parsed)) diagnostics.push({ severity: "error", code: "JSON_ROOT_INVALID", path, message: "JSON root must be an object." });
    } catch (error) {
      diagnostics.push({ severity: "error", code: "JSON_PARSE_ERROR", path, message: error instanceof Error ? error.message : "Invalid JSON.", suggestion: "Open the file in the code editor and fix the JSON syntax." });
    }
  }
  for (const required of ["behavior_pack/manifest.json", "resource_pack/manifest.json"]) {
    if (!project.files[required]) diagnostics.push({ severity: "error", code: "MANIFEST_MISSING", path: required, message: "Required pack manifest is missing." });
  }
  const bp = project.files["behavior_pack/manifest.json"];
  const rp = project.files["resource_pack/manifest.json"];
  if (bp && rp) {
    try {
      const behavior = JSON.parse(bp) as { dependencies?: Array<{ uuid?: string }> };
      const resource = JSON.parse(rp) as { header?: { uuid?: string } };
      if (!behavior.dependencies?.some((dependency) => dependency.uuid === resource.header?.uuid)) {
        diagnostics.push({ severity: "warning", code: "PACK_DEPENDENCY_MISSING", path: "behavior_pack/manifest.json", message: "Behavior Pack does not declare its Resource Pack dependency." });
      }
    } catch { /* JSON parser diagnostics already report malformed manifests. */ }
  }
  if (!diagnostics.some((item) => item.severity === "error")) diagnostics.push({ severity: "info", code: "STRUCTURAL_CHECK_PASSED", message: "Project structure and JSON syntax checks passed. This does not replace an in-game Minecraft test." });
  return diagnostics;
}
