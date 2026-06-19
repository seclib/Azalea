# Development - Guide de développement

## Vue d'ensemble

Ce guide couvre les workflows de développement, les conventions de code, les tests et le déploiement pour Azalea.

## Prérequis

### Outils requis

```bash
# Runtime
Bun >= 1.3.13
Node.js >= 22

# Build
TypeScript >= 5.9
esbuild

# Linting/Formatting
Biome

# Testing
Vitest
Playwright (E2E)
Mocha (VSCode extension)

# Git
Git (avec hooks Husky)
```

### Installation

```bash
# Cloner le repo
git clone git@github.com:seclib/Azalea.git
cd Azalea

# Installer dépendances
bun install

# Build SDK
bun run build:sdk

# Vérifier installation
bun run check
```

## Structure du workspace

### Monorepo Bun

Le projet utilise Bun workspaces pour gérer les dépendances entre packages :

```json
{
  "workspaces": [
    "sdk/packages/*",
    "apps/*",
    "!apps/vscode",
    "apps/azalea-hub/src/webview",
    "apps/examples/*",
    "sdk/examples",
    "sdk/examples/plugins/*"
  ]
}
```

### Packages

| Package | Path | Description |
|---------|------|-------------|
| `@azalea/core` | `sdk/packages/core` | Runtime principal (Enki AICore) |
| `@azalea/agents` | `sdk/packages/agents` | Framework d'agents |
| `@azalea/llms` | `sdk/packages/llms` | Abstractions LLM |
| `@azalea/shared` | `sdk/packages/shared` | Types partagés |
| `@azalea/sdk` | `sdk/packages/sdk` | SDK public |
| `@azalea/cli` | `apps/cli` | Interface CLI |
| `@azalea/azalea-hub` | `apps/azalea-hub` | Serveur Hub |

## Scripts disponibles

### Build

```bash
# Build complet (SDK + apps)
bun run build

# Build SDK seulement
bun run build:sdk

# Build apps seulement
bun run build:apps

# Génération types modèles
bun run build:models

# Clean
bun run clean
```

### Development

```bash
# CLI en mode dev
bun run cli

# VSCode extension en mode dev
bun run code

# Hub
bun run cli hub start
bun run cli hub stop
```

### Testing

```bash
# Tests unitaires (tous packages)
bun run test:unit

# Tests E2E
bun run test:e2e

# Tests E2E interactifs
bun run test:e2e:interactive

# Tests spécifiques
bun -F @azalea/core test
bun -F @azalea/cli test
bun -F @azalea/azalea-hub test

# Tests avec couverture
bun -F @azalea/core test:coverage
```

### Linting/Formatting

```bash
# Lint
bun run lint

# Format
bun run format

# Fix automatique
bun run fix

# Check complet (lint + build + types)
bun run check
```

### Type checking

```bash
# Tous les packages
bun run types

# Package spécifique
bun -F @azalea/core typecheck
bun -F @azalea/agents typecheck
```

## Conventions de code

### TypeScript

```typescript
// Utiliser des types stricts
"strict": true

// Préférer les interfaces pour les objets publics
interface UserConfig {
  apiKey: string
  modelId: string
}

// Utiliser des types pour les unions
type ApiProvider = "anthropic" | "openai" | "deepseek"

// Éviter any
// ❌ Bad
function process(data: any) {}

// ✅ Good
function process(data: UserConfig) {}
```

### Nommage

```typescript
// Classes: PascalCase
class TaskExecutor {}

// Fonctions/variables: camelCase
const taskId = generateId()

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRIES = 3

// Fichiers: kebab-case
// task-executor.ts (pas taskExecutor.ts)

// Types/Interfaces: PascalCase
interface TaskState {}
type StreamChunk = {}
```

### Imports

```typescript
// Ordre des imports
// 1. Packages externes
import axios from "axios"
import { pWaitFor } from "p-wait-for"

// 2. Packages internes (@azalea/*)
import { Enki AICore } from "@azalea/core"
import type { ApiProvider } from "@azalea/shared"

// 3. Imports relatifs
import { Task } from "./task"
import { buildApiHandler } from "../api"

// 4. Types seulement
import type { UserConfig } from "./types"
```

### Gestion d'erreurs

```typescript
// ✅ Toujours catcher les erreurs async
try {
  await riskyOperation()
} catch (error) {
  Logger.error("Operation failed:", error)
  throw new AzaleaError("Operation failed", { cause: error })
}

// ✅ Classes d'erreur personnalisées
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public provider?: string
  ) {
    super(message)
  }
}

// ❌ Éviter les erreurs génériques
// throw new Error("Failed")
```

