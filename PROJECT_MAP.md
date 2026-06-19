# Cline - Cartographie Complète du Projet

## Vue d'ensemble

**Cline** est une plateforme d'agents IA open-source pour le développement logiciel, disponible sous forme d'extension VSCode, d'application CLI, et de plugin JetBrains. Le projet est structuré comme un monorepo utilisant **Bun** comme gestionnaire de paquets et **TypeScript** comme langage principal.

**Stack technique** :
- Runtime : Bun 1.3.13 / Node.js >= 22
- Langage : TypeScript 5.9+
- Frontend Webview : React + Vite
- Communication : gRPC/Protobuf (VS Code ↔ Webview)
- Event Bus : NATS JetStream (architecture distribuée)
- Observabilité : Grafana Alloy
- Tests : Vitest, Playwright, Mocha

---

## Structure du Monorepo

```
cline/
├── apps/                          # Applications
│   ├── vscode/                    # Extension VSCode (monorepo exclu du workspace root)
│   ├── cli/                       # Application CLI (Bun)
│   ├── cline-hub/                 # Hub web pour MCP marketplace
│   └── examples/                  # Exemples d'intégration
│       ├── cli-agent/
│       ├── cline-core-cli-agent/
│       ├── code-review-bot/
│       ├── desktop-app/
│       ├── menubar/
│       ├── multi-agent/
│       ├── quickstart/
│       └── vscode/
├── sdk/                           # SDK partagé
│   ├── packages/
│   │   ├── agents/                # Framework d'agents
│   │   ├── core/                  # Cœur du runtime (ClineCore)
│   │   ├── llms/                  # Abstractions LLM
│   │   ├── sdk/                   # SDK public
│   │   └── shared/                # Types et utilitaires partagés
│   └── examples/
│       ├── plugins/
│       └── ...
├── evals/                         # Framework d'évaluation
├── docs/                          # Documentation
├── proto/                         # Fichiers Protobuf (dans apps/vscode/proto/)
├── .clinerules/                   # Règles et conventions du projet
└── package.json                   # Workspace root (Bun)
```

---

## 1. Application VSCode (`apps/vscode/`)

### 1.1 Structure

