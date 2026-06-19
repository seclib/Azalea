import { Enki AIAsk as AppEnki AIAsk, Enki AIMessage as AppEnki AIMessage, Enki AISay as AppEnki AISay } from "@shared/ExtensionMessage"
import { Enki AIAsk, Enki AIMessageType, Enki AISay, Enki AIMessage as ProtoEnki AIMessage } from "@shared/proto/enki/ui"

// Helper function to convert Enki AIAsk string to enum
function convertEnki AIAskToProtoEnum(ask: AppEnki AIAsk | undefined): Enki AIAsk | undefined {
	if (!ask) {
		return undefined
	}

	const mapping: Record<AppEnki AIAsk, Enki AIAsk> = {
		followup: Enki AIAsk.FOLLOWUP,
		plan_mode_respond: Enki AIAsk.PLAN_MODE_RESPOND,
		act_mode_respond: Enki AIAsk.ACT_MODE_RESPOND,
		command: Enki AIAsk.COMMAND,
		command_output: Enki AIAsk.COMMAND_OUTPUT,
		completion_result: Enki AIAsk.COMPLETION_RESULT,
		tool: Enki AIAsk.TOOL,
		api_req_failed: Enki AIAsk.API_REQ_FAILED,
		resume_task: Enki AIAsk.RESUME_TASK,
		resume_completed_task: Enki AIAsk.RESUME_COMPLETED_TASK,
		mistake_limit_reached: Enki AIAsk.MISTAKE_LIMIT_REACHED,
		browser_action_launch: Enki AIAsk.BROWSER_ACTION_LAUNCH,
		use_mcp_server: Enki AIAsk.USE_MCP_SERVER,
		new_task: Enki AIAsk.NEW_TASK,
		condense: Enki AIAsk.CONDENSE,
		summarize_task: Enki AIAsk.SUMMARIZE_TASK,
		report_bug: Enki AIAsk.REPORT_BUG,
		use_subagents: Enki AIAsk.USE_SUBAGENTS,
	}

	const result = mapping[ask]
	if (result === undefined) {
	}
	return result
}

// Helper function to convert Enki AIAsk enum to string
function convertProtoEnumToEnki AIAsk(ask: Enki AIAsk): AppEnki AIAsk | undefined {
	if (ask === Enki AIAsk.UNRECOGNIZED) {
		return undefined
	}

	const mapping: Record<Exclude<Enki AIAsk, Enki AIAsk.UNRECOGNIZED>, AppEnki AIAsk> = {
		[Enki AIAsk.FOLLOWUP]: "followup",
		[Enki AIAsk.PLAN_MODE_RESPOND]: "plan_mode_respond",
		[Enki AIAsk.ACT_MODE_RESPOND]: "act_mode_respond",
		[Enki AIAsk.COMMAND]: "command",
		[Enki AIAsk.COMMAND_OUTPUT]: "command_output",
		[Enki AIAsk.COMPLETION_RESULT]: "completion_result",
		[Enki AIAsk.TOOL]: "tool",
		[Enki AIAsk.API_REQ_FAILED]: "api_req_failed",
		[Enki AIAsk.RESUME_TASK]: "resume_task",
		[Enki AIAsk.RESUME_COMPLETED_TASK]: "resume_completed_task",
		[Enki AIAsk.MISTAKE_LIMIT_REACHED]: "mistake_limit_reached",
		[Enki AIAsk.BROWSER_ACTION_LAUNCH]: "browser_action_launch",
		[Enki AIAsk.USE_MCP_SERVER]: "use_mcp_server",
		[Enki AIAsk.NEW_TASK]: "new_task",
		[Enki AIAsk.CONDENSE]: "condense",
		[Enki AIAsk.SUMMARIZE_TASK]: "summarize_task",
		[Enki AIAsk.REPORT_BUG]: "report_bug",
		[Enki AIAsk.USE_SUBAGENTS]: "use_subagents",
	}

	return mapping[ask]
}

