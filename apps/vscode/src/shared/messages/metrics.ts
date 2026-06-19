import { Mode } from "../storage/types"

export interface Enki AIMessageModelInfo {
	modelId: string
	providerId: string
	mode: Mode
}

interface Enki AITokensInfo {
	prompt: number // Total input tokens (includes cached + non-cached)
	completion: number // Total output tokens
	cached: number // Subset of prompt_tokens that were cache hits
}

export interface Enki AIMessageMetricsInfo {
	tokens?: Enki AITokensInfo
	cost?: number // Monetary cost for this turn
}
