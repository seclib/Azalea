# Architecture de Cline

## Vue d'ensemble

Cline est une plateforme d'agents IA open-source conçue comme un système distribué et modulaire. L'architecture suit les principes suivants :

- **Event-driven** : Communication via événements (NATS JetStream)
- **Plugin-based** : Extensibilité via providers et outils
- **API-first** : Contrats d'interface stricts
- **Zero-trust** : Sécurité par défaut
- **Observable** : Logs, métriques, traces intégrés

---

## 1. Architecture Globale

### 1.1 Couches

```
┌─────────────────────────────────────────────────────────────┐
│                    Interfaces Utilisateur                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ VSCode       │  │ CLI (TUI)    │  │ JetBrains        │  │
│  │ Extension    │  │              │  │ Plugin           │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼────────────────────┼───────────┘
          │                 │                    │
          └─────────────────┼────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    HostProvider Layer                        │
│  (Abstraction des spécificités plateforme)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    SDK Layer (cline-core)                     │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐   │
│  │ Agents     │  │ Runtime    │  │ LLM Abstractions     │   │
│  │ Framework  │  │ Engine     │  │                      │   │
│  └────────────┘  └────────────┘  └──────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Application Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Controller (State Manager)                           │   │
│  │  - Global State                                       │   │
│  │  - Task Coordination                                  │   │
│  │  - MCP Hub                                            │   │
│  │  - Auth Services                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────┐     │
│  │  Task Execution Engine                               │     │
│  │  - API Requests                                      │     │
│  │  - Tool Execution                                    │     │
│  │  - Context Management                                │     │
│  │  - Checkpointing                                     │     │
│  └─────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Integration Layer                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐   │
│  │ API        │  │ MCP        │  │ External Tools       │   │
│  │ Providers  │  │ Servers    │  │ (Browser, Terminal)  │   │
│  └────────────┘  └────────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Infrastructure Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐   │
│  │ Storage    │  │ NATS       │  │ Observability        │   │
│  │ (Files)    │  │ JetStream  │  │ (Grafana Alloy)      │   │
│  └────────────┘  └────────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Principes Architecturaux

#### Single Source of Truth
Le `Controller` est l'unique source de vérité pour l'état global. Tous les composants lisent/écrivent via le Controller.

#### Isolation des Tasks
Chaque tâche s'exécute dans sa propre instance de `Task`, garantissant l'isolation des états et ressources.

#### Event-Driven
Toute communication inter-services passe par des événements (NATS). Aucune communication directe service→service n'est autorisée.

#### Provider Pattern
Les providers IA, les hôtes (VSCode/CLI/JetBrains), et les intégrations utilisent tous le pattern Provider pour l'extensibilité.

---

## 2. Architecture VSCode Extension

### 2.1 Composants Principaux

```
┌─────────────────────────────────────────────────────────────┐
│                    VSCode Extension Host                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  extension.ts (Activation)                            │   │
│  │  - Setup HostProvider                                 │   │
│  │  - Migration storage                                  │   │
│  │  - Register commands/views                            │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │  WebviewProvider                                      │   │
│  │  - Multi-instance (sidebar, panel)                    │   │
│  │  - postMessage communication                          │   │
│  │  - HTML generation + CSP                              │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │  Controller                                           │   │
│  │  - StateManager (cache + disk)                        │   │
│  │  - Task lifecycle                                     │   │
│  │  - McpHub                                             │   │
│  │  - AuthService                                        │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │  Task                                                 │   │
│  │  - API streaming                                      │   │
│  │  - Tool execution                                     │   │
│  │  - Context management                                 │   │
│  │  - Checkpointing                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Webview (React)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  App.tsx                                              │   │
│  │  └── Providers.tsx                                    │   │
│  │      └── ExtensionStateContext                        │   │
│  │          └── Components (chat, settings, mcp, ...)    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Flux de Communication

```
Webview (React) ←→ WebviewProvider ←→ Controller ←→ Task
       ↑                  ↑                ↑           ↑
       │                  │                │           │
       └──────────────────┴────────────────┴───────────┘
              gRPC/Protobuf (postMessage)
```

**Protocole** : gRPC/Protobuf sur VSCode `postMessage`

**Génération** : `npm run protos` compile les `.proto` en TypeScript

**Fichiers** :
- `proto/cline/task.proto` - Opérations de tâches
- `proto/cline/ui.proto` - Événements UI
- `proto/cline/state.proto` - Mises à jour d'état
- `proto/cline/models.proto` - Modèles IA

---

## 3. Architecture SDK

### 3.1 Packages

```
sdk/packages/
├── agents/          # Framework d'agents (Agent, Runner, Tools)
├── core/            # ClineCore runtime (Task, Context, Storage)
├── llms/            # Abstractions LLM (Providers, Models, Formats)
├── sdk/             # SDK public (Client, API)
└── shared/          # Types partagés (Events, Utils)
```

