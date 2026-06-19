// ---------------------------------------------------------------------------
// enki config - CLI tests
//
// Covers:
//   - `enki config --config <dir>` - shows config for specific directory
//   - `enki config --help`         - help page
// ---------------------------------------------------------------------------

import { test } from "@microsoft/tui-test";
import { CLINE_BIN, TERMINAL_WIDE } from "../helpers/constants.js";
import { enkiEnv } from "../helpers/env.js";
import { expectVisible } from "../helpers/terminal.js";

test.describe("enki config --help", () => {
	test.use({
		program: { file: CLINE_BIN, args: ["config", "--help"] },
		...TERMINAL_WIDE,
		env: enkiEnv("default"),
	});

	test("shows config help page", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--config"]);
	});
});
