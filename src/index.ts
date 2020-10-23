import * as vscode from 'vscode';
import build from './electron-builder';

async function activate(context: vscode.ExtensionContext): Promise<void> {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('extension.electron-builder.build', async () => {
      return await build();
    })
  );
}

export { activate };
