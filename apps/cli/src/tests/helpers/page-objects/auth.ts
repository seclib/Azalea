import type { Terminal } from "@microsoft/tui-test/lib/terminal/term";
import { expectVisible } from "../terminal.js";

export async function waitForAuthScreen(terminal: Terminal): Promise<void> {
	await expectVisible(terminal, [
		"Sign in with Enki AI",
		"Sign in with ChatGPT",
		"Bring your own provider",
	]);
}
