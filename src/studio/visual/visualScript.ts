import type { StudioProject, Diagnostic } from "../types";
import { generateManifest } from "../generators/manifest";
import { DEFAULT_VISUAL_GRAPH, type VisualGraph, type VisualNode } from "./types";

const GRAPH_PATH = "behavior_pack/visual_logic/graph.json";
const SCRIPT_PATH = "behavior_pack/scripts/main.js";
const VARIABLE_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]{0,31}$/;
const API_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const quote = (value: string) => JSON.stringify(value);
const validKinds = new Set(["playerSpawn", "itemUse", "initialSpawn", "itemTypeIdEquals", "variableEquals", "sendMessage", "setVariable", "consoleLog"]);

export function createDefaultVisualGraph(): VisualGraph {
  return JSON.parse(JSON.stringify(DEFAULT_VISUAL_GRAPH)) as VisualGraph;
}

export function parseVisualGraph(raw: string | undefined): VisualGraph {
  if (!raw) return createDefaultVisualGraph();
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Visual graph file must contain a JSON object.");
  const graph = parsed as Partial<VisualGraph>;
  if (graph.schemaVersion !== 1 || !Array.isArray(graph.nodes) || typeof graph.apiVersion !== "string") throw new Error("Unsupported or malformed visual graph file.");
  return graph as VisualGraph;
}

export function validateVisualGraph(graph: VisualGraph): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (!graph || typeof graph !== "object" || !Array.isArray(graph.nodes)) return [{ severity: "error", code: "VISUAL_GRAPH_SHAPE_INVALID", message: "Visual graph must contain a nodes array." }];
  if (graph.nodes.some((node) => !node || typeof node !== "object" || typeof node.id !== "string" || typeof node.type !== "string" || typeof node.kind !== "string" || typeof node.value !== "string" || typeof node.variable !== "string")) return [{ severity: "error", code: "VISUAL_NODE_SHAPE_INVALID", message: "One or more visual nodes have missing or invalid fields." }];
  if (typeof graph.apiVersion !== "string" || !API_VERSION_PATTERN.test(graph.apiVersion)) diagnostics.push({ severity: "error", code: "VISUAL_API_VERSION_INVALID", message: "Script API version must be a stable semantic version such as 2.0.0." });
  if (graph.nodes.length < 1 || graph.nodes[0]?.type !== "event") diagnostics.push({ severity: "error", code: "VISUAL_EVENT_REQUIRED", message: "A visual script must start with an event node." });
  if (graph.nodes.filter((node) => node.type === "event").length !== 1) diagnostics.push({ severity: "error", code: "VISUAL_EVENT_COUNT", message: "Each visual script must contain exactly one event node." });
  if (graph.nodes.some((node) => !validKinds.has(node.kind))) diagnostics.push({ severity: "error", code: "VISUAL_NODE_UNKNOWN", message: "The graph contains an unsupported node kind." });
  if (graph.nodes.some((node) => node.type !== "event" && node.type !== "condition" && node.type !== "action")) diagnostics.push({ severity: "error", code: "VISUAL_NODE_TYPE_INVALID", message: "A visual node has an unsupported node type." });
  graph.nodes.forEach((node, index) => {
    if (index > 0 && node.type === "event") diagnostics.push({ severity: "error", code: "VISUAL_EVENT_POSITION", message: "The event node must be first in the flow." });
    if (node.type === "condition" && node.kind === "initialSpawn" && graph.nodes[0]?.kind !== "playerSpawn") diagnostics.push({ severity: "error", code: "VISUAL_CONDITION_EVENT_MISMATCH", message: "The initial-spawn condition requires the Player spawns event." });
    if (node.type === "condition" && node.kind === "itemTypeIdEquals" && graph.nodes[0]?.kind !== "itemUse") diagnostics.push({ severity: "error", code: "VISUAL_CONDITION_EVENT_MISMATCH", message: "The item identifier condition requires the Player uses an item event." });
    if (node.type === "condition" && node.kind === "variableEquals" && !VARIABLE_PATTERN.test(node.variable)) diagnostics.push({ severity: "error", code: "VISUAL_VARIABLE_INVALID", message: "Variable names must start with a letter or underscore and contain up to 32 letters, numbers or underscores." });
    if (node.type === "action" && node.kind === "setVariable" && !VARIABLE_PATTERN.test(node.variable)) diagnostics.push({ severity: "error", code: "VISUAL_VARIABLE_INVALID", message: "Variable names must start with a letter or underscore and contain up to 32 letters, numbers or underscores." });
    if (node.kind === "itemTypeIdEquals" && !/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(node.value)) diagnostics.push({ severity: "error", code: "VISUAL_ITEM_ID_INVALID", message: "Enter a namespaced item identifier such as minecraft:diamond.", path: GRAPH_PATH });
    if ((node.kind === "sendMessage" || node.kind === "setVariable" || node.kind === "consoleLog" || node.kind === "variableEquals") && !node.value.trim()) diagnostics.push({ severity: "error", code: "VISUAL_NODE_VALUE_EMPTY", message: "This visual node needs a value.", path: GRAPH_PATH });
  });
  if (!diagnostics.some((entry) => entry.severity === "error")) diagnostics.push({ severity: "info", code: "VISUAL_GRAPH_VALID", message: "Visual graph structure and node compatibility passed validation." });
  return diagnostics;
}

