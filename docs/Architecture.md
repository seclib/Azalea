# Architecture d'Azalea

## Vue d'ensemble

Azalea est une plateforme d'agents IA distribuée et modulaire, organisée comme un monorepo Bun/TypeScript. Le projet est structuré en trois couches principales :

- **Apps** : Interfaces utilisateur (VSCode, CLI, Hub, Examples)
- **SDK** : Moteur d'agents réutilisable (`@azalea/core`, `@azalea/agents`, `@azalea/llms`)
- **Shared** : Types, utilitaires et logique métier partagés

## Structure du monorepo

```
azalea/
├── apps/
│   ├── vscode/          # Extension VSCode (legacy, non Bun)
│   ├── cli/             # Interface CLI principale
│   ├── azalea-hub/      # Serveur Hub pour collaboration
│   └── examples/        # Exemples d'intégration
├── sdk/
│   ├── packages/
│   │   ├── core/        # Enki AICore - runtime principal
│   │   ├── agents/      # Framework d'agents
│   │   ├── llms/        # Abstractions LLM/Providers
│   │   ├── shared/      # Types et utilitaires partagés
│   │   └── sdk/         # SDK public
│   └── examples/        # Exemples SDK
├── docs/                # Documentation
├── evals/               # Tests d'évaluation
└── package.json         # Workspace root
```

## Architecture VSCode (apps/vscode)

L'extension VSCode suit une architecture modulaire avec séparation claire des responsabilités :

```
apps/vscode/src/
├── extension.ts         # Point d'entrée VSCode
├── core/
│   ├── controller/      # Orchestrateur principal (Controller)
│   │   ├── index.ts     # Controller class - single source of truth
│   │   ├── account/     # Gestion compte Azalea
│   │   ├── browser/     # Contrôle navigateur
│   │   ├── checkpoints/ # Système de checkpoints Git
│   │   ├── commands/    # Commandes slash
│   │   ├── file/        # Opérations fichiers
│   │   ├── mcp/         # Intégration MCP
│   │   ├── models/      # Gestion modèles IA
│   │   ├── state/       # Gestion état global
│   │   ├── task/        # Exécution tâches
│   │   ├── ui/          # Interface webview
│   │   └── web/         # Fonctionnalités web
│   ├── task/            # Moteur d'exécution de tâches
│   │   ├── index.ts     # Task class - boucle principale
│   │   ├── ToolExecutor.ts
│   │   ├── StreamResponseHandler.ts
│   │   └── tools/       # Handlers d'outils
│   │       └── handlers/ # 24 outils (read, write, bash, browser, etc.)
│   ├── api/             # Couche API providers
│   │   ├── providers/   # 40+ implémentations (Anthropic, OpenAI, etc.)
│   │   ├── adapters/    # Adaptateurs de streaming
│   │   └── transform/   # Transformation de flux
│   ├── prompts/         # Système de prompts
│   │   ├── system-prompt/ # Prompts modulaires par variant
│   │   │   ├── variants/ # Configs par famille de modèles
│   │   │   ├── components/ # Sections réutilisables
│   │   │   └── tools/    # Définitions d'outils
│   │   └── commands.ts  # Commandes slash
│   ├── storage/         # Persistance état
│   │   ├── StateManager.ts # Cache mémoire + flush disque
│   │   ├── disk.ts      # File-backed JSON stores
│   │   └── remote-config/ # Configuration distante
│   ├── webview/         # Communication webview
│   ├── context/         # Gestion contexte
│   ├── hooks/           # Système de hooks
│   ├── mentions/        # Mentions @fichiers
│   ├── permissions/     # Gestion permissions
│   └── workspace/       # Gestion workspaces multi-root
├── services/
│   ├── mcp/             # Model Context Protocol
│   │   ├── McpHub.ts    # Hub MCP central
│   │   └── types.ts
│   ├── account/         # Service compte
│   ├── auth/            # Authentification
│   ├── telemetry/       # Télémetrie
│   ├── logging/         # Logging structuré
│   └── feature-flags/   # Feature flags
├── shared/              # Types partagés extension/webview
│   ├── proto/           # Définitions Protobuf
│   ├── ExtensionMessage.ts
│   └── net.ts           # Proxy-aware fetch
└── webview-ui/          # Interface React
    ├── src/
    │   ├── App.tsx
    │   ├── context/     # ExtensionStateContext
    │   └── components/  # Composants React
    └── dist/            # Build output
```

## Architecture CLI (apps/cli)

```
apps/cli/src/
├── main.ts              # Point d'entrée CLI
├── commands/            # Commandes CLI
├── runtime/             # Runtime agent
├── session/             # Gestion sessions
├── tui/                 # Terminal UI
├── connectors/          # Connecteurs externes
├── acp/                 # Agent Communication Protocol
└── wizards/             # Assistants configuration
```

## Architecture SDK (sdk/packages)

### Core (`@azalea/core`)

```
sdk/packages/core/src/
├── Enki AICore.ts         # Point d'entrée SDK principal
├── enki-core/          # Implémentation Enki AICore
│   ├── Enki AICoreImpl.ts
│   ├── session/         # Gestion sessions
│   ├── task/            # Exécution tâches
│   ├── context/         # Gestion contexte
│   └── storage/         # Persistance
├── runtime/             # Runtime abstrait
│   ├── host.ts          # Sélection host (local/hub)
│   └── RuntimeHost.ts   # Interface host
├── hub/                 # Intégration Hub
├── cron/                # Automatisation planifiée
├── hooks/               # Système de hooks
├── extensions/          # Système d'extensions
└── settings/            # Configuration
```

