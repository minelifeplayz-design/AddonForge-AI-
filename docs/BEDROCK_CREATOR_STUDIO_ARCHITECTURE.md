# Bedrock Creator Studio

Bedrock Creator Studio is an Android-first, no-code-first Minecraft Bedrock add-on editor. The product uses a React/TypeScript UI packaged in a Capacitor Android shell. It does not rely on AI generation or a remote login.

## Product principles

- Configuration-first content creation; JavaScript and raw JSON remain optional future advanced tools.
- Generated output must use documented Bedrock formats and APIs.
- Every creator declares its output paths, pack ownership and compatibility requirements.
- Unimplemented features must be marked Planned, never shown as functional.
- Generated files must be editable without silently discarding manual changes.
- Project editing, generation, validation and export should work offline.

## Architecture layers

1. Application UI — project dashboard and creator panels.
2. Project model — namespace, UUIDs, version profile, BP/RP metadata and project file map.
3. Creator registry — discoverable creator modules and their maturity/output metadata.
4. Generators — deterministic JSON, language, manifest and JavaScript output.
5. Validation — JSON syntax, required files, identifiers, cross-pack references and version rules.
6. Asset pipeline — import, validate and package PNG textures and future geometry/audio resources.
7. Export — individual files, .mcpack and .mcaddon.
8. Android bridge — Capacitor runtime, private app storage and system share sheet.

## Implemented in this branch

- Typed project model and namespace normalization.
- Behavior Pack and Resource Pack manifest generation.
- Basic custom item definition generation.
- PNG import and embedding in the Resource Pack.
- Safe item insertion that merges atlas and localization entries.
- IndexedDB project persistence with one-time migration from the first prototype's localStorage data.
- Project structural and JSON syntax validation.
- Nested .mcpack packaging inside a .mcaddon archive.
- Android file export through app cache and the Capacitor Share plugin.
- Automated tests for project UUIDs, item generation, duplicate handling, diagnostics and exported archive contents.
- CI workflow that builds a debug APK and uploads it as an artifact.

## Planned creator coverage

Blocks, entities, recipes, feature definitions, feature rules, spawn rules, loot tables, trade tables, visual JavaScript logic, animations, animation controllers, particles, geometry, render controllers, attachables, sounds, fog, camera and NPC dialogue remain Planned until each editor is implemented, schema-verified and tested in Minecraft.

"Every Bedrock capability" is the long-term coverage goal, not a claim about the current build.

## Android storage policy

The app uses IndexedDB for project records and asset data. Android's system file picker is used for selecting PNG textures. Export writes the final archive into the app's cache and invokes the system share sheet. The app does not request broad storage permissions or assume unrestricted access to /storage/emulated/0.

A future SAF workspace feature can use ACTION_OPEN_DOCUMENT_TREE and persisted URI permissions to read and write a user-selected project folder. That direct folder workspace is not included in this build.

## Compatibility policy

Keep Minecraft product release version, Bedrock JSON format versions and Script API module versions as separate concepts. Do not infer that these version numbers are interchangeable. The project format version is currently selected by the generator default and must be verified against the target game's official schema. Existing projects must not be silently upgraded.

## Quality gates

- Unit tests for every generator.
- Golden-file tests for generated JSON.
- Validation tests for malformed JSON, duplicate UUIDs and missing references.
- Archive tests that open the produced .mcaddon and inspect both nested .mcpack files and imported binary assets.
- Minecraft import/runtime tests for each supported content creator.
- Android tests for asset import, app restart persistence and share-sheet export.