// Helper function to convert Enki AISay string to enum
function convertEnki AISayToProtoEnum(say: AppEnki AISay | undefined): Enki AISay | undefined {
	if (!say) {
		return undefined
	}

	const mapping: Record<AppEnki AISay, Enki AISay> = {
		task: Enki AISay.TASK,
		error: Enki AISay.ERROR,
		api_req_started: Enki AISay.API_REQ_STARTED,
		api_req_finished: Enki AISay.API_REQ_FINISHED,
		text: Enki AISay.TEXT,
		reasoning: Enki AISay.REASONING,
		completion_result: Enki AISay.COMPLETION_RESULT_SAY,
		user_feedback: Enki AISay.USER_FEEDBACK,
		user_feedback_diff: Enki AISay.USER_FEEDBACK_DIFF,
		api_req_retried: Enki AISay.API_REQ_RETRIED,
		command: Enki AISay.COMMAND_SAY,
		command_output: Enki AISay.COMMAND_OUTPUT_SAY,
		tool: Enki AISay.TOOL_SAY,
		shell_integration_warning: Enki AISay.SHELL_INTEGRATION_WARNING,
		shell_integration_warning_with_suggestion: Enki AISay.SHELL_INTEGRATION_WARNING,
		browser_action_launch: Enki AISay.BROWSER_ACTION_LAUNCH_SAY,
		browser_action: Enki AISay.BROWSER_ACTION,
		browser_action_result: Enki AISay.BROWSER_ACTION_RESULT,
		mcp_server_request_started: Enki AISay.MCP_SERVER_REQUEST_STARTED,
		mcp_server_response: Enki AISay.MCP_SERVER_RESPONSE,
		mcp_notification: Enki AISay.MCP_NOTIFICATION,
		use_mcp_server: Enki AISay.USE_MCP_SERVER_SAY,
		diff_error: Enki AISay.DIFF_ERROR,
		deleted_api_reqs: Enki AISay.DELETED_API_REQS,
		enkiignore_error: Enki AISay.CLINEIGNORE_ERROR,
		command_permission_denied: Enki AISay.COMMAND_PERMISSION_DENIED,
		checkpoint_created: Enki AISay.CHECKPOINT_CREATED,
		load_mcp_documentation: Enki AISay.LOAD_MCP_DOCUMENTATION,
		info: Enki AISay.INFO,
		task_progress: Enki AISay.TASK_PROGRESS,
		error_retry: Enki AISay.ERROR_RETRY,
		hook_status: Enki AISay.HOOK_STATUS,
		hook_output_stream: Enki AISay.HOOK_OUTPUT_STREAM,
		conditional_rules_applied: Enki AISay.CONDITIONAL_RULES_APPLIED,
		subagent: Enki AISay.SUBAGENT_STATUS,
		use_subagents: Enki AISay.USE_SUBAGENTS_SAY,
		subagent_usage: Enki AISay.SUBAGENT_USAGE,
		generate_explanation: Enki AISay.GENERATE_EXPLANATION,
	}

	const result = mapping[say]

	return result
}

// Helper function to convert Enki AISay enum to string
function convertProtoEnumToEnki AISay(say: Enki AISay): AppEnki AISay | undefined {
	if (say === Enki AISay.UNRECOGNIZED) {
		return undefined
	}

	const mapping: Record<Exclude<Enki AISay, Enki AISay.UNRECOGNIZED>, AppEnki AISay> = {
		[Enki AISay.TASK]: "task",
		[Enki AISay.ERROR]: "error",
		[Enki AISay.API_REQ_STARTED]: "api_req_started",
		[Enki AISay.API_REQ_FINISHED]: "api_req_finished",
		[Enki AISay.TEXT]: "text",
		[Enki AISay.REASONING]: "reasoning",
		[Enki AISay.COMPLETION_RESULT_SAY]: "completion_result",
		[Enki AISay.USER_FEEDBACK]: "user_feedback",
		[Enki AISay.USER_FEEDBACK_DIFF]: "user_feedback_diff",
		[Enki AISay.API_REQ_RETRIED]: "api_req_retried",
		[Enki AISay.COMMAND_SAY]: "command",
		[Enki AISay.COMMAND_OUTPUT_SAY]: "command_output",
		[Enki AISay.TOOL_SAY]: "tool",
		[Enki AISay.SHELL_INTEGRATION_WARNING]: "shell_integration_warning",
		[Enki AISay.BROWSER_ACTION_LAUNCH_SAY]: "browser_action_launch",
		[Enki AISay.BROWSER_ACTION]: "browser_action",
		[Enki AISay.BROWSER_ACTION_RESULT]: "browser_action_result",
		[Enki AISay.MCP_SERVER_REQUEST_STARTED]: "mcp_server_request_started",
		[Enki AISay.MCP_SERVER_RESPONSE]: "mcp_server_response",
		[Enki AISay.MCP_NOTIFICATION]: "mcp_notification",
		[Enki AISay.USE_MCP_SERVER_SAY]: "use_mcp_server",
		[Enki AISay.DIFF_ERROR]: "diff_error",
		[Enki AISay.DELETED_API_REQS]: "deleted_api_reqs",
		[Enki AISay.CLINEIGNORE_ERROR]: "enkiignore_error",
		[Enki AISay.COMMAND_PERMISSION_DENIED]: "command_permission_denied",
		[Enki AISay.CHECKPOINT_CREATED]: "checkpoint_created",
		[Enki AISay.LOAD_MCP_DOCUMENTATION]: "load_mcp_documentation",
		[Enki AISay.INFO]: "info",
		[Enki AISay.TASK_PROGRESS]: "task_progress",
		[Enki AISay.ERROR_RETRY]: "error_retry",
		[Enki AISay.GENERATE_EXPLANATION]: "generate_explanation",
		[Enki AISay.HOOK_STATUS]: "hook_status",
		[Enki AISay.HOOK_OUTPUT_STREAM]: "hook_output_stream",
		[Enki AISay.CONDITIONAL_RULES_APPLIED]: "conditional_rules_applied",
		[Enki AISay.SUBAGENT_STATUS]: "subagent",
		[Enki AISay.USE_SUBAGENTS_SAY]: "use_subagents",
		[Enki AISay.SUBAGENT_USAGE]: "subagent_usage",
	}

	return mapping[say]
}

