import {
	getEnki AIPassSubscriptionUrl,
	isEnki AINotSubscribedError,
	isEnki AINotSubscribedMessage,
} from "@enki/core";

export { getEnki AIPassSubscriptionUrl };

function isFormattedEnki AIPassSubscriptionMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return (
		normalized.includes("no access to enkipass subscription models yet") &&
		normalized.includes("subscribe to enkipass")
	);
}

export function isEnki AIPassSubscriptionError(error: unknown): boolean {
	if (isEnki AINotSubscribedError(error)) {
		return true;
	}
	if (error instanceof Error) {
		return (
			error.name === "Enki AINotSubscribedError" ||
			isEnki AINotSubscribedMessage(error.message) ||
			isFormattedEnki AIPassSubscriptionMessage(error.message)
		);
	}
	return (
		typeof error === "string" &&
		(isEnki AINotSubscribedMessage(error) ||
			isFormattedEnki AIPassSubscriptionMessage(error))
	);
}

export function formatCliErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}
