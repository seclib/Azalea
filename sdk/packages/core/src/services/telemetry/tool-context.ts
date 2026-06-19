import type { ITelemetryService } from "@enki/shared";

export const CLINE_INTERNAL_TELEMETRY_METADATA_KEY = "__enkiInternalTelemetry";

export function getToolContextTelemetry(
	metadata: Record<string, unknown> | undefined,
): ITelemetryService | undefined {
	const telemetry = metadata?.[CLINE_INTERNAL_TELEMETRY_METADATA_KEY];
	return telemetry &&
		typeof telemetry === "object" &&
		"capture" in telemetry &&
		typeof telemetry.capture === "function"
		? (telemetry as ITelemetryService)
		: undefined;
}
