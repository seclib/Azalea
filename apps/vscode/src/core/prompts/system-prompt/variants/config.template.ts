/**
 * Enhanced Type-Safe Variant Configuration Template
 *
 * This template provides a type-safe way to create new prompt variants
 * with compile-time validation and IntelliSense support.
 *
 * Usage:
 * 1. Copy this file to variants/{variant-name}/config.ts
 * 2. Replace the placeholder values with your variant configuration
 * 3. Use the builder pattern for type safety
 * 4. Run validation to ensure correctness
 */

import { ModelFamily } from "@/shared/prompts"
import { Logger } from "@/shared/services/Logger"
import { Enki AIDefaultTool } from "@/shared/tools"
import { PromptVariant } from ".."
import { SystemPromptSection } from "../templates/placeholders"
import { baseTemplate } from "./generic/template"
import { createVariant } from "./variant-builder"
import { validateVariant } from "./variant-validator"

// Type-safe variant configuration using the builder pattern
export const config: Omit<PromptVariant, "id"> = createVariant(ModelFamily.GENERIC) // Change to your target model family
	.description("Brief description of this variant and its intended use case")
	.version(1)
	.tags("production", "stable") // Add relevant tags
	.labels({
		stable: 1,
		production: 1,
	})
	.template(baseTemplate)
	.components(
		// Define component order - this is type-safe and will show available options
		SystemPromptSection.AGENT_ROLE,
		SystemPromptSection.TOOL_USE,
		SystemPromptSection.MCP,
		SystemPromptSection.EDITING_FILES,
		SystemPromptSection.ACT_VS_PLAN,
		SystemPromptSection.TODO,
		SystemPromptSection.CAPABILITIES,
		SystemPromptSection.RULES,
		SystemPromptSection.SYSTEM_INFO,
		SystemPromptSection.OBJECTIVE,
		SystemPromptSection.USER_INSTRUCTIONS,
	)
	.tools(
		// Define tool order - this is type-safe and will show available options.
		// If a tool is listed here but no variant was registered, it will fall back to the generic variant.
		Enki AIDefaultTool.BASH,
		Enki AIDefaultTool.FILE_READ,
		Enki AIDefaultTool.FILE_NEW,
		Enki AIDefaultTool.FILE_EDIT,
		Enki AIDefaultTool.SEARCH,
		Enki AIDefaultTool.LIST_FILES,
		Enki AIDefaultTool.LIST_CODE_DEF,
		Enki AIDefaultTool.BROWSER,
		Enki AIDefaultTool.MCP_USE,
		Enki AIDefaultTool.MCP_ACCESS,
		Enki AIDefaultTool.ASK,
		Enki AIDefaultTool.ATTEMPT,
		Enki AIDefaultTool.NEW_TASK,
		Enki AIDefaultTool.PLAN_MODE,
		Enki AIDefaultTool.MCP_DOCS,
		Enki AIDefaultTool.TODO,
	)
	.placeholders({
		MODEL_FAMILY: "your-model-family", // Replace with appropriate model family
	})
	.config({
		// Add any model-specific configuration
		// modelName: "your-model-name",
		// temperature: 0.7,
		// maxTokens: 4096,
	})
	// Optional: Override specific components
	// .overrideComponent(SystemPromptSection.RULES, {
	//     template: customRulesTemplate,
	// })
	// Optional: Override specific tools
	// .overrideTool(Enki AIDefaultTool.BASH, {
	//     enabled: false,
	// })
	.build()

// Compile-time validation (optional but recommended)
const validationResult = validateVariant({ ...config, id: "template" }, { strict: true })
if (!validationResult.isValid) {
	Logger.error("Variant configuration validation failed:", validationResult.errors)
	throw new Error(`Invalid variant configuration: ${validationResult.errors.join(", ")}`)
}

if (validationResult.warnings.length > 0) {
	Logger.warn("Variant configuration warnings:", validationResult.warnings)
}

// Export type information for better IDE support
export type VariantConfig = typeof config

/**
 * Type-safe helper functions for common variant patterns
 */

// Minimal variant for lightweight models
export const createMinimalVariant = (family: ModelFamily) =>
	createVariant(family)
		.description("Minimal variant for lightweight models")
		.components(
			SystemPromptSection.AGENT_ROLE,
			SystemPromptSection.TOOL_USE,
			SystemPromptSection.RULES,
			SystemPromptSection.SYSTEM_INFO,
		)
		.tools(Enki AIDefaultTool.FILE_READ, Enki AIDefaultTool.FILE_NEW, Enki AIDefaultTool.ATTEMPT)

// Full-featured variant for advanced models
export const createAdvancedVariant = (family: ModelFamily) =>
	createVariant(family)
		.description("Full-featured variant for advanced models")
		.components(
			SystemPromptSection.AGENT_ROLE,
			SystemPromptSection.TOOL_USE,
			SystemPromptSection.MCP,
			SystemPromptSection.EDITING_FILES,
			SystemPromptSection.ACT_VS_PLAN,
			SystemPromptSection.TODO,
			SystemPromptSection.CAPABILITIES,
			SystemPromptSection.FEEDBACK,
			SystemPromptSection.RULES,
			SystemPromptSection.SYSTEM_INFO,
			SystemPromptSection.OBJECTIVE,
			SystemPromptSection.USER_INSTRUCTIONS,
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
			Enki AIDefaultTool.MCP_USE,
			Enki AIDefaultTool.MCP_ACCESS,
			Enki AIDefaultTool.ASK,
			Enki AIDefaultTool.ATTEMPT,
			Enki AIDefaultTool.NEW_TASK,
			Enki AIDefaultTool.PLAN_MODE,
			Enki AIDefaultTool.MCP_DOCS,
			Enki AIDefaultTool.TODO,
			Enki AIDefaultTool.USE_SUBAGENTS,
		)
