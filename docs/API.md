# API - Référence API

## Vue d'ensemble

Ce document référence les APIs principales d'Azalea, incluant les interfaces publiques du SDK, les endpoints Protobuf, et les APIs des services.

## SDK Public API

### Enki AICore

Point d'entrée principal du SDK pour créer et gérer des sessions agentiques.

```typescript
import { Enki AICore } from "@azalea/core"

// Création d'une instance
const enki = await Enki AICore.create({
  clientName: "my-app",
  clientType: "custom-client",
  backendMode: "local" | "hub",
  automation: boolean,
  toolPolicies: ToolPolicy[],
  compactionConfig: CompactionConfig
})

// Démarrer une session
const session = await enki.start({
  prompt: "Read file.txt",
  config: {
    apiProvider: "anthropic",
    apiKey: "sk-ant-...",
    modelId: "claude-sonnet-4-20250514"
  }
})

// S'abonner aux événements
enki.subscribe((event) => {
  switch (event.type) {
    case "chunk":
      console.log("Stream chunk:", event.payload)
      break
    case "text-delta":
      console.log("Text:", event.payload.text)
      break
    case "tool-use":
      console.log("Tool:", event.payload.tool)
      break
    case "complete":
      console.log("Done:", event.payload.text)
      break
  }
})

// Services disponibles
enki.tasks.list()           // Lister tâches
enki.tasks.get(taskId)      // Récupérer tâche
enki.tasks.cancel(taskId)   // Annuler tâche

enki.automation.list()      // Lister automatisations
enki.automation.create(spec) // Créer automatisation

enki.hub.connect(url)       // Connecter hub
enki.hub.disconnect()       // Déconnecter hub

// Nettoyage
enki.dispose()
```

### Agent (Lightweight)

Alternative légère sans persistance ni outils intégrés.

```typescript
import { Agent } from "@azalea/agents"

const agent = new Agent({
  model: "anthropic/claude-sonnet-4-20250514",
  systemPrompt: "You are a helpful assistant"
})

// Exécution simple
const result = await agent.run("What is 2+2?")
console.log(result.outputText)

// Streaming
for await (const chunk of agent.runStream("Write a poem")) {
  process.stdout.write(chunk.delta)
}

// Événements
agent.subscribe((event) => {
  console.log(event.type, event.data)
})

// Outils personnalisés
agent.addTool({
  name: "get_weather",
  description: "Get weather for a city",
  parameters: {
    type: "object",
    properties: {
      city: { type: "string" }
    }
  },
  execute: async (params) => {
    return { temperature: 20, condition: "sunny" }
  }
})
```

### LLMs Abstractions

```typescript
import { 
  createProvider, 
  listModels,
  validateConfig 
} from "@azalea/llms"

// Créer provider
const provider = createProvider({
  type: "anthropic",
  apiKey: "sk-ant-..."
})

// Lister modèles disponibles
const models = await provider.listModels()
console.log(models) // ["claude-sonnet-4-20250514", ...]

// Validation configuration
const isValid = validateConfig({
  apiProvider: "openai",
  apiKey: "sk-...",
  modelId: "gpt-4"
})

// Streaming
const stream = provider.stream({
  model: "claude-sonnet-4-20250514",
  messages: [{ role: "user", content: "Hello" }],
  max_tokens: 1000
})

for await (const chunk of stream) {
  console.log(chunk.text)
}
```

## Protobuf APIs

### Task Service

```protobuf
service TaskService {
  // Démarrer une nouvelle tâche
  rpc startTask(StartTaskRequest) returns (TaskResponse);
  
  // Annuler une tâche
  rpc cancelTask(CancelTaskRequest) returns (CancelTaskResponse);
  
  // Reprendre une tâche
  rpc resumeTask(ResumeTaskRequest) returns (TaskResponse);
  
  // Souscrire aux mises à jour
  rpc subscribeToTask(SubscribeRequest) returns (stream TaskUpdate);
}
```

**Messages:**

