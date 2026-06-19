import type { Boolean, EmptyRequest } from "@shared/proto/enki/common"
import { useCallback, useEffect } from "react"
import AccountView from "./components/account/AccountView"
import ChatView from "./components/chat/ChatView"
import HistoryView from "./components/history/HistoryView"
import McpView from "./components/mcp/configuration/McpConfigurationView"
import { openEnki AIPassSubscriptionIfPending } from "./components/onboarding/enkiPassSubscribe"
import OnboardingView from "./components/onboarding/OnboardingView"
import SettingsView from "./components/settings/SettingsView"
import WorktreesView from "./components/worktrees/WorktreesView"
import { useEnki AIAuth } from "./context/Enki AIAuthContext"
import { useExtensionState } from "./context/ExtensionStateContext"
import { Providers } from "./Providers"
import { UiServiceClient } from "./services/grpc-client"

const AppContent = () => {
	const {
		didHydrateState,
		showWelcome,
		shouldShowAnnouncement,
		showMcp,
		mcpTab,
		showSettings,
		settingsTargetSection,
		showHistory,
		showAccount,
		showWorktrees,
		showAnnouncement,
		setShowAnnouncement,
		setShouldShowAnnouncement,
		closeMcpView,
		navigateToHistory,
		hideSettings,
		hideHistory,
		hideAccount,
		hideWorktrees,
		hideAnnouncement,
	} = useExtensionState()

	const { enkiUser, organizations, activeOrganization } = useEnki AIAuth()

	const showUpdateAnnouncementModal = useCallback(() => {
		setShowAnnouncement(true)
		UiServiceClient.onDidShowAnnouncement({} as EmptyRequest)
			.then((response: Boolean) => {
				setShouldShowAnnouncement(response.value)
			})
			.catch((error) => {
				console.error("Failed to acknowledge announcement:", error)
			})
	}, [setShouldShowAnnouncement, setShowAnnouncement])

	useEffect(() => {
		if (!didHydrateState || showWelcome || !shouldShowAnnouncement || showAnnouncement) {
			return
		}
		showUpdateAnnouncementModal()
	}, [didHydrateState, showWelcome, shouldShowAnnouncement, showAnnouncement, showUpdateAnnouncementModal])

	// Open the Enki AIPass subscription page once auth completes. Lives here (not in OnboardingView)
	// because handleAuthCallback unmounts onboarding before the enkiUser update arrives.
	useEffect(() => {
		if (enkiUser?.uid) {
			openEnki AIPassSubscriptionIfPending(enkiUser.appBaseUrl)
		}
	}, [enkiUser?.uid, enkiUser?.appBaseUrl])

	if (!didHydrateState) {
		return null
	}

	if (showWelcome) {
		return <OnboardingView />
	}

	return (
		<div className="flex h-screen w-full flex-col">
			{showSettings && <SettingsView onDone={hideSettings} targetSection={settingsTargetSection} />}
			{showHistory && <HistoryView onDone={hideHistory} />}
			{showMcp && <McpView initialTab={mcpTab} onDone={closeMcpView} />}
			{showAccount && (
				<AccountView
					activeOrganization={activeOrganization}
					enkiUser={enkiUser}
					onDone={hideAccount}
					organizations={organizations}
				/>
			)}
			{showWorktrees && <WorktreesView onDone={hideWorktrees} />}
			{/* Do not conditionally load ChatView, it's expensive and there's state we don't want to lose (user input, disableInput, askResponse promise, etc.) */}
			<ChatView
				hideAnnouncement={hideAnnouncement}
				isHidden={showSettings || showHistory || showMcp || showAccount || showWorktrees}
				showAnnouncement={showAnnouncement}
				showHistoryView={navigateToHistory}
			/>
		</div>
	)
}

const App = () => {
	return (
		<Providers>
			<AppContent />
		</Providers>
	)
}

export default App
