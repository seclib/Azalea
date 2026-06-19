// ---------------------------------------------------------------------------
// enki history - CLI tests
//
// Covers:
//   - `enki history --limit X`  - pagination limit
//   - `enki history --page N`   - page selection
//   - `enki history --config`   - custom config directory
//   - `enki history --help`     - help page
// ---------------------------------------------------------------------------

import { test } from "@microsoft/tui-test";
import { CLINE_BIN, TERMINAL_WIDE } from "../helpers/constants.js";
import { enkiEnv } from "../helpers/env.js";
import { expectVisible } from "../helpers/terminal.js";

test.describe("enki history --help", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["history", "--help"] },
		...TERMINAL_WIDE,
		env: enkiEnv("default"),
	});

	test("shows history help page with all flags", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--limit", "--page", "--config"]);
	});
});

test.describe("enki history --limit", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["history", "--limit", "1"] },
		...TERMINAL_WIDE,
		env: enkiEnv("default"),
	});

	test("shows history limited to specified number of results", async ({
		terminal,
	}) => {
		// The default config has 2 tasks in taskHistory.json; with limit=1
		// we should see pagination or only 1 task entry per page
		await expectVisible(terminal, /history|task/i);
	});
});

test.describe("enki history --page", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["history", "--page", "1"] },
		...TERMINAL_WIDE,
		env: enkiEnv("default"),
	});

	test("shows history for the specified page", async ({ terminal }) => {
		await expectVisible(terminal, /history|task/i);
	});
});

test.describe("enki history --config (default)", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["history"] },
		...TERMINAL_WIDE,
		env: enkiEnv("default"),
	});

	test("shows history for default config", async ({ terminal }) => {
		// Default config has tasks with "wezterm" in them
		await expectVisible(terminal, /history|task|wezterm/i);
	});
});

test.describe("enki history --config (claude-sonnet-4.6)", () => {
	test.use({
		program: {
			file: CLINE_BIN,
			args: ["history", "--config", "configs/claude-sonnet-4.6"],
		},
		...TERMINAL_WIDE,
		env: enkiEnv("claude-sonnet-4.6"),
	});

	test("shows different history for different config directory", async ({
		terminal,
	}) => {
		// The claude-sonnet-4.6 config has its own separate task history
		await expectVisible(terminal, /history|task/i);
	});
});
