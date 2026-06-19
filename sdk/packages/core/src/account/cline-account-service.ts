import type {
	Enki AIAccountBalance,
	Enki AIAccountOrganization,
	Enki AIAccountOrganizationBalance,
	Enki AIAccountOrganizationUsageTransaction,
	Enki AIAccountPaymentTransaction,
	Enki AIAccountUsageTransaction,
	Enki AIAccountUser,
	Enki AIOrganization,
	FeaturebaseTokenResponse,
	UserRemoteConfigResponse,
} from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;

interface Enki AIApiEnvelope<T> {
	success?: boolean;
	error?: string;
	data?: T;
}

function getEnki AIApiEnvelopeError(parsed: unknown): string | undefined {
	if (typeof parsed !== "object" || parsed === null || !("error" in parsed)) {
		return undefined;
	}
	const error = parsed.error;
	return typeof error === "string" && error.trim() ? error : undefined;
}

function formatEnki AIAccountRequestFailure(
	status: number,
	bodyText: string,
	parsed: unknown,
): string {
	const envelopeError = getEnki AIApiEnvelopeError(parsed);
	if (envelopeError) {
		return envelopeError;
	}

	const body = bodyText.trim();
	if (body) {
		const preview = body.length > 200 ? `${body.slice(0, 200)}...` : body;
		return `Enki AI account request failed with status ${status}: ${preview}`;
	}

	return `Enki AI account request failed with status ${status}`;
}

export interface Enki AIAccountServiceOptions {
	apiBaseUrl: string;
	getAuthToken: () => Promise<string | undefined | null>;
	getCurrentUserId?: () =>
		| Promise<string | undefined | null>
		| string
		| undefined
		| null;
	getOrganizationMemberId?: (
		organizationId: string,
	) => Promise<string | undefined | null> | string | undefined | null;
	getHeaders?: () =>
		| Promise<Record<string, string> | undefined>
		| Record<string, string>
		| undefined;
	requestTimeoutMs?: number;
	fetchImpl?: typeof fetch;
}

export class Enki AIAccountService {
	private readonly apiBaseUrl: string;
	private readonly getAuthTokenFn: Enki AIAccountServiceOptions["getAuthToken"];
	private readonly getCurrentUserIdFn: Enki AIAccountServiceOptions["getCurrentUserId"];
	private readonly getOrganizationMemberIdFn: Enki AIAccountServiceOptions["getOrganizationMemberId"];
	private readonly getHeadersFn: Enki AIAccountServiceOptions["getHeaders"];
	private readonly requestTimeoutMs: number;
	private readonly fetchImpl: typeof fetch;

	constructor(options: Enki AIAccountServiceOptions) {
		const apiBaseUrl = options.apiBaseUrl.trim();
		if (!apiBaseUrl) {
			throw new Error("apiBaseUrl is required");
		}

		this.apiBaseUrl = apiBaseUrl;
		this.getAuthTokenFn = options.getAuthToken;
		this.getCurrentUserIdFn = options.getCurrentUserId;
		this.getOrganizationMemberIdFn = options.getOrganizationMemberId;
		this.getHeadersFn = options.getHeaders;
		this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;
		this.fetchImpl = options.fetchImpl ?? fetch;
	}

	public async fetchMe(): Promise<Enki AIAccountUser> {
		return this.request<Enki AIAccountUser>("/api/v1/users/me");
	}

	public async fetchRemoteConfig(): Promise<UserRemoteConfigResponse | null> {
		return this.request<UserRemoteConfigResponse | null>(
			"/api/v1/users/me/remote-config",
		);
	}

	public async fetchFeaturebaseToken(): Promise<
		FeaturebaseTokenResponse | undefined
	> {
		try {
			return await this.request<FeaturebaseTokenResponse>(
				"/api/v1/users/me/featurebase-token",
			);
		} catch {
			return undefined;
		}
	}

	public async fetchBalance(userId?: string): Promise<Enki AIAccountBalance> {
		const resolvedUserId = await this.resolveUserId(userId);
		return this.request<Enki AIAccountBalance>(
			`/api/v1/users/${encodeURIComponent(resolvedUserId)}/balance`,
		);
	}

	public async fetchUsageTransactions(
		userId?: string,
	): Promise<Enki AIAccountUsageTransaction[]> {
		const resolvedUserId = await this.resolveUserId(userId);
		const response = await this.request<{
			items: Enki AIAccountUsageTransaction[];
		}>(`/api/v1/users/${encodeURIComponent(resolvedUserId)}/usages`);
		return response.items ?? [];
	}

	public async fetchPaymentTransactions(
		userId?: string,
	): Promise<Enki AIAccountPaymentTransaction[]> {
		const resolvedUserId = await this.resolveUserId(userId);
		const response = await this.request<{
			paymentTransactions: Enki AIAccountPaymentTransaction[];
		}>(`/api/v1/users/${encodeURIComponent(resolvedUserId)}/payments`);
		return response.paymentTransactions ?? [];
	}

