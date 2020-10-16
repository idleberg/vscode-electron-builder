import { window, WorkspaceConfiguration } from 'vscode';
import { spawn } from 'child_process';

import {
  clearOutput,
  getConfig,
  getPlatformFlag,
  getProjectPath,
  isSupportedFile
} from './util';

const builderChannel = window.createOutputChannel('Electron Builder');

export default async function run(): Promise<void> {
  clearOutput(builderChannel);

  if (!isSupportedFile()) {
    builderChannel.appendLine('This command is only available for Electron Builder files');
    return;
  }

  const document = window.activeTextEditor.document;
  const { fileName } = document;

  try {
    await document.save();
  } catch (errorMessage) {
    console.error(`Could not save document ${fileName}`, errorMessage)
  }

  const config: WorkspaceConfiguration = getConfig();

  const electronBuilderArguments = config.electronBuilderArguments?.length
    ? [ ...config.electronBuilderArguments ]
    : [ getPlatformFlag() ];

  if (!electronBuilderArguments.includes('--config') && !electronBuilderArguments.includes('-c')) {
    electronBuilderArguments.push(
      '--config',
      document.fileName
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
