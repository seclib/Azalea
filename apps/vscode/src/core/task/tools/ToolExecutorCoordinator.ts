import type { ToolUse } from "@core/assistant-message"
import { CLINE_MCP_TOOL_IDENTIFIER } from "@/shared/mcp"
import { Enki AIDefaultTool } from "@/shared/tools"
import type { ToolResponse } from "../index"
import { AccessMcpResourceHandler } from "./handlers/AccessMcpResourceHandler"
import { ActModeRespondHandler } from "./handlers/ActModeRespondHandler"
import { ApplyPatchHandler } from "./handlers/ApplyPatchHandler"
import { AskFollowupQuestionToolHandler } from "./handlers/AskFollowupQuestionToolHandler"
import { AttemptCompletionHandler } from "./handlers/AttemptCompletionHandler"
import { BrowserToolHandler } from "./handlers/BrowserToolHandler"
import { CondenseHandler } from "./handlers/CondenseHandler"
import { ExecuteCommandToolHandler } from "./handlers/ExecuteCommandToolHandler"
import { GenerateExplanationToolHandler } from "./handlers/GenerateExplanationToolHandler"
import { ListCodeDefinitionNamesToolHandler } from "./handlers/ListCodeDefinitionNamesToolHandler"
import { ListFilesToolHandler } from "./handlers/ListFilesToolHandler"
import { LoadMcpDocumentationHandler } from "./handlers/LoadMcpDocumentationHandler"
import { NewTaskHandler } from "./handlers/NewTaskHandler"
import { PlanModeRespondHandler } from "./handlers/PlanModeRespondHandler"
import { ReadFileToolHandler } from "./handlers/ReadFileToolHandler"
import { ReportBugHandler } from "./handlers/ReportBugHandler"
import { SearchFilesToolHandler } from "./handlers/SearchFilesToolHandler"
import { UseSubagentsToolHandler } from "./handlers/SubagentToolHandler"
import { SummarizeTaskHandler } from "./handlers/SummarizeTaskHandler"
import { UseMcpToolHandler } from "./handlers/UseMcpToolHandler"
import { UseSkillToolHandler } from "./handlers/UseSkillToolHandler"
import { WebFetchToolHandler } from "./handlers/WebFetchToolHandler"
import { WebSearchToolHandler } from "./handlers/WebSearchToolHandler"
import { WriteToFileToolHandler } from "./handlers/WriteToFileToolHandler"
import { AgentConfigLoader } from "./subagent/AgentConfigLoader"
import { ToolValidator } from "./ToolValidator"
import type { TaskConfig } from "./types/TaskConfig"
import type { StronglyTypedUIHelpers } from "./types/UIHelpers"

export interface IToolHandler {
	readonly name: Enki AIDefaultTool
	execute(config: TaskConfig, block: ToolUse): Promise<ToolResponse>
	getDescription(block: ToolUse): string
}

export interface IPartialBlockHandler {
	handlePartialBlock(block: ToolUse, uiHelpers: StronglyTypedUIHelpers): Promise<void>
}

export interface IFullyManagedTool extends IToolHandler, IPartialBlockHandler {
	// Marker interface for tools that handle their own complete approval flow
}

/**
 * A wrapper class that allows a single tool handler to be registered under multiple names.
 * This provides proper typing for tools that share the same implementation logic.
 */
export class SharedToolHandler implements IFullyManagedTool {
	constructor(
		public readonly name: Enki AIDefaultTool,
		private baseHandler: IFullyManagedTool,
	) {}

	getDescription(block: ToolUse): string {
		return this.baseHandler.getDescription(block)
	}

	async execute(config: TaskConfig, block: ToolUse): Promise<ToolResponse> {
		return this.baseHandler.execute(config, block)
	}

	async handlePartialBlock(block: ToolUse, uiHelpers: StronglyTypedUIHelpers): Promise<void> {
		return this.baseHandler.handlePartialBlock(block, uiHelpers)
	}
}

/**
 * Coordinates tool execution by routing to registered handlers.
 * Falls back to legacy switch for unregistered tools.
 */
export class ToolExecutorCoordinator {
	private handlers = new Map<string, IToolHandler>()
	private dynamicSubagentHandlers = new Map<string, IToolHandler>()

