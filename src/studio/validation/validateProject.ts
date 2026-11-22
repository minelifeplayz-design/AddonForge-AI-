import type { Diagnostic, StudioProject } from "../types";

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

export function validateProject(project: StudioProject): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const paths = Object.keys(project.files);
  if (!project.name.trim()) diagnostics.push({ severity: "error", code: "PROJECT_NAME_EMPTY", message: "Project name is empty." });
  if (!/^[a-z0-9_]{1,32}$/.test(project.namespace)) diagnostics.push({ severity: "error", code: "NAMESPACE_INVALID", message: "Project namespace is invalid." });

  const uuids = [project.behaviorPackUuid, project.resourcePackUuid, project.behaviorModuleUuid, project.resourceModuleUuid, project.scriptModuleUuid];
  if (new Set(uuids).size !== uuids.length) diagnostics.push({ severity: "error", code: "UUID_COLLISION", message: "Pack, module and script UUIDs must all be unique." });

  for (const path of paths) {
    if (!path.endsWith(".json")) continue;
    try {
      const parsed: unknown = JSON.parse(project.files[path]);
      if (!isObject(parsed)) diagnostics.push({ severity: "error", code: "JSON_ROOT_INVALID", path, message: "JSON root must be an object." });
    } catch (error) {
      diagnostics.push({ severity: "error", code: "JSON_PARSE_ERROR", path, message: error instanceof Error ? error.message : "Invalid JSON.", suggestion: "Open the file in the code editor and fix the JSON syntax." });
    }
  }

  const bpPath = "behavior_pack/manifest.json";
  const rpPath = "resource_pack/manifest.json";
  for (const required of [bpPath, rpPath]) {
    if (!project.files[required]) diagnostics.push({ severity: "error", code: "MANIFEST_MISSING", path: required, message: "Required pack manifest is missing." });
  }

  if (project.files[bpPath] && project.files[rpPath]) {
    try {
      const behavior = JSON.parse(project.files[bpPath]) as { header?: { uuid?: string }; modules?: Array<{ uuid?: string }>; dependencies?: Array<{ uuid?: string; version?: number[] }> };
      const resource = JSON.parse(project.files[rpPath]) as { header?: { uuid?: string }; modules?: Array<{ uuid?: string }> };
      if (behavior.header?.uuid !== project.behaviorPackUuid) diagnostics.push({ severity: "error", code: "BP_HEADER_UUID_MISMATCH", path: bpPath, message: "Behavior Pack header UUID does not match project metadata." });
      if (resource.header?.uuid !== project.resourcePackUuid) diagnostics.push({ severity: "error", code: "RP_HEADER_UUID_MISMATCH", path: rpPath, message: "Resource Pack header UUID does not match project metadata." });
      if (!behavior.modules?.some((module) => module.uuid === project.behaviorModuleUuid)) diagnostics.push({ severity: "error", code: "BP_MODULE_UUID_MISMATCH", path: bpPath, message: "Behavior Pack module UUID does not match project metadata." });
      if (!resource.modules?.some((module) => module.uuid === project.resourceModuleUuid)) diagnostics.push({ severity: "error", code: "RP_MODULE_UUID_MISMATCH", path: rpPath, message: "Resource Pack module UUID does not match project metadata." });
      if (!behavior.dependencies?.some((dependency) => dependency.uuid === resource.header?.uuid && JSON.stringify(dependency.version) === JSON.stringify(project.version))) {
        diagnostics.push({ severity: "error", code: "PACK_DEPENDENCY_MISSING", path: bpPath, message: "Behavior Pack must depend on the matching Resource Pack UUID and version." });
      }
    } catch { /* JSON parser diagnostics above report malformed manifests. */ }
  }

  for (const path of paths.filter((entry) => entry.startsWith("resource_pack/textures/items/") && entry.endsWith(".png"))) {
    if (!project.files[path].startsWith("data:image/png;base64,iVBORw0KGgo")) diagnostics.push({ severity: "error", code: "PNG_ASSET_INVALID", path, message: "Item texture does not contain a valid PNG data URL." });
  }

  if (!diagnostics.some((item) => item.severity === "error")) {
    diagnostics.push({ severity: "info", code: "STRUCTURAL_CHECK_PASSED", message: "Project metadata, pack UUIDs, dependency, JSON syntax and imported PNG data passed structural checks. This is not an in-game runtime test." });
  }
  return diagnostics;
}
