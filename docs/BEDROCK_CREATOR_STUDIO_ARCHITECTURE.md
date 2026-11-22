# Bedrock Creator Studio

Bedrock Creator Studio is an Android-first, no-code-first Minecraft Bedrock add-on development environment. The existing React/TypeScript application is retained as the UI foundation; Android packaging and native Storage Access Framework integration are separate delivery tasks.

## Product principles
- Configuration-first creation; JavaScript and raw JSON are optional advanced tools.
- Generated output must use documented Bedrock formats and APIs.
- Every creator declares its output paths, pack ownership and compatibility requirements.
- Unknown or unimplemented features must be marked as planned, never shown as functional.
- Generated files must be editable without silently discarding manual changes.
- Core project editing, generation, validation and export must work offline.

## Architecture layers
1. Application UI — project dashboard, creator panels, visual logic, code editor and diagnostics.
2. Project model — namespace, UUIDs, version profile, BP/RP metadata and project file map.
3. Creator registry — discoverable creator modules and their maturity/output metadata.
4. Generators — deterministic JSON, language, manifest and JavaScript output.
5. Validation — JSON syntax, required files, identifiers, cross-pack references and version rules.
6. Asset pipeline — import, preview, validate and package textures, geometry, animations, particles and sounds.
7. Export — individual files, .mcpack and .mcaddon.
8. Compatibility data — versioned snapshots sourced from official Minecraft Creator documentation.

## Current implementation
- Typed project model and namespace normalization.
- Behavior Pack and Resource Pack manifest generation.
- A basic custom item generator.
- Project structural and JSON syntax validation.
- Nested .mcpack packaging inside a .mcaddon archive.
- A creator registry that distinguishes implemented modules from planned modules.

## Creator coverage roadmap
The registry is intentionally extensible. Planned creator families include blocks, entities, recipes, feature definitions, feature rules, spawn rules, loot tables, trade tables, visual JavaScript logic, animations, animation controllers, particles, geometry, render controllers, attachables, sound definitions, fog, camera, dialogue and advanced scripts.

"Every possible way" is a long-term coverage goal, not a claim that all Bedrock capabilities are implemented in this first foundation. Each creator must be implemented and tested against the target Bedrock schemas before it is marked ready.

## Android delivery
The web application should be packaged for Android with a maintained native bridge. Android document access must use the Storage Access Framework (SAF), persist granted URI permissions, and avoid assuming unrestricted access to /storage/emulated/0. ZIP export should write through the selected document URI. APK builds should run in CI and be attached to GitHub releases only after successful build and install tests.

## Compatibility policy
Do not assume the latest Minecraft product version, JSON format version and Script API module version are the same value. Store these independently in versioned compatibility profiles. Default to the latest verified stable profile bundled with the app; never automatically upgrade an existing project.

## Quality gates
- Unit tests for every generator.
- Golden-file tests for generated JSON.
- Validation tests for malformed JSON, duplicate UUIDs and missing references.
- Archive tests that open the produced .mcaddon and inspect both nested .mcpack files.
- Minecraft import/runtime tests for each supported content creator.
- Android tests for SAF permissions, reopening projects and exporting to user-selected folders.
