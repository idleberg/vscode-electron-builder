import * as vscode from 'vscode';

import build from './electron-builder';
function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('extension.electron-builder.build', () => {
      return build();
    })
  );
}

export { activate };