```
apps/vscode/
├── src/
│   ├── extension.ts                # Point d'entrée de l'extension
│   ├── common.ts                   # Initialisation commune (cross-platform)
│   ├── config.ts                   # Configuration (IS_DEV, etc.)
│   ├── registry.ts                 # Enregistrement des commandes/views
│   ├── core/                       # Logique métier principale
│   │   ├── api/                    # Couche API (providers + adapters)
│   │   │   ├── providers/          # 40+ providers IA
│   │   │   ├── adapters/           # Adaptateurs de streaming
│   │   │   ├── transform/          # Transformations de flux
│   │   │   └── utils/              # Utilitaires API
│   │   ├── assistant-message/      # Parsing des messages assistant
│   │   ├── commands/               # Commandes slash et handlers
│   │   ├── context/                # Gestion du contexte
│   │   │   ├── context-management/ # ContextManager (fenêtre de contexte)
│   │   │   └── context-tracking/   # Trackers (fichiers, env, modèles)
│   │   ├── controller/             # Contrôleur principal (état global)
│   │   │   ├── index.ts            # Classe Controller (singleton)
│   │   │   ├── state/              # Gestion de l'état
│   │   │   ├── ui/                 # Événements UI
│   │   │   ├── mcp/                # Gestion MCP
│   │   │   ├── task/               # Gestion des tâches
│   │   │   └── ...
│   │   ├── hooks/                  # Système de hooks (lifecycle)
│   │   ├── ignore/                 # Contrôleur .clineignore
│   │   ├── locks/                  # Verrous de tâches
│   │   ├── mentions/               # Système de mentions (@)
│   │   ├── permissions/            # Permissions de commandes
│   │   ├── prompts/                # Prompts système
│   │   │   ├── system-prompt/      # Prompts modulaires (voir section détaillée)
│   │   │   ├── commands.ts         # Commandes intégrées
│   │   │   └── responses.ts        # Réponses formatées
│   │   ├── slash-commands/         # Commandes slash personnalisées
│   │   ├── storage/                # Persistance (StateManager, disk)
│   │   ├── task/                   # Exécution des tâches (Task class)
│   │   ├── webview/                # Communication webview
│   │   └── workspace/              # Gestion multi-workspace
│   ├── services/                   # Services externes
│   │   ├── mcp/                    # MCP Hub (connexions MCP)
│   │   ├── auth/                   # Authentification (Cline, OCA, WorkOS)
│   │   ├── account/                # Gestion de compte
│   │   ├── browser/                # Automatisation navigateur (Puppeteer)
│   │   ├── telemetry/              # Télémétrie (PostHog)
│   │   ├── logging/                # Logging structuré
│   │   ├── feature-flags/          # Feature flags
│   │   ├── search/                 # Recherche (ripgrep)
│   │   ├── tree-sitter/            # Analyse de code
│   │   └── ...
│   ├── integrations/               # Intégrations externes
│   │   ├── checkpoints/            # Système de checkpoints Git
│   │   ├── claude-code/            # Intégration Claude Code CLI
│   │   ├── openai-codex/           # Intégration OpenAI Codex
│   │   ├── editor/                 # DiffViewProvider
│   │   ├── terminal/               # Gestion de terminaux
│   │   └── notifications/          # Notifications système
│   ├── hosts/                      # Abstraction hôte (VSCode, CLI, JetBrains)
│   │   ├── vscode/                 # Implémentation VSCode
│   │   ├── host-provider.ts        # Provider pattern
│   │   └── ...
│   ├── shared/                     # Code partagé core/webview
│   │   ├── api.ts                  # Types API (ApiProvider, ModelInfo)
│   │   ├── ExtensionMessage.ts     # Messages extension↔webview
│   │   ├── WebviewMessage.ts       # Messages webview→extension
│   │   ├── proto/                  # Définitions Protobuf
│   │   ├── proto-conversions/      # Conversions Proto↔TS
│   │   ├── storage/                # Gestion de stockage
│   │   │   ├── state-keys.ts       # Clés d'état (GlobalState, Settings)
│   │   │   ├── storage-context.ts  # Contexte de stockage
│   │   │   └── StateManager.ts      # Cache + persistance
│   │   ├── tools.ts                # Définitions des outils (ClineDefaultTool)
│   │   └── ...
│   ├── utils/                      # Utilitaires
│   └── dev/                        # Outils de développement
├── webview-ui/                     # Interface React (webview)
│   └── src/
│       ├── App.tsx                 # Composant racine
│       ├── Providers.tsx           # Providers React
│       ├── components/             # Composants UI
│       │   ├── chat/               # Interface de chat
│       │   ├── settings/           # Paramètres
│       │   ├── mcp/                # Gestion MCP
│       │   ├── browser/            # Contrôle navigateur
│       │   ├── history/            # Historique des tâches
│       │   ├── account/            # Authentification
│       │   ├── onboarding/         # Onboarding
│       │   └── ui/                 # Composants UI génériques
│       ├── context/                # Contextes React
│       │   └── ExtensionStateContext.tsx  # État global webview
│       ├── hooks/                  # Hooks React personnalisés
│       ├── services/               # Services webview
│       ├── utils/                  # Utilitaires webview
│       └── config/                 # Configuration webview
├── proto/                          # Fichiers .proto (gRPC)
│   └── cline/
│       ├── task.proto
│       ├── ui.proto
│       ├── state.proto
│       ├── models.proto
│       └── ...
└── package.json
```

### 1.2 Architecture Core (Backend Extension)

#### Controller (`src/core/controller/index.ts`)
**Rôle** : Single source of truth pour l'état de l'extension.

**Responsabilités** :
- Gestion de l'état global (StateManager)
- Coordination des tâches (Task instances)
- Gestion des connexions MCP (McpHub)
- Authentification (AuthService, OcaAuthService)
- Synchronisation webview↔extension
- Gestion multi-workspace

**Flux de données** :
```
WebviewProvider → Controller → Task → API Providers
                    ↓
                 McpHub → MCP Servers
                    ↓
              StateManager → Disk/GlobalState/Secrets
```

#### Task (`src/core/task/index.ts`)
**Rôle** : Exécution des requêtes IA et des outils.

