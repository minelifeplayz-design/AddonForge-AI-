import type { ItemDefinitionInput, GeneratedFile } from "../types";
const safeFileName = (identifier: string) => identifier.split(":")[1].replace(/[^a-z0-9_/-]/g, "_");
export function generateItem(input: ItemDefinitionInput, namespace: string): GeneratedFile[] {
  const [itemNamespace, itemName] = input.identifier.split(":");
  if (!itemNamespace || !itemName || itemNamespace !== namespace) throw new Error(`Item identifier must use the project namespace "${namespace}:".`);
  if (!/^[a-z0-9_]+$/.test(itemName)) throw new Error("Item identifier path must use lowercase letters, numbers and underscores.");
  if (!Number.isInteger(input.maxStackSize) || input.maxStackSize < 1 || input.maxStackSize > 99) throw new Error("Maximum stack size must be an integer from 1 to 99.");
  if (!input.displayName.trim()) throw new Error("Display name is required.");
  if (!input.textureKey.trim()) throw new Error("Texture key is required.");
  const languageKey = `item.${input.identifier.replace(":", ".")}.name`;
  const definition = {
    format_version: input.formatVersion ?? "1.26.0",
    "minecraft:item": {
      description: { identifier: input.identifier, menu_category: { category: input.category } },
      components: {
        "minecraft:display_name": { value: languageKey },
        "minecraft:icon": { texture: input.textureKey },
        "minecraft:max_stack_size": input.maxStackSize,
        ...(input.components ?? {})
      }
    }
  };
  const textureData = {
    resource_pack_name: "vanilla", texture_name: "atlas.items",
    texture_data: { [input.textureKey]: { textures: `textures/items/${safeFileName(input.identifier)}` } }
  };
  return [
    { pack: "behavior", path: `behavior_pack/items/${safeFileName(input.identifier)}.json`, content: JSON.stringify(definition, null, 2) },
    { pack: "resource", path: "resource_pack/textures/item_texture.json", content: JSON.stringify(textureData, null, 2) },
    { pack: "resource", path: "resource_pack/texts/en_US.lang", content: `${languageKey}=${input.displayName.trim()}\n` }
  ];
}
