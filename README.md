# Electron Builder for Visual Studio Code

[![The MIT License](https://flat.badgen.net/badge/license/MIT/orange)](http://opensource.org/licenses/MIT)
[![GitHub](https://flat.badgen.net/github/release/idleberg/vscode-electron-builder)](https://github.com/idleberg/vscode-electron-builder/releases)
[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/installs-short/idleberg.electron-builder.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=idleberg.electron-builder)
[![CircleCI](https://flat.badgen.net/circleci/github/idleberg/vscode-electron-builder)](https://circleci.com/gh/idleberg/vscode-electron-builder)
[![David](https://flat.badgen.net/david/dep/idleberg/vscode-electron-builder)](https://david-dm.org/idleberg/vscode-electron-builder)

Build system for [Electron Builder](https://www.electron.build/).

## Installation

### Extension Marketplace

Launch Quick Open, paste the following command, and press <kbd>Enter</kbd>

`ext install electron-builder`

### Packaged Extension

Download the package extension from the the [release page](https://github.com/idleberg/vscode-electron-builder/releases) and install it from the command-line:

```bash
$ code --install-extension electron-builder-*.vsix
```

### Clone Repository

Change to your Visual Studio Code extensions directory:

```bash
# Windows
$ cd %USERPROFILE%\.vscode\extensions

# Linux & macOS
$ cd ~/.vscode/extensions/
```

Clone repository as `electron-builder`:

```bash
$ git clone https://github.com/idleberg/vscode-electron-builder electron-builder
```

## Usage

You can run the *Electron Builder: Build* from the [command-palette](https://code.visualstudio.com/docs/editor/codebasics#_command-palette) or from the title menu when opening a configuration file. When no such file has been opened, your workspace will be scanned for eligible configurations.

Configuration Precedence:

- extension settings using `--config` option
- `package.json` with `build` field
- `electron-builder.yml`
- `electron-builder.yaml`
- `electron-builder.json`
- `electron-builder.toml`
- `electron-builder.js`

## License

This work is licensed under [The MIT License](https://opensource.org/licenses/MIT)
