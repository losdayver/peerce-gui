<p align="center">
  <img src="./promo/peerce-logo-transparent.png" alt="Peerce logo" width="180">
</p>

# Peerce GUI

Peerce GUI is a desktop interface for connecting peers and transferring files with [Peerce](https://www.npmjs.com/package/peerce). It provides peer management, optional encrypted connections, fingerprint verification, transfer progress, and persistent transfer history in a native Tauri application.

> [!WARNING]
> **Peerce GUI is currently in active development.** Features and configuration may change; some functionality is incomplete, and the application is not yet recommended for production use.

Current pre-release: **0.2.0-6**.

## Features

- Peer registration, editing, reconnecting, and aggressive reconnect mode
- Optional encrypted peer-to-peer file transfers
- Local and remote public-key fingerprints for out-of-band verification
- Trust-on-first-use protection that rejects a changed key for a known peer
- Incoming and outgoing transfer progress with persistent history
- Direct access to received files from the application

## Encryption and peer identity

Peerce GUI creates a local key pair on first startup and stores it in `~/.peerce/vault`. Private keys stay on the local machine and are not displayed by the application.

For an encrypted connection, both peers must enable encryption. The first public key received for a peer tag is remembered. If that tag later presents a different key, the connection is rejected. Use **Peer info** to compare the local fingerprint through a separate trusted channel.

## Preview

![Peerce GUI showing peer connections and file transfers](./promo/gui-example.png)

## Technology

- Tauri 2 desktop shell
- React 19 and TypeScript
- Node.js HTTP and WebSocket backend
- Peerce peer-to-peer networking

## Development

Install the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform, then run:

```bash
npm install
npm run dev
```

To start a local Peerce relay for development:

```bash
npm run peerce-start-relay-local
```

## Build

### Prerequisites

- See limitations if building Appimage for linux [official website](https://v2.tauri.app/distribute/appimage/#limitations)
- Tauri prerequisites [official website](https://v2.tauri.app/start/prerequisites/)
- Node.js runtime version 22 (`>=22 <23`), available from the [official website](https://nodejs.org/en/download)

If you are using nvm, make sure the correct version is selected, then run:

```bash
npm run build
```

After a successful build, `src-tauri/target/release/bundle` will contain the release artifacts for the host platform:

- an NSIS installer on Windows;
- an AppImage on Linux;
- a DMG image on macOS.

Build the macOS package on macOS with the native Node.js architecture (`arm64` on Apple Silicon or `x64` on Intel). The generated DMG is unsigned; distribution without a Gatekeeper warning requires Apple code signing and notarization.

## License

This project is available under the [MIT License](./LICENSE).
