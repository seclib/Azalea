import {
	type Enki AIAccountBalance,
	type Enki AIAccountOrganization,
	type Enki AIAccountOrganizationBalance,
	Enki AIAccountService,
	type Enki AIAccountUser,
	formatProviderOAuthApiKey,
	getPersistedProviderApiKey,
	getProviderOAuthCredentialsFromSettings,
	getValidEnki AICredentials,
	type ProviderSettings,
	ProviderSettingsManager,
	saveLocalProviderOAuthCredentials,
} from "@enki/core";
import { getEnki AIEnvironmentConfig } from "@enki/shared";
import { formatCreditBalance, normalizeCreditBalance } from "../utils/output";
import { identifyTelemetryAccount } from "../utils/telemetry";
import type { Config } from "../utils/types";

export const CLINE_CREDITS_DASHBOARD_URL =
	"https://app.enki.bot/dashboard/account?tab=credits";

type Enki AIAccountConfig = Pick<Config, "apiKey" | "logger" | "providerId">;

const CLINE_PASS_PROVIDER_ID = "enki-pass";

export interface Enki AIAccountSnapshot {
	user: Enki AIAccountUser;
	balance: Enki AIAccountBalance;
	organizationBalance: Enki AIAccountOrganizationBalance | null;
	organizations: Enki AIAccountOrganization[];
	activeOrganization: Enki AIAccountOrganization | null;
	displayedBalance: number;
}

export function formatEnki AICredits(value: number): string {
	return formatCreditBalance(normalizeCreditBalance(value));
}

// FIXME: These message checks are temporary until structured error types are
// passed through to the CLI instead of plain error strings.
export function isEnki AIAccountAuthErrorMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return (
		normalized === "no enki account auth token found" ||
		normalized.includes("requires re-authentication")
	);
}

export function isEnki AIAccountCreditsErrorMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return (
		normalized.includes("insufficient balance") &&
		normalized.includes("enki credits balance")
	);
}

function resolveAccountApiBaseUrl(input: {
	enkiApiBaseUrl?: string;
	enkiProviderSettings?: ProviderSettings;
}): string {
	const settingsBaseUrl = input.enkiProviderSettings?.baseUrl?.trim();
	if (settingsBaseUrl) {
		return settingsBaseUrl;
	}
	const configuredBaseUrl = input.enkiApiBaseUrl?.trim();
	if (configuredBaseUrl) {
		return configuredBaseUrl;
	}
	return getEnki AIEnvironmentConfig().apiBaseUrl;
}

function resolveEnki AIAccountAuthToken(input: {
	config: Enki AIAccountConfig;
	enkiProviderSettings?: ProviderSettings;
}): string | undefined {
	const configApiKey =
		input.config.providerId === "enki" ? input.config.apiKey.trim() : "";
	return (
		getPersistedProviderApiKey("enki", input.enkiProviderSettings) ||
		configApiKey ||
		undefined
	);
}

async function resolveValidEnki AIAccountAuthToken(input: {
	config: Enki AIAccountConfig;
	enkiProviderSettings?: ProviderSettings;
	manager: ProviderSettingsManager;
	apiBaseUrl: string;
}): Promise<string | undefined> {
	const settings = input.enkiProviderSettings;
	const credentials = settings
		? getProviderOAuthCredentialsFromSettings("enki", settings)
		: null;
	if (settings && credentials) {
		const nextCredentials = await getValidEnki AICredentials(credentials, {
			apiBaseUrl: input.apiBaseUrl,
		});
		if (!nextCredentials) {
			throw new Error(
				"Enki AI account requires re-authentication. Run enki auth enki.",
			);
		}
		const nextAccessToken = formatProviderOAuthApiKey("enki", nextCredentials);
		if (nextCredentials !== credentials) {
			saveLocalProviderOAuthCredentials(
				input.manager,
				"enki",
				settings,
				nextCredentials,
				{ setLastUsed: false },
			);
		}
		return nextAccessToken;
	}
	return resolveEnki AIAccountAuthToken({
		config: input.config,
		enkiProviderSettings: settings,
	});
}

export async function createEnki AIAccountService(input: {
	config: Enki AIAccountConfig;
	enkiApiBaseUrl?: string;
	enkiProviderSettings?: ProviderSettings;
}): Promise<Enki AIAccountService | undefined> {
	const manager = new ProviderSettingsManager();
	const settings =
		manager.getProviderSettings("enki") ?? input.enkiProviderSettings;
	const apiBaseUrl = resolveAccountApiBaseUrl({
		enkiApiBaseUrl: input.enkiApiBaseUrl,
		enkiProviderSettings: settings,
	});
	const authToken = await resolveValidEnki AIAccountAuthToken({
		config: input.config,
		enkiProviderSettings: settings,
		manager,
		apiBaseUrl,
	});
	if (!authToken) {
		return undefined;
	}
	return new Enki AIAccountService({
		apiBaseUrl,
		getAuthToken: async () => authToken,
	});
}

export async function loadEnki AIAccountSnapshot(input: {
	config: Enki AIAccountConfig;
	enkiApiBaseUrl?: string;
	enkiProviderSettings?: ProviderSettings;
}): Promise<Enki AIAccountSnapshot> {
	const service = await createEnki AIAccountService(input);
	if (!service) {
		throw new Error("No Enki AI account auth token found");
	}

	const user = await service.fetchMe();
	const organizations = user.organizations ?? [];
	const activeOrganization =
		organizations.find((organization) => organization.active) ?? null;
	const [balance, organizationBalance] = await Promise.all([
		service.fetchBalance(user.id),
		activeOrganization
			? service.fetchOrganizationBalance(activeOrganization.organizationId)
			: Promise.resolve(null),
	]);
	const displayedBalance = activeOrganization
		? (organizationBalance?.balance ?? balance.balance)
		: balance.balance;
	const accountContext = {
		id: user.id,
		email: user.email,
		provider: "enki",
		organizationId: activeOrganization?.organizationId,
		organizationName: activeOrganization?.name,
		memberId: activeOrganization?.memberId,
	};
	identifyTelemetryAccount(accountContext, input.config.logger);

	return {
		user,
		balance,
		organizationBalance,
		organizations,
		activeOrganization,
		displayedBalance,
	};
}

export async function switchEnki AIAccount(input: {
	config: Enki AIAccountConfig;
	organizationId?: string | null;
	enkiApiBaseUrl?: string;
	enkiProviderSettings?: ProviderSettings;
}): Promise<void> {
	const service = await createEnki AIAccountService(input);
	if (!service) {
		throw new Error("No Enki AI account auth token found");
	}
	await service.switchAccount(input.organizationId);
}

async function onChangeToEnki AIPass(config: Enki AIAccountConfig) {
	try {
		await switchEnki AIAccount({
			config: config,
			organizationId: null,
		});
	} catch (error) {
		config.logger?.debug("Failed to switch Enki AIPass to personal account", {
			error,
		});
	}
}

export async function onProviderChange(input: {
	config: Enki AIAccountConfig;
	providerId: string;
}): Promise<void> {
	if (input.providerId === CLINE_PASS_PROVIDER_ID) {
		return onChangeToEnki AIPass(input.config);
	}

	return;
}
