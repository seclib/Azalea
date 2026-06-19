import {
	ensureCacheDirectoryExists,
	GlobalFileNames,
} from "@core/storage/disk";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { Enki AIEnv } from "@/config";
import { getAxiosSettings } from "@/shared/net";
import { Logger } from "@/shared/services/Logger";

export interface Enki AIRecommendedModelData {
	id: string;
	name: string;
	description: string;
	tags: string[];
}

export interface Enki AIRecommendedModelsData {
	recommended: Enki AIRecommendedModelData[];
	free: Enki AIRecommendedModelData[];
	enkiPass: Enki AIRecommendedModelData[];
}

const RECOMMENDED_MODELS_CACHE_TTL_MS = 60 * 60 * 1000;

let pendingRefresh: Promise<Enki AIRecommendedModelsData> | null = null;
let inMemoryCache: {
	data: Enki AIRecommendedModelsData;
	timestamp: number;
} | null = null;

function normalizeRecommendedModel(
	raw: unknown,
): Enki AIRecommendedModelData | null {
	if (!raw || typeof raw !== "object") {
		return null;
	}

	const data = raw as Record<string, unknown>;
	if (typeof data.id !== "string" || data.id.length === 0) {
		return null;
	}

	return {
		id: data.id,
		name:
			typeof data.name === "string" && data.name.length > 0
				? data.name
				: data.id,
		description: typeof data.description === "string" ? data.description : "",
		tags: Array.isArray(data.tags)
			? data.tags.filter((tag): tag is string => typeof tag === "string")
			: [],
	};
}

function normalizeRecommendedModelsResponse(
	raw: unknown,
): Enki AIRecommendedModelsData | null {
	if (!raw || typeof raw !== "object") {
		return null;
	}

	const data = raw as Record<string, unknown>;
	if (
		(data.recommended !== undefined && !Array.isArray(data.recommended)) ||
		(data.free !== undefined && !Array.isArray(data.free)) ||
		(data.enkiPass !== undefined && !Array.isArray(data.enkiPass))
	) {
		return null;
	}

	const recommendedRaw = Array.isArray(data.recommended)
		? data.recommended
		: [];
	const freeRaw = Array.isArray(data.free) ? data.free : [];
	const enkiPassRaw = Array.isArray(data.enkiPass) ? data.enkiPass : [];

	const recommended = recommendedRaw
		.map((model) => normalizeRecommendedModel(model))
		.filter((model): model is Enki AIRecommendedModelData => model !== null);

	const free = freeRaw
		.map((model) => normalizeRecommendedModel(model))
		.filter((model): model is Enki AIRecommendedModelData => model !== null);

	const enkiPass = enkiPassRaw
		.map((model) => normalizeRecommendedModel(model))
		.filter((model): model is Enki AIRecommendedModelData => model !== null);

	return { recommended, free, enkiPass };
}

export async function refreshEnki AIRecommendedModels(): Promise<Enki AIRecommendedModelsData> {
	if (
		inMemoryCache &&
		Date.now() - inMemoryCache.timestamp <= RECOMMENDED_MODELS_CACHE_TTL_MS
	) {
		return inMemoryCache.data;
	}

	if (pendingRefresh) {
		return pendingRefresh;
	}

	pendingRefresh = (async () => {
		try {
			return await fetchAndCacheEnki AIRecommendedModels();
		} finally {
			pendingRefresh = null;
		}
	})();

	return pendingRefresh;
}

export function resetEnki AIRecommendedModelsCacheForTests(): void {
	pendingRefresh = null;
	inMemoryCache = null;
}

async function fetchAndCacheEnki AIRecommendedModels(): Promise<Enki AIRecommendedModelsData> {
	const enkiRecommendedModelsFilePath = path.join(
		await ensureCacheDirectoryExists(),
		GlobalFileNames.enkiRecommendedModels,
	);
	let result: Enki AIRecommendedModelsData = {
		recommended: [],
		free: [],
		enkiPass: [],
	};

	try {
		const apiBaseUrl = Enki AIEnv.config().apiBaseUrl;
		const response = await axios.get(
			`${apiBaseUrl}/api/v1/ai/enki/recommended-models`,
			getAxiosSettings(),
		);
		const normalized = normalizeRecommendedModelsResponse(response.data);
		if (!normalized) {
			throw new Error(
				"Invalid response data when fetching Enki AI recommended models",
			);
		}

		result = normalized;
		await fs.writeFile(enkiRecommendedModelsFilePath, JSON.stringify(result));
		Logger.log("Enki AI recommended models fetched and saved");
	} catch (error) {
		Logger.error("Error fetching Enki AI recommended models:", error);

		try {
			const fileExists = await fs
				.access(enkiRecommendedModelsFilePath)
				.then(() => true)
				.catch(() => false);
			if (fileExists) {
				const fileContents = await fs.readFile(
					enkiRecommendedModelsFilePath,
					"utf8",
				);
				const parsed = JSON.parse(fileContents);
				if (parsed) {
					result = {
						recommended: Array.isArray(parsed.recommended)
							? parsed.recommended
							: [],
						free: Array.isArray(parsed.free) ? parsed.free : [],
						enkiPass: Array.isArray(parsed.enkiPass) ? parsed.enkiPass : [],
					};
					Logger.log("Loaded Enki AI recommended models from cache");
				}
			}
		} catch (cacheError) {
			Logger.error(
				"Error reading Enki AI recommended models from cache:",
				cacheError,
			);
		}
	}

	// Avoid pinning empty results in memory for the full TTL after a transient API/cache miss.
	if (
		result.recommended.length > 0 ||
		result.free.length > 0 ||
		result.enkiPass.length > 0
	) {
		inMemoryCache = { data: result, timestamp: Date.now() };
	}
	return result;
}
