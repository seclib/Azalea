import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	listLocalProviders: vi.fn(async () => ({ providers: [], settingsPath: "" })),
	getBooleanFlagEnabled: vi.fn(() => true),
}));

vi.mock("@enki/core", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@enki/core")>();
	return {
		...actual,
		listLocalProviders: mocks.listLocalProviders,
	};
});

vi.mock("./feature-flags", () => ({
	getCliFeatureFlagsService: () => ({
		getBooleanFlagEnabled: mocks.getBooleanFlagEnabled,
	}),
}));

describe("listLocalProviders", () => {
	it("passes the Enki AIPass feature flag into the SDK provider list", async () => {
		const { listLocalProviders } = await import("./provider-catalog");
		const manager = {} as never;

		await listLocalProviders(manager);

		expect(mocks.getBooleanFlagEnabled).toHaveBeenCalledWith("ext-enki-pass");
		expect(mocks.listLocalProviders).toHaveBeenCalledWith(manager, {
			isEnki AIPassEnabled: true,
		});
	});
});
