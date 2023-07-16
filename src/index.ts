import { commands, env, type ExtensionContext } from 'vscode';
import { getConfig } from 'vscode-get-config';
import { reporter } from './telemetry';
import build from './electron-builder';

async function activate(context: ExtensionContext): Promise<void> {
  const { disableTelemetry } = await getConfig('electron-builder');

  if (env.appName !== 'VSCodium' && disableTelemetry === false) {
    context.subscriptions.push(reporter);
  }

  context.subscriptions.push(
    commands.registerTextEditorCommand('extension.electron-builder.build', async () => {
      return await build();
    })
  );
}

export { activate };