```typescript
// StartTaskRequest
interface StartTaskRequest {
  prompt: string
  config?: ApiConfiguration
  mode?: "plan" | "act"
}

// TaskResponse
interface TaskResponse {
  taskId: string
  status: "started" | "error"
}

// TaskUpdate (stream)
interface TaskUpdate {
  type: "text" | "tool_use" | "tool_result" | "complete" | "error"
  content: string | ToolUse | ToolResult
  taskId: string
}
```

**Utilisation:**

```typescript
import { TaskServiceClient } from "../../services/grpc"
import { StartTaskRequest } from "../../shared/proto/task"

// Démarrer tâche
const response = await TaskServiceClient.startTask(
  StartTaskRequest.create({
    prompt: "Read README.md",
    mode: "act"
  })
)

console.log("Task started:", response.taskId)

// Souscrire aux mises à jour
const stream = TaskServiceClient.subscribeToTask(
  SubscribeRequest.create({ taskId: response.taskId })
)

for await (const update of stream) {
  if (update.type === "text") {
    console.log(update.content)
  }
}
```

### UI Service

```protobuf
service UiService {
  // Mettre à jour l'UI
  rpc updateUi(UpdateUiRequest) returns (UpdateUiResponse);
  
  // Afficher message
  rpc showMessage(ShowMessageRequest) returns (ShowMessageResponse);
  
  // Demander approbation
  rpc askApproval(AskApprovalRequest) returns (AskApprovalResponse);
  
  // Scroll to settings
  rpc scrollToSettings(ScrollToSettingsRequest) returns (KeyValuePair);
}
```

**Utilisation:**

```typescript
import { UiServiceClient } from "../../services/grpc"

// Afficher message
await UiServiceClient.showMessage(
  ShowMessageRequest.create({
    message: "Task completed successfully",
    type: "info" // info | warning | error
  })
)

// Demander approbation
const response = await UiServiceClient.askApproval(
  AskApprovalRequest.create({
    message: "Execute rm -rf /tmp/test?",
    toolName: "execute_command"
  })
)

if (response.approved) {
  // Exécuter outil
}
```

### Account Service

```protobuf
service AccountService {
  // Login
  rpc login(LoginRequest) returns (LoginResponse);
  
  // Logout
  rpc logout(LogoutRequest) returns (LogoutResponse);
  
  // Get user info
  rpc getUserInfo(GetUserInfoRequest) returns (UserInfo);
  
  // OAuth callback
  rpc handleOAuthCallback(OAuthCallbackRequest) returns (OAuthCallbackResponse);
}
```

**Utilisation:**

```typescript
import { AccountServiceClient } from "../../services/grpc"

// Login
const loginResponse = await AccountServiceClient.login(
  LoginRequest.create({
    provider: "google" | "github" | "azure"
  })
)

// Get user info
const userInfo = await AccountServiceClient.getUserInfo(
  GetUserInfoRequest.create({})
)

console.log("Logged in as:", userInfo.email)
```

### MCP Service

```protobuf
service McpService {
  // Lister serveurs MCP
  rpc listMcpServers(ListMcpServersRequest) returns (ListMcpServersResponse);
  
  // Ajouter serveur
  rpc addMcpServer(AddMcpServerRequest) returns (AddMcpServerResponse);
  
  // Supprimer serveur
  rpc removeMcpServer(RemoveMcpServerRequest) returns (RemoveMcpServerResponse);
  
  // Lister outils
  rpc listMcpTools(ListMcpToolsRequest) returns (ListMcpToolsResponse);
  
  // Appeler outil
  rpc callMcpTool(CallMcpToolRequest) returns (CallMcpToolResponse);
}
```

**Utilisation:**

```typescript
import { McpServiceClient } from "../../services/grpc"

// Lister serveurs
const servers = await McpServiceClient.listMcpServers(
  ListMcpServersRequest.create({})
)

// Ajouter serveur
await McpServiceClient.addMcpServer(
  AddMcpServerRequest.create({
    name: "filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
  })
)

// Lister outils
const tools = await McpServiceClient.listMcpTools(
  ListMcpToolsRequest.create({ serverName: "filesystem" })
)

// Appeler outil
const result = await McpServiceClient.callMcpTool(
  CallMcpToolRequest.create({
    serverName: "filesystem",
    toolName: "read_file",
    arguments: { path: "/tmp/test.txt" }
  })
)
```