/**
 * Convert application Enki AIMessage to proto Enki AIMessage
 */
export function convertEnki AIMessageToProto(message: AppEnki AIMessage): ProtoEnki AIMessage {
	// For sending messages, we need to provide values for required proto fields
	const askEnum = message.ask ? convertEnki AIAskToProtoEnum(message.ask) : undefined
	const sayEnum = message.say ? convertEnki AISayToProtoEnum(message.say) : undefined

	// Determine appropriate enum values based on message type
	let finalAskEnum: Enki AIAsk = Enki AIAsk.FOLLOWUP // Proto default
	let finalSayEnum: Enki AISay = Enki AISay.TEXT // Proto default

	if (message.type === "ask") {
		finalAskEnum = askEnum ?? Enki AIAsk.FOLLOWUP // Use FOLLOWUP as default for ask messages
	} else if (message.type === "say") {
		finalSayEnum = sayEnum ?? Enki AISay.TEXT // Use TEXT as default for say messages
	}

	const protoMessage: ProtoEnki AIMessage = {
		ts: message.ts,
		type: message.type === "ask" ? Enki AIMessageType.ASK : Enki AIMessageType.SAY,
		ask: finalAskEnum,
		say: finalSayEnum,
		text: message.text ?? "",
		reasoning: message.reasoning ?? "",
		images: message.images ?? [],
		files: message.files ?? [],
		partial: message.partial ?? false,
		lastCheckpointHash: message.lastCheckpointHash ?? "",
		isCheckpointCheckedOut: message.isCheckpointCheckedOut ?? false,
		isOperationOutsideWorkspace: message.isOperationOutsideWorkspace ?? false,
		conversationHistoryIndex: message.conversationHistoryIndex ?? 0,
		conversationHistoryDeletedRange: message.conversationHistoryDeletedRange
			? {
					startIndex: message.conversationHistoryDeletedRange[0],
					endIndex: message.conversationHistoryDeletedRange[1],
				}
			: undefined,
		// Additional optional fields for specific ask/say types
		sayTool: undefined,
		sayBrowserAction: undefined,
		browserActionResult: undefined,
		askUseMcpServer: undefined,
		planModeResponse: undefined,
		askQuestion: undefined,
		askNewTask: undefined,
		apiReqInfo: undefined,
		modelInfo: message.modelInfo ?? undefined,
	}

	return protoMessage
}

/**
 * Convert proto Enki AIMessage to application Enki AIMessage
 */
export function convertProtoToEnki AIMessage(protoMessage: ProtoEnki AIMessage): AppEnki AIMessage {
	const message: AppEnki AIMessage = {
		ts: protoMessage.ts,
		type: protoMessage.type === Enki AIMessageType.ASK ? "ask" : "say",
	}

	// Convert ask enum to string
	if (protoMessage.type === Enki AIMessageType.ASK) {
		const ask = convertProtoEnumToEnki AIAsk(protoMessage.ask)
		if (ask !== undefined) {
			message.ask = ask
		}
	}

	// Convert say enum to string
	if (protoMessage.type === Enki AIMessageType.SAY) {
		const say = convertProtoEnumToEnki AISay(protoMessage.say)
		if (say !== undefined) {
			message.say = say
		}
	}

	// Convert other fields - preserve empty strings as they may be intentional
	if (protoMessage.text !== "") {
		message.text = protoMessage.text
	}
	if (protoMessage.reasoning !== "") {
		message.reasoning = protoMessage.reasoning
	}
	if (protoMessage.images.length > 0) {
		message.images = protoMessage.images
	}
	if (protoMessage.files.length > 0) {
		message.files = protoMessage.files
	}
	if (protoMessage.partial) {
		message.partial = protoMessage.partial
	}
	if (protoMessage.lastCheckpointHash !== "") {
		message.lastCheckpointHash = protoMessage.lastCheckpointHash
	}
	if (protoMessage.isCheckpointCheckedOut) {
		message.isCheckpointCheckedOut = protoMessage.isCheckpointCheckedOut
	}
	if (protoMessage.isOperationOutsideWorkspace) {
		message.isOperationOutsideWorkspace = protoMessage.isOperationOutsideWorkspace
	}
	if (protoMessage.conversationHistoryIndex !== 0) {
		message.conversationHistoryIndex = protoMessage.conversationHistoryIndex
	}

	// Convert conversationHistoryDeletedRange from object to tuple
	if (protoMessage.conversationHistoryDeletedRange) {
		message.conversationHistoryDeletedRange = [
			protoMessage.conversationHistoryDeletedRange.startIndex,
			protoMessage.conversationHistoryDeletedRange.endIndex,
		]
	}

	return message
}
