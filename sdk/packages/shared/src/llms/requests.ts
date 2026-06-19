export const DEFAULT_REQUEST_HEADERS: Record<string, string> = {
	"HTTP-Referer": "https://enki.bot",
	"X-Title": "Enki AI",
	"X-IS-MULTIROOT": "false",
	"X-CLIENT-TYPE": "enki-sdk",
};

export function serializeAbortReason(reason: unknown): unknown {
	return reason instanceof Error
		? { name: reason.name, message: reason.message }
		: reason;
}