## Controller API

### State Management

```typescript
// Controller expose l'état via StateManager
class Controller {
  readonly stateManager: StateManager
  
  // Lire état global
  getGlobalState<T>(key: string): T | undefined
  
  // Écrire état global
  setGlobalState<T>(key: string, value: T): void
  
  // Lire secret
  getSecret(key: string): string | undefined
  
  // Écrire secret
  setSecret(key: string, value: string): void
  
  // Lire workspace state
  getWorkspaceState<T>(key: string): T | undefined
  
  // Écrire workspace state
  setWorkspaceState<T>(key: string, value: T): void
}
```

**Utilisation:**

```typescript
// Lire configuration
const apiKey = controller.stateManager.getSecret("anthropicApiKey")
const modelId = controller.stateManager.getGlobalState("apiModelId")

// Écrire configuration
controller.stateManager.setGlobalState("apiModelId", "claude-sonnet-4-20250514")
controller.stateManager.setSecret("openaiApiKey", "sk-...")
```

### Task Management

```typescript
class Controller {
  // Créer tâche
  async initEnki AIWithTask(
    text: string,
    mode?: "plan" | "act"
  ): Promise<void>
  
  // Annuler tâche
  async cancelTask(): Promise<void>
  
  // Reprendre tâche
  async resumeTask(taskId: string): Promise<void>
  
  // Obtenir historique
  async getTaskHistory(): Promise<HistoryItem[]>
  
  // Mettre à jour historique
  async updateTaskHistory(item: HistoryItem): Promise<void>
}
```

### MCP Management

```typescript
class Controller {
  // Hub MCP
  mcpHub: McpHub
  
  // Télécharger serveur MCP
  async downloadMcp(mcpId: string): Promise<void>
  
  // Installer depuis marketplace
  async installMcpFromMarketplace(item: McpMarketplaceItem): Promise<void>
  
  // Désinstaller
  async uninstallMcp(name: string): Promise<void>
}
```

## Task API

### Task Instance

```typescript
class Task {
  // Identifiant
  readonly taskId: string
  
  // État
  abort: boolean
  enkiMessages: Enki AIMessage[]
  apiConversationHistory: Message[]
  
  // Boucle principale
  async initiateTaskLoop(
    userContent: UserContent,
    isNewTask: boolean
  ): Promise<void>
  
  // Requête API
  async *attemptApiRequest(
    previousApiReqIndex: number
  ): AsyncGenerator<StreamChunk>
  
  // Présentation UI
  async presentAssistantMessage(): Promise<void>
  
  // Exécution outil
  async executeToolWithApproval(
    block: ToolBlock
  ): Promise<ToolResult>
  
  // Sauvegarde état
  private async saveTaskState(): Promise<void>
  
  // Nettoyage
  async cleanup(): Promise<void>
}
```

### Tool Execution

```typescript
// Exécuter outil avec vérification auto-approval
async executeToolWithApproval(block: ToolBlock): Promise<ToolResult> {
  // 1. Vérifier auto-approval
  if (this.shouldAutoApproveTool(block.name)) {
    await this.say("tool", message)
  } else {
    // 2. Demander approbation
    const didApprove = await askApproval("tool", message)
    if (!didApprove) {
      this.didRejectTool = true
      return formatResponse.toolError("User rejected")
    }
  }
  
  // 3. Exécuter
  const result = await this.executeTool(block)
  
  // 4. Checkpoint
  await this.saveCheckpoint()
  
  return result
}
```

## Storage API

### StateManager

```typescript
class StateManager {
  // Singleton
  static get(): StateManager
  
  // Initialisation
  async initialize(context: StorageContext): Promise<void>
  
  // Global state
  getGlobalState<T>(key: string): T | undefined
  setGlobalState<T>(key: string, value: T): void
  deleteGlobalState(key: string): void
  
  // Secrets
  getSecret(key: string): string | undefined
  setSecret(key: string, value: string): void
  deleteSecret(key: string): void
  
  // Workspace state
  getWorkspaceState<T>(key: string): T | undefined
  setWorkspaceState<T>(key: string, value: T): void
  deleteWorkspaceState(key: string): void
  
  // Événements
  onDidStateChange(callback: (event: PersistenceErrorEvent) => void): Disposable
}
```

