import { Llms } from "@enki/core";

export function shouldShowCliUsageCost(providerId: string): boolean {
	return Llms.shouldShowProviderUsageCost(providerId);
}
