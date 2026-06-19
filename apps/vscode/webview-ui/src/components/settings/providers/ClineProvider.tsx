import { Mode } from "@shared/storage/types"
import { Enki AIAccountInfoCard } from "../Enki AIAccountInfoCard"
import Enki AIModelPicker from "../Enki AIModelPicker"

/**
 * Props for the Enki AIProvider component
 */
interface Enki AIProviderProps {
	showModelOptions: boolean
	isPopup?: boolean
	currentMode: Mode
	initialModelTab?: "recommended" | "free"
	isEnki AIPassEnabled?: boolean
}

/**
 * The Enki AI provider configuration component
 */
export const Enki AIProvider = ({
	showModelOptions,
	isPopup,
	currentMode,
	initialModelTab,
	isEnki AIPassEnabled,
}: Enki AIProviderProps) => {
	return (
		<div>
			{/* Enki AI Account Info Card */}
			<div style={{ marginBottom: 14, marginTop: 4 }}>
				<Enki AIAccountInfoCard />
			</div>

			{showModelOptions && (
				<Enki AIModelPicker
					currentMode={currentMode}
					initialTab={initialModelTab}
					isEnki AIPassEnabled={isEnki AIPassEnabled}
					isPopup={isPopup}
					showProviderRouting={true}
				/>
			)}
		</div>
	)
}
