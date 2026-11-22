import type { CreatorDefinition } from "./types";
export const CREATOR_REGISTRY: CreatorDefinition[] = [
  { id: "items", label: "Items", description: "Custom tools, food, weapons, equipment and utility items.", pack: "behavior", stage: "ready", output: ["items/*.json", "texts/en_US.lang", "textures/item_texture.json"] },
  { id: "blocks", label: "Blocks", description: "Custom block components, states, permutations and resource references.", pack: "both", stage: "planned", output: ["blocks/*.json", "blocks.json"] },
  { id: "entities", label: "Entities", description: "Entity behavior, attributes, component groups, events and client definitions.", pack: "both", stage: "planned", output: ["entities/*.json", "entity/*.entity.json"] },
  { id: "recipes", label: "Recipes", description: "Shaped, shapeless, furnace and other supported recipes.", pack: "behavior", stage: "planned", output: ["recipes/*.json"] },
  { id: "features", label: "Features", description: "World-generation feature definitions.", pack: "behavior", stage: "planned", output: ["features/*.json"] },
  { id: "feature-rules", label: "Feature Rules", description: "Configure where and how features generate.", pack: "behavior", stage: "planned", output: ["feature_rules/*.json"] },
  { id: "spawn-rules", label: "Spawn Rules", description: "Entity spawn conditions and population controls.", pack: "behavior", stage: "planned", output: ["spawn_rules/*.json"] },
  { id: "loot-tables", label: "Loot Tables", description: "Pools, entries, conditions, functions and drops.", pack: "behavior", stage: "planned", output: ["loot_tables/**/*.json"] },
  { id: "trade-tables", label: "Trade Tables", description: "Trade tiers and offers for supported entities.", pack: "behavior", stage: "planned", output: ["trading/**/*.json"] },
  { id: "visual-logic", label: "Visual Scripting", description: "Connect event, condition, variable and action blocks to generate Bedrock JavaScript.", pack: "behavior", stage: "ready", output: ["scripts/**/*.js"] },
  { id: "animations", label: "Animations", description: "Animation definitions and animation controllers.", pack: "resource", stage: "planned", output: ["animations/*.json", "animation_controllers/*.json"] },
  { id: "particles", label: "Particles", description: "Particle effects, components, curves and events.", pack: "resource", stage: "planned", output: ["particles/*.json"] },
  { id: "geometry", label: "Geometry", description: "Import, inspect and organize Bedrock geometry models.", pack: "resource", stage: "planned", output: ["models/entity/*.geo.json"] },
  { id: "render-controllers", label: "Render Controllers", description: "Configure entity and attachable rendering.", pack: "resource", stage: "planned", output: ["render_controllers/*.json"] },
  { id: "attachables", label: "Attachables", description: "Held-item, armor and wearable visual definitions.", pack: "resource", stage: "planned", output: ["attachables/*.json"] },
  { id: "sounds", label: "Sounds", description: "Sound definitions and audio asset references.", pack: "resource", stage: "planned", output: ["sounds/sound_definitions.json"] },
  { id: "fog", label: "Fog", description: "Custom fog definitions and settings.", pack: "resource", stage: "planned", output: ["fogs/*.json"] },
  { id: "camera", label: "Camera", description: "Supported camera presets and camera behavior definitions.", pack: "behavior", stage: "planned", output: ["cameras/*.json"] },
  { id: "dialogue", label: "NPC Dialogue", description: "Dialogue scenes, buttons and supported NPC interactions.", pack: "behavior", stage: "planned", output: ["dialogue/*.json"] },
  { id: "scripts", label: "JavaScript", description: "Optional code editor, API references and generated scripts.", pack: "behavior", stage: "planned", output: ["scripts/**/*.js"] }
];
export const getCreator = (id: string) => CREATOR_REGISTRY.find((creator) => creator.id === id);
