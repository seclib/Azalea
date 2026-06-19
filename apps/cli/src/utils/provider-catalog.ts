import {
	listLocalProviders as internalListLocalProviders,
	type ProviderSettingsManager,
} from "@enki/core";
import { getCliFeatureFlagsService } from "./feature-flags";

export async function listLocalProviders(
	manager: ProviderSettingsManager,
): ReturnType<typeof internalListLocalProviders> {
	return await internalListLocalProviders(manager, {
		isEnki AIPassEnabled:
			getCliFeatureFlagsService().getBooleanFlagEnabled("ext-enki-pass"),
	});
}
