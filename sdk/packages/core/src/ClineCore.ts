import type { BasicLogger, ITelemetryService } from "@enki/shared";
import {
	Enki AICoreAutomationController,
	createEnki AICoreAutomationExtensionContext,
	createEnki AICoreAutomationRuntimeHandlers,
	normalizeAutomationCronScope,
	normalizeAutomationOptions,
} from "./enki-core/automation";
import {
	createEnki AICorePendingPromptsApi,
	createEnki AICoreSettingsApi,
	type RuntimeHostServiceExtensions,
} from "./enki-core/runtime-services";
import {
	normalizeEnki AICoreStartInput,
	toEnki AICoreStartInput,
} from "./enki-core/start-input";
import { emitSessionStartedTelemetry } from "./enki-core/telemetry";
import type {
	Enki AICoreAutomationApi,
	Enki AICoreAutomationOptions,
	Enki AICoreListHistoryOptions,
	Enki AICoreOptions,
	Enki AICoreSettingsApi,
	Enki AICoreStartInput,
	RestoreInput,
	RestoreResult,
	StartSessionBootstrap,
} from "./enki-core/types";

import { CronService } from "./cron/service/cron-service";
import type { RuntimeCapabilities } from "./runtime/capabilities";
import { normalizeRuntimeCapabilities } from "./runtime/capabilities";
import { listSessionHistory } from "./runtime/host/history";
import { createRuntimeHost } from "./runtime/host/host";
import type {
	PendingPromptsServiceApi,
	RuntimeHost,
	RuntimeHostSubscribeOptions,
	SessionModelRuntimeService,
	SessionUsageRuntimeService,
	StartSessionInput,
	StartSessionResult,
} from "./runtime/host/runtime-host";
import {
	FeatureFlagsService,
	NoOpFeatureFlagsProvider,
} from "./services/feature-flags";
import { resolveCoreDistinctId } from "./services/telemetry/distinct-id";
import type { CoreSessionEvent } from "./types/events";
import type { SessionHistoryRecord } from "./types/sessions";

export type {
	Enki AIAutomationEventIngressResult,
	Enki AIAutomationEventLog,
	Enki AIAutomationEventSuppression,
	Enki AIAutomationListEventsOptions,
	Enki AIAutomationListRunsOptions,
	Enki AIAutomationListSpecsOptions,
	Enki AIAutomationRun,
	Enki AIAutomationRunStatus,
	Enki AIAutomationSpec,
	Enki AICoreAutomationApi,
	Enki AICoreAutomationOptions,
	Enki AICoreListHistoryOptions,
	Enki AICoreOptions,
	Enki AICoreSettingsApi,
	Enki AICoreStartInput,
	HubOptions,
	RemoteOptions,
	RestoreInput,
	RestoreOptions,
	RestoreResult,
	RuntimeHostMode,
	StartSessionBootstrap,
} from "./enki-core/types";

/**
 * The primary entry point for the Enki AI Core SDK.
 *
 * @example
 * ```ts
 * import { Enki AICore } from "@enki/core";
 *
 * const enki = await Enki AICore.create({ clientName: "my-app" });
 * const session = await enki.start({ ... });
 * ```
 */
export class Enki AICore {
	readonly clientName: string | undefined;
	readonly runtimeAddress: string | undefined;
	readonly automation: Enki AICoreAutomationApi;
	readonly settings: Enki AICoreSettingsApi;
	readonly featureFlags: FeatureFlagsService;
	readonly pendingPrompts: PendingPromptsServiceApi;
	private readonly host: RuntimeHost;
	private readonly prepare: Enki AICoreOptions["prepare"] | undefined;
	private readonly capabilities: RuntimeCapabilities | undefined;
	private readonly logger: BasicLogger | undefined;
	private readonly telemetry: ITelemetryService | undefined;
	private readonly distinctId: string | undefined;
	private readonly automationService: CronService | undefined;
	private readonly activeSessionBootstraps = new Map<
		string,
		StartSessionBootstrap
	>();
	private readonly unsubscribeBootstrapCleanup: () => void;