### Async/Await

```typescript
// ✅ Toujours await les promesses
const result = await fetchData()

// ❌ Éviter les then/catch
fetchData().then(result => ...)

// ✅ Utiliser Promise.all pour parallélisme
const [users, projects] = await Promise.all([
  fetchUsers(),
  fetchProjects()
])

// ❌ Éviter le séquentiel inutile
const users = await fetchUsers()
const projects = await fetchProjects()
```

## Architecture patterns

### Dependency Injection

```typescript
// Controller injecte les dépendances
class Task {
  constructor(
    private controller: Controller,
    private mcpHub: McpHub,
    private stateManager: StateManager
  ) {}
}

// Éviter les singletons globaux
// ❌ Bad
const task = new Task()

// ✅ Good
const task = new Task(controller, mcpHub, stateManager)
```

### Event-driven

```typescript
// Utiliser des événements pour communication
class Task {
  private eventEmitter = new EventEmitter()
  
  async executeTool(block: ToolBlock) {
    this.eventEmitter.emit("tool:start", block)
    const result = await this.runTool(block)
    this.eventEmitter.emit("tool:complete", result)
    return result
  }
}

// S'abonner aux événements
task.on("tool:start", (block) => {
  Logger.info(`Tool started: ${block.name}`)
})
```

### Factory Pattern

```typescript
// Factory pour création d'instances
function buildApiHandler(config: ApiConfiguration): ApiHandler {
  switch (config.apiProvider) {
    case "anthropic":
      return new AnthropicHandler(config)
    case "openai":
      return new OpenAIHandler(config)
    // ...
  }
}
```

### Strategy Pattern

```typescript
// Stratégies pour comportements variables
interface ContextStrategy {
  truncate(messages: Message[]): Message[]
}

class HalfTruncation implements ContextStrategy {
  truncate(messages: Message[]) {
    return messages.slice(0, Math.floor(messages.length / 2))
  }
}

class QuarterTruncation implements ContextStrategy {
  truncate(messages: Message[]) {
    return messages.slice(0, Math.floor(messages.length / 4))
  }
}
```

## Testing

### Structure des tests

```
apps/vscode/src/core/
├── task/
│   ├── index.ts
│   ├── __tests__/
│   │   ├── task.test.ts
│   │   └── integration.test.ts
│   └── tools/
│       └── handlers/
│           ├── ReadFileToolHandler.ts
│           └── __tests__/
│               └── ReadFileToolHandler.test.ts
```

### Tests unitaires

```typescript
import { describe, it, expect, vi } from "vitest"
import { Task } from "../index"

describe("Task", () => {
  it("should initialize with empty messages", () => {
    const task = new Task(mockController)
    expect(task.enkiMessages).toEqual([])
  })
  
  it("should execute tool with approval", async () => {
    const task = new Task(mockController)
    const result = await task.executeTool(mockToolBlock)
    expect(result.success).toBe(true)
  })
})
```

### Tests d'intégration

```typescript
describe("Task Integration", () => {
  it("should complete a full task loop", async () => {
    const controller = new Controller(mockContext)
    const task = new Task(controller)
    
    await task.initiateTaskLoop("Read file.txt", true)
    
    expect(task.enkiMessages.length).toBeGreaterThan(0)
    expect(task.abort).toBe(false)
  })
})
```

### Mocks

```typescript
// Mock provider
const mockProvider = {
  createMessageStream: vi.fn().mockReturnValue(asyncIteratorFromChunks([
    { type: "text", text: "Hello" }
  ]))
}

// Mock Controller
const mockController = {
  stateManager: mockStateManager,
  mcpHub: mockMcpHub,
  say: vi.fn()
}

// Mock API
vi.mock("@core/api", () => ({
  buildApiHandler: vi.fn(() => mockProvider)
}))
```

## Debugging

### VSCode Extension

```typescript
// Activer les logs debug
export const DEBUG_MODE = true

// Logger avec niveaux
Logger.debug("Task started:", { taskId, message })
Logger.info("Tool executed:", { toolName, duration })
Logger.warn("Rate limit approaching")
Logger.error("API failed:", error)
```

### CLI

```bash
# Mode debug
azalea --debug "Read file.txt"

# Verbose
azalea -v "Read file.txt"

# Logs fichier
azalea --log-file ./debug.log "Read file.txt"
```

### Breakpoints

