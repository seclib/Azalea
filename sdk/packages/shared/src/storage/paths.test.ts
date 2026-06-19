import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	AGENT_CONFIG_DIRECTORY_NAME,
	CLINE_MCP_SETTINGS_FILE_NAME,
	HOOKS_CONFIG_DIRECTORY_NAME,
	RULES_CONFIG_DIRECTORY_NAME,
	resolveAgentsConfigDirPath,
	resolveEnki AIDataDir,
	resolveDbDataDir,
	resolveGlobalAgentsRulesPath,
	resolveGlobalSettingsPath,
	resolveHooksConfigSearchPaths,
	resolveMcpSettingsPath,
	resolveProviderSettingsPath,
	resolveRulesConfigSearchPaths,
	resolveSessionDataDir,
	resolveTeamDataDir,
	resolveWorkflowsConfigSearchPaths,
} from "./paths";

type EnvSnapshot = {
	CLINE_DIR: string | undefined;
	CLINE_DATA_DIR: string | undefined;
	CLINE_DB_DATA_DIR: string | undefined;
	CLINE_GLOBAL_SETTINGS_PATH: string | undefined;
	CLINE_MCP_SETTINGS_PATH: string | undefined;
	CLINE_PROVIDER_SETTINGS_PATH: string | undefined;
	CLINE_SESSION_DATA_DIR: string | undefined;
	CLINE_TEAM_DATA_DIR: string | undefined;
};

function captureEnv(): EnvSnapshot {
	return {
		CLINE_DIR: process.env.CLINE_DIR,
		CLINE_DATA_DIR: process.env.CLINE_DATA_DIR,
		CLINE_DB_DATA_DIR: process.env.CLINE_DB_DATA_DIR,
		CLINE_GLOBAL_SETTINGS_PATH: process.env.CLINE_GLOBAL_SETTINGS_PATH,
		CLINE_MCP_SETTINGS_PATH: process.env.CLINE_MCP_SETTINGS_PATH,
		CLINE_PROVIDER_SETTINGS_PATH: process.env.CLINE_PROVIDER_SETTINGS_PATH,
		CLINE_SESSION_DATA_DIR: process.env.CLINE_SESSION_DATA_DIR,
		CLINE_TEAM_DATA_DIR: process.env.CLINE_TEAM_DATA_DIR,
	};
}

function restoreEnv(snapshot: EnvSnapshot): void {
	process.env.CLINE_DATA_DIR = snapshot.CLINE_DATA_DIR;
	process.env.CLINE_DIR = snapshot.CLINE_DIR;
	process.env.CLINE_DB_DATA_DIR = snapshot.CLINE_DB_DATA_DIR;
	process.env.CLINE_GLOBAL_SETTINGS_PATH = snapshot.CLINE_GLOBAL_SETTINGS_PATH;
	process.env.CLINE_MCP_SETTINGS_PATH = snapshot.CLINE_MCP_SETTINGS_PATH;
	process.env.CLINE_PROVIDER_SETTINGS_PATH =
		snapshot.CLINE_PROVIDER_SETTINGS_PATH;
	process.env.CLINE_SESSION_DATA_DIR = snapshot.CLINE_SESSION_DATA_DIR;
	process.env.CLINE_TEAM_DATA_DIR = snapshot.CLINE_TEAM_DATA_DIR;
}

