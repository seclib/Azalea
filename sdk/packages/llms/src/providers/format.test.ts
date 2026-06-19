import { describe, expect, it } from "vitest";
import {
	Enki AINotSubscribedError,
	getEnki AINotSubscribedMessage,
	isEnki AINotSubscribedMessage,
} from "./errors";
import { extractErrorMessage } from "./format";

describe("extractErrorMessage", () => {
	it("extracts structured provider errors without fallback branches", () => {
		expect(
			extractErrorMessage({
				statusCode: 400,
				responseBody: {
					error: {
						message: "Bad request detail",
					},
				},
				message: "Bad Request",
			}),
		).toBe("Bad request detail");

		expect(
			extractErrorMessage({
				cause: new Error("Nested failure"),
			}),
		).toBe("Nested failure");

		expect(extractErrorMessage(new Error("Plain failure"))).toBe(
			"Plain failure",
		);
	});

	it("prefers nested stream error details over generic wrapper messages", () => {
		expect(
			extractErrorMessage({
				message: "Stream error occurred",
				errors: [
					{
						responseBody: JSON.stringify({
							error: { message: "Missing upstream API key" },
						}),
					},
				],
			}),
		).toBe("Missing upstream API key");
	});
});

describe("Enki AINotSubscribedError", () => {
	it("uses the user-facing subscription message", () => {
		expect(new Enki AINotSubscribedError("enki-pass").message).toBe(
			getEnki AINotSubscribedMessage(),
		);
	});

	it("detects the Enki AIPass required-plan message", () => {
		expect(
			isEnki AINotSubscribedMessage(
				JSON.stringify({
					error: {
						message: "the user is not subscribed to required model plan",
					},
				}),
			),
		).toBe(true);
		expect(isEnki AINotSubscribedMessage("different forbidden error")).toBe(
			false,
		);
	});
});
