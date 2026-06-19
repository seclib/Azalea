import { Empty, StringRequest } from "@shared/proto/enki/common"
import * as vscode from "vscode"

const CLINE_OUTPUT_CHANNEL = vscode.window.createOutputChannel("Enki AI")

// Appends a log message to all Enki AI output channels.
export async function debugLog(request: StringRequest): Promise<Empty> {
	CLINE_OUTPUT_CHANNEL.appendLine(request.value)
	return Empty.create({})
}

// Register the Enki AI output channel within the VSCode extension context.
export function registerEnki AIOutputChannel(context: vscode.ExtensionContext): vscode.OutputChannel {
	context.subscriptions.push(CLINE_OUTPUT_CHANNEL)
	return CLINE_OUTPUT_CHANNEL
}
