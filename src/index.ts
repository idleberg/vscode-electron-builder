import { commands, type ExtensionContext } from "vscode";
import build from "./electron-builder";

export async function activate(context: ExtensionContext): Promise<void> {
	context.subscriptions.push(
		commands.registerTextEditorCommand(
			"extension.electron-builder.build",
			async () => {
				return await build();
			},
		),
	);
}
