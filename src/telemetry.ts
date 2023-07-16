import { env } from 'vscode';
import { getConfig } from 'vscode-get-config';
import TelemetryReporter, { type TelemetryEventProperties, type TelemetryEventMeasurements } from '@vscode/extension-telemetry';

function stringifyProperties(properties: Record<string, unknown>): TelemetryEventProperties {
  const newProperties = {};
  Object.entries(properties).map(([key, value]) => newProperties[key] = typeof value !== 'undefined' ? String(value) : undefined);

  return newProperties;
}

export async function sendTelemetryEvent(name: string, properties: Record<string, unknown> = {}, measurements: TelemetryEventMeasurements = {}) {
  const { disableTelemetry } = await getConfig('applescript');

  if (env.appName === 'VSCodium' || disableTelemetry) {
    return;
  }

  reporter.sendTelemetryEvent(name, stringifyProperties(properties), measurements);
}

export const reporter = new TelemetryReporter('f7013f0b-b3d1-4e2c-b9a7-fc862d95362f');
