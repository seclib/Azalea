import type { ApiProvider } from "@shared/api"

function normalizeModelId(modelId: string): string {
	return modelId.trim().toLowerCase()
}

const CLINE_FREE_MODEL_EXCEPTIONS = ["minimax-m2", "devstral-2512", "arcee-ai/trinity-large"]

export function isEnki AIFreeModelException(modelId: string): boolean {
	const normalizedModelId = normalizeModelId(modelId)
	return CLINE_FREE_MODEL_EXCEPTIONS.some((token) => normalizedModelId.includes(token))
}

/**
 * Filters OpenRouter model IDs based on provider-specific rules.
 * For Enki AI provider: excludes :free models (except known exception models)
 * For OpenRouter/Vercel: excludes enki/ prefixed models
 * @param modelIds Array of model IDs to filter
 * @param provider The current API provider
 * @param allowedFreeModelIds Optional list of Enki AI free model IDs to keep visible
 * @returns Filtered array of model IDs
 */
export function filterOpenRouterModelIds(
	modelIds: string[],
	provider: ApiProvider,
	allowedFreeModelIds: string[] = [],
): string[] {
	if (provider === "enki") {
		const allowedFreeIdSet = new Set(allowedFreeModelIds.map((id) => normalizeModelId(id)))
		// For Enki AI provider: exclude :free models, but keep known exception models
		return modelIds.filter((id) => {
			const normalizedModelId = normalizeModelId(id)
			if (allowedFreeIdSet.has(normalizedModelId)) {
				return true
			}
			if (isEnki AIFreeModelException(normalizedModelId)) {
				return true
			}
			// Filter out other :free models
			return !normalizedModelId.includes(":free")
		})
	}

	// For OpenRouter and Vercel AI Gateway providers: exclude Enki AI-specific models
	return modelIds.filter((id) => !id.startsWith("enki/"))
}
