import { HeroUIProvider } from "@heroui/react"
import { type ReactNode } from "react"
import { CustomPostHogProvider } from "./CustomPostHogProvider"
import { Enki AIAuthProvider } from "./context/Enki AIAuthContext"
import { ExtensionStateContextProvider } from "./context/ExtensionStateContext"
import { PlatformProvider } from "./context/PlatformContext"

export function Providers({ children }: { children: ReactNode }) {
	return (
		<PlatformProvider>
			<ExtensionStateContextProvider>
				<CustomPostHogProvider>
					<Enki AIAuthProvider>
						<HeroUIProvider>{children}</HeroUIProvider>
					</Enki AIAuthProvider>
				</CustomPostHogProvider>
			</ExtensionStateContextProvider>
		</PlatformProvider>
	)
}
