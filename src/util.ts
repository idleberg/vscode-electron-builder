import {
  window,
  workspace,
  WorkspaceConfiguration
} from 'vscode';

import { constants, promises as fs } from 'fs';
import { platform } from 'os';
import { resolve } from 'path';

async function asyncFilter(arr, callback) {
  const fail = Symbol();

  return (await Promise.all(
    arr.map(async item => (await callback(item))
      ? item
      : fail
    )
  )).filter(i=>i!==fail);
}

// eslint-disable-next-line
function clearOutput(channel: any): void {
  const config: WorkspaceConfiguration = getConfig();

  channel.clear();
  if (config.alwaysShowOutput === true) {
    channel.show(true);
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, constants.F_OK);
  } catch (error) {
    return false;
  }

  return true;
}

function getConfig(): WorkspaceConfiguration {
  return workspace.getConfiguration('electron-builder');
}

function isSupportedGrammar(): boolean {
  const languageID = window.activeTextEditor['_documentData']['_languageId'];

  return getSupportedGrammars().includes(languageID);
}

function getPlatformFlag(): string | void {
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

function getConfigFiles(): string[] {
  return [
    // Ordered by precedence!
    'electron-builder.yml',
    'electron-builder.yaml',
    'electron-builder.json',
    'electron-builder.toml',
    'electron-builder.js'
  ];
}

function getSupportedGrammars(): string[] {
  return [
    'electron-builder-js',
    'electron-builder-json',
    'electron-builder-toml',
    'electron-builder-yaml'
  ];
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

function hasConfigArgument(electronBuilderArguments: string[]): boolean {
  return electronBuilderArguments.includes('--config') || electronBuilderArguments.includes('-c');
}

async function hasEligibleManifest(): Promise<boolean> {
  const manifestFile = resolve(await getProjectPath(), 'package.json');
  const manifest: unknown = JSON.parse(await fs.readFile(manifestFile, 'utf-8'));

  return Boolean(manifest['build'] && manifest['build']['appId']);
}

async function hasConfigFiles(): Promise<boolean> {
  const configFiles = getConfigFiles();
  const projectPath = await getProjectPath();

  return Boolean(
    (await asyncFilter(configFiles, async configFile => {
      return await fileExists(resolve(projectPath, configFile))
    })).length
  );
}

function isValidConfigFile(fileName: string): boolean {
  return Boolean(getConfigFiles().filter(configFile => fileName.endsWith(`/${configFile}`)).length);
}

export {
  clearOutput,
  fileExists,
  getConfig,
  getConfigFiles,
  getPlatformFlag,
  getProjectPath,
  hasConfigArgument,
  hasConfigFiles,
  hasEligibleManifest,
  isSupportedGrammar,
  isValidConfigFile
};
