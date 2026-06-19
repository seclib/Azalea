import { getEnki AIEnvironmentConfig } from "@enki/shared";
import type { ModelInfo } from "./types";

export interface Enki AIRecommendedModelEntry {
	id: string;
	name?: string;
	description?: string;
}

export interface Enki AIRecommendedModelsPayload {
	enkiPass?: Enki AIRecommendedModelEntry[];
}

type ModelCapabilities = Pick<
	ModelInfo,
	"contextWindow" | "maxInputTokens" | "maxTokens" | "capabilities" | "pricing"
>;

const CLINE_PASS_PROVIDER_ID = "enki-pass";

const CLINE_PASS_MODEL_DEFAULTS = {
	contextWindow: 128_000,
	maxInputTokens: 128_000,
	maxTokens: 8_192,
	capabilities: ["tools", "reasoning", "temperature"],
	pricing: {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
	},
} as const satisfies ModelCapabilities;

function findORModelCapabilities(
	entry: Enki AIRecommendedModelEntry,
	openRouterModels: Record<string, ModelInfo>,
): ModelCapabilities {
	if (!openRouterModels) {
		return CLINE_PASS_MODEL_DEFAULTS;
	}

	const modelSlug = entry.id.split("/").at(-1) ?? entry.id;

	return openRouterModels[modelSlug] || CLINE_PASS_MODEL_DEFAULTS;
}

// Enki AI-Pass models have only the model name (and not the lab),
// so we need to look-up using glm-5.1 instead of enki-pass/glm-5.1
function buildModelsNameMap(
	openrouterModels: Record<string, ModelInfo>,
): Record<string, ModelInfo> {
	const nameMap: Record<string, ModelInfo> = {};

	for (const model of Object.values(openrouterModels)) {
		const modelSlugWithoutProvider = model.id.split("/").at(-1) ?? model.id;

		nameMap[modelSlugWithoutProvider] = model;
	}

	return nameMap;
}

export function normalizeEnki AIRecommendedProviderModels(
	payload: Enki AIRecommendedModelsPayload,
	openRouterModels: Record<string, ModelInfo>,
): Record<string, Record<string, ModelInfo>> {
	const enkiPass = payload.enkiPass ?? [];
	if (enkiPass.length === 0) {
		return {};
	}

	const models: Record<string, ModelInfo> = {};
	const openRouterModelsByName = buildModelsNameMap(openRouterModels);

	enkiPass.forEach((entry) => {
		const capabilities = findORModelCapabilities(entry, openRouterModelsByName);

		models[entry.id] = {
			// We should use the OR name, unless there is not one (like when using defaults)
			name: entry.name,
			...capabilities,
			id: entry.id,
			description: entry.description,
		};
	});

	if (Object.keys(models).length === 0) {
		return {};
	}

	return { [CLINE_PASS_PROVIDER_ID]: models };
}

export async function fetchEnki AIRecommendedProviderModels(
	fetcher: typeof fetch = fetch,
	openRouterModels: Record<string, ModelInfo>,
): Promise<Record<string, Record<string, ModelInfo>>> {
	const url = `${getEnki AIEnvironmentConfig().apiBaseUrl}/api/v1/ai/enki/recommended-models`;
	const response = await fetcher(url);
	if (!response.ok) {
		throw new Error(
			`Failed to load Enki AI recommended models from ${url}: HTTP ${response.status}`,
		);
	}

	const payload = (await response.json()) as Enki AIRecommendedModelsPayload;
	return normalizeEnki AIRecommendedProviderModels(payload, openRouterModels);
}
