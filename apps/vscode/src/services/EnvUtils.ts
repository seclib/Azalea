import { isMultiRootWorkspace } from "@/core/workspace/utils/workspace-detection"
import { HostProvider } from "@/hosts/host-provider"
import { ExtensionRegistryInfo } from "@/registry"
import { EmptyRequest } from "@/shared/proto/enki/common"
import { Logger } from "@/shared/services/Logger"

// Canonical header names for extra client/host context
export const Enki AIHeaders = {
	PLATFORM: "X-PLATFORM",
	PLATFORM_VERSION: "X-PLATFORM-VERSION",
	CLIENT_VERSION: "X-CLIENT-VERSION",
	CLIENT_TYPE: "X-CLIENT-TYPE",
	CORE_VERSION: "X-CORE-VERSION",
	IS_MULTIROOT: "X-IS-MULTIROOT",
} as const
export type Enki AIHeaderName = (typeof Enki AIHeaders)[keyof typeof Enki AIHeaders]

export function buildExternalBasicHeaders(): Record<string, string> {
	return {
		"User-Agent": `Enki AI/${ExtensionRegistryInfo.version}`,
	}
}

export async function buildBasicEnki AIHeaders(): Promise<Record<string, string>> {
	const headers: Record<string, string> = buildExternalBasicHeaders()
	try {
		const host = await HostProvider.env.getHostVersion(EmptyRequest.create({}))
		headers[Enki AIHeaders.PLATFORM] = host.platform || "unknown"
		headers[Enki AIHeaders.PLATFORM_VERSION] = host.version || "unknown"
		headers[Enki AIHeaders.CLIENT_TYPE] = host.enkiType || "unknown"
		headers[Enki AIHeaders.CLIENT_VERSION] = host.enkiVersion || "unknown"
	} catch (error) {
		Logger.log("Failed to get IDE/platform info via HostBridge EnvService.getHostVersion", error)
		headers[Enki AIHeaders.PLATFORM] = "unknown"
		headers[Enki AIHeaders.PLATFORM_VERSION] = "unknown"
		headers[Enki AIHeaders.CLIENT_TYPE] = "unknown"
		headers[Enki AIHeaders.CLIENT_VERSION] = "unknown"
	}
	headers[Enki AIHeaders.CORE_VERSION] = ExtensionRegistryInfo.version

	return headers
}

export async function buildEnki AIExtraHeaders(): Promise<Record<string, string>> {
	const headers = await buildBasicEnki AIHeaders()

	try {
		const isMultiRoot = await isMultiRootWorkspace()
		headers[Enki AIHeaders.IS_MULTIROOT] = isMultiRoot ? "true" : "false"
	} catch (error) {
		Logger.log("Failed to detect multi-root workspace", error)
		headers[Enki AIHeaders.IS_MULTIROOT] = "false"
	}

	return headers
}