**Responsabilités** :
- Boucle d'exécution IA (initiateTaskLoop)
- Streaming des réponses (presentAssistantMessage)
- Exécution des outils (executeToolWithApproval)
- Gestion du contexte (ContextManager)
- Checkpoints Git
- Gestion des erreurs et retry

**Flux d'exécution** :
```
1. initiateTaskLoop(userContent)
2. attemptApiRequest() → stream API
3. Parse assistantMessageContent (content blocks)
4. presentAssistantMessage() → streaming UI
5. Wait for tool execution (userMessageContentReady)
6. recursivelyMakeClineRequests() → boucle
```

#### WebviewProvider (`src/core/webview/index.ts`)
**Rôle** : Gestion du cycle de vie webview.

**Responsabilités** :
- Création/multi-instances (sidebar, panel)
- Communication bidirectionnelle (postMessage)
- Génération HTML avec CSP
- Hot Module Replacement (dev)

---

## 2. Application CLI (`apps/cli/`)

### 2.1 Structure

```
apps/cli/
├── src/
│   ├── main.ts                    # Point d'entrée CLI
│   ├── index.ts                   # Export public
│   ├── acp/                       # Agent Communication Protocol
│   ├── commands/                  # Commandes CLI
│   ├── connectors/                # Connecteurs (API, MCP)
│   ├── logging/                   # Logging CLI
│   ├── runtime/                   # Runtime d'exécution
│   ├── session/                   # Gestion de sessions
│   ├── tui/                       # Terminal UI (interface interactive)
│   ├── utils/                     # Utilitaires
│   └── wizards/                   # Assistants de configuration
├── bin/                           # Binaires
├── script/                        # Scripts de build
└── package.json
```

**Technologies** :
- TUI : Bibliothèque terminal UI (probablement Ink ou similaire)
- Runtime : Basé sur SDK Cline Core
- Mode : Interactif (TUI) ou headless (CI/CD)

---

## 3. SDK (`sdk/packages/`)

### 3.1 Structure

```
sdk/packages/
├── agents/                        # Framework d'agents
│   └── src/
│       ├── agent.ts               # Classe Agent de base
│       ├── runner.ts              # Exécuteur d'agents
│       └── ...
├── core/                          # Runtime ClineCore
│   └── src/
│       ├── cline-core.ts          # Cœur du système
│       ├── cron/                  # Planificateur de tâches
│       ├── task/                  # Gestion de tâches
│       └── ...
├── llms/                          # Abstractions LLM
│   └── src/
│       ├── providers/             # Providers LLM
│       ├── models/                # Définitions de modèles
│       └── ...
├── sdk/                           # SDK public
│   └── src/
│       ├── client.ts              # Client API
│       └── ...
└── shared/                        # Types partagés
    └── src/
        ├── types.ts
        └── ...
```

**Usage** : Le SDK permet d'intégrer Cline dans des applications tierces (ex: `cline-core-cli-agent`, `multi-agent`).

---

## 4. Providers IA (`apps/vscode/src/core/api/providers/`)

### 4.1 Liste des Providers (40+)

| Provider | Fichier | Type |
|----------|---------|------|
| Anthropic | `anthropic.ts` | Direct API |
| Claude Code | `claude-code.ts` | CLI local |
| OpenRouter | `openrouter.ts` | Agrégateur |
| AWS Bedrock | `bedrock.ts` | Cloud |
| Vertex AI | `vertex.ts` | Cloud |
| OpenAI | `openai.ts` | Direct API |
| OpenAI Native | `openai-native.ts` | Responses API |
| OpenAI Codex | `openai-codex.ts` | CLI/Responses API |
| Ollama | `ollama.ts` | Local |
| LM Studio | `lmstudio.ts` | Local |
| Gemini | `gemini.ts` | Direct API |
| DeepSeek | `deepseek.ts` | Direct API |
| Qwen | `qwen.ts` | Direct API |
| Qwen Code | `qwen-code.ts` | CLI |
| Mistral | `mistral.ts` | Direct API |
| Groq | `groq.ts` | Direct API |
| Cerebras | `cerebras.ts` | Direct API |
| Together | `together.ts` | Direct API |
| Fireworks | `fireworks.ts` | Direct API |
| xAI | `xai.ts` | Direct API |
| VSCode LM | `vscode-lm.ts` | Intégré VSCode |
| Cline | `cline.ts` | Service Cline |
| LiteLLM | `litellm.ts` | Proxy |
| Moonshot | `moonshot.ts` | Direct API |
| Nebius | `nebius.ts` | Direct API |
| HuggingFace | `huggingface.ts` | Inference API |
| Dify | `dify.ts` | Plateforme |
| Baseten | `baseten.ts` | Inference |
| Vercel AI Gateway | `vercel-ai-gateway.ts` | Edge |
| ZAI | `zai.ts` | Direct API |
| OCA | `oca.ts` | Service OCA |
| Aihubmix | `aihubmix.ts` | Agrégateur |
| Minimax | `minimax.ts` | Direct API |
| Hicap | `hicap.ts` | Direct API |
| NousResearch | `nousresearch.ts` | Direct API |
| W&B | `wandb.ts` | MLOps |
| SambaNova | `sambanova.ts` | Direct API |
| Huawei Cloud MaaS | `huawei-cloud-maas.ts` | Cloud |
| AskSage | `asksage.ts` | Gouvernemental |
| SAP AI Core | `sapaicore.ts` | Enterprise |

