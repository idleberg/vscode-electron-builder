import { window, workspace } from "vscode";

import { constants, promises as fs } from "node:fs";
import { getConfig } from "vscode-get-config";
import { platform } from "node:os";
import { resolve } from "node:path";
import which from "which";

export async function asyncFilter(arr, callback) {
	const fail = Symbol();

	return (
		await Promise.all(
			arr.map(async (item) => ((await callback(item)) ? item : fail)),
		)
	).filter((i) => i !== fail);
}

// eslint-disable-next-line
export async function clearOutput(channel: any): Promise<void> {
	const { alwaysShowOutput } = await getConfig("electron-builder");

	channel.clear();
	if (alwaysShowOutput === true) {
		channel.show(true);
	}
}

export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath, constants.F_OK);
		/* eslint-disable @typescript-eslint/no-unused-vars */
	} catch (error) {
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
	const { pathToElectronBuilder } = await getConfig("electron-builder");

	if (
		pathToElectronBuilder?.length &&
		pathToElectronBuilder.endsWith("/node_modules/.bin/electron-builder")
	) {
		return pathToElectronBuilder;
	}

	try {
		// Global installation?!
		return String(await which("electron-builder"));
	} catch (error) {
		console.error(error);
		window.showErrorMessage("No Electron Builder binary detected ");
	}

	return "";
}

export function getPlatformFlag(): string | void {
	const currentPlatform = platform();

	switch (currentPlatform) {
		case "linux":
			return "--linux";
		case "darwin":
			return "--mac";
		case "win32":
			return "--windows";
		default:
			window.showErrorMessage(
				`Unsupported platform '${currentPlatform}' detected, please specify custom build arguments`,
			);
	}
}

export function getConfigFiles(): string[] {
	return [
		// Ordered by precedence!
		"electron-builder.yml",
		"electron-builder.yaml",
		"electron-builder.json",
		"electron-builder.toml",
		"electron-builder.js",
	];
}

export function getSupportedGrammars(): string[] {
	return [
		"electron-builder-js",
		"electron-builder-json",
		"electron-builder-toml",
		"electron-builder-yaml",
	];
}

export async function getProjectPath(): Promise<undefined | string> {
	let editor;

	try {
		editor = window.activeTextEditor;
		/* eslint-disable @typescript-eslint/no-unused-vars */
	} catch (error) {
		return undefined;
	}

	try {
		const workspaceFolder = workspace.getWorkspaceFolder(editor.document.uri);

		return workspaceFolder ? workspaceFolder.uri.fsPath : "";
		/* eslint-disable @typescript-eslint/no-unused-vars */
	} catch (error) {
		return undefined;
	}
}

export function hasConfigArgument(electronBuilderArguments: string[]): boolean {
	return (
		electronBuilderArguments.includes("--config") ||
		electronBuilderArguments.includes("-c")
	);
}

export async function hasEligibleManifest(): Promise<boolean> {
	const projectPath = await getProjectPath();

	if (!projectPath?.length) {
		return false;
	}

	const manifestPath = resolve(projectPath, "package.json");

	if (!(await fileExists(manifestPath))) {
		return false;
	}

	let manifestFile;

	try {
		manifestFile = await fs.readFile(manifestPath, "utf-8");
	} catch (error) {
		console.error(error);
		return false;
	}

	let manifest: Record<string, unknown>;

	try {
		manifest = JSON.parse(manifestFile);
	} catch (error) {
		if (error instanceof Error) {
			console.error(error.message);
			window.showErrorMessage(error.message);
		}

		return false;
	}

	return Boolean(manifest["build"] && manifest["build"]["appId"]);
}

export async function hasConfigFiles(): Promise<boolean> {
	const configFiles = await getConfigFiles();
	const projectPath = await getProjectPath();

	if (!projectPath?.length) {
		return false;
	}

	return Boolean(
		(
			await asyncFilter(configFiles, async (configFile) => {
				return await fileExists(resolve(projectPath, configFile));
			})
		).length,
	);
}

export function isValidConfigFile(fileName: string): boolean {
	return Boolean(
		getConfigFiles().filter((configFile) => fileName.endsWith(`/${configFile}`))
			.length,
	);
}
