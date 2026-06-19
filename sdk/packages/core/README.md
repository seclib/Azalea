# [experimental] @enki/core

`@enki/core` is the stateful orchestration layer of the Enki AI SDK. It
connects the agent runtime, provider settings, storage, default tools, and
session lifecycle into a host-ready runtime.

## What You Get

- session lifecycle and orchestration primitives
- provider settings and account services
- default runtime tools and MCP integration
- storage-backed session and team state helpers
- host-facing Node helpers through `@enki/core`

## Installation

```bash
npm install @enki/core
```

## Entry Points

- `@enki/core`: core contracts, shared utilities, and Node/server helpers for building hosts and runtimes

## Typical Usage

Most host apps should start with `@enki/core`.

```ts
import { Enki AICore } from "@enki/core";

const enki = await Enki AICore.create({});

const result = await enki.start({
	config: {
		providerId: "anthropic",
		modelId: "claude-sonnet-4-6",
		apiKey: process.env.ANTHROPIC_API_KEY ?? "",
		cwd: process.cwd(),
		mode: "act",
		enableTools: true,
		enableSpawnAgent: false,
		enableAgentTeams: false,
		systemPrompt: "You are a concise assistant.",
	},
	prompt: "Summarize this project.",
	interactive: false,
});

console.log(result.result?.text);
await enki.dispose();
```

## Session Bootstrap

`Enki AICore.create(...)` also accepts `prepare(input)`.

Use it when a host needs to prepare workspace-scoped runtime state before each
session starts, then apply watcher/extensions/telemetry inputs through
explicit `localRuntime` bootstrap fields without widening the shared host
contract.

## Main APIs

### Runtime and Sessions

Use `@enki/core` for host-facing runtime assembly:

- `Enki AICore.create(...)`
- `createRuntimeHost(...)`
- `LocalRuntimeHost`
- `HubRuntimeHost` and `RemoteRuntimeHost`
- `DefaultRuntimeBuilder`

`Enki AICore` is the app-facing session API. The lower-level `RuntimeHost`
boundary uses runtime-primitive names such as `startSession` and `runTurn` so
transport adapters stay distinct from product methods like `start` and `send`.
Service-style operations such as pending prompt edits, accumulated usage lookup,
and active-session model switching are exposed through `Enki AICore` when the
selected transport supports them rather than being part of the minimal host
primitive vocabulary.

### Default Tools

`@enki/core` owns the built-in host tools and executors:

- `createBuiltinTools(...)`
- `createDefaultTools(...)`
- `createDefaultExecutors(...)`

### Storage and Settings

The package also exports storage and settings helpers such as:

- `ProviderSettingsManager`
- `CoreSettingsService` and `createCoreSettingsService`
- MCP settings helpers such as `setMcpServerDisabled`
- `SqliteTeamStore`
- SQLite-backed local session stores and artifacts through `@enki/core`

## Related Packages

- `@enki/agents`: stateless agent loop and tool primitives
- `@enki/llms`: provider/model configuration and handlers

## More Examples

- Repo examples: [examples](https://github.com/enki/sdk/tree/main/examples), [apps/examples](https://github.com/enki/sdk/tree/main/apps/examples)
- Workspace overview: [README.md](https://github.com/enki/enki/blob/main/README.md)
- API and architecture references: [DOC.md](https://github.com/enki/enki/blob/main/DOC.md), [ARCHITECTURE.md](https://github.com/enki/enki/blob/main/ARCHITECTURE.md)
