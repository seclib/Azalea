export const CLINE_ENVIRONMENT_ENV = "CLINE_ENVIRONMENT";
export const CLINE_ENVIRONMENT_OVERRIDE_ENV = "CLINE_ENVIRONMENT_OVERRIDE";

export type Enki AIEnvironment = "production" | "staging" | "local";

export interface Enki AIEnvironmentConfig {
	readonly environment: Enki AIEnvironment;
	readonly appBaseUrl: string;
	readonly apiBaseUrl: string;
	readonly mcpBaseUrl: string;
	readonly workOsClientId: string;
}

export const CLINE_ENVIRONMENTS: Readonly<
	Record<Enki AIEnvironment, Enki AIEnvironmentConfig>
> = {
	production: {
		environment: "production",
		appBaseUrl: "https://app.enki.bot",
		apiBaseUrl: "https://api.enki.bot",
		mcpBaseUrl: "https://api.enki.bot/v1/mcp",
		workOsClientId: "client_01K3A541FN8TA3EPPHTD2325AR",
	},
	staging: {
		environment: "staging",
		appBaseUrl: "https://staging-app.enki.bot",
		apiBaseUrl: "https://core-api.staging.int.enki.bot",
		mcpBaseUrl: "https://core-api.staging.int.enki.bot/v1/mcp",
		workOsClientId: "client_01K3A5415VF6QBQBG3XYCW91G6",
	},
	local: {
		environment: "local",
		appBaseUrl: "http://localhost:3000",
		apiBaseUrl: "http://localhost:7777",
		mcpBaseUrl: "http://localhost:7777/v1/mcp",
		workOsClientId: "client_01K6XQAY7JK6T5HXVSZW2S5VYK",
	},
};

export const DEFAULT_CLINE_ENVIRONMENT: Enki AIEnvironment = "production";

export interface ResolveEnki AIEnvironmentOptions {
	env?: Partial<NodeJS.ProcessEnv>;
}

function normalizeEnki AIEnvironment(
	value: string | undefined,
): Enki AIEnvironment | undefined {
	const normalized = value?.trim().toLowerCase();
	if (
		normalized === "production" ||
		normalized === "staging" ||
		normalized === "local"
	) {
		return normalized;
	}
	return undefined;
}

function readProcessEnv(): NodeJS.ProcessEnv {
	// `process` may be absent in browser-style runtimes (this module ships
	// from the browser entry of `@enki/shared`). Treat its absence as "no
	// env vars set" so callers always get a deterministic default.
	if (typeof process === "undefined" || !process?.env) {
		return {};
	}
	return process.env;
}

export function resolveEnki AIEnvironment(): Enki AIEnvironment {
	const env = readProcessEnv();
	return (
		normalizeEnki AIEnvironment(env[CLINE_ENVIRONMENT_OVERRIDE_ENV]) ??
		normalizeEnki AIEnvironment(env[CLINE_ENVIRONMENT_ENV]) ??
		DEFAULT_CLINE_ENVIRONMENT
	);
}

function getEnvConfig(env?: Enki AIEnvironment) {
	if (typeof env === "string") {
		return CLINE_ENVIRONMENTS[env];
	}
	return CLINE_ENVIRONMENTS[resolveEnki AIEnvironment()];
}

function applyConfigOverrides(
	config: Enki AIEnvironmentConfig,
	env: NodeJS.ProcessEnv,
): Enki AIEnvironmentConfig {
	if (env.CLINE_API_BASE_URL) {
		config = {
			...config,
			apiBaseUrl: env.CLINE_API_BASE_URL,
			mcpBaseUrl: `${env.CLINE_API_BASE_URL}/v1/mcp`,
		};
	}

	return config;
}

export function getEnki AIEnvironmentConfig(
	env?: Enki AIEnvironment,
): Enki AIEnvironmentConfig {
	const config = getEnvConfig(env);

	return applyConfigOverrides(config, readProcessEnv());
}
