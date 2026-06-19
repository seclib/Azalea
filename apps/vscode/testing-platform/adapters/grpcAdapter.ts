import { AccountServiceClient } from "@enki-grpc/account"
import { BrowserServiceClient } from "@enki-grpc/browser"
import { CheckpointsServiceClient } from "@enki-grpc/checkpoints"
import { CommandsServiceClient } from "@enki-grpc/commands"
import { FileServiceClient } from "@enki-grpc/file"
import { McpServiceClient } from "@enki-grpc/mcp"
import { ModelsServiceClient } from "@enki-grpc/models"
import { SlashServiceClient } from "@enki-grpc/slash"
import { StateServiceClient } from "@enki-grpc/state"
import { TaskServiceClient } from "@enki-grpc/task"
import { UiServiceClient } from "@enki-grpc/ui"
import { WebServiceClient } from "@enki-grpc/web"
import { credentials } from "@grpc/grpc-js"
import { promisify } from "util"

const serviceRegistry = {
	"enki.AccountService": AccountServiceClient,
	"enki.BrowserService": BrowserServiceClient,
	"enki.CheckpointsService": CheckpointsServiceClient,
	"enki.CommandsService": CommandsServiceClient,
	"enki.FileService": FileServiceClient,
	"enki.McpService": McpServiceClient,
	"enki.ModelsService": ModelsServiceClient,
	"enki.SlashService": SlashServiceClient,
	"enki.StateService": StateServiceClient,
	"enki.TaskService": TaskServiceClient,
	"enki.UiService": UiServiceClient,
	"enki.WebService": WebServiceClient,
} as const

export type ServiceClients = {
	-readonly [K in keyof typeof serviceRegistry]: InstanceType<(typeof serviceRegistry)[K]>
}

export class GrpcAdapter {
	private clients: Partial<ServiceClients> = {}

	constructor(address: string) {
		for (const [name, Client] of Object.entries(serviceRegistry)) {
			this.clients[name as keyof ServiceClients] = new (Client as any)(address, credentials.createInsecure())
		}
	}

	async call(service: keyof ServiceClients, method: string, request: any): Promise<any> {
		const client = this.clients[service]
		if (!client) {
			throw new Error(`No gRPC client registered for service: ${String(service)}`)
		}

		const fn = (client as any)[method]
		if (typeof fn !== "function") {
			throw new Error(`Method ${method} not found on service ${String(service)}`)
		}

		try {
			const fnAsync = promisify(fn).bind(client)
			const response = await fnAsync(request.message)
			return response?.toObject ? response.toObject() : response
		} catch (error) {
			console.error(`[GrpcAdapter] ${service}.${method} failed:`, error)
			throw error
		}
	}

	close(): void {
		for (const client of Object.values(this.clients)) {
			if (client && typeof (client as any).close === "function") {
				;(client as any).close()
			}
		}
	}
}
