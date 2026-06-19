import type { Anthropic } from "@anthropic-ai/sdk";
import type { Enki AIMessageMetricsInfo, Enki AIMessageModelInfo } from "./metrics";

export type Enki AIPromptInputContent = string;

export type Enki AIMessageRole = "user" | "assistant";

export interface Enki AIReasoningDetailParam {
	type: "reasoning.text" | string;
	text: string;
	signature: string;
	format: "anthropic-claude-v1" | string;
	index: number;
}

interface Enki AISharedMessageParam {
	// The id of the response that the block belongs to
	call_id?: string;
}

export const REASONING_DETAILS_PROVIDERS = ["enki", "openrouter"];

/**
 * An extension of Anthropic.MessageParam that includes Enki AI-specific fields: reasoning_details.
 * This ensures backward compatibility where the messages were stored in Anthropic format with additional
 * fields unknown to Anthropic SDK.
 */
export interface Enki AITextContentBlock
	extends Anthropic.TextBlockParam,
		Enki AISharedMessageParam {
	// reasoning_details only exists for providers listed in REASONING_DETAILS_PROVIDERS
	reasoning_details?: Enki AIReasoningDetailParam[];
	// Thought Signature associates with Gemini
	signature?: string;
}

export interface Enki AIImageContentBlock
	extends Anthropic.ImageBlockParam,
		Enki AISharedMessageParam {}

export interface Enki AIDocumentContentBlock
	extends Anthropic.DocumentBlockParam,
		Enki AISharedMessageParam {}

export interface Enki AIUserToolResultContentBlock
	extends Anthropic.ToolResultBlockParam,
		Enki AISharedMessageParam {}

/**
 * Assistant only content types
 */
export interface Enki AIAssistantToolUseBlock
	extends Anthropic.ToolUseBlockParam,
		Enki AISharedMessageParam {
	// reasoning_details only exists for providers listed in REASONING_DETAILS_PROVIDERS
	reasoning_details?: unknown[] | Enki AIReasoningDetailParam[];
	// Thought Signature associates with Gemini
	signature?: string;
}

export interface Enki AIAssistantThinkingBlock
	extends Anthropic.ThinkingBlock,
		Enki AISharedMessageParam {
	// The summary items returned by OpenAI response API
	// The reasoning details that will be moved to the text block when finalized
	summary?: unknown[] | Enki AIReasoningDetailParam[];
}

export interface Enki AIAssistantRedactedThinkingBlock
	extends Anthropic.RedactedThinkingBlockParam,
		Enki AISharedMessageParam {}

export type Enki AIToolResponseContent =
	| Enki AIPromptInputContent
	| Array<Enki AITextContentBlock | Enki AIImageContentBlock>;

export type Enki AIUserContent =
	| Enki AITextContentBlock
	| Enki AIImageContentBlock
	| Enki AIDocumentContentBlock
	| Enki AIUserToolResultContentBlock;

export type Enki AIAssistantContent =
	| Enki AITextContentBlock
	| Enki AIImageContentBlock
	| Enki AIDocumentContentBlock
	| Enki AIAssistantToolUseBlock
	| Enki AIAssistantThinkingBlock
	| Enki AIAssistantRedactedThinkingBlock;

export type Enki AIContent = Enki AIUserContent | Enki AIAssistantContent;

/**
 * An extension of Anthropic.MessageParam that includes Enki AI-specific fields.
 * This ensures backward compatibility where the messages were stored in Anthropic format,
 * while allowing for additional metadata specific to Enki AI to avoid unknown fields in Anthropic SDK
 * added by ignoring the type checking for those fields.
 */
export interface Enki AIStorageMessage extends Anthropic.MessageParam {
	/**
	 * Response ID associated with this message
	 */
	id?: string;
	role: Enki AIMessageRole;
	content: Enki AIPromptInputContent | Enki AIContent[];
	/**
	 * NOTE: model information used when generating this message.
	 * Internal use for message conversion only.
	 * MUST be removed before sending message to any LLM provider.
	 */
	modelInfo?: Enki AIMessageModelInfo;
	/**
	 * LLM operational and performance metrics for this message
	 * Includes token counts, costs.
	 */
	metrics?: Enki AIMessageMetricsInfo;
	/**
	 * Timestamp of when the message was created
	 */
	ts?: number;
}

/**
 * Converts Enki AIStorageMessage to Anthropic.MessageParam by removing Enki AI-specific fields
 * Enki AI-specific fields (like modelInfo, reasoning_details) are properly omitted.
 */
export function convertEnki AIStorageToAnthropicMessage(
	enkiMessage: Enki AIStorageMessage,
	provider = "anthropic",
): Anthropic.MessageParam {
	const { role, content } = enkiMessage;

	// Handle string content - fast path
	if (typeof content === "string") {
		return { role, content };
	}

	// Removes thinking block that has no signature (invalid thinking block that's incompatible with Anthropic API)
	const filteredContent = content.filter(
		(b) => b.type !== "thinking" || !!b.signature,
	);

	// Handle array content - strip Enki AI-specific fields for non-reasoning_details providers
	const shouldCleanContent = !REASONING_DETAILS_PROVIDERS.includes(provider);
	const cleanedContent = shouldCleanContent
		? filteredContent.map(cleanContentBlock)
		: (filteredContent as Anthropic.MessageParam["content"]);

	return { role, content: cleanedContent };
}

/**
 * Enki AI stores images as base64, so an image block's source is always a base64 source.
 * The Anthropic SDK types the source as a Base64ImageSource | URLImageSource union, so this
 * narrows to the base64 variant for the transform layer. URL sources are not produced by Enki AI,
 * so they degrade to empty values rather than throwing.
 */
export function getBase64ImageSource(
	source: Anthropic.ImageBlockParam["source"],
): { mediaType: string; data: string } {
	if (source.type === "base64") {
		return { mediaType: source.media_type, data: source.data };
	}
	return { mediaType: "", data: "" };
}

/**
 * Builds a base64 data URL from an image block's source. See getBase64ImageSource.
 */
export function getImageDataUrl(
	source: Anthropic.ImageBlockParam["source"],
): string {
	const { mediaType, data } = getBase64ImageSource(source);
	return `data:${mediaType};base64,${data}`;
}

/**
 * Clean a content block by removing Enki AI-specific fields and returning only Anthropic-compatible fields
 */
export function cleanContentBlock(block: Enki AIContent): Anthropic.ContentBlock {
	// Fast path: if no Enki AI-specific fields exist, return as-is
	const hasEnki AIFields =
		"reasoning_details" in block ||
		"call_id" in block ||
		"summary" in block ||
		(block.type !== "thinking" && "signature" in block);

	if (!hasEnki AIFields) {
		return block as Anthropic.ContentBlock;
	}

	// Removes Enki AI-specific fields & the signature field that's added for Gemini.
	const { reasoning_details, call_id, summary, ...rest } = block as any;

	// Remove signature from non-thinking blocks that were added for Gemini
	if (block.type !== "thinking" && rest.signature) {
		rest.signature = undefined;
	}

	return rest satisfies Anthropic.ContentBlock;
}