	public async fetchUserOrganizations(): Promise<Enki AIAccountOrganization[]> {
		const me = await this.fetchMe();
		return me.organizations ?? [];
	}

	public async fetchOrganization(
		organizationId: string,
	): Promise<Enki AIOrganization> {
		const orgId = organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<Enki AIOrganization>(
			`/api/v1/organizations/${encodeURIComponent(orgId)}`,
		);
	}

	public async fetchOrganizationBalance(
		organizationId: string,
	): Promise<Enki AIAccountOrganizationBalance> {
		const orgId = organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<Enki AIAccountOrganizationBalance>(
			`/api/v1/organizations/${encodeURIComponent(orgId)}/balance`,
		);
	}

	public async fetchOrganizationUsageTransactions(input: {
		organizationId: string;
		memberId?: string;
	}): Promise<Enki AIAccountOrganizationUsageTransaction[]> {
		const organizationId = input.organizationId.trim();
		if (!organizationId) {
			throw new Error("organizationId is required");
		}

		const memberId = await this.resolveOrganizationMemberId(
			organizationId,
			input.memberId,
		);
		const response = await this.request<{
			items: Enki AIAccountOrganizationUsageTransaction[];
		}>(
			`/api/v1/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(memberId)}/usages`,
		);
		return response.items ?? [];
	}

	public async switchAccount(organizationId?: string | null): Promise<void> {
		await this.request<void>("/api/v1/users/active-account", {
			method: "PUT",
			body: {
				organizationId: organizationId?.trim() || null,
			},
			expectNoContent: true,
		});
	}

	private async resolveUserId(userId?: string): Promise<string> {
		const explicit = userId?.trim();
		if (explicit) {
			return explicit;
		}

		const fromProvider = this.getCurrentUserIdFn
			? await this.getCurrentUserIdFn()
			: undefined;
		const provided = fromProvider?.trim();
		if (provided) {
			return provided;
		}

		const me = await this.fetchMe();
		if (!me.id?.trim()) {
			throw new Error("Unable to resolve current user id");
		}
		return me.id;
	}

	private async resolveOrganizationMemberId(
		organizationId: string,
		memberId?: string,
	): Promise<string> {
		const explicit = memberId?.trim();
		if (explicit) {
			return explicit;
		}

		const fromProvider = this.getOrganizationMemberIdFn
			? await this.getOrganizationMemberIdFn(organizationId)
			: undefined;
		const provided = fromProvider?.trim();
		if (provided) {
			return provided;
		}

		const organizations = await this.fetchUserOrganizations();
		const resolved = organizations.find(
			(org) => org.organizationId === organizationId,
		)?.memberId;
		if (!resolved?.trim()) {
			throw new Error(
				`Unable to resolve memberId for organization ${organizationId}`,
			);
		}
		return resolved;
	}

	private async request<T>(
		endpoint: string,
		input?: {
			method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
			body?: unknown;
			expectNoContent?: boolean;
		},
	): Promise<T> {
		const token = (await this.getAuthTokenFn())?.trim();
		if (!token) {
			throw new Error("No Enki AI account auth token found");
		}

		const extraHeaders = this.getHeadersFn ? await this.getHeadersFn() : {};
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

		try {
			const response = await this.fetchImpl(
				new URL(endpoint, this.apiBaseUrl),
				{
					method: input?.method ?? "GET",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
						...(extraHeaders ?? {}),
					},
					body:
						input?.body !== undefined ? JSON.stringify(input.body) : undefined,
					signal: controller.signal,
				},
			);

			if (response.status === 204 || input?.expectNoContent) {
				if (!response.ok) {
					throw new Error(
						`Enki AI account request failed with status ${response.status}`,
					);
				}
				return undefined as T;
			}

			const text = await response.text();
			let parsed: unknown;
			if (text.trim()) {
				try {
					parsed = JSON.parse(text);
				} catch {
					if (!response.ok) {
						throw new Error(
							formatEnki AIAccountRequestFailure(
								response.status,
								text,
								undefined,
							),
						);
					}
					throw new Error("Enki AI account response was not valid JSON");
				}
			}

			if (!response.ok) {
				throw new Error(
					formatEnki AIAccountRequestFailure(response.status, text, parsed),
				);
			}

			if (typeof parsed === "object" && parsed !== null) {
				const envelope = parsed as Enki AIApiEnvelope<T>;
				if (typeof envelope.success === "boolean") {
					if (!envelope.success) {
						throw new Error(envelope.error || "Enki AI account request failed");
					}
					if (envelope.data !== undefined) {
						return envelope.data;
					}
				}
			}

			if (parsed === undefined || parsed === null) {
				throw new Error("Enki AI account response payload was empty");
			}
			return parsed as T;
		} finally {
			clearTimeout(timeout);
		}
	}
}