### 3.2 ClineCore

**Rôle** : Moteur d'exécution d'agents IA, indépendant de toute UI.

**Responsabilités** :
- Exécution de tâches (Task loop)
- Gestion du contexte (ContextManager)
- Appels API (via LLM abstractions)
- Exécution d'outils (ToolExecutor)
- Persistance (Storage abstractions)

**Usage** : Utilisé par VSCode, CLI, et intégrations tierces.

---

## 4. Architecture des Providers IA

### 4.1 Interface Commune

```typescript
interface ApiHandler {
  // Streaming de réponses
  *stream(request: ApiRequest): ApiStream
  
  // Construction du handler depuis config
  create(config: ApiConfiguration): ApiHandler
  
  // Validation de la config
  validateConfig(config: ApiConfiguration): ValidationResult
}
```

### 4.2 Factory Pattern

```typescript
// src/core/api/index.ts
export function buildApiHandler(
  provider: ApiProvider,
  config: ApiConfiguration
): ApiHandler {
  switch (provider) {
    case "anthropic": return new AnthropicHandler(config)
    case "openai": return new OpenAIHandler(config)
    case "openrouter": return new OpenRouterHandler(config)
    // ... 40+ providers
  }
}
```

### 4.3 Formats API Supportés

| Format | Providers | Caractéristiques |
|--------|-----------|------------------|
| Anthropic | anthropic, bedrock, vertex | Messages API, prompt caching |
| OpenAI | openai, deepseek, qwen, mistral | Chat Completions |
| OpenAI Responses | openai-native, openai-codex | Tool calling natif, reasoning |
| Gemini | gemini | Multimodal, thinking levels |
| OpenAI Compatible | ollama, lmstudio, groq, cerebras | Chat Completions standard |

---

## 5. Architecture du Système de Prompts

### 5.1 Structure Modulaire

```
system-prompt/
├── components/           # Sections réutilisables
│   ├── rules.ts          # Règles de base
│   ├── capabilities.ts   # Capacités de Cline
│   ├── editing_files.ts  # Édition de fichiers
│   ├── tools/            # Définitions d'outils
│   └── ...
├── variants/             # Configurations par famille
│   ├── generic/          # Fallback universel
│   ├── next-gen/         # Claude 4, GPT-5, Gemini 2.5
│   ├── native-next-gen/  # Tool calling natif
│   ├── xs/               # Modèles locaux petits
│   └── ...
├── tools/                # 24 définitions d'outils
├── templates/            # Moteur de templates
└── registry/             # Enregistrement central
```

### 5.2 Système de Variants

**Principe** : Chaque famille de modèles a ses propres configurations de prompt.

**Familles** :
- **Generic** : Fallback universel (tous modèles)
- **Next-gen** : Claude 4, GPT-5, Gemini 2.5+ (tool calling natif)
- **Native variants** : Versions avec tool calling natif uniquement
- **XS** : Modèles locaux petits (prompts condensés)
- **Spécialisés** : Hermes, GLM, Devstral, Trinity

**Override** : Les variants peuvent override des components via `componentOverrides` dans `config.ts`.

### 5.3 Moteur de Templates

**Placeholders** : `{{PLACEHOLDER}}` résolus dynamiquement.

**Exemples** :
- `{{TOOLS}}` - Liste des outils disponibles
- `{{RULES}}` - Règles de base
- `{{CAPABILITIES}}` - Capacités de Cline
- `{{CONTEXT}}` - Contexte utilisateur

---

## 6. Architecture du Système MCP

### 6.1 McpHub (Hub Central)

```
┌─────────────────────────────────────────────────────────────┐
│                      McpHub                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Connection Manager                                   │   │
│  │  - StdioTransport (CLI)                               │   │
│  │  - SSETransport (HTTP)                                │   │
│  │  - StreamableHTTPTransport                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────┐     │
│  │  Server Lifecycle                                     │     │
│  │  - Start/Stop/Restart                                 │     │
│  │  - Health monitoring                                  │     │
│  │  - Auto-reconnection                                  │     │
│  └─────────────────────────────────────────────────────┘     │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────┐     │
│  │  Tool/Resource Discovery                              │     │
│  │  - ListTools                                          │     │
│  │  - ListResources                                      │     │
│  │  - ListPrompts                                        │     │
│  └─────────────────────────────────────────────────────┘     │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────┐     │
│  │  OAuth Manager                                        │     │
│  │  - Token refresh                                      │     │
│  │  - Auth flow                                          │     │
│  └─────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Transports

| Transport | Usage | Communication |
|-----------|-------|----------------|
| Stdio | CLI local | stdin/stdout |
| SSE | HTTP server | Server-Sent Events |
| Streamable HTTP | HTTP API | Request/Response + streaming |

### 6.3 Découverte

- **File watcher** sur `mcp_settings.json` (chokidar)
- **Hot reload** des serveurs (redémarrage automatique)
- **Marketplace** : Catalogue en ligne de serveurs MCP

---

## 7. Architecture du Stockage

### 7.1 Hiérarchie

```
~/.cline/
└── data/
    ├── globalState.json          # État global (tous workspaces)
    │   └── Settings, API configs, préférences
    ├── secrets.json              # Secrets chiffrés (mode 0o600)
    │   └── API keys, tokens
    ├── tasks/
    │   └── taskHistory.json      # Historique des tâches
    └── workspaces/
        └── <hash>/
            ├── workspaceState.json  # État par workspace
            └── <taskId>/
                ├── clineMessages.json    # Messages conversation
                ├── apiConversation.json  # Historique API
                └── checkpoints/          # Points Git
