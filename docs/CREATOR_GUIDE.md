# Bedrock Creator Studio — User Guide

## 1. Create a project

Open Bedrock Creator Studio and tap **New Add-on Project**. Enter a project name and a namespace. The namespace becomes the prefix of custom identifiers, for example `myaddon:ruby`. Use lowercase letters, numbers and underscores.

The Studio creates two packs:
- Behavior Pack (BP): gameplay definitions such as item JSON.
- Resource Pack (RP): textures, item texture atlas and language files.

Their manifests have distinct UUIDs. The Behavior Pack manifest includes a dependency on the matching Resource Pack.

## 2. Create a custom item

Open the project and use **Item Creator**:
1. Enter the item identifier path. The project namespace is added automatically.
2. Enter the in-game display name.
3. Enter a texture key using lowercase letters, numbers or underscores.
4. Choose a maximum stack size from 1 to 99.
5. Choose the creative inventory category.
6. Import a PNG texture from your device.
7. Tap **Generate Item**.

The Studio writes the item JSON, adds the texture key to `resource_pack/textures/item_texture.json`, adds the display-name key to `resource_pack/texts/en_US.lang`, and stores the PNG under `resource_pack/textures/items/`.

A PNG is required. A texture atlas entry by itself is not a texture asset.

## 3. Run diagnostics

Open **Diagnostics** in the project. Errors block export. The current checks include JSON parsing, root object shape, distinct pack/module UUIDs, manifest UUID consistency, the BP-to-RP dependency and PNG data signature.

Diagnostics are structural checks. They cannot simulate Minecraft's runtime parser or confirm that an item behaves correctly in every game version.

## 4. Export and import into Minecraft

Tap **Export**. On Android, the add-on is written to the app cache and the system share sheet opens. Choose a file manager or another destination that can save the shared file. The output is a single `.mcaddon` containing both `.mcpack` files.

Open the saved `.mcaddon` with Minecraft. After Minecraft reports the import, activate the Behavior Pack and Resource Pack in the world's pack settings.

## 5. Understand creator status

The Creator Library labels each module:
- **Available** — implemented in this branch.
- **Planned** — listed in the roadmap but not yet an editor.

At this stage, paired project creation, custom item generation, PNG import, diagnostics and add-on export are available. Blocks, entities, recipes, world generation, animation, particles, visual JavaScript logic and the other listed systems remain planned.

## 6. Local project storage

Projects are stored on the device in IndexedDB. Clearing the app's storage or uninstalling the app can remove local projects. Export important add-ons and keep backups. The current Android build imports individual assets through the system picker and exports archives through the share sheet; it does not mount an arbitrary user-selected project folder as a live workspace.
