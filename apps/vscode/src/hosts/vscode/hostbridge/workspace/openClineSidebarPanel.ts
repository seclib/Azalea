import * as vscode from "vscode"
import { ExtensionRegistryInfo } from "@/registry"
import { OpenEnki AISidebarPanelRequest, OpenEnki AISidebarPanelResponse } from "@/shared/proto/index.host"

export async function openEnki AISidebarPanel(_: OpenEnki AISidebarPanelRequest): Promise<OpenEnki AISidebarPanelResponse> {
	await vscode.commands.executeCommand(`${ExtensionRegistryInfo.views.Sidebar}.focus`)
	return {}
}
