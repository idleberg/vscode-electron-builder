import * as vscode from 'vscode';

import run from './electron-builder';
function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('extension.electron-builder.run', () => {
      return run();
    })
  );
}

export { activate };
