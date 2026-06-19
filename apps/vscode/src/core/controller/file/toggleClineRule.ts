import { getWorkspaceBasename } from "@core/workspace"
import type { ToggleEnki AIRuleRequest } from "@shared/proto/enki/file"
import { RuleScope, ToggleEnki AIRules } from "@shared/proto/enki/file"
import { telemetryService } from "@/services/telemetry"
import { Logger } from "@/shared/services/Logger"
import type { Controller } from "../index"

/**
 * Toggles a Enki AI rule (enable or disable)
 * @param controller The controller instance
 * @param request The toggle request
 * @returns The updated Enki AI rule toggles
 */
export async function toggleEnki AIRule(controller: Controller, request: ToggleEnki AIRuleRequest): Promise<ToggleEnki AIRules> {
	const { scope, rulePath, enabled } = request

	if (!rulePath || typeof enabled !== "boolean" || scope === undefined) {
		Logger.error("toggleEnki AIRule: Missing or invalid parameters", {
			rulePath,
			scope,
			enabled: typeof enabled === "boolean" ? enabled : `Invalid: ${typeof enabled}`,
		})
		throw new Error("Missing or invalid parameters for toggleEnki AIRule")
	}

	// Handle the three different scopes
	switch (scope) {
		case RuleScope.GLOBAL: {
			const toggles = controller.stateManager.getGlobalSettingsKey("globalEnki AIRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setGlobalState("globalEnki AIRulesToggles", toggles)
			break
		}
		case RuleScope.LOCAL: {
			const toggles = controller.stateManager.getWorkspaceStateKey("localEnki AIRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setWorkspaceState("localEnki AIRulesToggles", toggles)
			break
		}
		case RuleScope.REMOTE: {
			const toggles = controller.stateManager.getGlobalStateKey("remoteRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setGlobalState("remoteRulesToggles", toggles)
			break
		}
		default:
			throw new Error(`Invalid scope: ${scope}`)
	}

	// Track rule toggle telemetry with current task context
	if (controller.task?.ulid) {
		// Extract just the filename for privacy (no full paths)
		const ruleFileName = getWorkspaceBasename(rulePath, "Controller.toggleEnki AIRule")
		const isGlobal = scope === RuleScope.GLOBAL
		telemetryService.captureEnki AIRuleToggled(controller.task.ulid, ruleFileName, enabled, isGlobal)
	}

	// Get the current state to return in the response
	const globalToggles = controller.stateManager.getGlobalSettingsKey("globalEnki AIRulesToggles")
	const localToggles = controller.stateManager.getWorkspaceStateKey("localEnki AIRulesToggles")
	const remoteToggles = controller.stateManager.getGlobalStateKey("remoteRulesToggles")

	return ToggleEnki AIRules.create({
		globalEnki AIRulesToggles: { toggles: globalToggles },
		localEnki AIRulesToggles: { toggles: localToggles },
		remoteRulesToggles: { toggles: remoteToggles },
	})
}
