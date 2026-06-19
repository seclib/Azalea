import {
	type BuiltinToolAvailabilityContext,
	getCoreBuiltinToolCatalog,
	resolveDisabledToolNames,
	type ToolCatalogEntry,
} from "@enki/core";

export type { ToolCatalogEntry } from "@enki/core";

export function getToolCatalog(
	availabilityContext?: BuiltinToolAvailabilityContext,
): ToolCatalogEntry[] {
	return getCoreBuiltinToolCatalog({
		disabledToolIds: resolveDisabledToolNames(),
		...availabilityContext,
	});
}
