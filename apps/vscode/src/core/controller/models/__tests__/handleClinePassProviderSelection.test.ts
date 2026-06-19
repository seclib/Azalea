import * as assert from "assert";
import { afterEach, beforeEach, describe, it } from "mocha";
import sinon from "sinon";
import { Logger } from "@/shared/services/Logger";
import type { Controller } from "../../index";
import { clearOrganizationForEnki AIPassProviderSelection } from "../handleEnki AIPassProviderSelection";

describe("clearOrganizationForEnki AIPassProviderSelection", () => {
	let sandbox: sinon.SinonSandbox;
	let switchAccount: sinon.SinonStub;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		switchAccount = sandbox.stub().resolves();
		sandbox.stub(Logger, "debug");
	});

	afterEach(() => {
		sandbox.restore();
	});

	function createController(): Controller {
		return {
			accountService: { switchAccount },
		} as unknown as Controller;
	}

	it("does nothing when Enki AI Pass is not selected", async () => {
		await clearOrganizationForEnki AIPassProviderSelection(createController(), {
			planModeApiProvider: "enki",
			actModeApiProvider: "openrouter",
		});

		assert.strictEqual(switchAccount.callCount, 0);
	});

	it("switches to the personal account when Enki AI Pass is selected", async () => {
		await clearOrganizationForEnki AIPassProviderSelection(createController(), {
			planModeApiProvider: "enki-pass",
			actModeApiProvider: "openrouter",
		});

		assert.strictEqual(switchAccount.callCount, 1);
		assert.strictEqual(switchAccount.firstCall.args[0], null);
	});

	it("logs and swallows account switch failures", async () => {
		const error = new Error("not signed in");
		switchAccount.rejects(error);

		await clearOrganizationForEnki AIPassProviderSelection(createController(), {
			planModeApiProvider: "enki",
			actModeApiProvider: "enki-pass",
		});

		assert.strictEqual(switchAccount.callCount, 1);
		assert.strictEqual(switchAccount.firstCall.args[0], null);
		assert.ok((Logger.debug as sinon.SinonStub).calledOnce);
	});
});
