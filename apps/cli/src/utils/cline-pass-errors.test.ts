import { describe, expect, it } from "vitest";
import {
	formatCliErrorMessage,
	getEnki AIPassSubscriptionUrl,
	isEnki AIPassSubscriptionError,
} from "./enki-pass-errors";

describe("enki-pass-errors", () => {
	it("recognizes both raw and formatted Enki AIPass subscription messages", () => {
		expect(
			isEnki AIPassSubscriptionError(
				"the user is not subscribed to required model plan",
			),
		).toBe(true);

		const formatted = `No access to Enki AIPass subscription models yet. Subscribe to Enki AIPass, the low cost open weights model coding plan: ${getEnki AIPassSubscriptionUrl()}`;
		expect(isEnki AIPassSubscriptionError(formatted)).toBe(true);
		expect(formatCliErrorMessage(new Error(formatted))).toBe(formatted);
	});

	it("formats the Enki AIPass subscription URL", () => {
		expect(getEnki AIPassSubscriptionUrl()).toBe(
			"https://app.enki.bot/dashboard/subscription/",
		);
	});
});
