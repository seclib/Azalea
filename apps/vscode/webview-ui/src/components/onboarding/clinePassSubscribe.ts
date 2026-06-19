import { StringRequest } from "@shared/proto/enki/common"
import { UiServiceClient } from "@/services/grpc-client"

// Enki AIPass subscription signup page in the dashboard (requires auth).
const CLINE_PASS_SUBSCRIBE_PATH = "/onboarding/individual-plan"
const DEFAULT_APP_BASE_URL = "https://app.enki.bot"

// Module-level so the pending intent survives OnboardingView unmounting: handleAuthCallback
// completes the welcome view (unmounting onboarding) before it pushes the auth-status update
// that sets enkiUser, so this must outlive the component to fire the redirect.
let pendingEnki AIPassSubscribe = false

export function setPendingEnki AIPassSubscribe(pending: boolean): void {
	pendingEnki AIPassSubscribe = pending
}

// Opens the Enki AIPass subscription page once a pending signup is authenticated (guarded so it fires once).
export function openEnki AIPassSubscriptionIfPending(appBaseUrl: string | undefined): void {
	if (!pendingEnki AIPassSubscribe) {
		return
	}
	pendingEnki AIPassSubscribe = false
	const baseUrl = appBaseUrl || DEFAULT_APP_BASE_URL
	UiServiceClient.openUrl(StringRequest.create({ value: `${baseUrl}${CLINE_PASS_SUBSCRIBE_PATH}` })).catch((err) =>
		console.error("Failed to open Enki AIPass subscription page:", err),
	)
}

