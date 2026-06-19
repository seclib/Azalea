# Workflow - Cycle d'une requête IA

## Vue d'ensemble

Ce document décrit le cycle complet d'une requête IA dans Azalea, depuis l'entrée utilisateur jusqu'à la réponse finale.

## Cycle principal

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER INPUT                                                │
│    - Message texte                                           │
│    - Commande slash                                          │
│    - Upload fichier                                          │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. WEBVIEW/CLI → CONTROLLER                                  │
│    - postMessage (VSCode)                                    │
│    - CLI command parsing                                     │
│    - Validation entrée                                       │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CONTROLLER → TASK                                         │
│    - Création instance Task                                  │
│    - Initialisation état                                     │
│    - Sauvegarde taskId                                       │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. TASK LOOP (initiateTaskLoop)                              │
│    while (!abort) {                                          │
│      a. attemptApiRequest() → stream                         │
│      b. presentAssistantMessage() → UI update                │
│      c. waitForUserMessageContentReady()                     │
│      d. recursivelyMakeEnki AIRequests()                       │
│    }                                                         │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. API REQUEST (attemptApiRequest)                           │
│    - Construction prompt système                             │
│    - Sélection provider                                      │
│    - Gestion contexte (token window)                         │
│    - Appel API avec streaming                                │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. STREAMING RESPONSE                                        │
│    - Réception chunks                                        │
│    - Parsing (text, tool_use, thinking)                      │
│    - Mise à jour UI en temps réel                            │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. TOOL EXECUTION (si nécessaire)                            │
│    - Détection bloc tool_use                                 │
│    - Vérification auto-approval                              │
│    - Demande approbation utilisateur (si besoin)             │
│    - Exécution outil                                         │
│    - Sauvegarde checkpoint                                   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. TOOL RESULT → API                                         │
│    - Formatage résultat                                      │
│    - Ajout à l'historique                                    │
│    - Retour boucle API (étape 5)                             │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. COMPLETION                                                │
│    - Détection fin (stop_reason)                             │
│    - Sauvegarde état final                                   │
│    - Notification utilisateur                                │
└─────────────────────────────────────────────────────────────┘
```

## Étapes détaillées

### 1. User Input

**Sources d'entrée :**
- Message texte dans le chat
- Commande slash (`/`, `/commit`, `/clear`, etc.)
- Upload de fichier
- Mention de fichier (`@fichier.ts`)
- Résumé de conversation (compaction)

**Validation :**
- Vérification longueur
- Vérification caractères interdits
- Sanitization XSS

### 2. Webview/CLI → Controller

**VSCode (Webview) :**
```typescript
// webview-ui/src/components/chat/ChatInput.tsx
const handleSubmit = async () => {
  await UiServiceClient.submitUserMessage(StringRequest.create({
    value: messageText
  }))
}
```

**CLI :**
```typescript
// apps/cli/src/commands/
const submitCommand = async (args: string[]) => {
  const task = await runtime.startTask({
    text: args.join(' ')
  })
}
```

**Controller reçoit :**
```typescript
// apps/vscode/src/core/controller/index.ts
async handleUserMessage(message: string) {
  this.task = new Task(this)
  await this.task.initiateTaskLoop(message, true)
}
```

### 3. Controller → Task

**Initialisation Task :**
```typescript
class Task {
  constructor(private controller: Controller) {
    this.taskId = generateId()
    this.enkiMessages = []
    this.apiConversationHistory = []
    this.abort = false
  }
  
