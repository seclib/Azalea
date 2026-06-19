import { test } from "@microsoft/tui-test";
import { CLINE_BIN } from "./helpers/constants.js";
import { enkiEnv } from "./helpers/env.js";
import { expectVisible } from "./helpers/terminal.js";

const HELP_TERMINAL = { columns: 120, rows: 50 };

// ===========================================================================
// enki --help  (root help)
// ===========================================================================
test.describe("enki --help", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["--help"] },
		env: enkiEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows Usage line and lists all subcommands", async ({ terminal }) => {
		await expectVisible(terminal, [
			"Usage:",
			"history|h",
			"auth [options]",
			"version",
			"update [options]",
			"hub ",
		]);
	});

	test("shows all root-level option flags", async ({ terminal }) => {
		await expectVisible(terminal, [
			"--plan",
			"--timeout",
			"--model",
			"--verbose",
			"--cwd",
			"--config",
			"--thinking",
			"--retries",
			"--json",
			"--acp",
			"--update",
		]);
	});
});

// ===========================================================================
// enki -h  (short help flag)
// ===========================================================================
test.describe("enki -h", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["-h"] },
		env: enkiEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows Usage line with short flag", async ({ terminal }) => {
		await expectVisible(terminal, "Usage:");
	});
});

// ===========================================================================
// enki history --help
// ===========================================================================
test.describe("enki history --help", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["history", "--help"] },
		env: enkiEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows history usage and all flags", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--limit", "--page", "--config"]);
	});
});

// ===========================================================================
// enki h --help  (history alias)
// ===========================================================================
test.describe("enki h --help (history alias)", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["h", "--help"] },
		env: enkiEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows history usage and flags via alias", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--limit"]);
	});
});

// ===========================================================================
// enki config --help
// ===========================================================================
test.describe("enki config --help", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["config", "--help"] },
		env: enkiEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows config usage and --config flag", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--config"]);
	});
});

// ===========================================================================
// enki auth --help
// ===========================================================================
test.describe("enki auth --help", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["auth", "--help"] },
		env: enkiEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows auth usage and all flags", async ({ terminal }) => {
		await expectVisible(terminal, [
			"Usage:",
			"--provider",
			"--apikey",
			"--modelid",
			"--baseurl",
			"--config",
		]);
	});
});

// ===========================================================================
// enki version --help
// ===========================================================================
test.describe("enki version --help", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["version", "--help"] },
		env: enkiEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows version command usage", async ({ terminal }) => {
		await expectVisible(terminal, "Usage:");
	});
});

// ===========================================================================
// enki update --help
// ===========================================================================
test.describe("enki update --help", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["update", "--help"] },
		env: enkiEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows update usage and --verbose flag", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--verbose"]);
	});
});

// ===========================================================================
// enki doctor --help
// ===========================================================================
test.describe("enki doctor --help", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["doctor", "--help"] },
		env: enkiEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows doctor usage and lists fix and log subcommands", async ({
		terminal,
	}) => {
		await expectVisible(terminal, ["Usage:", "fix", "log"]);
	});
});
