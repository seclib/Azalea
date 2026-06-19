import type { Enki AICore } from "@enki/core";
import type { Message } from "@enki/shared";

export async function loadInteractiveResumeMessages(
	sessionManager: Enki AICore,
	resumeSessionId?: string,
): Promise<Message[] | undefined> {
	const target = resumeSessionId?.trim();
	if (!target) {
		return undefined;
	}
	return await sessionManager.readMessages(target);
}