  async initiateTaskLoop(userContent: UserContent, isNewTask: boolean) {
    // 1. Sauvegarde état initial
    await this.saveTaskState()
    
    // 2. Boucle principale
    while (!this.abort) {
      await this.recursivelyMakeEnki AIRequests(userContent)
    }
  }
}
```

### 4. Task Loop

**Boucle récursive :**
```typescript
async recursivelyMakeEnki AIRequests(userContent: UserContent) {
  // 1. Requête API
  const stream = this.attemptApiRequest(this.enkiMessages.length - 1)
  
  // 2. Traitement stream
  for await (const chunk of stream) {
    this.assistantMessageContent = parseAssistantMessageV2(chunk.text)
    await this.presentAssistantMessage()
  }
  
  // 3. Attente outils (si présents)
  await pWaitFor(() => this.userMessageContentReady)
  
  // 4. Récursion avec résultat outils
  return this.recursivelyMakeEnki AIRequests(this.userMessageContent)
}
```

### 5. API Request

**Construction prompt :**
```typescript
async attemptApiRequest(previousApiReqIndex: number) {
  // 1. Construction prompt système
  const systemPrompt = await this.buildSystemPrompt()
  
  // 2. Construction messages
  const messages = this.buildMessages()
  
  // 3. Vérification contexte
  this.checkContextWindow()
  
  // 4. Appel provider
  const handler = buildApiHandler(this.apiConfiguration)
  return handler.createMessageStream(systemPrompt, messages, options)
}
```

**Gestion contexte :**
```typescript
checkContextWindow() {
  const totalTokens = this.getTotalTokenCount()
  const maxAllowedSize = this.getModelContextWindow() * 0.75 // 75% safety margin
  
  if (totalTokens >= maxAllowedSize) {
    // Compaction automatique
    this.conversationHistoryDeletedRange = 
      this.contextManager.getNextTruncationRange(...)
  }
}
```

### 6. Streaming Response

**Traitement chunks :**
```typescript
async *attemptApiRequest() {
  const stream = handler.createMessageStream(systemPrompt, messages, options)
  
  for await (const chunk of stream) {
    switch (chunk.type) {
      case "text":
        yield chunk
        break
      case "tool_use":
        this.detectedToolUse = true
        break
      case "thinking":
        // Affichage thinking (si supporté)
        break
    }
  }
}
```

**Présentation UI :**
```typescript
async presentAssistantMessage() {
  const block = this.assistantMessageContent[this.currentStreamingContentIndex]
  
  switch (block.type) {
    case "text":
      await this.say("text", block.text, undefined, block.partial)
      break
    case "tool_use":
      await this.say("tool", formatToolUse(block))
      break
  }
}
```

### 7. Tool Execution

**Détection outils :**
```typescript
// Parsing réponse LLM
const contentBlocks = parseAssistantMessageV2(responseText)
const toolBlocks = contentBlocks.filter(block => block.type === "tool_use")
```

**Exécution avec approbation :**
```typescript
async executeToolWithApproval(block: ToolBlock) {
  // 1. Vérification auto-approval
  if (this.shouldAutoApproveTool(block.name)) {
    await this.say("tool", message)
    this.consecutiveAutoApprovedRequestsCount++
  } else {
    // 2. Demande approbation
    const didApprove = await askApproval("tool", message)
    if (!didApprove) {
      this.didRejectTool = true
      return
    }
  }
  
  // 3. Exécution
  const result = await this.executeTool(block)
  
  // 4. Checkpoint
  await this.saveCheckpoint()
  
  return result
}
```

**Handlers d'outils :**
```typescript
// apps/vscode/src/core/task/tools/handlers/
├── ReadFileToolHandler.ts
├── WriteToFileToolHandler.ts
├── ApplyPatchHandler.ts
├── ExecuteCommandToolHandler.ts
├── BrowserToolHandler.ts
├── SearchFilesToolHandler.ts
├── ListFilesToolHandler.ts
├── ListCodeDefinitionNamesToolHandler.ts
├── WebFetchToolHandler.ts
├── WebSearchToolHandler.ts
├── UseMcpToolHandler.ts
├── AccessMcpResourceHandler.ts
├── SubagentToolHandler.ts
├── AskFollowupQuestionToolHandler.ts
├── AttemptCompletionHandler.ts
├── PlanModeRespondHandler.ts
├── ActModeRespondHandler.ts
├── NewTaskHandler.ts
├── CondenseHandler.ts
├── SummarizeTaskHandler.ts
├── GenerateExplanationToolHandler.ts
├── ReportBugHandler.ts
├── LoadMcpDocumentationHandler.ts
└── UseSkillToolHandler.ts
```

### 8. Tool Result → API

**Formatage résultat :**
```typescript
const toolResult = formatResponse.toolResult(result)
this.userMessageContent.push({
  type: "tool_result",
  tool_use_id: block.id,
  content: toolResult
})
```

**Retour boucle :**
```typescript
// Le résultat est ajouté à l'historique
// La boucle API reprend avec le nouveau contexte
await this.recursivelyMakeEnki AIRequests(this.userMessageContent)
```

### 9. Completion

**Détection fin :**
```typescript
if (stopReason === "end_turn" || stopReason === "max_tokens") {
  // Sauvegarde finale
  await this.saveTaskState()
  
  // Notification
  await this.say("complete", "Tâche terminée")
  
  // Nettoyage
  await this.cleanup()
}
```

## Gestion des erreurs

### Erreurs API

```typescript
async handleApiError(error: Error) {
  // 1. Vérification type d'erreur
  if (isRateLimitError(error)) {
    // Retry automatique
    await this.retryWithBackoff()
  } else if (isContextWindowError(error)) {
    // Compaction forcée
    await this.forceCompaction()
  } else if (isAuthenticationError(error)) {
    // Demande re-authentification
    await this.askForReAuthentication()
  } else {
    // Erreur générique
    await this.say("error", error.message)
  }
}
```

### Erreurs outils

```typescript
async handleToolError(error: Error, toolName: string) {
  // 1. Formatage erreur
  const errorMessage = `Error executing ${toolName}: ${error.message}`
  
  // 2. Notification UI
  await this.say("error", errorMessage)
  
  // 3. Ajout résultat erreur
  pushToolResult(formatResponse.toolError(errorMessage))
  
  // 4. Nettoyage
  await this.diffViewProvider.revertChanges()
}
```

### Interruption utilisateur

```typescript
async abortTask() {
  this.abort = true
  
  // Nettoyage ressources
  await this.diffViewProvider.revertChanges()
  await this.browserSession.closeBrowser()
  await this.terminalManager.closeAllTerminals()
  
  // Sauvegarde état
  await this.saveTaskState()
}
```

## Modes Plan/Act

### Plan Mode

```
User Input
    ↓