**Architecture** :
- Chaque provider implémente une interface commune (`ApiHandler`)
- Factory pattern dans `src/core/api/index.ts` (`buildApiHandler`)
- Support du streaming, retry, token tracking
- Formats API : Anthropic, OpenAI, OpenAI Responses, Gemini

---

## 5. Système de Prompts (`apps/vscode/src/core/prompts/system-prompt/`)

### 5.1 Architecture Modulaire

```
system-prompt/
├── components/                    # Sections réutilisables
│   ├── rules.ts                   # Règles de base
│   ├── capabilities.ts            # Capacités de Cline
│   ├── editing_files.ts           # Édition de fichiers
│   ├── tools/                     # Définitions d'outils
│   └── ...
├── variants/                      # Variantes par famille de modèles
│   ├── generic/                   # Fallback par défaut
│   ├── next-gen/                  # Claude 4, GPT-5, Gemini 2.5
│   ├── native-next-gen/           # Next-gen avec tool calling natif
│   ├── native-gpt-5/              # GPT-5 natif
│   ├── native-gpt-5-1/            # GPT-5.1 natif
│   ├── gemini-3/                  # Gemini 3
│   ├── gpt-5/                     # GPT-5
│   ├── xs/                        # Modèles locaux petits
│   ├── hermes/                    # Hermes
│   ├── glm/                       # GLM
│   ├── devstral/                  # Devstral
│   └── trinity/                   # Trinity
├── tools/                         # Définitions des outils (24 outils)
│   ├── read_file.ts
│   ├── write_to_file.ts
│   ├── replace_in_file.ts
│   ├── execute_command.ts
│   ├── browser_action.ts
│   ├── use_mcp_tool.ts
│   ├── access_mcp_resource.ts
│   ├── ask_followup_question.ts
│   ├── attempt_completion.ts
│   ├── plan_mode_respond.ts
│   ├── act_mode_respond.ts
│   ├── search_files.ts
│   ├── list_files.ts
│   ├── list_code_definition_names.ts
│   ├── web_fetch.ts
│   ├── web_search.ts
│   ├── apply_patch.ts
│   ├── generate_explanation.ts
│   ├── focus_chain.ts
│   ├── subagent.ts
│   ├── use_skill.ts
│   ├── load_mcp_documentation.ts
│   └── new_task.ts
├── templates/                     # Moteur de templates
├── registry/                      # Enregistrement des prompts
├── index.ts                       # Point d'entrée
├── spec.ts                        # Spécification
└── types.ts                       # Types
```

**Familles de modèles** :
- **Next-gen** : Claude 4, GPT-5, Gemini 2.5+ (tool calling natif)
- **Standard** : Generic (fallback universel)
- **Local/Small** : XS, Hermes, GLM (prompts condensés)
- **Spécialisés** : Devstral, Trinity, GPT-5 variants

---

## 6. Outils (Tools)

### 6.1 Liste Complète (24 outils)

