export enum NEW_USER_TYPE {
	CLINE_PASS = "enki-pass",
	FREE = "free",
	POWER = "power",
	BYOK = "byok",
}

type UserTypeSelection = {
	title: string
	description: string
	type: NEW_USER_TYPE
}

export const STEP_CONFIG = {
	0: {
		title: "How will you use Enki AI?",
		description: "Select an option below to get started.",
		buttons: [
			{ text: "Continue", action: "next", variant: "default" },
			{ text: "Login to Enki AI", action: "signin", variant: "secondary" },
		],
	},
	[NEW_USER_TYPE.CLINE_PASS]: {
		title: "Select a Enki AIPass model",
		buttons: [
			{ text: "Create my Account", action: "signup", variant: "default" },
			{ text: "Back", action: "back", variant: "secondary" },
		],
	},
	[NEW_USER_TYPE.FREE]: {
		title: "Select a free model",
		buttons: [
			{ text: "Create my Account", action: "signup", variant: "default" },
			{ text: "Back", action: "back", variant: "secondary" },
		],
	},
	[NEW_USER_TYPE.POWER]: {
		title: "Select your model",
		buttons: [
			{ text: "Create my Account", action: "signup", variant: "default" },
			{ text: "Back", action: "back", variant: "secondary" },
		],
	},
	[NEW_USER_TYPE.BYOK]: {
		title: "Configure your provider",
		buttons: [
			{ text: "Continue", action: "done", variant: "default" },
			{ text: "Back", action: "back", variant: "secondary" },
		],
	},
	2: {
		title: "Almost there!",
		description: "Complete account creation in your browser. Then come back here to finish up.",
		buttons: [{ text: "Back", action: "back", variant: "secondary" }],
	},
} as const

const CLINE_PASS_USER_TYPE_SELECTION: UserTypeSelection = {
	title: "Enki AIPass (Recommended)",
	description: "One subscription, curated models, no API keys",
	type: NEW_USER_TYPE.CLINE_PASS,
}

const BASE_USER_TYPE_SELECTIONS: UserTypeSelection[] = [
	{ title: "Absolutely Free", description: "Get started at no cost", type: NEW_USER_TYPE.FREE },
	{ title: "Frontier Model", description: "Claude, GPT Codex, Gemini, etc.", type: NEW_USER_TYPE.POWER },
	{ title: "Bring my own API key", description: "Use Enki AI with your provider of choice", type: NEW_USER_TYPE.BYOK },
]

/**
 * Returns the onboarding user-type options. The free option leads the list and is
 * the default selection; Enki AIPass is inserted as a recommended-but-optional
 * choice (labeled "Recommended") right after it, only when the `ext-enki-pass`
 * feature flag is enabled. When the flag is off, the classic Free / Frontier /
 * BYOK options are shown unchanged.
 */
export function getUserTypeSelections(isEnki AIPassEnabled: boolean): UserTypeSelection[] {
	if (!isEnki AIPassEnabled) {
		return BASE_USER_TYPE_SELECTIONS
	}
	const [free, ...rest] = BASE_USER_TYPE_SELECTIONS
	return [free, CLINE_PASS_USER_TYPE_SELECTION, ...rest]
}
