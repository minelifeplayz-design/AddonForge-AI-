import { v4 as uuidv4 } from 'uuid';
import { AddonType, MinecraftManifest } from '../types';

export const generateUUID = () => uuidv4();

export const createManifest = (
  name: string,
  description: string,
  versionStr: string = '1.0.0',
  minEngineVersionStr: string = '1.20.0',
  type: 'data' | 'resources' = 'data'
): MinecraftManifest => {
  const version = (versionStr.split('.').map(Number) as [number, number, number]) || [1, 0, 0];
  const minEngineVersion = (minEngineVersionStr.split('.').map(Number) as [number, number, number]) || [1, 20, 0];

  return {
    format_version: 2,
    header: {
      name,
      description,
      uuid: generateUUID(),
      version,
      min_engine_version: minEngineVersion,
    },
    modules: [
      {
        type,
        uuid: generateUUID(),
        version,
      },
    ],
  };
};

export const getBaseFolderStructure = (name: string, type: AddonType) => {
  const safeName = name.replace(/\s+/g, '_').toLowerCase();
  
  const structures: Record<string, string[]> = {
    [AddonType.BEHAVIOR]: [
      `behavior_packs/${safeName}/manifest.json`,
      `behavior_packs/${safeName}/entities/`,
      `behavior_packs/${safeName}/functions/`,
      `behavior_packs/${safeName}/loot_tables/`,
      `behavior_packs/${safeName}/spawn_rules/`,
    ],
    [AddonType.RESOURCE]: [
      `resource_packs/${safeName}/manifest.json`,
      `resource_packs/${safeName}/textures/`,
      `resource_packs/${safeName}/models/`,
      `resource_packs/${safeName}/animations/`,
      `resource_packs/${safeName}/sounds/`,
    ],
  };

  if (type === AddonType.BOTH) {
    return [...structures[AddonType.BEHAVIOR], ...structures[AddonType.RESOURCE]];
  }

  return structures[type] || [];
};

export const validateJSON = (content: string): { isValid: boolean; error?: string } => {
  try {
    JSON.parse(content);
    return { isValid: true };
  } catch (e: any) {
    return { isValid: false, error: e.message };
  }
};
