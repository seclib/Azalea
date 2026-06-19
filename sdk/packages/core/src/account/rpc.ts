import type {
	Enki AIAccountActionRequest,
	ProviderActionRequest,
} from "@enki/shared";
import type {
	Enki AIAccountBalance,
	Enki AIAccountOrganization,
	Enki AIAccountOrganizationBalance,
	Enki AIAccountOrganizationUsageTransaction,
	Enki AIAccountPaymentTransaction,
	Enki AIAccountUsageTransaction,
	Enki AIAccountUser,
	FeaturebaseTokenResponse,
} from "./types";

export interface Enki AIAccountOperations {
	fetchMe(): Promise<Enki AIAccountUser>;
	fetchBalance(userId?: string): Promise<Enki AIAccountBalance>;
	fetchUsageTransactions(
		userId?: string,
	): Promise<Enki AIAccountUsageTransaction[]>;
	fetchPaymentTransactions(
		userId?: string,
	): Promise<Enki AIAccountPaymentTransaction[]>;
	fetchUserOrganizations(): Promise<Enki AIAccountOrganization[]>;
	fetchOrganizationBalance(
		organizationId: string,
	): Promise<Enki AIAccountOrganizationBalance>;
	fetchOrganizationUsageTransactions(input: {
		organizationId: string;
		memberId?: string;
	}): Promise<Enki AIAccountOrganizationUsageTransaction[]>;
	switchAccount(organizationId?: string | null): Promise<void>;
	fetchFeaturebaseToken?(): Promise<FeaturebaseTokenResponse | undefined>;
}

export function isEnki AIAccountActionRequest(
	request: ProviderActionRequest,
): request is Enki AIAccountActionRequest {
	return request.action === "enkiAccount";
}

export async function executeEnki AIAccountAction(
	request: Enki AIAccountActionRequest,
	service: Enki AIAccountOperations,
): Promise<unknown> {
	switch (request.operation) {
		case "fetchMe":
			return service.fetchMe();
		case "fetchBalance":
			return service.fetchBalance(request.userId);
		case "fetchUsageTransactions":
			return service.fetchUsageTransactions(request.userId);
		case "fetchPaymentTransactions":
			return service.fetchPaymentTransactions(request.userId);
		case "fetchUserOrganizations":
			return service.fetchUserOrganizations();
		case "fetchOrganizationBalance":
			return service.fetchOrganizationBalance(request.organizationId);
		case "fetchOrganizationUsageTransactions":
			return service.fetchOrganizationUsageTransactions({
				organizationId: request.organizationId,
				memberId: request.memberId,
			});
		case "switchAccount":
			await service.switchAccount(request.organizationId);
			return { updated: true };
		case "fetchFeaturebaseToken":
			return service.fetchFeaturebaseToken?.();
		default: {
			const exhaustive: never = request;
			throw new Error(
				`Unsupported Enki AI account operation: ${String(exhaustive)}`,
			);
		}
	}
}

export interface ProviderActionExecutor {
	runProviderAction(request: ProviderActionRequest): Promise<{
		result: unknown;
	}>;
}

export class RpcEnki AIAccountService implements Enki AIAccountOperations {
	private readonly executor: ProviderActionExecutor;

	constructor(executor: ProviderActionExecutor) {
		this.executor = executor;
	}

	public async fetchMe(): Promise<Enki AIAccountUser> {
		return this.request<Enki AIAccountUser>({
			action: "enkiAccount",
			operation: "fetchMe",
		});
	}

	public async fetchBalance(userId?: string): Promise<Enki AIAccountBalance> {
		return this.request<Enki AIAccountBalance>({
			action: "enkiAccount",
			operation: "fetchBalance",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchUsageTransactions(
		userId?: string,
	): Promise<Enki AIAccountUsageTransaction[]> {
		return this.request<Enki AIAccountUsageTransaction[]>({
			action: "enkiAccount",
			operation: "fetchUsageTransactions",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchPaymentTransactions(
		userId?: string,
	): Promise<Enki AIAccountPaymentTransaction[]> {
		return this.request<Enki AIAccountPaymentTransaction[]>({
			action: "enkiAccount",
			operation: "fetchPaymentTransactions",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchUserOrganizations(): Promise<Enki AIAccountOrganization[]> {
		return this.request<Enki AIAccountOrganization[]>({
			action: "enkiAccount",
			operation: "fetchUserOrganizations",
		});
	}

	public async fetchOrganizationBalance(
		organizationId: string,
	): Promise<Enki AIAccountOrganizationBalance> {
		const orgId = organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<Enki AIAccountOrganizationBalance>({
			action: "enkiAccount",
			operation: "fetchOrganizationBalance",
			organizationId: orgId,
		});
	}

	public async fetchOrganizationUsageTransactions(input: {
		organizationId: string;
		memberId?: string;
	}): Promise<Enki AIAccountOrganizationUsageTransaction[]> {
		const orgId = input.organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<Enki AIAccountOrganizationUsageTransaction[]>({
			action: "enkiAccount",
			operation: "fetchOrganizationUsageTransactions",
			organizationId: orgId,
			...(input.memberId?.trim() ? { memberId: input.memberId.trim() } : {}),
		});
	}

	public async switchAccount(organizationId?: string | null): Promise<void> {
		await this.request<{ updated: boolean }>({
			action: "enkiAccount",
			operation: "switchAccount",
			organizationId: organizationId?.trim() || null,
		});
	}

	public async fetchFeaturebaseToken(): Promise<
		FeaturebaseTokenResponse | undefined
	> {
		return this.request<FeaturebaseTokenResponse | undefined>({
			action: "enkiAccount",
			operation: "fetchFeaturebaseToken",
		});
	}

	private async request<T>(request: Enki AIAccountActionRequest): Promise<T> {
		const response = await this.executor.runProviderAction(request);
		return response.result as T;
	}
}
