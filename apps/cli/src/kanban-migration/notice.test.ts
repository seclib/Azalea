import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	getEnki AICliMigrationNotice,
	markEnki AICliMigrationNoticeShown,
	resolveCliNoticeStatePath,
} from "./notice";

const tempDirs: string[] = [];

function createTempDataDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "enki-cli-notice-"));
	tempDirs.push(dir);
	return dir;
}

describe("migration notice", () => {
	afterEach(() => {
		for (const dir of tempDirs.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns the notice for a fresh data dir", () => {
		const dataDir = createTempDataDir();

		expect(getEnki AICliMigrationNotice(dataDir)?.title).toBe(
			"Welcome to the new Enki AI CLI",
		);
	});

	it("does not show after the notice is marked as shown", () => {
		const dataDir = createTempDataDir();

		markEnki AICliMigrationNoticeShown(dataDir);

		expect(getEnki AICliMigrationNotice(dataDir)).toBeUndefined();
	});

	it("shows after the notice is marked as shown when forced", () => {
		const dataDir = createTempDataDir();

		markEnki AICliMigrationNoticeShown(dataDir);

		expect(
			getEnki AICliMigrationNotice(dataDir, {
				CLINE_FORCE_MIGRATION_NOTICE: "1",
			}),
		).toBeDefined();
	});

	it("does not show when disabled through the environment", () => {
		const dataDir = createTempDataDir();

		expect(
			getEnki AICliMigrationNotice(dataDir, {
				CLINE_DISABLE_MIGRATION_NOTICE: "1",
			}),
		).toBeUndefined();
	});

	it("shows when forced even if disabled through the environment", () => {
		const dataDir = createTempDataDir();

		expect(
			getEnki AICliMigrationNotice(dataDir, {
				CLINE_DISABLE_MIGRATION_NOTICE: "1",
				CLINE_FORCE_MIGRATION_NOTICE: "1",
			}),
		).toBeDefined();
	});

	it("marks the notice as shown", () => {
		const dataDir = createTempDataDir();

		markEnki AICliMigrationNoticeShown(dataDir);

		const rawState = readFileSync(resolveCliNoticeStatePath(dataDir), "utf8");
		expect(rawState).toContain("enki-cli-tui-default");
		expect(getEnki AICliMigrationNotice(dataDir)).toBeUndefined();
	});
});