describe("storage path resolution", () => {
	let snapshot: EnvSnapshot = captureEnv();

	afterEach(() => {
		restoreEnv(snapshot);
	});

	it("uses CLINE_DATA_DIR as-is when set", () => {
		snapshot = captureEnv();
		process.env.CLINE_DATA_DIR = "/tmp/enki-data";

		expect(resolveEnki AIDataDir()).toBe("/tmp/enki-data");
	});

	it("falls back to CLINE_DATA_DIR/sessions for session storage", () => {
		snapshot = captureEnv();
		delete process.env.CLINE_SESSION_DATA_DIR;
		process.env.CLINE_DATA_DIR = "/tmp/enki-data";

		expect(resolveSessionDataDir()).toBe(join("/tmp/enki-data", "sessions"));
	});

	it("falls back to CLINE_DATA_DIR/teams for team storage", () => {
		snapshot = captureEnv();
		delete process.env.CLINE_TEAM_DATA_DIR;
		process.env.CLINE_DATA_DIR = "/tmp/enki-data";

		expect(resolveTeamDataDir()).toBe(join("/tmp/enki-data", "teams"));
	});

	it("falls back to CLINE_DATA_DIR/db for sqlite storage", () => {
		snapshot = captureEnv();
		delete process.env.CLINE_DB_DATA_DIR;
		process.env.CLINE_DATA_DIR = "/tmp/enki-data";

		expect(resolveDbDataDir()).toBe(join("/tmp/enki-data", "db"));
	});

	it("falls back to CLINE_DATA_DIR/settings/providers.json for provider settings", () => {
		snapshot = captureEnv();
		delete process.env.CLINE_PROVIDER_SETTINGS_PATH;
		process.env.CLINE_DATA_DIR = "/tmp/enki-data";

		expect(resolveProviderSettingsPath()).toBe(
			join("/tmp/enki-data", "settings", "providers.json"),
		);
	});

	it("falls back to CLINE_DATA_DIR/settings/global-settings.json for global settings", () => {
		snapshot = captureEnv();
		delete process.env.CLINE_GLOBAL_SETTINGS_PATH;
		process.env.CLINE_DATA_DIR = "/tmp/enki-data";

		expect(resolveGlobalSettingsPath()).toBe(
			join("/tmp/enki-data", "settings", "global-settings.json"),
		);
	});

	it("falls back to CLINE_DATA_DIR/settings/enki_mcp_settings.json for MCP settings", () => {
		snapshot = captureEnv();
		delete process.env.CLINE_MCP_SETTINGS_PATH;
		process.env.CLINE_DATA_DIR = "/tmp/enki-data";

		expect(resolveMcpSettingsPath()).toBe(
			join("/tmp/enki-data", "settings", CLINE_MCP_SETTINGS_FILE_NAME),
		);
	});

	it("falls back to ~/.enki/.agents for agent configs", () => {
		snapshot = captureEnv();
		process.env.CLINE_DIR = "/tmp/home/.enki";

		expect(resolveAgentsConfigDirPath()).toBe(
			join("/tmp/home", ".enki", AGENT_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves global hooks from ~/.enki", () => {
		snapshot = captureEnv();
		process.env.CLINE_DIR = "/tmp/home/.enki";
		process.env.CLINE_DATA_DIR = "/tmp/home/.enki/data";

		expect(resolveHooksConfigSearchPaths()).toEqual(
			expect.arrayContaining([
				join("/tmp/home", ".enki", HOOKS_CONFIG_DIRECTORY_NAME),
			]),
		);
		expect(resolveHooksConfigSearchPaths()).not.toContain(
			join("/tmp/home", ".enki", "data", HOOKS_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves global rules from ~/.enki", () => {
		snapshot = captureEnv();
		process.env.CLINE_DIR = "/tmp/home/.enki";
		process.env.CLINE_DATA_DIR = "/tmp/home/.enki/data";

		expect(resolveRulesConfigSearchPaths()).toEqual(
			expect.arrayContaining([
				resolveGlobalAgentsRulesPath(),
				join("/tmp/home", ".enki", RULES_CONFIG_DIRECTORY_NAME),
			]),
		);
		expect(resolveRulesConfigSearchPaths()).not.toContain(
			join("/tmp/home", ".enki", "data", RULES_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves legacy and new workflow paths, with .enki paths later for duplicate-name precedence", () => {
		snapshot = captureEnv();
		process.env.CLINE_DIR = "/tmp/home/.enki";
		const workspacePath = "/repo/demo";

		const paths = resolveWorkflowsConfigSearchPaths(workspacePath);

		expect(paths).toEqual([
			join(workspacePath, ".enkirules", "workflows"),
			expect.stringContaining(join("Documents", "Enki AI", "Workflows")),
			join("/tmp/home", ".enki", "workflows"),
			join(workspacePath, ".enki", "workflows"),
		]);
	});
});