	private constructor(
		host: RuntimeHost,
		clientName: string | undefined,
		runtimeAddress: string | undefined,
		prepare: Enki AICoreOptions["prepare"],
		capabilities: RuntimeCapabilities | undefined,
		logger: BasicLogger | undefined,
		telemetry: ITelemetryService | undefined,
		distinctId: string | undefined,
		featureFlags: FeatureFlagsService,
		automationOptions:
			| (Enki AICoreAutomationOptions & { logger?: BasicLogger })
			| undefined,
	) {
		this.clientName = clientName;
		this.runtimeAddress = runtimeAddress;
		this.host = host;
		this.prepare = prepare;
		this.capabilities = capabilities;
		this.logger = logger;
		this.telemetry = telemetry;
		this.distinctId = distinctId;
		this.featureFlags = featureFlags;
		this.settings = createEnki AICoreSettingsApi(host);
		this.pendingPrompts = createEnki AICorePendingPromptsApi(host);
		this.automation = new Enki AICoreAutomationController(() => {
			if (!this.automationService) {
				throw new Error(
					"Enki AICore automation is not enabled. Pass `automation: true` or automation options to Enki AICore.create().",
				);
			}
			return this.automationService;
		});
		this.automationService = automationOptions
			? new CronService({
					workspaceRoot: automationOptions.workspaceRoot ?? process.cwd(),
					specs: {
						cronSpecsDir:
							automationOptions.cronSpecsDir ?? automationOptions.cronDir,
						scope: normalizeAutomationCronScope(automationOptions.cronScope),
						workspaceRoot: automationOptions.workspaceRoot,
					},
					runtimeHandlers: createEnki AICoreAutomationRuntimeHandlers({
						host,
						getExtensionContext: () =>
							createEnki AICoreAutomationExtensionContext({
								automationService: this.automationService,
								automation: this.automation,
								clientName: this.clientName,
								distinctId: this.distinctId,
								logger: this.logger,
								telemetry: this.telemetry,
							}),
					}),
					dbPath: automationOptions.dbPath,
					logger: automationOptions.logger,
					pollIntervalMs: automationOptions.pollIntervalMs,
					claimLeaseSeconds: automationOptions.claimLeaseSeconds,
					globalMaxConcurrency: automationOptions.globalMaxConcurrency,
					watcherDebounceMs: automationOptions.watcherDebounceMs,
				})
			: undefined;
		this.unsubscribeBootstrapCleanup = this.host.subscribe((event) => {
			if (event.type !== "ended") {
				return;
			}
			void this.disposeSessionBootstrap(event.payload.sessionId);
		});
	}

	/**
	 * Creates a new Enki AICore instance.
	 *
	 * This is the primary factory method for initializing the SDK. It sets up the runtime
	 * host (local, hub, or remote) based on the provided options and prepares the SDK for
	 * starting sessions.
	 *
	 * @param options Configuration options for the SDK instance
	 * @returns A promise that resolves to a new Enki AICore instance
	 *
	 * @example
	 * ```ts
	 * const enki = await Enki AICore.create({
	 *   clientName: "my-app",
	 *   backendMode: "local",
	 * });
	 * ```
	 */
	static async create(options: Enki AICoreOptions = {}): Promise<Enki AICore> {
		const distinctId = resolveCoreDistinctId(options.distinctId);
		const capabilities = normalizeRuntimeCapabilities(options.capabilities);
		const normalizedOptions = { ...options, capabilities, distinctId };
		const host = await createRuntimeHost(normalizedOptions);
		const automationOptions = normalizeAutomationOptions(options.automation);
		const featureFlags =
			options.featureFlags ||
			new FeatureFlagsService({
				provider: new NoOpFeatureFlagsProvider(),
				telemetry: options.telemetry,
				logger: options.logger,
				context: {
					distinctId,
					clientName: options.clientName,
				},
			});
		const core = new Enki AICore(
			host,
			options.clientName,
			host.runtimeAddress,
			options.prepare,
			capabilities,
			options.logger,
			options.telemetry,
			distinctId,
			featureFlags,
			automationOptions
				? { ...automationOptions, logger: options.logger }
				: undefined,
		);
		if (automationOptions && automationOptions.autoStart !== false) {
			await core.automation.start();
		}
		return core;
	}

