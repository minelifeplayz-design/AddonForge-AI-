import { v4 as uuidv4 } from "uuid";
import type { SemVer, StudioProject } from "../types";
import { generateManifest } from "../generators/manifest";
export interface CreateProjectInput { name: string; namespace: string; description?: string; version?: SemVer; minEngineVersion?: SemVer; formatVersion?: string; }
const DEFAULT_ENGINE_VERSION: SemVer = [1, 26, 0];
export function normalizeNamespace(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^\d/, "_$&");
}
export function createProject(input: CreateProjectInput): StudioProject {
  const name = input.name.trim();
  const namespace = normalizeNamespace(input.namespace);
  if (!name) throw new Error("Project name is required.");
  if (!/^[a-z0-9_]{1,32}$/.test(namespace)) throw new Error("Namespace must contain 1–32 lowercase letters, numbers or underscores.");
  const now = new Date().toISOString();
  const project: StudioProject = {
    schemaVersion: 1, id: uuidv4(), name, namespace,
    description: input.description?.trim() || "A Minecraft Bedrock add-on.",
    version: input.version ?? [1, 0, 0], createdAt: now, updatedAt: now,
    settings: { formatVersion: input.formatVersion ?? "1.26.0", minEngineVersion: input.minEngineVersion ?? DEFAULT_ENGINE_VERSION, enableScripts: false },
    behaviorPackUuid: uuidv4(), resourcePackUuid: uuidv4(), files: {}
  };
  project.files["behavior_pack/manifest.json"] = JSON.stringify(generateManifest(project, "behavior"), null, 2);
  project.files["resource_pack/manifest.json"] = JSON.stringify(generateManifest(project, "resource"), null, 2);
  project.files["project.json"] = JSON.stringify({
    schemaVersion: project.schemaVersion, id: project.id, name: project.name, namespace: project.namespace,
    description: project.description, version: project.version, createdAt: project.createdAt,
    updatedAt: project.updatedAt, settings: project.settings,
    behaviorPackUuid: project.behaviorPackUuid, resourcePackUuid: project.resourcePackUuid
  }, null, 2);
  return project;
}