**Utilisation:**

```typescript
// Initialisation (une seule fois)
const storageContext = createStorageContext({
  globalState: globalStateFile,
  secrets: secretsFile,
  workspaceState: workspaceStateFile
})
await StateManager.initialize(storageContext)

// Utilisation
const apiKey = StateManager.get().getSecret("anthropicApiKey")
StateManager.get().setGlobalState("lastTaskId", "task-123")
```

### StorageContext

```typescript
interface StorageContext {
  globalState: Enki AIFileStorage
  secrets: Enki AIFileStorage
  workspaceState: Enki AIFileStorage
}

// Création
const context = createStorageContext({
  globalState: new Enki AIFileStorage(path.join(dataDir, "globalState.json")),
  secrets: new Enki AIFileStorage(path.join(dataDir, "secrets.json"), 0o600),
  workspaceState: new Enki AIFileStorage(path.join(workspaceDir, "workspaceState.json"))
})
```

### Enki AIFileStorage

```typescript
class Enki AIFileStorage {
  // Lire valeur
  get<T>(key: string): T | undefined
  
  // Écrire valeur
  set<T>(key: string, value: T): void
  
  // Écriture batch
  setBatch(entries: Record<string, unknown>): void
  
  // Supprimer
  delete(key: string): void
  
  // Vider
  clear(): void
  
  // Lister clés
  keys(): string[]
}
```

## MCP API

### McpHub

```typescript
class McpHub {
  // Serveurs connectés
  servers: Map<string, McpServer>
  
  // Connexion
  async connect(server: McpServerConfig): Promise<void>
  
  // Déconnexion
  async disconnect(name: string): Promise<void>
  
  // Lister outils
  async listTools(serverName?: string): Promise<McpTool[]>
  
  // Appeler outil
  async callTool(
    serverName: string,
    toolName: string,
    args: unknown
  ): Promise<McpToolResult>
  
  // Lister ressources
  async listResources(serverName?: string): Promise<McpResource[]>
  
  // Lire ressource
  async readResource(
    serverName: string,
    uri: string
  ): Promise<McpResourceContent>
  
  // Auto-approval
  setAutoApprove(toolName: string, enabled: boolean): void
  shouldAutoApprove(toolName: string): boolean
}
```

**Configuration:**

```typescript
interface McpServerConfig {
  name: string
  command: string
  args?: string[]
  env?: Record<string, string>
  type: "stdio" | "sse"
  url?: string // pour SSE
  autoApprove?: string[]
}
```

## Webview Communication

### PostMessage API

```typescript
// Webview → Extension
window.postMessage({
  type: "submitUserMessage",
  text: "Hello"
})

// Extension → Webview
vscode.postMessage({
  type: "updateState",
  state: { messages: [...] }
})
```

### gRPC Services

```typescript
// Client généré
import { 
  TaskServiceClient,
  UiServiceClient,
  AccountServiceClient,
  McpServiceClient 
} from "../../services/grpc"

// Utilisation
const taskClient = new TaskServiceClient()
const uiClient = new UiServiceClient()
```

## Hooks API

### Hook Definition

```typescript
interface AzaleaHook {
  name: string
  description: string
  type: "PreToolUse" | "PostToolUse" | "TaskStart" | "TaskComplete"
  
  // Validation
  validate?(input: HookInput): HookValidationResult
  
  // Transformation
  transform?(input: HookInput): HookInput
  
  // Side effects
  execute?(result: HookResult): Promise<void>
}
```

**Exemple:**

```typescript
const myHook: AzaleaHook = {
  name: "block-destructive",
  description: "Block dangerous commands",
  type: "PreToolUse",
  
  validate(input) {
    const dangerous = ["rm -rf", "sudo rm", "format"]
    const isDangerous = dangerous.some(cmd => 
      input.toolInput.command.includes(cmd)
    )
    
    return {
      valid: !isDangerous,
      reason: isDangerous ? "Dangerous command blocked" : undefined
    }
  }
}
```

