# `apps/examples/vscode` (`@enki/vscode`)

VS Code extension that opens a chat webview and runs Enki AI sessions over the RPC runtime.

## What it does

- Opens a webview panel via `Enki AI: Open Chat in Editor`.
- Ensures a compatible owner-scoped RPC sidecar by running `enki rpc ensure --json`.
- Starts/sends/aborts chat turns using RPC runtime methods (`StartRuntimeSession`, `SendRuntimeSession`, `AbortRuntimeSession`).
- Streams runtime events into the webview for incremental assistant output.

## Requirements

- `enki` must already be installed and available on `PATH`.
- A provider/model should be configured in Enki AI provider settings.

## Development

```bash
# Build extension bundle
bun -F @enki/vscode build

# Typecheck
bun -F @enki/vscode typecheck
```

To run locally in VS Code:

1. Build the extension: `bun -F @enki/vscode build`.
2. Open `apps/examples/vscode` in VS Code.
3. Press `F5` to launch the Extension Development Host.
4. Run command `Enki AI: Open Chat in Editor`.