```

### 7.2 Abstractions

**StorageContext** : Point d'entrée, contient 3 `ClineFileStorage` :
- `globalState` → `~/.cline/data/globalState.json`
- `secrets` → `~/.cline/data/secrets.json` (chiffré)
- `workspaceState` → `~/.cline/data/workspaces/<hash>/workspaceState.json`

**StateManager** : Cache mémoire + flush debounced vers disque.

**Règle** : Toute lecture/écriture passe par `StateManager`, jamais par `context.globalState` VSCode natif.

---

## 8. Architecture des Hooks

### 8.1 Types de Hooks

| Hook | Timing | Usage |
|------|--------|-------|
| PreToolUse | Avant exécution d'outil | Validation, modification, blocage |
| PostToolUse | Après exécution d'outil | Logging, transformation résultat |
| PreCompact | Avant compactage contexte | Sauvegarde, résumé |
| Notification | Événements système | Alertes utilisateur |
| UserPromptSubmit | Soumission prompt | Transformation, validation |

### 8.2 Découverte

**HookDiscoveryCache** : Cache des hooks découverts pour optimiser les performances.

**File watchers** : Surveillance des dossiers de hooks pour détection automatique.

---

## 9. Architecture Multi-Platform

### 9.1 HostProvider Pattern

```typescript
// Abstraction des spécificités plateforme
interface HostProvider {
  // Webview
  createWebview(): WebviewProvider
  createDiffView(): DiffViewProvider
  
  // Terminal
  createTerminalManager(): TerminalManager
  
  // Browser
  createBrowserSession(): BrowserSession
  
  // Auth
  getCallbackUrl(): Promise<string>
  
  // Storage
  getBinaryLocation(name: string): Promise<string>
}
```

**Implémentations** :
- `VSCodeHostProvider` : apps/vscode/src/hosts/vscode/
- `CLIHostProvider` : apps/cli/src/
- `JetBrainsHostProvider` : (futur)

### 9.2 Avantages

- Code métier partagé (core, sdk)
- UI adaptée à chaque plateforme
- Storage unifié (fichiers)
- Tests cross-platform

---

## 10. Sécurité

### 10.1 Modèle Zero-Trust

- **Pas de confiance par défaut** : Toute action nécessite validation
- **RBAC** : Contrôle d'accès basé sur les rôles (futur)
- **Audit logs** : Toutes les actions sont journalisées
- **Secrets chiffrés** : Stockage en mode 0o600

### 10.2 ClineIgnore

**Fichier** : `.clineignore` (racine du workspace)

**Fonctionnalités** :
- Exclusion de fichiers sensibles
- Patterns glob (comme .gitignore)
- Vérification avant tout accès fichier

### 10.3 Permissions

**CommandPermissionController** : Gestion des permissions d'exécution.

**Niveaux** :
- Read-only (pas de modification)
- Auto-approve (pas de confirmation)
- Manual approval (confirmation requise)

---

## 11. Observabilité

### 11.1 Logging

**Logger** : Logging structuré (`src/shared/services/Logger.ts`)

**Niveaux** : debug, info, warn, error

**Format** : JSON structuré pour parsing

### 11.2 Métriques

- **Token usage** : Comptage par requête
- **Coût** : Calcul par modèle (input/output)
- **Latence** : Temps de réponse API
- **Erreurs** : Taux d'erreur, retry

### 11.3 Télémétrie

**PostHog** : Télémétrie produit (événements anonymes)

**Événements** :
- Button clicks
- Tool usage
- API calls
- Errors

---

## 12. Extensibilité

### 12.1 Points d'Extension

1. **Providers IA** : Ajouter un nouveau fournisseur
2. **Outils** : Ajouter un nouvel outil
3. **Hooks** : Ajouter un hook lifecycle
4. **MCP Servers** : Connecter un serveur MCP
5. **Slash Commands** : Ajouter une commande
6. **Intégrations** : Browser, Terminal, Editor

### 12.2 Plugin System

**Futur** : Système de plugins pour extensions communautaires.

**Concept** :
- Plugins isolés (sandbox)
- API publique stable
- Marketplace de plugins

---

*Document généré par analyse statique du codebase - Dernière mise à jour : 2025-06-19*
