export type SemVer = [number, number, number];
export type PackKind = "behavior" | "resource";
export type DiagnosticSeverity = "error" | "warning" | "info";
export interface ProjectSettings { formatVersion: string; minEngineVersion: SemVer; scriptApiVersion?: string; enableScripts: boolean; }
export interface StudioProject {
  schemaVersion: 1; id: string; name: string; namespace: string; description: string;
  version: SemVer; createdAt: string; updatedAt: string; settings: ProjectSettings;
  behaviorPackUuid: string; resourcePackUuid: string;
  behaviorModuleUuid: string; resourceModuleUuid: string; scriptModuleUuid: string;
  files: Record<string, string>;
}
export interface ItemDefinitionInput {
  identifier: string; displayName: string; textureKey: string; maxStackSize: number;
  category: "items" | "equipment" | "nature" | "construction";
  formatVersion?: string; components?: Record<string, unknown>;
}
export interface GeneratedFile { path: string; content: string; pack: PackKind; }
export interface Diagnostic { severity: DiagnosticSeverity; code: string; message: string; path?: string; line?: number; suggestion?: string; }
export interface CreatorDefinition { id: string; label: string; description: string; pack: PackKind | "both"; stage: "ready" | "planned"; output: string[]; }
