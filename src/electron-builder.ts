import { getConfig } from 'vscode-get-config';
import { window, WorkspaceConfiguration } from 'vscode';
import { spawn } from 'child_process';

import {
  clearOutput,
  getPlatformFlag,
  getProjectPath,
  hasConfigArgument,
  hasConfigFiles,
  hasEligibleManifest,
  isSupportedGrammar,
  isValidConfigFile
} from './util';

const builderChannel = window.createOutputChannel('Electron Builder');

export default async function build(): Promise<void> {
  await clearOutput(builderChannel);

  if (!(await hasEligibleManifest() || await hasConfigFiles()) && !isSupportedGrammar()) {
    builderChannel.appendLine('No eligible Electron Builder configuration found in your workspace');
    return;
  }

  const document = window.activeTextEditor.document;
  const { fileName } = document;

  try {
    await document.save();
  } catch (errorMessage) {
    window.showErrorMessage(`Could not save document ${fileName}, see console for details`);
    console.error(errorMessage);
    return;
  }

  const config: WorkspaceConfiguration = await getConfig('electron-builder');

  const electronBuilderArguments = config.electronBuilderArguments?.length
    ? [ ...config.electronBuilderArguments ]
    : [ getPlatformFlag() ];

  if (!hasConfigArgument(electronBuilderArguments) && (isValidConfigFile(fileName) || !(await hasEligibleManifest() || await hasConfigFiles()))) {
    electronBuilderArguments.push(
      '--config',
      fileName
    );
  }

  // Let's build
  const child = spawn(config.pathToElectronBuilder, electronBuilderArguments, { cwd: await getProjectPath()});
  const stdErr = [];

  child.stdout.on('data', (line: string ) => {
    builderChannel.appendLine(line.toString());
  });

  child.stderr.on('data', (line: string) => {
    stdErr.push(line);
    builderChannel.appendLine(line.toString());
  });

  child.on('error', (errorMessage: string) => {
    if (errorMessage && errorMessage.toString().includes('ENOENT')) {
      window.showErrorMessage('Could not find electron-builder at specified path');
    } else {
      window.showErrorMessage('Failed to run electron-builder, see console for details');
    }

    console.error(errorMessage);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      builderChannel.show(true);

      if (config.showNotifications) window.showErrorMessage('Building failed, see output for details');
      if (stdErr.length > 0) console.error(stdErr.join('\n'));
    }
  });
}
