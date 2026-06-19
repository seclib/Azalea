import {
	ActivatedConditionalRule,
	getRemoteRulesTotalContentWithMetadata,
	getRuleFilesTotalContentWithMetadata,
	RULE_SOURCE_PREFIX,
	RuleLoadResultWithInstructions,
	synchronizeRuleToggles,
} from "@core/context/instructions/user-instructions/rule-helpers"
import { formatResponse } from "@core/prompts/responses"
import { ensureRulesDirectoryExists, GlobalFileNames } from "@core/storage/disk"
import { StateManager } from "@core/storage/StateManager"
import { Enki AIRulesToggles } from "@shared/enki-rules"
import { fileExistsAtPath, isDirectory, readDirectory } from "@utils/fs"
import fs from "fs/promises"
import path from "path"
import { Controller } from "@/core/controller"
import { Logger } from "@/shared/services/Logger"
import { parseYamlFrontmatter } from "./frontmatter"
import { evaluateRuleConditionals, type RuleEvaluationContext } from "./rule-conditionals"

export const getGlobalEnki AIRules = async (
	globalEnki AIRulesFilePath: string,
	toggles: Enki AIRulesToggles,
	opts?: { evaluationContext?: RuleEvaluationContext },
): Promise<RuleLoadResultWithInstructions> => {
	let combinedContent = ""
	const activatedConditionalRules: ActivatedConditionalRule[] = []

	// 1. Get file-based rules
	if (await fileExistsAtPath(globalEnki AIRulesFilePath)) {
		if (await isDirectory(globalEnki AIRulesFilePath)) {
			try {
				const rulesFilePaths = await readDirectory(globalEnki AIRulesFilePath)
				// Note: ruleNamePrefix explicitly set to "global" for clarity (matches the default)
				const rulesFilesTotal = await getRuleFilesTotalContentWithMetadata(
					rulesFilePaths,
					globalEnki AIRulesFilePath,
					toggles,
					{
						evaluationContext: opts?.evaluationContext,
						ruleNamePrefix: "global",
					},
				)
				if (rulesFilesTotal.content) {
					combinedContent = rulesFilesTotal.content
					activatedConditionalRules.push(...rulesFilesTotal.activatedConditionalRules)
				}
			} catch {
				Logger.error(`Failed to read .enkirules directory at ${globalEnki AIRulesFilePath}`)
			}
		} else {
			Logger.error(`${globalEnki AIRulesFilePath} is not a directory`)
		}
	}

	// 2. Append remote config rules
	const stateManager = StateManager.get()
	const remoteConfigSettings = stateManager.getRemoteConfigSettings()
	const remoteRules = remoteConfigSettings.remoteGlobalRules || []
	const remoteToggles = stateManager.getGlobalStateKey("remoteRulesToggles") || {}
	const remoteResult = getRemoteRulesTotalContentWithMetadata(remoteRules, remoteToggles, {
		evaluationContext: opts?.evaluationContext,
	})
	if (remoteResult.content) {
		if (combinedContent) combinedContent += "\n\n"
		combinedContent += remoteResult.content
		activatedConditionalRules.push(...remoteResult.activatedConditionalRules)
	}

	// 3. Return formatted instructions
	if (!combinedContent) {
		return { instructions: undefined, activatedConditionalRules: [] }
	}

	return {
		instructions: formatResponse.enkiRulesGlobalDirectoryInstructions(globalEnki AIRulesFilePath, combinedContent),
		activatedConditionalRules,
	}
}