	private async disposeSessionBootstrap(sessionId: string): Promise<void> {
		const bootstrap = this.activeSessionBootstraps.get(sessionId);
		if (!bootstrap) {
			return;
		}
		this.activeSessionBootstraps.delete(sessionId);
		await Promise.resolve(bootstrap.dispose?.());
	}

	/**
	 * Starts a new Enki AI session with the provided configuration.
	 *
	 * This method initializes and begins a new agent session. It handles session setup,
	 * runs any preparation hooks, and returns session metadata along with event streams.
	 * The session continues to run until explicitly stopped or aborted.
	 *
	 * @param input The session configuration and startup parameters
	 * @returns A promise that resolves to session metadata and event stream
	 *
	 * @example
	 * ```ts
	 * const result = await enki.start({
	 *   config: {
	 *     providerId: "anthropic",
	 *     modelId: "claude-opus-4-1",
	 *   },
	 * });
	 *
	 * // Subscribe to session events
	 * result.subscribe((event) => {
	 *   console.log("Session event:", event);
	 * });
	 * ```
	 */
	start(input: StartSessionInput): Promise<StartSessionResult>;
	/**
	 * Starts a new Enki AI session with extended core-specific configuration.
	 * This overload allows specifying local runtime options and config overrides.
	 */
	start(input: Enki AICoreStartInput): Promise<StartSessionResult>;
	async start(
		input: StartSessionInput | Enki AICoreStartInput,
	): Promise<StartSessionResult> {
		const enkiCoreInput = toEnki AICoreStartInput(input);
		const bootstrap = await this.prepare?.(enkiCoreInput);
		try {
			const preparedInput = bootstrap
				? await bootstrap.applyToStartSessionInput(enkiCoreInput)
				: enkiCoreInput;
			const result = await this.host.startSession(
				normalizeEnki AICoreStartInput(preparedInput, {
					defaultCapabilities: this.capabilities,
					withExtensionContext: (context) =>
						createEnki AICoreAutomationExtensionContext({
							automationService: this.automationService,
							automation: this.automation,
							context,
							clientName: this.clientName,
							distinctId: this.distinctId,
							logger: this.logger,
							telemetry: this.telemetry,
						}),
				}),
			);
			if (bootstrap) {
				const activeSession = await this.host.getSession(result.sessionId);
				if (activeSession) {
					this.activeSessionBootstraps.set(result.sessionId, bootstrap);
				} else {
					await Promise.resolve(bootstrap.dispose?.());
				}
			}
			emitSessionStartedTelemetry({
				input: preparedInput,
				sessionId: result.sessionId,
				telemetry: this.telemetry,
				clientName: this.clientName,
				runtimeAddress: this.runtimeAddress,
			});
			return result;
		} catch (error) {
			await Promise.resolve(bootstrap?.dispose?.());
			throw error;
		}
	}
	/**
	 * Sends a message or command to an active session.
	 *
	 * This method communicates with a running session, allowing you to send user messages,
	 * tool responses, or other session input while the session is in progress.
	 *
	 * @example
	 * ```ts
	 * await enki.send(sessionId, {
	 *   type: "user_message",
	 *   text: "Please implement the login feature",
	 * });
	 * ```
	 */
	send: RuntimeHost["runTurn"] = (...args) => this.host.runTurn(...args);
	/**
	 * Retrieves accumulated token and cost usage for a session.
	 *
	 * Returns metrics about the session's resource consumption, including tokens used
	 * across different API providers and associated costs. The `usage` field is
	 * root/lead-agent usage; `aggregateUsage` includes teammates and subagents.
	 *
	 * @example
	 * ```ts
	 * const usageSummary = await enki.getAccumulatedUsage(sessionId);
	 * console.log(`Total cost: $${usageSummary?.aggregateUsage?.totalCost}`);
	 * ```
	 */
	getAccumulatedUsage: SessionUsageRuntimeService["getAccumulatedUsage"] = (
		...args
	) => {
		const service = this.host as RuntimeHostServiceExtensions;
		return service.getAccumulatedUsage?.(...args) ?? Promise.resolve(undefined);
	};
	/**
	 * Aborts an in-flight tool execution without stopping the session.
	 *
	 * Interrupts the current tool operation (e.g., file read, shell command) while keeping
	 * the session alive. The session can continue processing after the abort. Use this for
	 * cancelling long-running operations.
	 *
	 * @example
	 * ```ts
	 * // Stop the current operation but keep the session running
	 * await enki.abort(sessionId);
	 * ```
	 */
	abort: RuntimeHost["abort"] = (...args) => this.host.abort(...args);
	/**
	 * Stops an active session gracefully.
	 *
	 * Terminates the session and cleans up associated resources. Unlike abort, this
	 * completely ends the session. The session cannot be resumed after stopping.
	 *
	 * @example
	 * ```ts
	 * // Cleanly shutdown the session
	 * await enki.stop(sessionId);
	 * ```
	 */
	stop: RuntimeHost["stopSession"] = async (sessionId) => {
		await this.host.stopSession(sessionId);
		await this.disposeSessionBootstrap(sessionId);
	};
	/**
	 * Disposes the Enki AICore instance and all associated resources.
	 *
	 * Shuts down the runtime host, closes connections, and cleans up all active sessions
	 * and bootstraps. Call this when you're done using the SDK instance, typically at
	 * application shutdown. After calling dispose, the instance cannot be reused.
	 *
	 * @example
	 * ```ts
	 * // Clean up when done
	 * await enki.dispose();
	 * ```
	 */
	dispose: RuntimeHost["dispose"] = async (...args) => {
		try {
			await this.automationService?.dispose();
			await this.host.dispose(...args);
		} finally {
			this.unsubscribeBootstrapCleanup();
			const sessionIds = [...this.activeSessionBootstraps.keys()];
			await Promise.allSettled(
				sessionIds.map((sessionId) => this.disposeSessionBootstrap(sessionId)),
			);
		}
	};
	/**
	 * Retrieves information about a specific session by ID.
	 *
	 * Fetches the current metadata and state of a session, including configuration,
	 * status, and other session details.
	 *
	 * @example
	 * ```ts
	 * const session = await enki.get(sessionId);
	 * console.log("Session status:", session?.status);
	 * ```
	 */
	get: RuntimeHost["getSession"] = (...args) => this.host.getSession(...args);
	/**
	 * Lists recent sessions through the shared history-listing path.
	 */
	listHistory = async (
		options: Enki AICoreListHistoryOptions = {},
	): Promise<SessionHistoryRecord[]> =>
		await listSessionHistory(this.host, options);
	/**
	 * Lists recent sessions with inferred history display metadata.
	 *
	 * Retrieves a paginated list of recent sessions, optionally limited by the
	 * provided count.
	 *
	 * @param limit Maximum number of sessions to return (defaults to 200)
	 * @returns A promise resolving to an array of session history records
	 *
	 * @example
	 * ```ts
	 * const sessions = await enki.list(50);
	 * sessions.forEach((session) => {
	 *   console.log(`Session ${session.sessionId}: ${session.metadata?.title}`);
	 * });
	 * ```
	 */
	list = async (
		limit = 200,
		options: Omit<Enki AICoreListHistoryOptions, "limit"> = {},
	): Promise<SessionHistoryRecord[]> =>
		await this.listHistory({ ...options, limit });
	/**
	 * Permanently deletes a session and all its associated data.
	 *
	 * Removes the session from storage and cleans up any related resources. This is
	 * a destructive operation that cannot be undone.
	 *
	 * @param sessionId The ID of the session to delete
	 * @returns A promise that resolves to true if the session was deleted, false if not found
	 *
	 * @example
	 * ```ts
	 * const deleted = await enki.delete(sessionId);
	 * if (deleted) {
	 *   console.log("Session deleted successfully");
	 * }
	 * ```
	 */
	delete: RuntimeHost["deleteSession"] = async (sessionId) => {
		const deleted = await this.host.deleteSession(sessionId);
		if (deleted) {
			await this.disposeSessionBootstrap(sessionId);
		}
		return deleted;
	};
	/**
	 * Updates an existing session's metadata.
	 *
	 * Modifies session properties like title or other mutable metadata while preserving
	 * message history and other session data.
	 *
	 * @example
	 * ```ts
	 * await enki.update(sessionId, {
	 *   title: "Updated session title",
	 * });
	 * ```
	 */
	update: RuntimeHost["updateSession"] = (...args) =>
		this.host.updateSession(...args);
	/**
	 * Reads message history for a session.
	 *
	 * Retrieves the full message transcript for a specific session, including all
	 * user messages, agent responses, and tool interactions.
	 *
	 * @example
	 * ```ts
	 * const messages = await enki.readMessages(sessionId);
	 * messages.forEach((msg) => {
	 *   console.log(`${msg.role}: ${msg.content}`);
	 * });
	 * ```
	 */
	readMessages: RuntimeHost["readSessionMessages"] = (...args) =>
		this.host.readSessionMessages(...args);

