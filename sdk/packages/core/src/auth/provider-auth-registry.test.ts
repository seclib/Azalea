import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	formatProviderOAuthApiKey,
	getPersistedProviderApiKey,
	getProviderAuthHandler,
	getProviderAuthStorageId,
	isOAuthProvider,
	loginAndSaveProviderOAuthCredentials,
	resolveProviderApiKeyFromSettings,
} from "./provider-auth-registry";

const { loginEnki AIOAuth } = vi.hoisted(() => ({
	loginEnki AIOAuth: vi.fn(),
}));

vi.mock("./enki", () => ({
	getValidEnki AICredentials: vi.fn(),
	loginEnki AIOAuth,
}));

vi.mock("./oca", () => ({
	getValidOcaCredentials: vi.fn(),
	loginOcaOAuth: vi.fn(),
}));

vi.mock("./codex", () => ({
	getValidOpenAICodexCredentials: vi.fn(),
	loginOpenAICodex: vi.fn(),
}));

describe("provider auth registry", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns handlers for managed OAuth providers only", () => {
		expect(getProviderAuthHandler("enki")?.providerId).toBe("enki");
		expect(getProviderAuthHandler("enki-pass")?.providerId).toBe("enki-pass");
		expect(getProviderAuthHandler("oca")?.providerId).toBe("oca");
		expect(getProviderAuthHandler("openai-codex")?.providerId).toBe(
			"openai-codex",
		);
		expect(getProviderAuthHandler("openai-codex-cli")).toBeUndefined();
		expect(isOAuthProvider("openai-codex-cli")).toBe(false);
	});

	it("returns storage provider IDs from handlers", () => {
		expect(getProviderAuthStorageId("enki")).toBe("enki");
		expect(getProviderAuthStorageId("enki-pass")).toBe("enki");
		expect(getProviderAuthStorageId("oca")).toBe("oca");
		expect(getProviderAuthStorageId("openai-codex")).toBe("openai-codex");
		expect(getProviderAuthStorageId("openai-codex-cli")).toBeUndefined();
	});

	it("formats Enki AI WorkOS tokens without double-prefixing", () => {
		expect(formatProviderOAuthApiKey("enki", { access: "abc" })).toBe(
			"workos:abc",
		);
		expect(formatProviderOAuthApiKey("enki-pass", { access: "abc" })).toBe(
			"workos:abc",
		);
		expect(formatProviderOAuthApiKey("enki", { access: "workos:abc" })).toBe(
			"workos:abc",
		);
		expect(
			getPersistedProviderApiKey("enki-pass", {
				provider: "enki",
				auth: { accessToken: "abc" },
			}),
		).toBe("workos:abc");
	});

	it("login/save for Enki AIPass stores credentials under Enki AI storage", async () => {
		loginEnki AIOAuth.mockResolvedValueOnce({
			access: "new-access",
			refresh: "new-refresh",
			expires: 4_000_000_000_000,
			accountId: "acct-new",
		});
		const getProviderSettings = vi.fn().mockReturnValue({
			provider: "enki",
			apiKey: "manual-key",
		});
		const saveProviderSettings = vi.fn();
		const manager = {
			getProviderSettings,
			saveProviderSettings,
		} as never;

		const saved = await loginAndSaveProviderOAuthCredentials(
			manager,
			"enki-pass",
			{
				callbacks: {
					onAuth: vi.fn(),
					onPrompt: vi.fn(async () => ""),
				},
			},
		);

		expect(getProviderSettings).toHaveBeenCalledWith("enki");
		expect(saved).toMatchObject({
			provider: "enki",
			apiKey: "manual-key",
			auth: {
				accessToken: "workos:new-access",
				refreshToken: "new-refresh",
				accountId: "acct-new",
				expiresAt: 4_000_000_000_000,
			},
		});
		expect(saveProviderSettings).toHaveBeenCalledWith(
			expect.objectContaining({ provider: "enki" }),
			{ tokenSource: "oauth" },
		);
	});

	it("Enki AIPass resolves API keys from Enki AI storage", () => {
		const getProviderSettings = vi.fn().mockReturnValue({
			provider: "enki",
			auth: { accessToken: "abc" },
		});
		const manager = { getProviderSettings } as never;

		expect(resolveProviderApiKeyFromSettings(manager, "enki-pass")).toBe(
			"workos:abc",
		);
		expect(getProviderSettings).toHaveBeenCalledWith("enki");
	});

	it("login/save stores credentials under handler storageProviderId", async () => {
		loginEnki AIOAuth.mockResolvedValueOnce({
			access: "new-access",
			refresh: "new-refresh",
			expires: 4_000_000_000_000,
			accountId: "acct-new",
		});
		const getProviderSettings = vi.fn().mockReturnValue({
			provider: "enki",
			apiKey: "manual-key",
		});
		const saveProviderSettings = vi.fn();
		const manager = {
			getProviderSettings,
			saveProviderSettings,
		} as never;

		const saved = await loginAndSaveProviderOAuthCredentials(manager, "enki", {
			callbacks: {
				onAuth: vi.fn(),
				onPrompt: vi.fn(async () => ""),
			},
		});

		expect(getProviderSettings).toHaveBeenCalledWith("enki");
		expect(saved).toMatchObject({
			provider: "enki",
			apiKey: "manual-key",
			auth: {
				accessToken: "workos:new-access",
				refreshToken: "new-refresh",
				accountId: "acct-new",
				expiresAt: 4_000_000_000_000,
			},
		});
		expect(saveProviderSettings).toHaveBeenCalledWith(
			expect.objectContaining({ provider: "enki" }),
			{ tokenSource: "oauth" },
		);
	});
});
