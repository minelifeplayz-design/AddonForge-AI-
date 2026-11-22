export type VisualEventKind = "playerSpawn" | "itemUse";
export type VisualConditionKind = "initialSpawn" | "itemTypeIdEquals" | "variableEquals";
export type VisualActionKind = "sendMessage" | "setVariable" | "consoleLog";
export type VisualNodeKind = VisualEventKind | VisualConditionKind | VisualActionKind;
export type VisualNodeType = "event" | "condition" | "action";

export interface VisualNode {
  id: string;
  type: VisualNodeType;
  kind: VisualNodeKind;
  value: string;
  variable: string;
}

export interface VisualGraph {
  schemaVersion: 1;
  apiVersion: string;
  nodes: VisualNode[];
}

export const DEFAULT_VISUAL_GRAPH: VisualGraph = {
  schemaVersion: 1,
  apiVersion: "2.0.0",
  nodes: [{ id: "event-1", type: "event", kind: "playerSpawn", value: "", variable: "" }]
};

export const VISUAL_NODE_CATALOG: Array<{ type: VisualNodeType; kind: VisualNodeKind; label: string; description: string }> = [
  { type: "event", kind: "playerSpawn", label: "Player spawns", description: "Runs when a player joins or respawns." },
  { type: "event", kind: "itemUse", label: "Player uses an item", description: "Runs when a player successfully uses an item." },
  { type: "condition", kind: "initialSpawn", label: "Is first spawn?", description: "Continue only on the player's initial spawn after joining." },
  { type: "condition", kind: "itemTypeIdEquals", label: "Used item is…", description: "Continue only when the used item's identifier matches." },
  { type: "condition", kind: "variableEquals", label: "Variable equals…", description: "Continue only when a stored variable matches a value." },
  { type: "action", kind: "sendMessage", label: "Send player message", description: "Send a chat message to the event player." },
  { type: "action", kind: "setVariable", label: "Set variable", description: "Store a text value in this script's runtime memory." },
  { type: "action", kind: "consoleLog", label: "Write debug log", description: "Write a message to the Script API log." }
];
