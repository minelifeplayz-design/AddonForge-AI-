# Bedrock Creator Studio

Bedrock Creator Studio is an Android-first, no-code-first editor for Minecraft Bedrock add-on projects. It creates paired Behavior Packs and Resource Packs, builds custom item definitions and packages them as installable `.mcaddon` archives.

## Working features in this branch

- Create and store projects locally in IndexedDB.
- Generate Behavior Pack and Resource Pack manifests with unique UUIDs and a linked pack dependency.
- Create a custom item definition using a namespace, display name, stack size and creative category.
- Import a PNG texture from the device and embed the real image bytes in the Resource Pack.
- Merge item texture atlas and `en_US.lang` entries without replacing existing items.
- Validate JSON syntax, pack/module UUIDs, pack dependency and imported PNG data.
- Export both packs as nested `.mcpack` files inside one `.mcaddon` archive.
- On Android, save the archive to the app cache and open the Android share sheet so the user can save or send it.
- Build node-based visual scripts from player events, conditions, variables and actions.\n- Generate a JavaScript entry point and update the Behavior Pack script module manifest automatically.\n- Run automated generator, visual graph, validation and archive tests.

## Creator availability

The paired project generator, Item Creator and first Visual Scripting editor are implemented in this branch. The other creator categories in the registry are explicitly marked Planned. They are not presented as working editors.

## Requirements

- Node.js 22 or newer
- Android Studio and Android SDK for local Android builds
- Java 21 for the Android Gradle build

## Run the web preview

```bash
npm install
npm run lint
npm test
npm run build
npm run dev
```

## Create and build the Android project

```bash
npm install
npm run build
npm run android:init
npm run android:sync
cd android
./gradlew assembleDebug
```

The installable debug APK is created at:

`android/app/build/outputs/apk/debug/app-debug.apk`

The GitHub Actions workflow also builds this APK and uploads it as a downloadable artifact for each push to the Studio branch. It runs TypeScript checks, automated tests, a production web build and the Android Gradle build before uploading the APK.

## Storage and Android file access

Project data is stored in the app's IndexedDB database. PNG import uses the Android system file picker provided by the WebView. Add-on export uses Capacitor Filesystem cache storage and the Android share sheet. The app does not request broad storage permission or claim direct unrestricted access to `/storage/emulated/0`.

## Compatibility and testing

The default item JSON format version is a project setting, not a claim about the current Minecraft game release. Generated add-ons must still be imported into the target Minecraft Bedrock version and checked in-game. Structural checks and a successful APK build do not certify every Bedrock runtime component.

See [the user guide](docs/CREATOR_GUIDE.md) and [the architecture notes](docs/BEDROCK_CREATOR_STUDIO_ARCHITECTURE.md).
