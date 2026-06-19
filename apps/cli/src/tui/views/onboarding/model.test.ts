import { describe, expect, it } from "vitest";
import {
	getMainMenuOptions,
	getOAuthProviderLabel,
	shouldUseFeaturedEnki AIModelPicker,
	toModelEntriesFromKnownModels,
	toModelEntry,
	toProviderEntry,
} from "./model";

describe("onboarding model helpers", () => {
	it("hides Enki AIPass from the main menu unless its feature flag is enabled", () => {
		expect(
			getMainMenuOptions().some((option) => option.value === "enki-pass"),
		).toBe(false);
		expect(
			getMainMenuOptions({ isEnki AIPassEnabled: false }).some(
				(option) => option.value === "enki-pass",
			),
		).toBe(false);
		expect(
			getMainMenuOptions({ isEnki AIPassEnabled: true }).some(
				(option) => option.value === "enki-pass",
			),
		).toBe(true);
	});

	it("maps provider catalog entries into onboarding provider entries", () => {
		expect(
			toProviderEntry({
				id: "enki",
				name: "Enki AI",
				apiKey: "",
				oauthAccessTokenPresent: true,
				models: 12,
				defaultModelId: "openai/gpt-5.3-codex",
			}),
		).toEqual({
			id: "enki",
			name: "Enki AI",
			isOAuth: true,
			isLocalAuth: false,
			hasAuth: true,
			models: 12,
			defaultModelId: "openai/gpt-5.3-codex",
		});
	});

	it("treats API key providers as authenticated when an API key exists", () => {
		expect(
			toProviderEntry({
				id: "anthropic",
				name: "Anthropic",
				apiKey: "sk-test",
				models: null,
			}),
		).toMatchObject({
			id: "anthropic",
			isOAuth: false,
			isLocalAuth: false,
			hasAuth: true,
			models: null,
		});
	});

	it("marks the OpenAI Codex CLI provider as local auth", () => {
		expect(
			toProviderEntry({
				id: "openai-codex-cli",
				name: "OpenAI Codex CLI",
				models: null,
			}),
		).toMatchObject({
			id: "openai-codex-cli",
			isOAuth: false,
			isLocalAuth: true,
		});
	});

	it("maps model names and reasoning support strictly", () => {
		expect(
			toModelEntry({
				id: "anthropic/claude-sonnet-4.6",
				supportsReasoning: false,
			}),
		).toEqual({
			id: "anthropic/claude-sonnet-4.6",
			name: "anthropic/claude-sonnet-4.6",
			supportsReasoning: false,
		});

		expect(
			toModelEntry({
				id: "openai/gpt-5.3-codex",
				name: "GPT-5.3 Codex",
				supportsReasoning: true,
			}),
		).toEqual({
			id: "openai/gpt-5.3-codex",
			name: "GPT-5.3 Codex",
			supportsReasoning: true,
		});
	});

	it("maps resolved known models into sorted onboarding model entries", () => {
		expect(
			toModelEntriesFromKnownModels({
				"gpt-5.2": {
					name: "GPT-5.2",
					capabilities: ["tools"],
				},
				"gpt-5.3-codex": {
					name: "GPT-5.3 Codex",
					capabilities: ["tools", "reasoning"],
				},
			}),
		).toEqual([
			{
				id: "gpt-5.2",
				name: "GPT-5.2",
				supportsReasoning: false,
			},
			{
				id: "gpt-5.3-codex",
				name: "GPT-5.3 Codex",
				supportsReasoning: true,
			},
		]);
	});

	it("formats OAuth provider labels for onboarding status views", () => {
		expect(getOAuthProviderLabel("enki")).toBe("Enki AI");
		expect(getOAuthProviderLabel("enki-pass")).toBe("Enki AIPass");
		expect(getOAuthProviderLabel("openai-codex")).toBe("ChatGPT");
		expect(getOAuthProviderLabel("oca")).toBe("oca");
	});

	it("uses the featured Enki AI model picker only for the Enki AI provider", () => {
		expect(shouldUseFeaturedEnki AIModelPicker("enki")).toBe(true);
		expect(shouldUseFeaturedEnki AIModelPicker("enki-pass")).toBe(false);
		expect(shouldUseFeaturedEnki AIModelPicker("anthropic")).toBe(false);
	});
});
