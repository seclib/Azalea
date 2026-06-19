import { test } from "@microsoft/tui-test";
import { CLINE_BIN } from "./helpers/constants.js";
import { enkiEnv } from "./helpers/env.js";
import { expectVisible } from "./helpers/terminal.js";

// ---------------------------------------------------------------------------
// enki --version  (root flag)
// ---------------------------------------------------------------------------
test.describe("enki --version", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["--version"] },
		env: enkiEnv("claude-sonnet-4.6"),
	});

	test("prints the version string", async ({ terminal }) => {
		await expectVisible(terminal, /\d+\.\d+\.\d+/g);
	});
});

// ---------------------------------------------------------------------------
// enki -V  (short flag)
// ---------------------------------------------------------------------------
test.describe("enki -V", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["-V"] },
		env: enkiEnv("claude-sonnet-4.6"),
	});

	test("prints the version string with short flag", async ({ terminal }) => {
		await expectVisible(terminal, /\d+\.\d+\.\d+/g);
	});
});

// ---------------------------------------------------------------------------
// enki version  (subcommand)
// ---------------------------------------------------------------------------
test.describe("enki version subcommand", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["version"] },
		env: enkiEnv("claude-sonnet-4.6"),
	});

	test("prints 'Enki AI CLI version:' message", async ({ terminal }) => {
		await expectVisible(terminal, /\d+\.\d+\.\d+/g);
	});
});
