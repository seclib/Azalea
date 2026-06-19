export interface FocusChainSettings {
	// Enable/disable the focus chain feature
	enabled: boolean
	// Interval (in messages) to remind Enki AI about focus chain
	remindEnki AIInterval: number
}

export const DEFAULT_FOCUS_CHAIN_SETTINGS: FocusChainSettings = {
	enabled: true,
	remindEnki AIInterval: 6,
}