| Outil | Enum | Description |
|-------|------|-------------|
| `read_file` | `ClineDefaultTool.ReadFile` | Lire un fichier |
| `write_to_file` | `ClineDefaultTool.WriteToFile` | Écrire un fichier |
| `replace_in_file` | `ClineDefaultTool.ReplaceInFile` | Modifier un fichier |
| `execute_command` | `ClineDefaultTool.ExecuteCommand` | Exécuter une commande |
| `browser_action` | `ClineDefaultTool.BrowserAction` | Actions navigateur |
| `use_mcp_tool` | `ClineDefaultTool.UseMcpTool` | Appeler un outil MCP |
| `access_mcp_resource` | `ClineDefaultTool.AccessMcpResource` | Accéder à une ressource MCP |
| `ask_followup_question` | `ClineDefaultTool.AskFollowupQuestion` | Poser une question |
| `attempt_completion` | `ClineDefaultTool.AttemptCompletion` | Terminer une tâche |
| `plan_mode_respond` | `ClineDefaultTool.PlanModeRespond` | Répondre en mode Plan |
| `act_mode_respond` | `ClineDefaultTool.ActModeRespond` | Répondre en mode Act |
| `search_files` | `ClineDefaultTool.SearchFiles` | Rechercher dans fichiers |
| `list_files` | `ClineDefaultTool.ListFiles` | Lister fichiers/dossiers |
| `list_code_definition_names` | `ClineDefaultTool.ListCodeDefinitionNames` | Lister définitions code |
| `web_fetch` | `ClineDefaultTool.WebFetch` | Récupérer une URL |
| `web_search` | `ClineDefaultTool.WebSearch` | Recherche web |
| `apply_patch` | `ClineDefaultTool.ApplyPatch` | Appliquer un patch |
| `generate_explanation` | `ClineDefaultTool.GenerateExplanation` | Générer explication |
| `focus_chain` | `ClineDefaultTool.FocusChain` | Gestion focus chain |
| `subagent` | `ClineDefaultTool.Subagent` | Sous-agent |
| `use_skill` | `ClineDefaultTool.UseSkill` | Utiliser une skill |
| `load_mcp_documentation` | `ClineDefaultTool.LoadMcpDocumentation` | Charger doc MCP |
| `new_task` | `ClineDefaultTool.NewTask` | Nouvelle tâche |

**Définition** : `src/shared/tools.ts` (enum `ClineDefaultTool`)

---

## 7. Système MCP (Model Context Protocol)

### 7.1 Architecture

```
apps/vscode/src/services/mcp/
├── McpHub.ts                      # Hub central (gestion connexions)
├── McpOAuthManager.ts             # Gestion OAuth MCP
├── McpOAuthRedirectResolver.ts    # Résolution OAuth
├── StreamableHttpReconnectHandler.ts  # Reconnexion HTTP
├── constants.ts                   # Constantes (timeouts, etc.)
├── schemas.ts                     # Schémas Zod (validation)
├── types.ts                       # Types MCP
└── __tests__/
```

### 7.2 McpHub (Classe Principale)

**Responsabilités** :
- Gestion du cycle de vie des serveurs MCP
- Connexions Stdio et SSE
- File watcher sur `mcp_settings.json`
- Découverte d'outils et ressources
- Gestion des notifications
- OAuth intégré
- Marketplace MCP (catalogue en ligne)

**Transports supportés** :
- **Stdio** : Communication via stdin/stdout (CLI)
- **SSE** : Server-Sent Events (HTTP)
- **Streamable HTTP** : HTTP avec streaming

**Fichier de configuration** : `~/.cline/settings/mcp_settings.json`

### 7.3 Intégration dans les Outils

- `use_mcp_tool` : Appel d'outils MCP
- `access_mcp_resource` : Accès aux ressources MCP
- `load_mcp_documentation` : Chargement de documentation MCP

---

## 8. Webview UI (`apps/vscode/webview-ui/`)

### 8.1 Structure

