import { SystemPromptSection } from "../templates/placeholders"
import { TemplateEngine } from "../templates/TemplateEngine"
import type { PromptVariant, SystemPromptContext } from "../types"

const USER_CUSTOM_INSTRUCTIONS_TEMPLATE_TEXT = `USER'S CUSTOM INSTRUCTIONS

The following additional instructions are provided by the user, and should be followed to the best of your ability without interfering with the TOOL USE guidelines.

{{CUSTOM_INSTRUCTIONS}}`

export async function getUserInstructions(variant: PromptVariant, context: SystemPromptContext): Promise<string | undefined> {
	const customInstructions = buildUserInstructions(
		context.globalEnki AIRulesFileInstructions,
		context.localEnki AIRulesFileInstructions,
		context.localCursorRulesFileInstructions,
		context.localCursorRulesDirInstructions,
		context.localWindsurfRulesFileInstructions,
		context.localAgentsRulesFileInstructions,
		context.enkiIgnoreInstructions,
		context.preferredLanguageInstructions,
	)

	if (!customInstructions) {
		return undefined
	}

	const template =
		variant.componentOverrides?.[SystemPromptSection.USER_INSTRUCTIONS]?.template || USER_CUSTOM_INSTRUCTIONS_TEMPLATE_TEXT

	return new TemplateEngine().resolve(template, context, {
		CUSTOM_INSTRUCTIONS: customInstructions,
	})
}

function buildUserInstructions(
	globalEnki AIRulesFileInstructions?: string,
	localEnki AIRulesFileInstructions?: string,
	localCursorRulesFileInstructions?: string,
	localCursorRulesDirInstructions?: string,
	localWindsurfRulesFileInstructions?: string,
	localAgentsRulesFileInstructions?: string,
	enkiIgnoreInstructions?: string,
	preferredLanguageInstructions?: string,
): string | undefined {
	const customInstructions = []
	if (preferredLanguageInstructions) {
		customInstructions.push(preferredLanguageInstructions)
	}
	if (globalEnki AIRulesFileInstructions) {
		customInstructions.push(globalEnki AIRulesFileInstructions)
	}
	if (localEnki AIRulesFileInstructions) {
		customInstructions.push(localEnki AIRulesFileInstructions)
	}
	if (localCursorRulesFileInstructions) {
		customInstructions.push(localCursorRulesFileInstructions)
	}
	if (localCursorRulesDirInstructions) {
		customInstructions.push(localCursorRulesDirInstructions)
	}
	if (localWindsurfRulesFileInstructions) {
		customInstructions.push(localWindsurfRulesFileInstructions)
	}
	if (localAgentsRulesFileInstructions) {
		customInstructions.push(localAgentsRulesFileInstructions)
	}
	if (enkiIgnoreInstructions) {
		customInstructions.push(enkiIgnoreInstructions)
	}
	if (customInstructions.length === 0) {
		return undefined
	}
	return customInstructions.join("\n\n")
}