export const getLocalEnki AIRules = async (
	cwd: string,
	toggles: Enki AIRulesToggles,
	opts?: { evaluationContext?: RuleEvaluationContext },
): Promise<RuleLoadResultWithInstructions> => {
	const enkiRulesFilePath = path.resolve(cwd, GlobalFileNames.enkiRules)

	let instructions: string | undefined
	const activatedConditionalRules: ActivatedConditionalRule[] = []

	if (await fileExistsAtPath(enkiRulesFilePath)) {
		if (await isDirectory(enkiRulesFilePath)) {
			try {
				const rulesFilePaths = await readDirectory(enkiRulesFilePath, [
					[".enkirules", "workflows"],
					[".enkirules", "hooks"],
					[".enkirules", "skills"],
				])

				const rulesFilesTotal = await getRuleFilesTotalContentWithMetadata(rulesFilePaths, cwd, toggles, {
					evaluationContext: opts?.evaluationContext,
					ruleNamePrefix: "workspace",
				})
				if (rulesFilesTotal.content) {
					instructions = formatResponse.enkiRulesLocalDirectoryInstructions(cwd, rulesFilesTotal.content)
					activatedConditionalRules.push(...rulesFilesTotal.activatedConditionalRules)
				}
			} catch {
				Logger.error(`Failed to read .enkirules directory at ${enkiRulesFilePath}`)
			}
		} else {
			try {
				if (enkiRulesFilePath in toggles && toggles[enkiRulesFilePath] !== false) {
					const raw = (await fs.readFile(enkiRulesFilePath, "utf8")).trim()
					if (raw) {
						// Keep single-file .enkirules behavior consistent with directory/remote rules:
						// - Parse YAML frontmatter (fail-open on parse errors)
						// - Evaluate conditionals against the request's evaluation context
						const parsed = parseYamlFrontmatter(raw)
						if (parsed.hadFrontmatter && parsed.parseError) {
							// Fail-open: preserve the raw contents so the LLM can still see the author's intent.
							instructions = formatResponse.enkiRulesLocalFileInstructions(cwd, raw)
						} else {
							const { passed, matchedConditions } = evaluateRuleConditionals(
								parsed.data,
								opts?.evaluationContext ?? {},
							)
							if (passed) {
								instructions = formatResponse.enkiRulesLocalFileInstructions(cwd, parsed.body.trim())
								if (parsed.hadFrontmatter && Object.keys(matchedConditions).length > 0) {
									activatedConditionalRules.push({
										name: `${RULE_SOURCE_PREFIX.workspace}:${GlobalFileNames.enkiRules}`,
										matchedConditions,
									})
								}
							}
						}
					}
				}
			} catch {
				Logger.error(`Failed to read .enkirules file at ${enkiRulesFilePath}`)
			}
		}
	}

	return { instructions, activatedConditionalRules }
}

export async function refreshEnki AIRulesToggles(
	controller: Controller,
	workingDirectory: string,
): Promise<{
	globalToggles: Enki AIRulesToggles
	localToggles: Enki AIRulesToggles
}> {
	// Global toggles
	const globalEnki AIRulesToggles = controller.stateManager.getGlobalSettingsKey("globalEnki AIRulesToggles")
	const globalEnki AIRulesFilePath = await ensureRulesDirectoryExists()
	const updatedGlobalToggles = await synchronizeRuleToggles(globalEnki AIRulesFilePath, globalEnki AIRulesToggles)
	controller.stateManager.setGlobalState("globalEnki AIRulesToggles", updatedGlobalToggles)

	// Local toggles
	const localEnki AIRulesToggles = controller.stateManager.getWorkspaceStateKey("localEnki AIRulesToggles")
	const localEnki AIRulesFilePath = path.resolve(workingDirectory, GlobalFileNames.enkiRules)
	const updatedLocalToggles = await synchronizeRuleToggles(localEnki AIRulesFilePath, localEnki AIRulesToggles, "", [
		[".enkirules", "workflows"],
		[".enkirules", "hooks"],
		[".enkirules", "skills"],
	])
	controller.stateManager.setWorkspaceState("localEnki AIRulesToggles", updatedLocalToggles)

	return {
		globalToggles: updatedGlobalToggles,
		localToggles: updatedLocalToggles,
	}
}
