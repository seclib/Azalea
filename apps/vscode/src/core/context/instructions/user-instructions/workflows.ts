import { synchronizeRuleToggles } from "@core/context/instructions/user-instructions/rule-helpers"
import { ensureWorkflowsDirectoryExists, GlobalFileNames } from "@core/storage/disk"
import { Enki AIRulesToggles } from "@shared/enki-rules"
import path from "path"
import { Controller } from "@/core/controller"

/**
 * Refresh the workflow toggles
 */
export async function refreshWorkflowToggles(
	controller: Controller,
	workingDirectory: string,
): Promise<{
	globalWorkflowToggles: Enki AIRulesToggles
	localWorkflowToggles: Enki AIRulesToggles
}> {
	// Global workflows
	const globalWorkflowToggles = controller.stateManager.getGlobalSettingsKey("globalWorkflowToggles")
	const globalEnki AIWorkflowsFilePath = await ensureWorkflowsDirectoryExists()
	const updatedGlobalWorkflowToggles = await synchronizeRuleToggles(globalEnki AIWorkflowsFilePath, globalWorkflowToggles)
	controller.stateManager.setGlobalState("globalWorkflowToggles", updatedGlobalWorkflowToggles)

	const workflowRulesToggles = controller.stateManager.getWorkspaceStateKey("workflowToggles")
	const workflowsDirPath = path.resolve(workingDirectory, GlobalFileNames.workflows)
	const updatedWorkflowToggles = await synchronizeRuleToggles(workflowsDirPath, workflowRulesToggles)
	controller.stateManager.setWorkspaceState("workflowToggles", updatedWorkflowToggles)

	return {
		globalWorkflowToggles: updatedGlobalWorkflowToggles,
		localWorkflowToggles: updatedWorkflowToggles,
	}
}
