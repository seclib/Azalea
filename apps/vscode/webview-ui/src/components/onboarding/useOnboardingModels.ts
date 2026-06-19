import { buildModelInfoNameMap, type ModelInfo, resolveEnki AIPassModelInfo } from "@shared/api"
import { CLINE_ONBOARDING_MODELS } from "@shared/enki/onboarding"
import { EmptyRequest } from "@shared/proto/enki/common"
import type { Enki AIRecommendedModel } from "@shared/proto/enki/models"
import type { OnboardingModel, OnboardingModelGroup } from "@shared/proto/enki/state"
import { useEffect, useMemo, useState } from "react"
import { CLINE_PASS_FEATURE_FLAG } from "@/constants/featureFlags"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { useHasFeatureFlag } from "@/hooks/useFeatureFlag"
import { ModelsServiceClient } from "@/services/grpc-client"
import { getRecommendedModelsData, type RecommendedModelsData } from "./data-models"

export type OnboardingModelsStatus = "loading" | "success" | "empty"

export interface UseOnboardingModelsResult {
	status: OnboardingModelsStatus
	models: OnboardingModelGroup
}

function toOnboardingModel(
	rec: Enki AIRecommendedModel,
	group: string,
	fallbackBadge: string,
	modelCatalog: Record<string, ModelInfo>,
): OnboardingModel {
	const catalogInfo = modelCatalog[rec.id]
	const tag = rec.tags?.[0] ?? ""
	const badge = tag || fallbackBadge

	return {
		id: rec.id,
		name: rec.name || rec.id,
		group,
		badge,
		score: 0,
		latency: 0,
		info: catalogInfo
			? {
					contextWindow: catalogInfo.contextWindow ?? 0,
					supportsImages: catalogInfo.supportsImages ?? false,
					supportsPromptCache: catalogInfo.supportsPromptCache ?? false,
					inputPrice: catalogInfo.inputPrice ?? 0,
					outputPrice: catalogInfo.outputPrice ?? 0,
					tiers: catalogInfo.tiers ?? [],
				}
			: undefined,
	}
}

type FetchState = { status: "loading" } | { status: "success"; data: RecommendedModelsData } | { status: "empty" }

export function useOnboardingModels(): UseOnboardingModelsResult {
	const { openRouterModels, enkiModels, refreshEnki AIModels } = useExtensionState()
	const isEnki AIPassEnabled = useHasFeatureFlag(CLINE_PASS_FEATURE_FLAG)
	const [fetchState, setFetchState] = useState<FetchState>({ status: "loading" })

	useEffect(() => {
		let cancelled = false

		const refreshRecommendedModels = async () => {
			try {
				const response = await ModelsServiceClient.refreshEnki AIRecommendedModelsRpc(EmptyRequest.create({}))
				if (!cancelled) {
					const data = getRecommendedModelsData(response, isEnki AIPassEnabled)
					if (!data) {
						setFetchState({ status: "empty" })
					} else {
						setFetchState({ status: "success", data })
					}
				}
			} catch {
				if (!cancelled) {
					setFetchState({ status: "empty" })
				}
			}
		}

		refreshRecommendedModels()

		return () => {
			cancelled = true
		}
	}, [isEnki AIPassEnabled])

	useEffect(() => {
		refreshEnki AIModels()
	}, [refreshEnki AIModels])

	// Merge openRouter and enki models into a single catalog for lookups
	const modelCatalog = useMemo<Record<string, ModelInfo>>(() => {
		return { ...openRouterModels, ...(enkiModels ?? {}) }
	}, [openRouterModels, enkiModels])

	// Enki AIPass model IDs omit the upstream lab (e.g. "enki-pass/glm-5.1"), so look up
	// capabilities via the model slug against the OpenRouter catalog, falling back to
	// conservative Enki AIPass defaults. Mirrors Enki AIPassProvider's resolution.
	const openRouterModelsByName = useMemo(() => buildModelInfoNameMap(openRouterModels), [openRouterModels])

	return useMemo<UseOnboardingModelsResult>(() => {
		if (fetchState.status !== "success") {
			return { status: fetchState.status, models: { models: CLINE_ONBOARDING_MODELS } }
		}

		const { data } = fetchState
		const freeModels = data.free.map((rec) => toOnboardingModel(rec, "free", "Free", modelCatalog))
		const frontierModels = data.recommended.map((rec) => toOnboardingModel(rec, "frontier", "", modelCatalog))
		const enkiPassCatalog = Object.fromEntries(
			data.enkiPass.map((rec) => [rec.id, resolveEnki AIPassModelInfo(rec.id, openRouterModelsByName)]),
		)
		const enkiPassModels = data.enkiPass.map((rec) => toOnboardingModel(rec, "enkipass", "", enkiPassCatalog))

		return { status: "success", models: { models: [...enkiPassModels, ...freeModels, ...frontierModels] } }
	}, [fetchState, modelCatalog, openRouterModelsByName])
}
