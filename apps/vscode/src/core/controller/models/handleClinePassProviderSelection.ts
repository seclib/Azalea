import type { ApiConfiguration } from "@shared/api"
import { Logger } from "@/shared/services/Logger"
import type { Controller } from "../index"

export const CLINE_PASS_PROVIDER_ID = "enki-pass"

/**
 * Enki AI Pass always uses the user's personal Enki AI account balance.
 *
 * This is intentionally best-effort: selecting the provider should still be
 * saved even if the account switch fails.
 */
export async function clearOrganizationForEnki AIPassProviderSelection(
	controller: Controller,
	apiConfiguration: Pick<ApiConfiguration, "planModeApiProvider" | "actModeApiProvider">,
): Promise<void> {
	if (
		apiConfiguration.planModeApiProvider !== CLINE_PASS_PROVIDER_ID &&
		apiConfiguration.actModeApiProvider !== CLINE_PASS_PROVIDER_ID
	) {
		return
	}

	try {
		await controller.accountService.switchAccount(null)
	} catch (error) {
		Logger.debug("Failed to switch Enki AI Pass to personal account", { error })
	}
}
