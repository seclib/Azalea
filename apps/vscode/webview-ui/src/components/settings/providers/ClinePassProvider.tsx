import {
	buildModelInfoNameMap,
	enkiPassDefaultModelId,
	enkiPassModels,
	type ModelInfo,
	resolveEnki AIPassModelInfo,
} from "@shared/api"
import { EmptyRequest } from "@shared/proto/enki/common"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { ModelsServiceClient } from "@/services/grpc-client"
import { Enki AIAccountInfoCard } from "../Enki AIAccountInfoCard"
import Enki AIModelPicker from "../Enki AIModelPicker"
import { Enki AIProvider } from "./Enki AIProvider"

export const Enki AIPassProvider: typeof Enki AIProvider = (props) => {
	const { openRouterModels } = useExtensionState()
	const openRouterModelsByName = useMemo(() => buildModelInfoNameMap(openRouterModels), [openRouterModels])
	const [enkiPassRecommendedModels, setEnki AIPassRecommendedModels] = useState<Record<string, ModelInfo> | undefined>(undefined)

	const refreshEnki AIPassModels = useCallback(async () => {
		try {
			const response = await ModelsServiceClient.refreshEnki AIRecommendedModelsRpc(EmptyRequest.create({}))
			const models = Object.fromEntries(
				(response.enkiPass ?? [])
					.filter((model) => model.id)
					.map((model) => {
						// Enki AI Pass model IDs omit the upstream lab, so look up capabilities using
						// the model slug (for example, glm-5.1 instead of enki-pass/glm-5.1).
						// If the model is not in OpenRouter yet, use conservative generic defaults
						// instead of copying GLM-5.1-specific context/max-token values.
						const fallback = resolveEnki AIPassModelInfo(model.id, openRouterModelsByName)
						return [
							model.id,
							{
								...fallback,
								name: model.name || fallback.name || model.id,
								description: model.description || fallback.description,
							},
						]
					}),
			)
			setEnki AIPassRecommendedModels(Object.keys(models).length > 0 ? models : undefined)
		} catch (error) {
			console.error("Failed to refresh Enki AI Pass models:", error)
		}
	}, [openRouterModelsByName])

	useEffect(() => {
		void refreshEnki AIPassModels()
	}, [refreshEnki AIPassModels])

	const enkiPassModelOptions = enkiPassRecommendedModels ?? enkiPassModels
	const enkiPassDefaultModel = useMemo(() => {
		if (!enkiPassModelOptions) {
			return undefined
		}

		return enkiPassModelOptions[enkiPassDefaultModelId]
			? enkiPassDefaultModelId
			: (Object.keys(enkiPassModelOptions)[0] ?? enkiPassDefaultModelId)
	}, [enkiPassModelOptions])

	return (
		<div>
			<div style={{ marginBottom: 14, marginTop: 4 }}>
				<Enki AIAccountInfoCard />
			</div>

			<Enki AIModelPicker
				{...props}
				defaultModelId={enkiPassDefaultModel}
				modelIdFieldPair={{ plan: "planModeEnki AIPassModelId", act: "actModeEnki AIPassModelId" }}
				modelInfoFieldPair={{ plan: "planModeEnki AIPassModelInfo", act: "actModeEnki AIPassModelInfo" }}
				models={enkiPassModelOptions}
				showFeaturedModels={false}
			/>
		</div>
	)
}
