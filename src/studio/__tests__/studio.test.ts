import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { createProject } from "../project/createProject";
import { addItemToProject } from "../project/addItem";
import { validateProject } from "../validation/validateProject";
import { exportMcaddon } from "../export/exportMcaddon";
import type { ItemDefinitionInput } from "../types";

const onePixelPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/m5sAAAAASUVORK5CYII=";
const validItem: ItemDefinitionInput = {
  identifier: "testmod:ruby",
  displayName: "Ruby",
  textureKey: "ruby",
  maxStackSize: 64,
  category: "items",
  textureDataUrl: onePixelPng
};

test("new project creates distinct pack and module UUIDs with linked manifests", () => {
  const project = createProject({ name: "Test Add-on", namespace: "testmod" });
  const identifiers = [project.behaviorPackUuid, project.resourcePackUuid, project.behaviorModuleUuid, project.resourceModuleUuid, project.scriptModuleUuid];
  assert.equal(new Set(identifiers).size, identifiers.length);
  const bp = JSON.parse(project.files["behavior_pack/manifest.json"]);
  const rp = JSON.parse(project.files["resource_pack/manifest.json"]);
  assert.equal(bp.dependencies[0].uuid, rp.header.uuid);
});

test("item creation merges atlas and localization entries and embeds the PNG", () => {
  const project = createProject({ name: "Test Add-on", namespace: "testmod" });
  const withRuby = addItemToProject(project, validItem);
  const item = JSON.parse(withRuby.files["behavior_pack/items/ruby.json"]);
  const atlas = JSON.parse(withRuby.files["resource_pack/textures/item_texture.json"]);
  assert.equal(item["minecraft:item"].components["minecraft:icon"].texture, "ruby");
  assert.ok(atlas.texture_data.ruby);
  assert.ok(withRuby.files["resource_pack/textures/items/ruby.png"].startsWith("data:image/png;base64,"));
  assert.match(withRuby.files["resource_pack/texts/en_US.lang"], /item\.testmod\.ruby\.name=Ruby/);
});

test("item creation rejects missing PNG assets and duplicate identifiers", () => {
  const project = createProject({ name: "Test Add-on", namespace: "testmod" });
  assert.throws(() => addItemToProject(project, { ...validItem, textureDataUrl: undefined }), /valid PNG texture/);
  const once = addItemToProject(project, validItem);
  assert.throws(() => addItemToProject(once, validItem), /already exists/);
});

test("new project and generated item pass structural diagnostics", () => {
  const project = addItemToProject(createProject({ name: "Test Add-on", namespace: "testmod" }), validItem);
  assert.equal(validateProject(project).filter((diagnostic) => diagnostic.severity === "error").length, 0);
});

test("mcaddon contains nested behavior and resource mcpack archives including the PNG", async () => {
  const project = addItemToProject(createProject({ name: "Test Add-on", namespace: "testmod" }), validItem);
  const archive = await exportMcaddon(project);
  const outer = await JSZip.loadAsync(new Uint8Array(await archive.arrayBuffer()));
  const bpFile = outer.file("testmod_BP.mcpack");
  const rpFile = outer.file("testmod_RP.mcpack");
  assert.ok(bpFile);
  assert.ok(rpFile);
  const [bp, rp] = await Promise.all([JSZip.loadAsync(await bpFile.async("uint8array")), JSZip.loadAsync(await rpFile.async("uint8array"))]);
  assert.ok(bp.file("manifest.json"));
  assert.ok(bp.file("items/ruby.json"));
  assert.ok(rp.file("manifest.json"));
  assert.ok(rp.file("textures/items/ruby.png"));
});

import { createDefaultVisualGraph, applyVisualGraph, generateVisualScript, validateVisualGraph } from "../visual";

test("visual graph generates a documented spawn event script and script manifest dependency", () => {
  const project = createProject({ name: "Visual Test", namespace: "visualtest" });
  const graph = createDefaultVisualGraph();
  graph.nodes.push({ id: "condition-1", type: "condition", kind: "initialSpawn", value: "", variable: "" });
  graph.nodes.push({ id: "action-1", type: "action", kind: "sendMessage", value: "Hello {player}", variable: "" });
  assert.equal(validateVisualGraph(graph).filter((entry) => entry.severity === "error").length, 0);
  const script = generateVisualScript(graph);
  assert.match(script, /world\.afterEvents\.playerSpawn\.subscribe/);
  assert.match(script, /if \(!event\.initialSpawn\) return/);
  assert.match(script, /player\.sendMessage\("Hello " \+ player\.name\)/);
  const updated = applyVisualGraph(project, graph);
  const manifest = JSON.parse(updated.files["behavior_pack/manifest.json"]);
  assert.equal(manifest.dependencies.find((entry: { module_name?: string }) => entry.module_name === "@minecraft/server").version, "2.0.0");
  assert.ok(manifest.modules.some((entry: { type: string; entry?: string }) => entry.type === "script" && entry.entry === "scripts/main.js"));
  assert.ok(updated.files["behavior_pack/visual_logic/graph.json"]);
  assert.ok(updated.files["behavior_pack/scripts/main.js"]);
  assert.equal(validateProject(updated).filter((diagnostic) => diagnostic.severity === "error").length, 0);
});

test("visual item-use condition validates event type and emits item type filter", () => {
  const graph = createDefaultVisualGraph();
  graph.nodes[0] = { ...graph.nodes[0], kind: "itemUse" };
  graph.nodes.push({ id: "condition-1", type: "condition", kind: "itemTypeIdEquals", value: "minecraft:diamond", variable: "" });
  graph.nodes.push({ id: "action-1", type: "action", kind: "sendMessage", value: "Diamond used by {player}", variable: "" });
  assert.equal(validateVisualGraph(graph).filter((entry) => entry.severity === "error").length, 0);
  assert.match(generateVisualScript(graph), /event\.itemStack\.typeId !== "minecraft:diamond"/);
});

test("visual graph rejects incompatible condition and malformed variable names", () => {
  const graph = createDefaultVisualGraph();
  graph.nodes.push({ id: "bad-condition", type: "condition", kind: "itemTypeIdEquals", value: "minecraft:diamond", variable: "" });
  graph.nodes.push({ id: "bad-variable", type: "action", kind: "setVariable", value: "x", variable: "bad variable" });
  assert.ok(validateVisualGraph(graph).some((entry) => entry.code === "VISUAL_CONDITION_EVENT_MISMATCH"));
  assert.ok(validateVisualGraph(graph).some((entry) => entry.code === "VISUAL_VARIABLE_INVALID"));
  assert.throws(() => generateVisualScript(graph));
});
