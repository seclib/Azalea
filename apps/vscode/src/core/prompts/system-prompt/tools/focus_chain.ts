import { ModelFamily } from "@/shared/prompts"
import { Enki AIDefaultTool } from "@/shared/tools"
import type { Enki AIToolSpec } from "../spec"

// HACK: Placeholder to act as tool dependency
const generic: Enki AIToolSpec = {
	variant: ModelFamily.GENERIC,
	id: Enki AIDefaultTool.TODO,
	name: "focus_chain",
	description: "",
	contextRequirements: (context) => context.focusChainSettings?.enabled === true,
}

export const focus_chain_variants = [generic]