### Agents (`@azalea/agents`)

```
sdk/packages/agents/src/
├── agent.ts             # Agent loop principal
├── tools/               # Définitions outils
├── types.ts
└── index.ts
```

### LLMs (`@azalea/llms`)

```
sdk/packages/llms/src/
├── providers/           # Providers LLM
├── models/              # Définitions modèles
├── formats/             # Formats (Anthropic, OpenAI, etc.)
└── index.ts
```

## Flux de données principal

```
User Input (VSCode/CLI)
    ↓
Webview/CLI TUI
    ↓ postMessage
Controller (state manager)
    ↓
Task (task executor)
    ↓
API Layer (provider selection)
    ↓
LLM Provider (Anthropic/OpenAI/etc.)
    ↓ stream
Task (response handler)
    ↓ parse
Tool Execution (if needed)
    ↓
File System / Browser / MCP / Shell
    ↓
State Update
    ↓
Webview/CLI Update
```

## Composants clés

### Controller
- **Rôle** : Single source of truth pour l'état de l'extension
- **Responsabilités** :
  - Gestion état global (VSCode global state, secrets, workspace state)
  - Coordination des tâches
  - Gestion MCP Hub
  - Authentification compte
  - Distribution état vers webview et core

### Task
- **Rôle** : Exécuteur de boucle agentique
- **Responsabilités** :
  - Boucle principale : API request → stream → tools → repeat
  - Gestion contexte (token window, compaction)
  - Exécution outils avec approbation
  - Gestion erreurs et retry
  - Sauvegarde état et checkpoints

### McpHub
- **Rôle** : Gestionnaire de protocole MCP
- **Responsabilités** :
  - Connexion serveurs MCP (stdio/SSE)
  - Découverte outils et ressources
  - Exécution outils MCP
  - Monitoring santé serveurs

### StateManager
- **Rôle** : Couche de persistance
- **Architecture** :
  - Cache mémoire (in-memory)
  - File-backed JSON stores (`~/.enki/data/`)
  - Debounce flush vers disque
  - Migration VSCode → file-backed

## Système de Providers

40+ providers IA supportés via architecture unifiée :

```
apps/vscode/src/core/api/providers/
├── anthropic.ts         # Claude (API native)
├── openai.ts            # GPT-4/5 (API native)
├── openai-native.ts     # OpenAI Responses API
├── openai-codex.ts      # OpenAI Codex
├── bedrock.ts           # AWS Bedrock
├── vertex.ts            # Google Vertex AI
├── gemini.ts            # Google Gemini
├── ollama.ts            # Ollama local
├── lmstudio.ts          # LM Studio local
├── vscode-lm.ts         # VSCode LM API
├── openrouter.ts        # OpenRouter (agrégateur)
├── deepseek.ts          # DeepSeek
├── qwen.ts              # Qwen
├── mistral.ts           # Mistral
├── cerebras.ts          # Cerebras
├── together.ts          # Together AI
├── fireworks.ts         # Fireworks AI
├── groq.ts              # Groq
├── xai.ts               # xAI (Grok)
├── zai.ts               # Zhipu AI
└── ... (20+ autres)
```

## Système de Prompts

Architecture modulaire avec variants par famille de modèles :

```
apps/vscode/src/core/prompts/system-prompt/
├── components/          # Sections réutilisables
│   ├── rules.ts         # Règles de base
│   ├── capabilities.ts  # Capacités de l'agent
│   ├── editing_files.ts # Édition de fichiers
│   └── ...
├── variants/            # Configs spécifiques par modèle
│   ├── generic/         # Fallback universel
│   ├── next-gen/        # Claude 4, GPT-5, Gemini 2.5
│   ├── native-next-gen/ # Providers Responses API
│   ├── gpt-5/           # GPT-5 spécifique
│   ├── gemini-3/        # Gemini 3
│   ├── xs/              # Modèles légers
│   └── ...
├── tools/               # Définitions d'outils
│   ├── read_file.ts
│   ├── write_to_file.ts
│   ├── execute_command.ts
│   └── ...
└── templates/           # Moteur de templates
```

## Système MCP (Model Context Protocol)

```
apps/vscode/src/services/mcp/
├── McpHub.ts            # Hub central
├── McpOAuthManager.ts   # OAuth MCP
├── types.ts             # Types MCP
└── schemas.ts           # Schémas JSON

Features:
- Support stdio et SSE
- Auto-approval par outil
- Marketplace MCP
- OAuth intégré
- Reconnection automatique
```

## Système de stockage

```
~/.enki/data/
├── globalState.json          # État global
├── secrets.json              # Secrets (mode 0o600)
├── tasks/
│   └── taskHistory.json      # Historique tâches
└── workspaces/
    └── <hash>/
        └── workspaceState.json # État par workspace

Abstractions:
- StorageContext → 3 Enki AIFileStorage instances
- StateManager → Cache mémoire + flush debounced
- Migration VSCode → file-backed automatique
```

## Technologies clés

- **Runtime** : Bun 1.3.13, Node.js >= 22
- **Language** : TypeScript 5.9+
- **UI** : React (webview), TUI (CLI)
- **Communication** : gRPC/Protobuf (VSCode ↔ webview)
- **Event Bus** : NATS JetStream (futur)
- **Observability** : Grafana Alloy (futur)
- **Testing** : Vitest, Playwright, Mocha
- **Linting** : Biome
- **Build** : esbuild, TypeScript compiler
