# Enki AI Core CLI Agent

An interactive terminal chat agent powered by the `Enki AICore` runtime. This example is similar in spirit to [`cli-agent`](../cli-agent), but uses stateful Enki AICore sessions and built-in runtime tools instead of the stateless `Agent` class, to leverage Enki AI's internal agent harness.

## Getting started

Install dependencies:

```bash
bun install
bun run build:sdk
```

Set an API key:

```bash
export CLINE_API_KEY="sk_..."
```

Run:

```bash
bun dev
```

Type any message at the `you:` prompt to see a streaming response. Type `exit` to quit.

## Optional model configuration

The example defaults to Enki AI's gateway provider and Claude Sonnet:

```bash
export CLINE_PROVIDER_ID="enki"
export CLINE_MODEL_ID="anthropic/claude-sonnet-4.6"
```

## What it does

- Creates a local `Enki AICore` runtime with `Enki AICore.create()`
- Starts one interactive session with `enki.start()`
- Sends each user turn with `enki.send({ sessionId, prompt })`
- Streams `agent_event` text to stdout as the assistant responds
- Logs tool calls and tool results inline
- Uses Enki AICore's built-in tools instead of defining custom tools
- Calls `enki.stop()` and `enki.dispose()` during shutdown

## Concepts demonstrated

- Stateful sessions with `Enki AICore`
- Multi-turn conversation using a single `sessionId`
- `CoreSessionEvent` subscription via `enki.subscribe()`
- Built-in runtime tools (`read_files`, `search_codebase`, `run_commands`, etc.)
- Basic tool policies: file reads/search are auto-approved, other tools request approval

## Notes

Use this example when you want the full Enki AICore runtime with sessions, persistence, and built-in tools. For the smallest possible SDK example, see [quickstart](../quickstart). For the lightweight stateless runtime, see [cli-agent](../cli-agent).