function nodeCode(node: VisualNode): string[] {
  switch (node.kind) {
    case "initialSpawn": return ["  if (!event.initialSpawn) return;"];
    case "itemTypeIdEquals": return [`  if (event.itemStack.typeId !== ${quote(node.value.trim())}) return;`];
    case "variableEquals": return [`  if (variables[${quote(node.variable)}] !== ${quote(node.value)}) return;`];
    case "sendMessage": {
      const messageExpression = node.value.split("{player}").map(quote).join(" + player.name + ");
      return [`  player.sendMessage(${messageExpression});`];
    }
    case "setVariable": return [`  variables[${quote(node.variable)}] = ${quote(node.value)};`];
    case "consoleLog": return [`  console.warn(${quote(node.value)});`];
    default: return [];
  }
}

export function generateVisualScript(graph: VisualGraph): string {
  const errors = validateVisualGraph(graph).filter((entry) => entry.severity === "error");
  if (errors.length) throw new Error(errors.map((entry) => entry.message).join(" "));
  const event = graph.nodes[0];
  const body = graph.nodes.slice(1).flatMap(nodeCode).join("\n");
  const eventPlayer = event.kind === "playerSpawn" ? "event.player" : "event.source";
  const eventProperty = event.kind === "playerSpawn" ? "playerSpawn" : "itemUse";
  return [
    "// Generated by Bedrock Creator Studio. Edit the visual graph in the Studio instead of this file.",
    "// Stable @minecraft/server API. Node order is the execution flow; failed conditions stop the flow.",
    'import { world } from "@minecraft/server";',
    "",
    "const variables = Object.create(null);",
    "",
    `world.afterEvents.${eventProperty}.subscribe((event) => {`,
    `  const player = ${eventPlayer};`,
    "  if (!player) return;",
    body,
    "});",
    ""
  ].filter((line, index, lines) => !(line === "" && lines[index - 1] === "")).join("\n");
}

export function applyVisualGraph(project: StudioProject, graph: VisualGraph): StudioProject {
  const errors = validateVisualGraph(graph).filter((entry) => entry.severity === "error");
  if (errors.length) throw new Error(errors.map((entry) => entry.message).join(" "));
  const updated: StudioProject = {
    ...project,
    settings: { ...project.settings, enableScripts: true, scriptApiVersion: graph.apiVersion },
    files: { ...project.files },
    updatedAt: new Date().toISOString()
  };
  updated.files[GRAPH_PATH] = JSON.stringify(graph, null, 2);
  updated.files[SCRIPT_PATH] = generateVisualScript(graph);
  updated.files["behavior_pack/manifest.json"] = JSON.stringify(generateManifest(updated, "behavior"), null, 2);
  updated.files["project.json"] = JSON.stringify({
    schemaVersion: updated.schemaVersion, id: updated.id, name: updated.name, namespace: updated.namespace,
    description: updated.description, version: updated.version, createdAt: updated.createdAt,
    updatedAt: updated.updatedAt, settings: updated.settings,
    behaviorPackUuid: updated.behaviorPackUuid, resourcePackUuid: updated.resourcePackUuid,
    behaviorModuleUuid: updated.behaviorModuleUuid, resourceModuleUuid: updated.resourceModuleUuid,
    scriptModuleUuid: updated.scriptModuleUuid
  }, null, 2);
  return updated;
}

export const VISUAL_GRAPH_PATH = GRAPH_PATH;
export const VISUAL_SCRIPT_PATH = SCRIPT_PATH;