Plan Mode (pas d'outils)
    ↓
AI répond avec plan_mode_respond
    ↓
UI affiche plan
    ↓
User valide → Switch Act Mode
```

**Caractéristiques :**
- Pas d'exécution d'outils
- Questions de clarification autorisées
- Mode conversationnel pur
- Utilise `plan_mode_respond` tool

### Act Mode

```
User Input
    ↓
Act Mode (outils autorisés)
    ↓
AI utilise outils
    ↓
Exécution avec approbation
    ↓
Résultat → nouvelle requête
```

**Caractéristiques :**
- Exécution d'outils complète
- Auto-approval configurable
- Checkpoints Git automatiques
- Mode "YOLO" (tout auto-approuvé)

## Context Management

### Fenêtre de contexte

```typescript
class ContextManager {
  getNextTruncationRange(
    messages: Message[],
    currentRange: [number, number],
    pressure: "half" | "quarter"
  ): [number, number] {
    // Stratégie: supprimer moitié ou 3/4 des messages
    // Préserver: premier message (task original)
    // Préserver: structure user/assistant
  }
}
```

### Compaction

```typescript
// Quand le contexte approche la limite
if (totalTokens >= maxAllowedSize) {
  // 1. Sauvegarde état actuel
  await this.saveTaskState()
  
  // 2. Compaction
  this.conversationHistoryDeletedRange = 
    this.contextManager.getNextTruncationRange(...)
  
  // 3. Notification
  await this.say("info", "Conversation compactée")
}
```

## Checkpoints Git

### Création automatique

```typescript
async saveCheckpoint() {
  if (!this.checkpointTracker) return
  
  // 1. Commit des changements
  const commitHash = await this.checkpointTracker.commit()
  
  // 2. Sauvegarde métadonnées
  await this.saveTaskState({
    lastCheckpointHash: commitHash,
    lastCheckpointTs: Date.now()
  })
}
```

### Restauration

```typescript
async restoreCheckpoint(checkpointHash: string) {
  // 1. Git checkout
  await this.checkpointTracker.restore(checkpointHash)
  
  // 2. Mise à jour UI
  await this.say("info", "Checkpoint restauré")
}
```

## State Persistence

### Sauvegarde état

```typescript
private async saveTaskState() {
  // 1. Conversation history
  await saveApiConversationHistory(
    this.getContext(), 
    this.taskId, 
    this.apiConversationHistory
  )
  
  // 2. Enki AI messages (UI)
  await saveEnki AIMessages(
    this.getContext(), 
    this.taskId, 
    this.enkiMessages
  )
  
  // 3. Checkpoint Git
  await this.checkpointTracker?.commit()
  
  // 4. Task history
  await this.controllerRef.deref()?.updateTaskHistory({
    id: this.taskId,
    ts: Date.now(),
    task: this.taskMessage,
    // ...
  })
}
```

### Reprise tâche

```typescript
async resumeTaskFromHistory() {
  // 1. Chargement état
  this.enkiMessages = await getSavedEnki AIMessages(...)
  this.apiConversationHistory = await getSavedApiConversationHistory(...)
  
  // 2. Gestion interruption
  const lastMessage = this.apiConversationHistory[this.apiConversationHistory.length - 1]
  if (lastMessage.role === "assistant") {
    const toolUseBlocks = lastMessage.content.filter(b => b.type === "tool_use")
    if (toolUseBlocks.length > 0) {
      // Ajout réponses outils interrompues
      const toolResponses = toolUseBlocks.map(block => ({
        type: "tool_result",
        tool_use_id: block.id,
        content: "Task was interrupted before this tool call could be completed."
      }))
      this.userMessageContent.push(...toolResponses)
    }
  }
  
  // 3. Notification
  this.userMessageContent.push({
    type: "text",
    text: `[TASK RESUMPTION] This task was interrupted ${agoText}.`
  })
  
  // 4. Reprise boucle
  await this.initiateTaskLoop(this.userMessageContent, false)
}
```

## Variables d'environnement

```bash
# API Configuration
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
AZALEA_API_KEY=...

# Hub Configuration
AZALEA_HUB_URL=http://localhost:3000
AZALEA_HUB_ROOM_SECRET=secret

# CLI Configuration
CLINE_WRAPPER_PATH=/usr/local/bin/azalea
CLINE_DIR=~/.azalea

# Logging
LOG_LEVEL=debug|info|warn|error
DEBUG=azalea:*

# Development
NODE_ENV=development|production
BUN_ENV=development|production
```

## Scripts npm

### Build

```bash
# Build complet
bun run build

# Build SDK seulement
bun run build:sdk

# Build apps
bun run build:apps

# Génération modèles
bun run build:models
```

### Development

```bash
# Mode dev CLI
bun run cli

# Mode dev VSCode
bun run code

# Hub
bun run cli hub start
bun run cli hub stop
```

### Testing

```bash
# Tests unitaires
bun run test:unit

# Tests E2E
bun run test:e2e

# Tests interactifs
bun run test:e2e:interactive

# Tests spécifiques
bun -F @azalea/core test
```

### Linting/Formatting

```bash
# Lint
bun run lint

# Format
bun run format

# Fix automatique
bun run fix

# Check complet
bun run check
```

### Type checking

```bash
# Types pour tous les packages
bun run types

# Types pour package spécifique
bun -F @azalea/core typecheck
```

## Performance

### Optimisations clés

1. **Streaming** : Traitement chunk par chunk, pas de buffering
2. **Connection pooling** : Réutilisation connexions HTTP
3. **Caching** : Cache configurations et modèles
4. **Debouncing** : Flush disque debounced pour StateManager
5. **Lazy loading** : Workspace manager initialisé à la demande

### Monitoring

```typescript
// Métriques collectées
- Latency par provider
- Error rate par provider
- Token usage (input/output)
- Coût estimé par requête
- Temps d'exécution outils
- Taille contexte (tokens)
```

## Sécurité

### Approbation outils

```typescript
// Niveaux d'approbation
const AUTO_APPROVE = {
  readFiles: false,
  editFiles: false,
  executeCommands: false,
  browserActions: false,
  mcpTools: false,
  all: false // YOLO mode
}
```

### Sandboxing

- **Commandes** : Exécution dans terminal isolé
- **Fichiers** : Vérification .enkiignore
- **Browser** : Navigation contrôlée
- **MCP** : Isolation par serveur

### Secrets

```typescript
// Stockage sécurisé
- Mode 0o600 pour secrets.json
- Chiffrement au repos (futur)
- Rotation automatique (futur)
- Audit log (futur)