```
webview-ui/src/
├── App.tsx                        # Composant racine
├── Providers.tsx                  # Providers React
├── main.tsx                       # Point d'entrée
├── components/
│   ├── chat/                      # Interface de chat
│   │   ├── ChatRow.tsx            # Ligne de message
│   │   ├── ChatInput.tsx          # Input utilisateur
│   │   └── ...
│   ├── settings/                  # Paramètres
│   │   ├── ApiOptions.tsx         # Configuration API
│   │   ├── BrowserSettings.tsx    # Paramètres navigateur
│   │   └── ...
│   ├── mcp/                       # Gestion MCP
│   │   ├── McpPanel.tsx
│   │   └── ...
│   ├── browser/                   # Contrôle navigateur
│   ├── history/                   # Historique tâches
│   ├── account/                   # Authentification
│   ├── onboarding/                # Onboarding
│   ├── welcome/                   # Vue d'accueil
│   ├── cline-rules/               # Gestion des règles
│   ├── worktrees/                 # Gestion worktrees Git
│   └── ui/                        # Composants génériques
├── context/
│   └── ExtensionStateContext.tsx  # Contexte global React
├── hooks/                         # Hooks personnalisés
├── services/                      # Services webview
├── utils/                         # Utilitaires
└── config/                        # Configuration
```

### 8.2 Communication Extension ↔ Webview

**Protocole** : gRPC/Protobuf via `postMessage`

**Fichiers Proto** :
- `proto/cline/task.proto` : Opérations de tâches
- `proto/cline/ui.proto` : Événements UI
- `proto/cline/state.proto` : Mises à jour d'état
- `proto/cline/models.proto` : Modèles IA

**Génération** : `npm run protos` → `src/generated/`

---

## 9. Stockage et État

### 9.1 Architecture

```
~/.cline/
└── data/
    ├── globalState.json           # État global (tous workspaces)
    ├── secrets.json               # Secrets (mode 0o600)
    ├── tasks/
    │   └── taskHistory.json       # Historique des tâches
    └── workspaces/
        └── <hash>/
            └── workspaceState.json  # État par workspace
```

### 9.2 Abstractions

- **StorageContext** : Entrée point (`createStorageContext()`)
- **ClineFileStorage** : Stockage JSON synchrone (atomic writes)
- **StateManager** : Cache mémoire + flush debounced vers disque

**Règle** : Ne jamais utiliser `context.globalState` VSCode directement (migration vers fichiers).

---

## 10. Système de Hooks

**Emplacement** : `apps/vscode/src/core/hooks/`

**Types de hooks** :
- **PreToolUse** : Avant exécution d'outil
- **PostToolUse** : Après exécution d'outil
- **PreCompact** : Avant compactage du contexte
- **Notification** : Notifications utilisateur
- **UserPromptSubmit** : Soumission de prompt utilisateur

**Découverte** : `HookDiscoveryCache` pour optimisation performance (file watchers).

---

## 11. Intégrations Externes

### 11.1 Checkpoints Git
- **Factory** : `apps/vscode/src/integrations/checkpoints/factory.ts`
- **Implémentations** : Git-based, multi-root support
- **Migration** : `CheckpointMigration.ts`

### 11.2 Navigateur (Puppeteer)
- **BrowserSession** : Contrôle automatisé (900x600 résolution fixe)
- **UrlContentFetcher** : Récupération de contenu web

### 11.3 Claude Code CLI
- Intégration du CLI Claude Code local
- Communication via stdin/stdout

### 11.4 OpenAI Codex
- Intégration du CLI OpenAI Codex
- Support Responses API natif

### 11.5 Terminal
- **VscodeTerminalManager** : Gestion de terminaux multiples
- Support intégration shell (zsh, bash, fish, PowerShell)

---

## 12. Modes Plan/Act

### 12.1 Architecture

**État** : `chatSettings.mode` dans Controller

**Modes** :
- **Plan Mode** : Planification, questions, approche réflexive
- **Act Mode** : Exécution, outils, implémentation

