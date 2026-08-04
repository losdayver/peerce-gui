<p align="center">
  <img src="./promo/peerce-logo-transparent.png" alt="Peerce logo" width="180">
</p>

# Peerce GUI

Peerce GUI is a desktop interface for connecting peers and transferring files with [Peerce](https://www.npmjs.com/package/peerce). It provides peer management, connection status, transfer progress, and persistent transfer history in a native Tauri application.

> [!WARNING]
> **Peerce GUI is currently in active development.** Features and configuration may change; some functionality is incomplete, and the application is not yet recommended for production use.

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
npm run peerce-relay-local
```

## Build

### Prerequisites

- Node.js runtime version 22 (`>=22 <23`), available from the [official website](https://nodejs.org/en/download)

If you are using nvm, make sure the correct version is selected, then run:

```bash
npm run build
```

After a successful build, `src-tauri/target/release/bundle` will contain the release artifacts for the target platform: an NSIS installer when building on Windows or an AppImage when building on Linux.

## License

This project is available under the [MIT License](./LICENSE).