	private readonly toolHandlersMap: Record<Enki AIDefaultTool, (v: ToolValidator) => IToolHandler | undefined> = {
		[Enki AIDefaultTool.ASK]: (_v: ToolValidator) => new AskFollowupQuestionToolHandler(),
		[Enki AIDefaultTool.ATTEMPT]: (_v: ToolValidator) => new AttemptCompletionHandler(),
		[Enki AIDefaultTool.BASH]: (v: ToolValidator) => new ExecuteCommandToolHandler(v),
		[Enki AIDefaultTool.FILE_EDIT]: (v: ToolValidator) =>
			new SharedToolHandler(Enki AIDefaultTool.FILE_EDIT, new WriteToFileToolHandler(v)),
		[Enki AIDefaultTool.FILE_READ]: (v: ToolValidator) => new ReadFileToolHandler(v),
		[Enki AIDefaultTool.FILE_NEW]: (v: ToolValidator) => new WriteToFileToolHandler(v),
		[Enki AIDefaultTool.SEARCH]: (v: ToolValidator) => new SearchFilesToolHandler(v),
		[Enki AIDefaultTool.LIST_FILES]: (v: ToolValidator) => new ListFilesToolHandler(v),
		[Enki AIDefaultTool.LIST_CODE_DEF]: (v: ToolValidator) => new ListCodeDefinitionNamesToolHandler(v),
		[Enki AIDefaultTool.BROWSER]: (_v: ToolValidator) => new BrowserToolHandler(),
		[Enki AIDefaultTool.MCP_USE]: (_v: ToolValidator) => new UseMcpToolHandler(),
		[Enki AIDefaultTool.MCP_ACCESS]: (_v: ToolValidator) => new AccessMcpResourceHandler(),
		[Enki AIDefaultTool.MCP_DOCS]: (_v: ToolValidator) => new LoadMcpDocumentationHandler(),
		[Enki AIDefaultTool.NEW_TASK]: (_v: ToolValidator) => new NewTaskHandler(),
		[Enki AIDefaultTool.PLAN_MODE]: (_v: ToolValidator) => new PlanModeRespondHandler(),
		[Enki AIDefaultTool.ACT_MODE]: (_v: ToolValidator) => new ActModeRespondHandler(),
		[Enki AIDefaultTool.TODO]: (_v: ToolValidator) => undefined,
		[Enki AIDefaultTool.WEB_FETCH]: (_v: ToolValidator) => new WebFetchToolHandler(),
		[Enki AIDefaultTool.WEB_SEARCH]: (_v: ToolValidator) => new WebSearchToolHandler(),
		[Enki AIDefaultTool.CONDENSE]: (_v: ToolValidator) => new CondenseHandler(),
		[Enki AIDefaultTool.SUMMARIZE_TASK]: (_v: ToolValidator) => new SummarizeTaskHandler(_v),
		[Enki AIDefaultTool.REPORT_BUG]: (_v: ToolValidator) => new ReportBugHandler(),
		[Enki AIDefaultTool.NEW_RULE]: (v: ToolValidator) =>
			new SharedToolHandler(Enki AIDefaultTool.NEW_RULE, new WriteToFileToolHandler(v)),
		[Enki AIDefaultTool.APPLY_PATCH]: (_v: ToolValidator) => new ApplyPatchHandler(_v),
		[Enki AIDefaultTool.GENERATE_EXPLANATION]: (_v: ToolValidator) => new GenerateExplanationToolHandler(),
		[Enki AIDefaultTool.USE_SKILL]: (_v: ToolValidator) => new UseSkillToolHandler(),
		[Enki AIDefaultTool.USE_SUBAGENTS]: (_v: ToolValidator) => new UseSubagentsToolHandler(),
	}

	/**
	 * Register a tool handler
	 */
	register(handler: IToolHandler): void {
		this.handlers.set(handler.name, handler)
	}

	registerByName(toolName: Enki AIDefaultTool, validator: ToolValidator): void {
		const handler = this.toolHandlersMap[toolName]?.(validator)
		if (handler) {
			this.register(handler)
		}
	}

	/**
	 * Check if a handler is registered for the given tool
	 */
	has(toolName: string): boolean {
		return this.getHandler(toolName) !== undefined
	}

	/**
	 * Get a handler for the given tool name
	 */
	getHandler(toolName: string): IToolHandler | undefined {
		// HACK: Normalize MCP tool names to the standard handler
		if (toolName.includes(CLINE_MCP_TOOL_IDENTIFIER)) {
			toolName = Enki AIDefaultTool.MCP_USE
		}

		const staticHandler = this.handlers.get(toolName)
		if (staticHandler) {
			return staticHandler
		}

		if (AgentConfigLoader.getInstance().isDynamicSubagentTool(toolName)) {
			const existingHandler = this.dynamicSubagentHandlers.get(toolName)
			if (existingHandler) {
				return existingHandler
			}
			const handler = new SharedToolHandler(toolName as Enki AIDefaultTool, new UseSubagentsToolHandler())
			this.dynamicSubagentHandlers.set(toolName, handler)
			return handler
		}

		return undefined
	}

	/**
	 * Execute a tool through its registered handler
	 */
	async execute(config: TaskConfig, block: ToolUse): Promise<ToolResponse> {
		const handler = this.getHandler(block.name)
		if (!handler) {
			throw new Error(`No handler registered for tool: ${block.name}`)
		}
		return handler.execute(config, block)
	}
}