**Séparation** :
- Modèles distincts par mode (optionnel)
- Prompts système différents
- Outils restreints en Plan mode (pas d'outils destructeurs)

**Transition** : `togglePlanActModeWithChatSettings()` dans Controller

---

## 13. Gestion du Contexte (Context Management)

### 13.1 ContextManager

**Responsabilités** :
- Surveillance de la fenêtre de contexte (tokens)
- Truncation proactive (avant erreur)
- Préservation du message original
- Stratégies adaptatives (half/quarter)

**Modèles supportés** :
- DeepSeek : 64K
- Standard : 128K
- Claude : 200K

### 13.2 Trackers

- **FileContextTracker** : Fichiers modifiés
- **EnvironmentContextTracker** : Variables d'environnement
- **ModelContextTracker** : Infos du modèle

---

## 14. Workflows et Features

### 14.1 Features Principales

- **Auto-approval** : Approbation automatique d'outils
- **Auto-compact** : Compactage automatique du contexte
- **Focus Chain** : Workflow guidé (checklist)
- **Subagents** : Sous-agents parallèles
- **Multi-root** : Workspaces multiples
- **Worktrees** : Worktrees Git
- **Jupyter** : Support notebooks `.ipynb`
- **Checkpoints** : Points de restauration Git
- **Browser** : Automatisation navigateur
- **MCP Marketplace** : Catalogue de serveurs MCP

### 14.2 Commandes Slash

**Définition** : `src/core/slash-commands/index.ts`

**Intégration** :
- `src/core/prompts/commands.ts` : System prompt
- `webview-ui/src/utils/slash-commands.ts` : Autocomplete webview

---

## 15. Authentification et Sécurité

### 15.1 Services

- **AuthService** : Authentification Cline (WorkOS Device Auth)
- **OcaAuthService** : Authentification OCA
- **ClineAccountService** : Gestion de compte

### 15.2 Sécurité

- **Zero-trust** : Pas de confiance par défaut
- **RBAC** : Contrôle d'accès (futur)
- **Audit logs** : Journaux d'audit
- **Secrets** : Stockage chiffré (mode 0o600)
- **ClineIgnore** : Exclusion de fichiers sensibles

---

## 16. Observabilité

### 16.1 Logging

- **Logger** : Logging structuré (`src/shared/services/Logger.ts`)
- **Grafana Alloy** : Pipeline d'observabilité unique
- **Telemetry** : PostHog (télémétrie produit)

### 16.2 Métriques

- Token usage tracking
- Coût par requête
- Latence API
- Erreurs et retry

---

## 17. Fichiers de Configuration

### 17.1 Racine

- `package.json` : Workspace Bun
- `biome.json` : Linting/formatting
- `vitest.config.ts` : Tests unitaires
- `.nvmrc` : Version Node.js
- `.tool-versions` : Versions outils

### 17.2 Apps

- `apps/vscode/package.json` : Extension VSCode
- `apps/cli/package.json` : CLI
- `apps/cline-hub/package.json` : Hub web

### 17.3 SDK

- `sdk/packages/*/package.json` : Packages SDK
- `sdk/tsconfig.json` : Configuration TypeScript

---

## 18. Tests

### 18.1 Frameworks

- **Vitest** : Tests unitaires (SDK, CLI)
- **Mocha** : Tests VSCode legacy
- **Playwright** : Tests E2E
- **Bun Test** : Tests intégrés

### 18.2 Structure

```
apps/vscode/src/
├── __tests__/                    # Tests unitaires
└── test/                         # Tests d'intégration

apps/cli/src/
├── tests/                        # Tests CLI
└── *.test.ts                     # Tests E2E

evals/                            # Framework d'évaluation
```

---

## 19. Documentation

### 19.1 Structure

```
docs/
├── api/                          # API Reference
├── best-practices/               # Bonnes pratiques
├── cli/                          # Documentation CLI
├── core-workflows/               # Workflows principaux
├── customization/                # Personnalisation
├── enterprise-solutions/         # Solutions enterprise
├── features/                     # Fonctionnalités
├── getting-started/              # Démarrage
├── kanban/                       # Kanban
├── mcp/                          # MCP
├── provider-config/              # Configuration providers
├── running-models-locally/       # Modèles locaux
└── sdk/                          # SDK
```

---

## 20. Flux de Données Principal

### 20.1 Extension VSCode

```
Utilisateur (VSCode)
    ↓
Webview (React)
    ↓ postMessage (gRPC/Proto)
WebviewProvider
    ↓
Controller (État global)
    ↓
Task (Exécution)
    ↓
API Provider (IA)
    ↓
Streaming → Webview (UI temps réel)
    ↓
Outils → McpHub / Terminal / Browser / Filesystem
    ↓
StateManager → Disk (persistance)
```

### 20.2 CLI

```
Utilisateur (Terminal)
    ↓
TUI (Interface)
    ↓
Runtime (ClineCore)
    ↓
Task Execution
    ↓
API Provider / MCP / Tools
    ↓
Session (persistance)
```

---

## 21. Points d'Extension

### 21.1 Ajout d'un Provider IA

1. `src/core/api/providers/[provider].ts` : Implémenter `ApiHandler`
2. `src/shared/api.ts` : Ajouter au type `ApiProvider`
3. `src/shared/providers/providers.json` : Ajouter à la liste
4. `src/core/api/index.ts` : Enregistrer dans `createHandlerForProvider()`
5. `webview-ui/src/components/settings/utils/providerUtils.ts` : Ajouter cas
6. `webview-ui/src/utils/validate.ts` : Ajouter validation
7. `webview-ui/src/components/settings/ApiOptions.tsx` : Renderer composant

### 21.2 Ajout d'un Outil

1. `src/shared/tools.ts` : Ajouter à `ClineDefaultTool` enum
2. `src/core/prompts/system-prompt/tools/[tool].ts` : Définir variants
3. `src/core/prompts/system-prompt/tools/init.ts` : Enregistrer
4. `src/core/prompts/system-prompt/variants/*/config.ts` : Ajouter aux configs
5. `src/core/task/tools/handlers/[tool].ts` : Implémenter handler
6. `src/core/task/ToolExecutor.ts` : Wire up si nécessaire
7. `src/core/assistant-message/index.ts` : Ajouter parsing si besoin
8. (Optionnel) `proto/cline/task.proto` : Ajouter `ClineSay` enum
9. (Optionnel) `webview-ui/src/components/chat/ChatRow.tsx` : UI feedback

---

## 22. Conventions et Règles

### 22.1 Nommage

- **Services** : `PascalCaseService`
- **RPCs** : `camelCase`
- **Messages Proto** : `PascalCase`
- **Fichiers** : `kebab-case.ts`

### 22.2 Patterns

- **Controller** : Single source of truth
- **StateManager** : Cache + debounce flush
- **Task** : Isolation par instance
- **Provider** : Factory pattern
- **Hooks** : Lifecycle events

### 22.3 Interdits

- Pas de `fetch` global (utiliser `@/shared/net`)
- Pas de `axios` par défaut (utiliser `getAxiosSettings()`)
- Pas de stockage VSCode natif (utiliser StateManager)
- Pas de communication service→service directe (NATS only)

---

## 23. Scripts Principaux

```bash
# Développement
bun run dev                    # SDK + CLI
bun run cli                    # CLI seul (dev)
bun run code                   # SDK code (dev)

# Build
bun run build                  # Full build
bun run build:sdk              # SDK seulement
bun run build:apps             # Apps seulement
bun run build:models           # Générer modèles LLM

# Tests
bun run test                   # Tous les tests
bun run test:unit              # Tests unitaires parallèles
bun run test:e2e               # Tests E2E

# Qualité
bun run biome                  # Linter
bun run format                 # Formatter
bun run lint                   # Lint only
bun run check                  # Check complet

# Protobuf
npm run protos                 # Générer code Proto

# Types
bun run types                  # TypeScript check
```

---

## 24. Statistiques du Projet

- **Providers IA** : 40+
- **Outils** : 24
- **Variants de prompts** : 13 familles de modèles
- **Langages supportés** : 100+ (via `src/shared/Languages.ts`)
- **Tests** : Vitest + Playwright + Mocha
- **Workspaces** : Multi-root support
- **Plates-formes** : VSCode, CLI, JetBrains (via abstraction HostProvider)

---

## 25. Points d'Attention

### 25.1 Migration VSCode

- Migration automatique vers stockage fichier (`vscode-to-file-migration.ts`)
- Sentinel : `__vscodeMigrationVersion`
- Stratégie : File store gagne (pas d'overwrite)

### 25.2 Round-trip État

- Webview toggle → Controller → StateManager → Fichier
- Doit être bidirectionnel (backend + frontend)
- Clés manquantes = silencieux (pas d'erreur)

### 25.3 Native Tool Calling

- Providers Responses API (OpenAI, Codex) nécessitent `enableNativeToolCalls: true`
- Vérifier `isNextGenModelProvider()` dans `src/utils/model-utils.ts`
- Modèles doivent avoir `apiFormat: ApiFormat.OPENAI_RESPONSES`

---

*Document généré par analyse statique du codebase - Dernière mise à jour : 2025-06-19*
