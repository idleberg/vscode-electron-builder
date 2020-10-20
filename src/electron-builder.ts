import { window, WorkspaceConfiguration } from 'vscode';
import { spawn } from 'child_process';

import {
  clearOutput,
  getConfig,
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

  const config: WorkspaceConfiguration = await getConfig();

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

  let stdErr = '';

  child.stdout.on('data', (line: Array<string> ) => {
    builderChannel.appendLine(line.toString());
  });

  child.stderr.on('data', (line: Array<string>) => {
    stdErr += '\n' + line;
    builderChannel.appendLine(line.toString());
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      builderChannel.show(true);

      if (config.showNotifications) window.showErrorMessage('Building failed, see output for details');
      if (stdErr.length > 0) console.error(stdErr);
    }
  });
}
