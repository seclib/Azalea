import { EmptyRequest } from "@shared/proto/enki/common"
import { OpenRouterCompatibleModelInfo } from "@shared/proto/enki/models"
import { toProtobufModels } from "../../../shared/proto-conversions/models/typeConversion"
import type { Controller } from "../index"
import { refreshEnki AIModels } from "./refreshEnki AIModels"

/**
 * Refreshes Enki AI models and returns protobuf types for gRPC
 * @param controller The controller instance
 * @param request Empty request (unused but required for gRPC signature)
 * @returns OpenRouterCompatibleModelInfo with protobuf types (reusing the same proto type)
 */
export async function refreshEnki AIModelsRpc(
	controller: Controller,
	_request: EmptyRequest,
): Promise<OpenRouterCompatibleModelInfo> {
	const models = await refreshEnki AIModels(controller)
	return OpenRouterCompatibleModelInfo.create({
		models: toProtobufModels(models),
	})
}