## Automation API

### Cron Jobs

```typescript
import { CronService } from "@azalea/core"

const cron = new CronService()

// Créer job
await cron.createJob({
  name: "daily-scan",
  schedule: "0 9 * * *", // 9am daily
  prompt: "Scan for security vulnerabilities",
  config: {
    apiProvider: "anthropic",
    modelId: "claude-sonnet-4-20250514"
  }
})

// Lister jobs
const jobs = await cron.listJobs()

// Supprimer job
await cron.deleteJob("daily-scan")
```

### Event-Driven Automation

```typescript
// Définir événement
const eventSpec = {
  type: "file-change",
  trigger: {
    path: "src/**/*.ts",
    event: "modified"
  },
  prompt: "Review the changes and suggest improvements"
}

// Créer automatisation
await enki.automation.create(eventSpec)
```

## Error Handling

### Error Types

```typescript
// Erreurs API
class ApiError extends Error {
  statusCode?: number
  provider?: string
  retryable: boolean
}

// Erreurs contexte
class ContextWindowError extends Error {
  currentTokens: number
  maxTokens: number
}

// Erreurs outils
class ToolExecutionError extends Error {
  toolName: string
  toolInput: unknown
  cause: Error
}

// Erreurs MCP
class McpError extends Error {
  serverName: string
  code: string
}
```

### Retry Pattern

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries: number
    backoff: "linear" | "exponential"
    retryableErrors: Error[]
  }
): Promise<T> {
  for (let i = 0; i < options.maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (!options.retryableErrors.some(e => error instanceof e)) {
        throw error
      }
      
      const delay = options.backoff === "exponential"
        ? Math.pow(2, i) * 1000
        : (i + 1) * 1000
      
      await sleep(delay)
    }
  }
  
  throw new Error("Max retries exceeded")
}
```

## Configuration API

### ApiConfiguration

```typescript
interface ApiConfiguration {
  // Provider
  apiProvider: ApiProvider
  apiKey: string
  
  // Modèle
  modelId: string
  modelInfo: ModelInfo
  
  // Paramètres génération
  temperature?: number
  maxTokens?: number
  topP?: number
  
  // Mode
  mode?: "plan" | "act"
  
  // Provider-specific
  openAIBaseUrl?: string
  openAIOrganization?: string
  awsRegion?: string
  awsProfile?: string
  vertexProjectId?: string
  vertexRegion?: string
}
```

### ModelInfo

```typescript
interface ModelInfo {
  id: string
  name: string
  provider: string
  contextWindow: number
  maxOutputTokens: number
  supportsImages: boolean
  supportsComputerUse: boolean
  supportsPromptCaching: boolean
  inputPricePer1k: number
  outputPricePer1k: number
  currency: string
}
```

## Events API

### CoreSessionEvent

```typescript
type CoreSessionEvent = 
  | { type: "chunk"; payload: { type: "text"; text: string } }
  | { type: "chunk"; payload: { type: "tool_use"; tool: ToolBlock } }
  | { type: "text-delta"; payload: { text: string } }
  | { type: "tool-use"; payload: { tool: ToolBlock } }
  | { type: "tool-result"; payload: { result: ToolResult } }
  | { type: "complete"; payload: { text: string } }
  | { type: "error"; payload: { error: Error } }
  | { type: "status"; payload: { status: string } }
```

### AgentRuntimeEvent

```typescript
type AgentRuntimeEvent = 
  | { type: "assistant-text-delta"; payload: { delta: string } }
  | { type: "assistant-message"; payload: { message: Message } }
  | { type: "tool-start"; payload: { tool: Tool } }
  | { type: "tool-complete"; payload: { result: ToolResult } }
  | { type: "error"; payload: { error: Error } }
  | { type: "complete"; payload: { outputText: string } }
```

## Examples

### Example 1: Basic Task

```typescript
import { Enki AICore } from "@azalea/core"