	async restore(input: RestoreInput): Promise<RestoreResult> {
		const normalizedStart = input.start
			? normalizeEnki AICoreStartInput(input.start, {
					defaultCapabilities: this.capabilities,
					withExtensionContext: (context) =>
						createEnki AICoreAutomationExtensionContext({
							automationService: this.automationService,
							automation: this.automation,
							context,
							clientName: this.clientName,
							distinctId: this.distinctId,
							logger: this.logger,
							telemetry: this.telemetry,
						}),
				})
			: undefined;
		return this.host.restoreSession({
			sessionId: input.sessionId,
			checkpointRunCount: input.checkpointRunCount,
			cwd: input.cwd,
			restore: input.restore,
			start: normalizedStart,
		});
	}

	/**
	 * Handles hook events from the runtime environment.
	 *
	 * Processes system or environment events (e.g., workspace changes, external signals)
	 * that may affect the current session. This is typically called by the host environment
	 * rather than directly by consumer code.
	 *
	 * @internal
	 */
	ingestHookEvent: RuntimeHost["dispatchHookEvent"] = (...args) =>
		this.host.dispatchHookEvent(...args);
	/**
	 * Subscribes to session events.
	 *
	 * Registers a listener for all session events (messages, state changes, errors, etc.).
	 * Returns an unsubscribe function to stop listening.
	 *
	 * @param listener Callback function invoked for each event
	 * @param options Optional configuration for the subscription
	 * @returns An unsubscribe function
	 *
	 * @example
	 * ```ts
	 * const unsubscribe = enki.subscribe((event) => {
	 *   if (event.type === "message") {
	 *     console.log("New message:", event.payload.message);
	 *   }
	 * });
	 *
	 * // Later, stop listening
	 * unsubscribe();
	 * ```
	 */
	subscribe(
		listener: (event: CoreSessionEvent) => void,
		options?: RuntimeHostSubscribeOptions,
	): () => void {
		return this.host.subscribe(listener, options);
	}
	/**
	 * Updates the AI model used by an active session.
	 *
	 * Switches the session to use a different AI model while maintaining the session state
	 * and message history. This allows you to continue a conversation with a different model.
	 *
	 * @example
	 * ```ts
	 * // Switch to a different model mid-session
	 * await enki.updateSessionModel(sessionId, "claude-opus-4-1");
	 * ```
	 */
	updateSessionModel: SessionModelRuntimeService["updateSessionModel"] = (
		...args
	) => {
		const service = this.host as RuntimeHostServiceExtensions;
		return service.updateSessionModel?.(...args) ?? Promise.resolve();
	};
}