```typescript
// VSCode: launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Extension",
  "runtimeExecutable": "${execPath}",
  "args": ["--extensionDevelopmentPath=${workspaceFolder}/apps/vscode"]
}
```

## Protobuf

### Définition

```protobuf
// proto/enki/task.proto
syntax = "proto3";

package enki.task;

service TaskService {
  rpc executeTask(TaskRequest) returns (TaskResponse);
  rpc cancelTask(CancelRequest) returns (CancelResponse);
}

message TaskRequest {
  string taskId = 1;
  string input = 2;
}
```

### Génération

```bash
# Générer types TypeScript
npm run protos

# Output:
# src/shared/proto/ - Types partagés
# src/generated/grpc-js/ - Services
# src/generated/nice-grpc/ - Clients promise-based
```

### Utilisation

```typescript
// Backend (handler)
import { TaskService } from "./TaskService"

export async function executeTask(
  controller: Controller,
  request: TaskRequest
): Promise<TaskResponse> {
  // Implementation
}

// Frontend (client)
import { TaskServiceClient } from "../../services/grpc"

const response = await TaskServiceClient.executeTask(
  TaskRequest.create({ taskId: "123", input: "..." })
)
```

## Git workflow

### Branches

```
main          # Production
develop       # Intégration
feature/*     # Nouvelles fonctionnalités
fix/*         # Corrections
hotfix/*      # Corrections urgentes
```

### Commits

```bash
# Format: type(scope): description

# Types
feat:      # Nouvelle fonctionnalité
fix:       # Correction bug
docs:      # Documentation
refactor:  # Refactoring
test:      # Tests
chore:     # Maintenance

# Exemples
git commit -m "feat(api): add DeepSeek provider"
git commit -m "fix(task): handle context window overflow"
git commit -m "docs(workflow): add API request cycle"
```

### Hooks Husky

```bash
# Pré-commit
- Type checking
- Biome lint/format

# Pré-push
- Tests unitaires
- Build vérification
```

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run check
      - run: bun run test:unit
```

### Déploiement

```bash
# Release
bun run release

# Publie automatiquement:
# - npm (@azalea/core, @azalea/cli, etc.)
# - GitHub releases
# - VSCode marketplace
```

## Performance

### Profiling

```typescript
// Mesurer performance
console.time("task-execution")
await task.execute()
console.timeEnd("task-execution")

// Utiliser Node.js inspector
node --inspect-brk dist/index.js
```

### Optimisations

1. **Streaming** : Traiter chunks individuellement
2. **Caching** : Cache configurations, modèles
3. **Lazy loading** : Charger à la demande
4. **Connection pooling** : Réutiliser connexions HTTP
5. **Debouncing** : Éviter appels excessifs

## Sécurité

### Secrets

```typescript
// ❌ Jamais en dur
const apiKey = "sk-ant-..."

// ✅ Utiliser secrets storage
const apiKey = await stateManager.getSecret("anthropicApiKey")

// ✅ Variables d'environnement
const apiKey = process.env.ANTHROPIC_API_KEY
```

### Validation

```typescript
// Valider toutes les entrées utilisateur
function validateUserInput(input: string): void {
  if (input.length > 100000) {
    throw new Error("Input too long")
  }
  if (containsXSS(input)) {
    throw new Error("Invalid characters")
  }
}
```

### Permissions

```typescript
// Vérifier permissions avant actions sensibles
async function executeCommand(command: string) {
  if (!hasPermission("executeCommands")) {
    throw new Error("Permission denied")
  }
  // ...
}
```

## Contribution

### Workflow

1. **Fork** le repo
2. **Créer** une branche feature
3. **Développer** avec tests
4. **Vérifier** `bun run check`
5. **Commit** avec message conventionnel
6. **Push** et créer PR
7. **Review** et merge

### PR Checklist

- [ ] Tests passent (`bun run test:unit`)
- [ ] Linting OK (`bun run lint`)
- [ ] Types OK (`bun run types`)
- [ ] Documentation mise à jour
- [ ] Changelog entry ajoutée
- [ ] Pas de secrets exposés
- [ ] Performance vérifiée

## Resources

### Documentation interne

- `docs/Architecture.md` - Architecture globale
- `docs/Providers.md` - Système de providers
- `docs/Workflow.md` - Cycle de requête
- `docs/API.md` - API reference

### Documentation externe

- [Bun](https://bun.sh/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vitest](https://vitest.dev/guide/)
- [Biome](https://biomejs.dev/guides/)
- [Protobuf](https://protobuf.dev/)

### Support

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Docs: `/docs` dans le repo
