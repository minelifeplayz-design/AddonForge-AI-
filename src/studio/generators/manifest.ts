import type { PackKind, StudioProject } from "../types";
export function generateManifest(project: StudioProject, pack: PackKind) {
  const isBehavior = pack === "behavior";
  const manifest: Record<string, unknown> = {
    format_version: 2,
    header: {
      name: isBehavior ? `${project.name} BP` : `${project.name} RP`,
      description: project.description,
      uuid: isBehavior ? project.behaviorPackUuid : project.resourcePackUuid,
      version: project.version,
      min_engine_version: project.settings.minEngineVersion
    },
    modules: [{
      type: isBehavior ? "data" : "resources",
      uuid: isBehavior ? project.behaviorPackUuid : project.resourcePackUuid,
      version: project.version
    }]
  };
  if (isBehavior) {
    const dependencies: Array<Record<string, string>> = [{ uuid: project.resourcePackUuid, version: project.version.join(".") }];
    if (project.settings.enableScripts && project.settings.scriptApiVersion) {
      manifest.dependencies = [...dependencies, { module_name: "@minecraft/server", version: project.settings.scriptApiVersion }];
      (manifest.modules as Array<Record<string, unknown>>).push({
        type: "script", language: "javascript", entry: "scripts/main.js",
        uuid: crypto.randomUUID(), version: project.version
      });
    } else manifest.dependencies = dependencies;
  }
  return manifest;
}
