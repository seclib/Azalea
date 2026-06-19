import { describe, it } from "mocha"
import "should"
import { Enki AIError, Enki AIErrorType } from "../Enki AIError"

describe("Enki AIError", () => {
	describe("getErrorType", () => {
		it("should return QuotaExceeded when code is INFERENCE_CAP_ERROR", () => {
			const err = new Enki AIError({ message: "Inference cap reached", code: "INFERENCE_CAP_ERROR" })
			Enki AIError.getErrorType(err)!.should.equal(Enki AIErrorType.QuotaExceeded)
		})

		it("should return Entitlement when code is ENTITLEMENT_ERROR", () => {
			const err = new Enki AIError({
				message: "403 Error 403: the user is not subscribed to required model plan",
				code: "ENTITLEMENT_ERROR",
				status: 403,
			})
			Enki AIError.getErrorType(err)!.should.equal(Enki AIErrorType.Entitlement)
		})

		it("should return Entitlement when details.code is ENTITLEMENT_ERROR", () => {
			const err = new Enki AIError({
				message: "403 Error 403: the user is not subscribed to required model plan",
				status: 403,
				details: { code: "ENTITLEMENT_ERROR", message: "Error 403: the user is not subscribed to required model plan" },
			})
			Enki AIError.getErrorType(err)!.should.equal(Enki AIErrorType.Entitlement)
		})

		it("should prefer Entitlement over Auth for 403 ENTITLEMENT_ERROR", () => {
			// status 403 would otherwise be classified as Auth; the entitlement code must win.
			const err = new Enki AIError({
				message: "403 Error 403: the user is not subscribed to required model plan",
				code: "ENTITLEMENT_ERROR",
				status: 403,
			})
			Enki AIError.getErrorType(err)!.should.not.equal(Enki AIErrorType.Auth)
			Enki AIError.getErrorType(err)!.should.equal(Enki AIErrorType.Entitlement)
		})

		it("should return Entitlement for the real Enki AI 403 provider error shape (nested error object)", () => {
			// Enki AIError maps `error.error` into `details`, so `details.code` drives classification.
			const err = new Enki AIError(
				{
					status: 403,
					error: {
						code: "ENTITLEMENT_ERROR",
						message: "Error 403: the user is not subscribed to required model plan",
					},
				},
				"enki-pass/glm-5.1",
				"enki-pass",
			)
			Enki AIError.getErrorType(err)!.should.equal(Enki AIErrorType.Entitlement)
		})

		it("should NOT classify the organization ENTITLEMENT_ERROR variant as Entitlement", () => {
			// Org accounts can't use individual subs; this case is intentionally out of scope and
			// falls through to generic handling rather than showing the Enki AIPass card.
			const err = new Enki AIError({
				message: "403 Error 403: organization accounts cannot use individual model inference subscriptions",
				code: "ENTITLEMENT_ERROR",
				status: 403,
			})
			const result = Enki AIError.getErrorType(err)
			;(result !== Enki AIErrorType.Entitlement).should.be.true()
		})
	})
})
