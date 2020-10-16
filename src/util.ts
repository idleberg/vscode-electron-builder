import {
  window,
  workspace,
  WorkspaceConfiguration
} from 'vscode';

import { platform } from 'os';

// eslint-disable-next-line
function clearOutput(channel: any): void {
  const config: WorkspaceConfiguration = getConfig();

  channel.clear();
  if (config.alwaysShowOutput === true) {
    channel.show(true);
  }
}

function getConfig(): WorkspaceConfiguration {
  return workspace.getConfiguration('electron-builder');
}

function isSupportedFile(): boolean {
  const supportedFiles = [
    'electron-builder-js',
    'electron-builder-json',
    'electron-builder-toml',
    'electron-builder-yaml'
  ];

  const languageID = window.activeTextEditor['_documentData']['_languageId'];

  return supportedFiles.includes(languageID);
}

function getPlatformFlag() {
  const currentPlatform = platform();

  switch(currentPlatform) {
    case 'linux':
      return '--linux';
    case 'darwin':
      return '--mac';
    case 'win32':
      return '--windows';
    default:
      window.showErrorMessage(`Unsupported platform '${currentPlatform}' detected, please specify custom build arguments`);
  }
}

async function getProjectPath(): Promise<null | string> {
  let editor;

  try {
    editor = window.activeTextEditor;
  } catch (err) {
    return null;
  }

  const resource = editor.document.uri;
  const { uri } = workspace.getWorkspaceFolder(resource);

  return uri.fsPath || null;
}

export {
  clearOutput,
  getConfig,
  getPlatformFlag,
  getProjectPath,
  isSupportedFile
};
