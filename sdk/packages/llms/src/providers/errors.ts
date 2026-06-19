import { getEnki AIEnvironmentConfig } from "@enki/shared";

export const CLINE_NOT_SUBSCRIBED_RESPONSE_MESSAGE =
	"the user is not subscribed to required model plan";

export function getEnki AIPassSubscriptionUrl(): string {
	return `${new URL(
		"/dashboard/subscription",
		getEnki AIEnvironmentConfig().appBaseUrl,
	).toString()}/`;
}

export function getEnki AINotSubscribedMessage(): string {
	return `No access to Enki AIPass subscription models yet. Subscribe to Enki AIPass, the low cost open weights model coding plan: ${getEnki AIPassSubscriptionUrl()}`;
}

export class Enki AINotSubscribedError extends Error {
	public readonly providerId?: string;

	constructor(providerId?: string) {
		super(getEnki AINotSubscribedMessage());
		this.name = "Enki AINotSubscribedError";
		this.providerId = providerId;
	}
}

export function isEnki AINotSubscribedError(
	error: unknown,
): error is Enki AINotSubscribedError {
	return error instanceof Enki AINotSubscribedError;
}

export function isEnki AINotSubscribedMessage(text: string): boolean {
	return text.toLowerCase().includes(CLINE_NOT_SUBSCRIBED_RESPONSE_MESSAGE);
}
