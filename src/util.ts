import { constants, promises as fs } from 'node:fs';
import { platform } from 'node:os';
import { resolve } from 'node:path';
import { type OutputChannel, type TextEditor, window, workspace } from 'vscode';
import { getConfig } from 'vscode-get-config';
import which from 'which';

type ManifestStub = {
	build: {
		appId: string;
	};
};

export async function asyncFilter(arr: string[], callback: (arg: string) => Promise<boolean>) {
	const fail = Symbol();

	return (await Promise.all(arr.map(async (item) => ((await callback(item)) ? item : fail)))).filter((i) => i !== fail);
}

// eslint-disable-next-line
export async function clearOutput(channel: OutputChannel): Promise<void> {
	channel.clear();
	channel.show();
}

export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath, constants.F_OK);
		/* eslint-disable @typescript-eslint/no-unused-vars */
	} catch {
		return false;
	}

	return true;
}

export function isSupportedGrammar(): boolean {
	const activeTextEditor = window.activeTextEditor;

	if (!activeTextEditor) {
		return false;
	}

	const languageID = activeTextEditor.document.languageId;

	return getSupportedGrammars().includes(languageID);
}

export async function getElectronBuilderPath(): Promise<string> {
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

export function getPlatformFlag(): string | void {
	const currentPlatform = platform();

	switch (currentPlatform) {
		case 'linux':
			return '--linux';
		case 'darwin':
			return '--mac';
		case 'win32':
			return '--windows';
		default:
			window.showErrorMessage(
				`Unsupported platform '${currentPlatform}' detected, please specify custom build arguments`,
			);
	}
}

export function getConfigFiles(): string[] {
	return [
		// Ordered by precedence!
		'electron-builder.yml',
		'electron-builder.yaml',
		'electron-builder.json',
		'electron-builder.toml',
		'electron-builder.js',
	];
}

export function getSupportedGrammars(): string[] {
	return ['electron-builder-js', 'electron-builder-json', 'electron-builder-toml', 'electron-builder-yaml'];
}

export async function getProjectPath(): Promise<undefined | string> {
	let editor: TextEditor | undefined;

	try {
		editor = window.activeTextEditor;
	} catch (_error) {
		return undefined;
	}

	if (!editor) {
		return undefined;
	}

	try {
		const workspaceFolder = workspace.getWorkspaceFolder(editor.document.uri);

		return workspaceFolder ? workspaceFolder.uri.fsPath : '';
	} catch (_error) {
		return undefined;
	}
}

export function hasConfigArgument(electronBuilderArguments: string[]): boolean {
	return electronBuilderArguments.includes('--config') || electronBuilderArguments.includes('-c');
}

export async function hasEligibleManifest(): Promise<boolean> {
	const projectPath = await getProjectPath();

	if (!projectPath?.length) {
		return false;
	}

	const manifestPath = resolve(projectPath, 'package.json');

	if (!(await fileExists(manifestPath))) {
		return false;
	}

	let manifestFile: string;

	try {
		manifestFile = await fs.readFile(manifestPath, 'utf-8');
	} catch (error) {
		console.error(error);
		return false;
	}

	let manifest: ManifestStub;

	try {
		manifest = JSON.parse(manifestFile);
	} catch (error) {
		if (error instanceof Error) {
			console.error(error.message);
			window.showErrorMessage(error.message);
		}

		return false;
	}

	return Boolean(manifest.build?.appId);
}

export async function hasConfigFiles(): Promise<boolean> {
	const configFiles = await getConfigFiles();
	const projectPath = await getProjectPath();

	if (!projectPath?.length) {
		return false;
	}

	return Boolean(
		(
			await asyncFilter(configFiles, async (configFile: string) => {
				return await fileExists(resolve(projectPath, configFile));
			})
		).length,
	);
}

export function isValidConfigFile(fileName: string): boolean {
	return Boolean(getConfigFiles().filter((configFile) => fileName.endsWith(`/${configFile}`)).length);
}
