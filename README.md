# Bedrock Creator Studio

Android-first, no-code-first toolkit for creating Minecraft Bedrock add-ons.

The project is being developed as a complete creator environment: configuration-based content editors, visual gameplay logic, optional JavaScript editing, asset management, validation, offline documentation and add-on packaging.

## Current foundation

- Typed project model and namespace validation
- Behavior Pack and Resource Pack manifest generation
- Basic custom item definition generation
- Safe item insertion that merges texture atlas and language entries
- Project structural and JSON syntax diagnostics
- Export to a .mcaddon archive containing nested .mcpack files
- Creator registry showing implemented and planned modules

## Development

Requirements: Node.js 22+

```bash
npm ci
npm run lint
npm run build
npm run dev
```

See [the architecture and roadmap](docs/BEDROCK_CREATOR_STUDIO_ARCHITECTURE.md).

## Status

This is an active development branch. The creator registry includes planned modules, but only modules explicitly marked ready are implemented. A successful structural validation is not a substitute for importing and testing an add-on in Minecraft.

## Platform

The current UI foundation is React + TypeScript. Android delivery will use a native Android wrapper and Storage Access Framework integration so users can work with folders they explicitly grant access to. APK releases will only be published after the Android build and install tests pass.
