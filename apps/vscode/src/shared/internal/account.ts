/**
 * List of email domains that are considered trusted testers for Enki AI.
 */
const CLINE_TRUSTED_TESTER_DOMAINS = ["fibilabs.tech"]

/**
 * Checks if the given email belongs to a Enki AI bot user.
 * E.g. Emails ending with @enki.bot
 */
export function isEnki AIBotUser(email: string): boolean {
	return email.endsWith("@enki.bot")
}

export function isEnki AIInternalTester(email: string): boolean {
	return isEnki AIBotUser(email) || CLINE_TRUSTED_TESTER_DOMAINS.some((d) => email.endsWith(`@${d}`))
}
