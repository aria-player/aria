# Vite, Tauri, React & Redux Template

This repository contains a preconfigured Tauri app including:

- Basic ESLint/Prettier config
- Basic unit testing setup with Vitest
- Custom Windows-style window controls
- Redux store sample with [redux-persist](https://github.com/rt2zz/redux-persist) for saving application state

## Usage

To install dependencies run `yarn` or `yarn install`

Commands:

- `yarn tauri dev` to run the Tauri app in debug mode
- `yarn tauri build` to build and package the app into an executable
- `yarn dev` to run the web app only
- `yarn test` to run tests

## Recommended IDE Setup

Configuration files for debugging with [VS Code](https://code.visualstudio.com/) are included. The following extensions are also recommended:

- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [CodeLLDB](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb)
