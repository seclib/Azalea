import { isGPT5ModelFamily, isNextGenModelProvider } from "@utils/model-utils"
import { ModelFamily } from "@/shared/prompts"
import { Logger } from "@/shared/services/Logger"
import { Enki AIDefaultTool } from "@/shared/tools"
import { SystemPromptSection } from "../../templates/placeholders"
import { createVariant } from "../variant-builder"
import { validateVariant } from "../variant-validator"
import { GPT_5_TEMPLATE_OVERRIDES } from "./template"

// Type-safe variant configuration using the builder pattern
export const config = createVariant(ModelFamily.GPT_5)
	.description("Prompt tailored to GPT-5 with text-based tools")
	.version(1)
	.tags("gpt", "gpt-5", "advanced", "production")
	.labels({
		stable: 1,
		production: 1,
		advanced: 1,
	})
	// Match GPT-5 models from providers that support native tools
	.matcher((context) => {
		const providerInfo = context.providerInfo
		const modelId = providerInfo.model.id
		return (
			isGPT5ModelFamily(modelId) &&
			!modelId.includes("chat") &&
			isNextGenModelProvider(providerInfo) &&
			!context.enableNativeToolCalls
		)
	})
	.template(GPT_5_TEMPLATE_OVERRIDES.BASE)
	.components(
		SystemPromptSection.AGENT_ROLE,
		SystemPromptSection.TOOL_USE,
		SystemPromptSection.TASK_PROGRESS,
		SystemPromptSection.MCP,
		SystemPromptSection.EDITING_FILES,
		SystemPromptSection.ACT_VS_PLAN,
		SystemPromptSection.CAPABILITIES,
		SystemPromptSection.FEEDBACK,
		SystemPromptSection.RULES,
		SystemPromptSection.SYSTEM_INFO,
		SystemPromptSection.OBJECTIVE,
		SystemPromptSection.USER_INSTRUCTIONS,
		SystemPromptSection.SKILLS,
	)
	.tools(
		Enki AIDefaultTool.BASH,
		Enki AIDefaultTool.FILE_READ,
		Enki AIDefaultTool.FILE_NEW,
		Enki AIDefaultTool.FILE_EDIT,
		Enki AIDefaultTool.SEARCH,
		Enki AIDefaultTool.LIST_FILES,
		Enki AIDefaultTool.LIST_CODE_DEF,
		Enki AIDefaultTool.BROWSER,
		Enki AIDefaultTool.WEB_FETCH,
		Enki AIDefaultTool.WEB_SEARCH,
		Enki AIDefaultTool.MCP_USE,
		Enki AIDefaultTool.MCP_ACCESS,
		Enki AIDefaultTool.ASK,
		Enki AIDefaultTool.ATTEMPT,
		Enki AIDefaultTool.PLAN_MODE,
		Enki AIDefaultTool.MCP_DOCS,
		Enki AIDefaultTool.TODO,
		Enki AIDefaultTool.GENERATE_EXPLANATION,
		Enki AIDefaultTool.USE_SKILL,
		Enki AIDefaultTool.USE_SUBAGENTS,
	)
	.placeholders({
		MODEL_FAMILY: ModelFamily.GPT_5,
	})
	.config({})
	// Override the RULES component with custom template
	.overrideComponent(SystemPromptSection.RULES, {
		template: GPT_5_TEMPLATE_OVERRIDES.RULES,
	})
	.build()

// Compile-time validation
const validationResult = validateVariant({ ...config, id: ModelFamily.GPT_5 }, { strict: true })
if (!validationResult.isValid) {
	Logger.error("GPT-5 variant configuration validation failed:", validationResult.errors)
	throw new Error(`Invalid GPT-5 variant configuration: ${validationResult.errors.join(", ")}`)
}

if (validationResult.warnings.length > 0) {
	Logger.warn("GPT-5 variant configuration warnings:", validationResult.warnings)
}

// Export type information for better IDE support
export type GPT5VariantConfig = typeof config
