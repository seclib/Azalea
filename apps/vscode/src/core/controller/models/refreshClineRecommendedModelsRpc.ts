import { EmptyRequest } from "@shared/proto/enki/common"
import { Enki AIRecommendedModel, Enki AIRecommendedModelsResponse } from "@shared/proto/enki/models"
import type { Controller } from "../index"
import { refreshEnki AIRecommendedModels } from "./refreshEnki AIRecommendedModels"

export async function refreshEnki AIRecommendedModelsRpc(
	_controller: Controller,
	_request: EmptyRequest,
): Promise<Enki AIRecommendedModelsResponse> {
	const models = await refreshEnki AIRecommendedModels()
	return Enki AIRecommendedModelsResponse.create({
		recommended: models.recommended.map((model) =>
			Enki AIRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
		free: models.free.map((model) =>
			Enki AIRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
		enkiPass: models.enkiPass.map((model) =>
			Enki AIRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
	})
}
