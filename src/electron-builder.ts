import { spawn } from 'node:child_process';
import { type WorkspaceConfiguration, window } from 'vscode';
import { getConfig } from 'vscode-get-config';

import {
	clearOutput,
	getElectronBuilderPath,
	getPlatformFlag,
	getProjectPath,
	hasConfigArgument,
	hasConfigFiles,
	hasEligibleManifest,
	isSupportedGrammar,
	isValidConfigFile,
} from './util';

const builderChannel = window.createOutputChannel('Electron Builder');

export default async function build(): Promise<void> {
	const activeTextEditor = window.activeTextEditor;

	if (!activeTextEditor) {
		return;
	}

	await clearOutput(builderChannel);

	if (!isSupportedGrammar()) {
		builderChannel.appendLine('Active file is no eligible Electron Builder configuration');
		return;
	}

	if (!((await hasEligibleManifest()) || (await hasConfigFiles()))) {
		builderChannel.appendLine('No eligible Electron Builder configuration found in your workspace');
		return;
	}

	const document = activeTextEditor.document;
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
		? [...config.electronBuilderArguments]
		: [getPlatformFlag()];

	if (
		!hasConfigArgument(electronBuilderArguments) &&
		(isValidConfigFile(fileName) || !((await hasEligibleManifest()) || (await hasConfigFiles())))
	) {
		electronBuilderArguments.push('--config', fileName);
	}

	// Let's build
	const child = spawn(await getElectronBuilderPath(), electronBuilderArguments, { cwd: await getProjectPath() });
	const stdErr: string[] = [];

	child.stdout.on('data', (line: string) => {
		builderChannel.appendLine(line.toString());
	});

	child.stderr.on('data', (line: string) => {
		stdErr.push(line);
		builderChannel.appendLine(line.toString());
	});

	child.on('error', (errorMessage: string) => {
		if (errorMessage?.toString().includes('ENOENT')) {
			window.showErrorMessage('Could not find electron-builder at specified path');
		} else {
			window.showErrorMessage('Failed to run electron-builder, see console for details');
		}

		console.error(errorMessage);
	});

	child.on('exit', (code) => {
		builderChannel.show();

		if (code !== 0) {
			if (config.showNotifications) window.showErrorMessage('Building failed, see output for details');
			if (stdErr.length > 0) console.error(stdErr.join('\n'));
		}
	});
}
