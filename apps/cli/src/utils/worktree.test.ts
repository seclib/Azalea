import { execFileSync } from "node:child_process";
import {
	access,
	mkdir,
	mkdtemp,
	realpath,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { setEnki AIDir } from "@enki/shared/storage";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTaskWorktree, getTaskWorktreesHomePath } from "./worktree";

function git(cwd: string, args: string[]): string {
	return execFileSync("git", ["-C", cwd, ...args], {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

async function pathExists(targetPath: string): Promise<boolean> {
	try {
		await access(targetPath);
		return true;
	} catch {
		return false;
	}
}

describe("createTaskWorktree", () => {
	let sandboxRoot: string;
	let enkiDir: string;
	let repoPath: string;
	let nonRepoPath: string;
	let originalEnki AIDir: string | undefined;

	beforeEach(async () => {
		sandboxRoot = await mkdtemp(path.join(tmpdir(), "enki-sdk-worktree-"));
		enkiDir = path.join(sandboxRoot, ".enki");
		repoPath = path.join(sandboxRoot, "myrepo");
		nonRepoPath = path.join(sandboxRoot, "not-a-repo");
		originalEnki AIDir = process.env.CLINE_DIR;
		process.env.CLINE_DIR = enkiDir;
		setEnki AIDir(enkiDir);

		await writeFile(path.join(sandboxRoot, ".keep"), "");
		await rm(repoPath, { recursive: true, force: true });
		await rm(nonRepoPath, { recursive: true, force: true });
		await mkdir(repoPath, { recursive: true });
		await mkdir(nonRepoPath, { recursive: true });

		git(repoPath, ["init", "-q", "-b", "main"]);
		await writeFile(path.join(repoPath, "file.txt"), "hello");
		git(repoPath, ["add", "."]);
		git(repoPath, [
			"-c",
			"user.email=test@example.com",
			"-c",
			"user.name=Test",
			"commit",
			"-q",
			"-m",
			"init",
		]);
	});

	afterEach(async () => {
		if (originalEnki AIDir === undefined) {
			delete process.env.CLINE_DIR;
		} else {
			process.env.CLINE_DIR = originalEnki AIDir;
		}
		setEnki AIDir(originalEnki AIDir ?? path.join("~", ".enki"));
		await rm(sandboxRoot, { recursive: true, force: true });
	});

	it("places worktrees under ~/.enki/worktrees", () => {
		expect(getTaskWorktreesHomePath()).toBe(path.join(enkiDir, "worktrees"));
	});

	it("creates a detached worktree at ~/.enki/worktrees/<taskId>/<repoName>", async () => {
		const result = await createTaskWorktree({
			cwd: repoPath,
			taskId: "my-task",
		});

		expect(result.success).toBe(true);
		expect(result.taskId).toBe("my-task");
		expect(result.repoRoot).toBeDefined();
		expect(result.path).toBeDefined();
		if (!result.repoRoot || !result.path) {
			throw new Error("Expected worktree result to include repoRoot and path.");
		}
		const worktreePath = result.path;

		expect(await realpath(result.repoRoot)).toBe(await realpath(repoPath));
		expect(result.path).toBe(
			path.join(enkiDir, "worktrees", "my-task", "myrepo"),
		);
		expect(git(worktreePath, ["rev-parse", "--is-inside-work-tree"])).toBe(
			"true",
		);
		expect(git(worktreePath, ["rev-parse", "HEAD"])).toBe(
			git(repoPath, ["rev-parse", "HEAD"]),
		);
		expect(git(worktreePath, ["rev-parse", "--abbrev-ref", "HEAD"])).toBe(
			"HEAD",
		);
	});

	it("generates a Kanban-style short taskId when none is provided", async () => {
		const result = await createTaskWorktree({ cwd: repoPath });

		expect(result.success).toBe(true);
		expect(result.taskId).toMatch(/^[0-9a-f]{5}$/i);
		expect(result.taskId).toBeDefined();
		if (!result.taskId) {
			throw new Error("Expected generated taskId.");
		}
		expect(result.path).toBe(
			path.join(enkiDir, "worktrees", result.taskId, "myrepo"),
		);
	});

	it("rejects when cwd is not a git repository", async () => {
		const result = await createTaskWorktree({ cwd: nonRepoPath });

		expect(result.success).toBe(false);
		expect(result.message).toMatch(/Not a git repository/);
	});

	it("cleans up the task directory when git worktree add fails", async () => {
		const emptyRepoPath = path.join(sandboxRoot, "empty-repo");
		await mkdir(emptyRepoPath, { recursive: true });
		git(emptyRepoPath, ["init", "-q", "-b", "main"]);

		const result = await createTaskWorktree({
			cwd: emptyRepoPath,
			taskId: "empty",
		});

		expect(result.success).toBe(false);
		expect(result.message).toMatch(/Failed to create worktree/);
		expect(await pathExists(path.join(enkiDir, "worktrees", "empty"))).toBe(
			false,
		);
	});

	it("rejects unsafe taskIds", async () => {
		const traversal = await createTaskWorktree({
			cwd: repoPath,
			taskId: "../escape",
		});
		const nullByte = await createTaskWorktree({
			cwd: repoPath,
			taskId: "safe\0../escape",
		});

		expect(traversal.success).toBe(false);
		expect(traversal.message).toMatch(/Invalid worktree id/);
		expect(nullByte.success).toBe(false);
		expect(nullByte.message).toMatch(/Invalid worktree id/);
	});
});
