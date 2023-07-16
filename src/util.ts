import {
  window,
  workspace,
} from 'vscode';

import { constants, promises as fs } from 'node:fs';
import { getConfig } from 'vscode-get-config';
import { platform } from 'node:os';
import { resolve } from 'node:path';
import which from 'which';

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
async function clearOutput(channel: any): Promise<void> {
  const { alwaysShowOutput } = await getConfig('electron-builder');

  channel.clear();
  if (alwaysShowOutput === true) {
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

function isSupportedGrammar(): boolean {
  const activeTextEditor = window.activeTextEditor;

  if (!activeTextEditor) {
    return false;
  }

  const languageID = activeTextEditor.document.languageId;

  return getSupportedGrammars().includes(languageID);
}

async function getElectronBuilderPath(): Promise<string> {
  // If stored, return pathToElectronBuilder
  const { pathToElectronBuilder } = await getConfig('electron-builder');

  if (pathToElectronBuilder?.length && pathToElectronBuilder.endsWith('/node_modules/.bin/electron-builder')) {
    return pathToElectronBuilder;
  }

  try {
    // Global installation?!
    return String(await which('electron-builder'));
  } catch (error) {
    console.error(error);
    window.showErrorMessage('No Electron Builder binary detected ');
  }

  return '';
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

async function getProjectPath(): Promise<undefined | string> {
  let editor;

  try {
    editor = window.activeTextEditor;
  } catch (err) {
    return undefined;
  }

  try {
    const workspaceFolder = workspace.getWorkspaceFolder(editor.document.uri);

    return workspaceFolder ? workspaceFolder.uri.fsPath : '';
  } catch (error) {
    return undefined;
  }
}

function hasConfigArgument(electronBuilderArguments: string[]): boolean {
  return electronBuilderArguments.includes('--config') || electronBuilderArguments.includes('-c');
}

async function hasEligibleManifest(): Promise<boolean> {
  const projectPath = await getProjectPath();

  if (!projectPath?.length) {
    return false;
  }

  const manifestPath = resolve(projectPath, 'package.json');

  if (!await fileExists(manifestPath)) {
    return false;
  }

  let manifestFile;

  try {
    manifestFile = await fs.readFile(manifestPath, 'utf-8');
  } catch (error) {
    console.error(error);
    return false;
  }

  const manifest: Record<string, unknown> = JSON.parse(manifestFile);

  return Boolean(manifest['build'] && manifest['build']['appId']);
}

async function hasConfigFiles(): Promise<boolean> {
  const configFiles = await getConfigFiles();
  const projectPath = await getProjectPath();

  if (!projectPath?.length) {
    return false;
  }

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
  getConfigFiles,
  getElectronBuilderPath,
  getPlatformFlag,
  getProjectPath,
  hasConfigArgument,
  hasConfigFiles,
  hasEligibleManifest,
  isSupportedGrammar,
  isValidConfigFile
};
