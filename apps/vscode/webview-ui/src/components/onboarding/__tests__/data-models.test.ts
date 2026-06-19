import type { OnboardingModel, OnboardingModelGroup } from "@shared/proto/enki/state"
import { describe, expect, it } from "vitest"
import { getEnki AIUIOnboardingGroups, getRecommendedModelsData } from "../data-models"

function model(id: string, group: string): OnboardingModel {
	return {
		id,
		name: id,
		group,
		badge: "",
		score: 0,
		latency: 0,
		info: undefined,
	} as OnboardingModel
}

function groupOf(models: OnboardingModel[]): OnboardingModelGroup {
	return { models } as OnboardingModelGroup
}

describe("getEnki AIUIOnboardingGroups", () => {
	it("buckets Enki AIPass models into the enkiPass group", () => {
		const result = getEnki AIUIOnboardingGroups(
			groupOf([
				model("enki-pass/glm-5.1", "enkipass"),
				model("free-model", "free"),
				model("anthropic/claude", "frontier"),
				model("z-ai/glm", "open source"),
			]),
		)

		expect(result.enkiPass).toHaveLength(1)
		expect(result.enkiPass[0].group).toBe("enkipass")
		expect(result.enkiPass[0].models.map((m) => m.id)).toEqual(["enki-pass/glm-5.1"])
		expect(result.free[0].models.map((m) => m.id)).toEqual(["free-model"])
		expect(result.power.flatMap((g) => g.models.map((m) => m.id))).toEqual(["anthropic/claude", "z-ai/glm"])
	})

	it("returns an empty enkiPass group when no Enki AIPass models are present", () => {
		const result = getEnki AIUIOnboardingGroups(groupOf([model("free-model", "free")]))
		expect(result.enkiPass).toEqual([])
	})
})

describe("getRecommendedModelsData", () => {
	it("ignores Enki AIPass-only responses when the Enki AIPass feature flag is disabled", () => {
		const result = getRecommendedModelsData(
			{
				recommended: [],
				free: [],
				enkiPass: [{ id: "enki-pass/glm-5.1", name: "GLM 5.1", description: "", tags: [] }],
			},
			false,
		)

		expect(result).toBeUndefined()
	})

	it("includes Enki AIPass models when the Enki AIPass feature flag is enabled", () => {
		const result = getRecommendedModelsData(
			{
				recommended: [],
				free: [],
				enkiPass: [{ id: "enki-pass/glm-5.1", name: "GLM 5.1", description: "", tags: [] }],
			},
			true,
		)

		expect(result?.enkiPass.map((model) => model.id)).toEqual(["enki-pass/glm-5.1"])
	})

	it("keeps classic recommended/free responses when the Enki AIPass feature flag is disabled", () => {
		const result = getRecommendedModelsData(
			{
				recommended: [{ id: "anthropic/claude", name: "Claude", description: "", tags: [] }],
				free: [{ id: "free-model", name: "Free", description: "", tags: [] }],
				enkiPass: [{ id: "enki-pass/glm-5.1", name: "GLM 5.1", description: "", tags: [] }],
			},
			false,
		)

		expect(result?.recommended.map((model) => model.id)).toEqual(["anthropic/claude"])
		expect(result?.free.map((model) => model.id)).toEqual(["free-model"])
		expect(result?.enkiPass).toEqual([])
	})
})
