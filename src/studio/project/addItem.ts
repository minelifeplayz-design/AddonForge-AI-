import type { ItemDefinitionInput, StudioProject } from "../types";
import { generateItem } from "../generators/item";

function parseTextureAtlas(raw: string | undefined): Record<string, unknown> {
  if (!raw) return { resource_pack_name: "vanilla", texture_name: "atlas.items", texture_data: {} };
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const textureData = parsed.texture_data;
  if (typeof textureData !== "object" || textureData === null || Array.isArray(textureData)) {
    throw new Error("Existing item_texture.json has an invalid texture_data object.");
  }
  return parsed;
}

export function addItemToProject(project: StudioProject, input: ItemDefinitionInput): StudioProject {
  if (!input.textureDataUrl?.startsWith("data:image/png;base64,iVBORw0KGgo")) {
    throw new Error("Select a valid PNG texture before generating this item.");
  }
  const generated = generateItem({ ...input, formatVersion: input.formatVersion ?? project.settings.formatVersion }, project.namespace);
  const itemFile = generated.find((file) => file.path.startsWith("behavior_pack/items/"));
  const atlasFile = generated.find((file) => file.path.endsWith("textures/item_texture.json"));
  const languageFile = generated.find((file) => file.path.endsWith("texts/en_US.lang"));
  if (!itemFile || !atlasFile || !languageFile) throw new Error("Item generator returned an incomplete file set.");
  if (project.files[itemFile.path]) throw new Error(`An item definition already exists at ${itemFile.path}.`);

  const texturePath = `resource_pack/textures/items/${input.identifier.split(":")[1]}.png`;
  if (project.files[texturePath]) throw new Error(`A texture already exists at ${texturePath}.`);

  const nextFiles = { ...project.files, [itemFile.path]: itemFile.content, [texturePath]: input.textureDataUrl };
  const atlasPath = "resource_pack/textures/item_texture.json";
  const atlas = parseTextureAtlas(nextFiles[atlasPath]);
  const textureData = atlas.texture_data as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(textureData, input.textureKey)) {
    throw new Error(`Texture key "${input.textureKey}" is already registered.`);
  }
  const generatedAtlas = JSON.parse(atlasFile.content) as { texture_data: Record<string, unknown> };
  atlas.texture_data = { ...textureData, ...generatedAtlas.texture_data };
  nextFiles[atlasPath] = JSON.stringify(atlas, null, 2);

  const languagePath = "resource_pack/texts/en_US.lang";
  const currentLanguage = nextFiles[languagePath] ?? "";
  const languageKey = `item.${input.identifier.replace(":", ".")}.name`;
  const existingKeys = currentLanguage.split(/\r?\n/).map((line) => line.split("=")[0].trim());
  if (existingKeys.includes(languageKey)) throw new Error(`Language key "${languageKey}" already exists.`);
  nextFiles[languagePath] = currentLanguage + (currentLanguage && !currentLanguage.endsWith("\n") ? "\n" : "") + languageFile.content;

  const updated: StudioProject = { ...project, files: nextFiles, updatedAt: new Date().toISOString() };
  const metadata = {
    schemaVersion: updated.schemaVersion, id: updated.id, name: updated.name, namespace: updated.namespace,
    description: updated.description, version: updated.version, createdAt: updated.createdAt,
    updatedAt: updated.updatedAt, settings: updated.settings,
    behaviorPackUuid: updated.behaviorPackUuid, resourcePackUuid: updated.resourcePackUuid,
    behaviorModuleUuid: updated.behaviorModuleUuid, resourceModuleUuid: updated.resourceModuleUuid,
    scriptModuleUuid: updated.scriptModuleUuid
  };
  updated.files["project.json"] = JSON.stringify(metadata, null, 2);
  return updated;
}