async function main() {
  const enki = await Enki AICore.create({
    clientName: "my-app",
    backendMode: "local"
  })
  
  enki.subscribe((event) => {
    if (event.type === "text-delta") {
      process.stdout.write(event.payload.text)
    }
    if (event.type === "complete") {
      console.log("\n\nDone!")
      enki.dispose()
      process.exit(0)
    }
  })
  
  await enki.start({
    prompt: "What is the capital of France?",
    config: {
      apiProvider: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY!,
      modelId: "claude-sonnet-4-20250514"
    }
  })
}

main()
```

### Example 2: Custom Tools

```typescript
import { Agent } from "@azalea/agents"

const agent = new Agent({
  model: "openai/gpt-4",
  systemPrompt: "You are a helpful assistant with access to weather data"
})

// Add custom tool
agent.addTool({
  name: "get_weather",
  description: "Get current weather for a city",
  parameters: {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "City name"
      }
    },
    required: ["city"]
  },
  execute: async ({ city }) => {
    // Call weather API
    const response = await fetch(
      `https://api.weather.com/v1/current?city=${city}`
    )
    const data = await response.json()
    return {
      temperature: data.temp_c,
      condition: data.condition
    }
  }
})

const result = await agent.run("What's the weather in Paris?")
console.log(result.outputText)
```

### Example 3: Multi-Agent

```typescript
import { Enki AICore } from "@azalea/core"

async function main() {
  const enki = await Enki AICore.create({
    clientName: "multi-agent-app",
    backendMode: "hub"
  })
  
  // Connect to hub for multi-agent coordination
  await enki.hub.connect("http://localhost:3000")
  
  // Start task
  await enki.start({
    prompt: "Research AI trends and write a report",
    config: {
      apiProvider: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY!,
      modelId: "anthropic/claude-sonnet-4-20250514"
    }
  })
  
  // Monitor progress
  enki.subscribe((event) => {
    if (event.type === "status") {
      console.log("Status:", event.payload.status)
    }
  })
}

main()
```

## Rate Limits & Quotas

### Provider Limits

| Provider | Free Tier | Rate Limit | Notes |
|----------|-----------|------------|-------|
| Anthropic | No | 50 req/min | Pay-as-you-go |
| OpenAI | No | 500 req/min | Tier-based |
| OpenRouter | Yes | 20 req/min | Free tier available |
| Groq | Yes | 30 req/min | Free tier, very fast |
| DeepSeek | Yes | 10 req/min | Free tier available |

### Handling Rate Limits

```typescript
// Automatic retry with backoff
const result = await withRetry(
  () => provider.createMessage(prompt),
  {
    maxRetries: 3,
    backoff: "exponential",
    retryableErrors: [RateLimitError]
  }
)

// Manual rate limit handling
if (error.statusCode === 429) {
  const retryAfter = error.headers["retry-after"]
  await sleep(retryAfter * 1000)
  // Retry request
}
```

## Webhooks (Future)

```typescript
// Configuration webhook
const webhook = {
  url: "https://myapp.com/webhooks/azalea",
  events: ["task.complete", "task.error"],
  secret: "whsec_..."
}

// Recevoir événements
app.post("/webhooks/azalea", (req, res) => {
  const event = req.body
  
  switch (event.type) {
    case "task.complete":
      console.log("Task completed:", event.taskId)
      break
    case "task.error":
      console.log("Task failed:", event.taskId, event.error)
      break
  }
  
  res.json({ received: true })
})
```

## SDK Versions

### Current Version

```json
{
  "version": "2.0.0",
  "packages": {
    "@azalea/core": "2.0.0",
    "@azalea/agents": "2.0.0",
    "@azalea/llms": "2.0.0",
    "@azalea/shared": "2.0.0",
    "@azalea/sdk": "2.0.0"
  }
}
```

### Changelog

See [CHANGELOG.md](../CHANGELOG.md) for version history.

## Support

- **Documentation**: https://docs.azalea.dev
- **GitHub Issues**: https://github.com/seclib/Azalea/issues
- **Discord**: https://discord.gg/azalea
- **Email**: support@azalea.dev
