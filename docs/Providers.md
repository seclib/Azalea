# Providers IA - Documentation Complète

## Vue d'ensemble

Cline supporte **40+ providers IA** à travers une architecture unifiée. Chaque provider implémente une interface commune (`ApiHandler`) et est instancié via une factory (`buildApiHandler`).

---

## 1. Architecture des Providers

### 1.1 Interface Commune

```typescript
// apps/vscode/src/core/api/providers/types.ts
export interface ApiHandler {
  // Streaming de réponses (générateur async)
  *stream(request: ApiRequest): AsyncGenerator<ApiStreamChunk>
  
  // Construction depuis configuration
  create(config: ApiConfiguration): ApiHandler
  
  // Validation de la configuration
  validateConfig(config: ApiConfiguration): ValidationResult
  
  // Récupération des modèles disponibles
  getModels(): Promise<ModelInfo[]>
  
  // Estimation de tokens
  countTokens(text: string): Promise<number>
}
```

### 1.2 Factory Pattern

```typescript
// apps/vscode/src/core/api/index.ts
export function buildApiHandler(
  provider: ApiProvider,
  config: ApiConfiguration
): ApiHandler {
  switch (provider) {
    case "anthropic": return new AnthropicHandler(config)
    case "openai": return new OpenAIHandler(config)
    case "openrouter": return new OpenRouterHandler(config)
    case "bedrock": return new BedrockHandler(config)
    case "vertex": return new VertexHandler(config)
    case "gemini": return new GeminiHandler(config)
    case "ollama": return new OllamaHandler(config)
    case "lmstudio": return new LMStudioHandler(config)
    case "openai-native": return new OpenAINativeHandler(config)
    case "openai-codex": return new OpenAICodexHandler(config)
    // ... 30+ autres providers
    default: throw new Error(`Unknown provider: ${provider}`)
  }
}
```

### 1.3 Types de Configuration

```typescript
// apps/vscode/src/shared/api.ts
export interface ApiConfiguration {
  // Provider ID
  apiProvider: ApiProvider
  
  // Authentification
  apiKey?: string
  apiBaseUrl?: string
  apiModelId?: string
  
  // Paramètres avancés
  temperature?: number
  maxTokens?: number
  topP?: number
  
  // Options spécifiques
  openRouterApiKey?: string  // Pour OpenRouter
  awsRegion?: string          // Pour Bedrock/Vertex
  awsAccessKey?: string
  awsSecretKey?: string
  gcpProjectId?: string       // Pour Vertex
  gcpServiceAccount?: string
  
  // Features
  enablePromptCaching?: boolean
  enableNativeToolCalls?: boolean
  useLegacyCompletions?: boolean
}
```

---

## 2. Catalogue des Providers

### 2.1 Providers Directs (API)

| Provider | ID | Type | Base URL | Auth |
|----------|----|------|----------|------|
| Anthropic | `anthropic` | Direct | api.anthropic.com | API Key |
| OpenAI | `openai` | Direct | api.openai.com | API Key |
| Google Gemini | `gemini` | Direct | generativelanguage.googleapis.com | API Key |
| DeepSeek | `deepseek` | Direct | api.deepseek.com | API Key |
| Qwen | `qwen` | Direct | dashscope.aliyuncs.com | API Key |
| Mistral | `mistral` | Direct | api.mistral.ai | API Key |
| Groq | `groq` | Direct | api.groq.com | API Key |
| Cerebras | `cerebras` | Direct | api.cerebras.ai | API Key |
| Together | `together` | Direct | api.together.xyz | API Key |
| Fireworks | `fireworks` | Direct | api.fireworks.ai | API Key |
| xAI | `xai` | Direct | api.x.ai | API Key |
| Moonshot | `moonshot` | Direct | api.moonshot.cn | API Key |
| Nebius | `nebius` | Direct | api.nebius.cloud | API Key |
| SambaNova | `sambanova` | Direct | api.sambanova.ai | API Key |
| Minimax | `minimax` | Direct | api.minimax.chat | API Key |
| Hicap | `hicap` | Direct | api.hicap.ai | API Key |
| NousResearch | `nousresearch` | Direct | api.nousresearch.com | API Key |
| ZAI | `zai` | Direct | api.z.ai | API Key |
| Aihubmix | `aihubmix` | Direct | aihubmix.com | API Key |
| HuggingFace | `huggingface` | Inference | api-inference.huggingface.co | API Key |
| Baseten | `baseten` | Inference | api.baseten.co | API Key |
| Huawei Cloud MaaS | `huawei-cloud-maas` | Cloud | huaweicloud.com | API Key |
| AskSage | `asksage` | Gouvernemental | asksage.com | API Key |
| SAP AI Core | `sapaicore` | Enterprise | sap.ai | OAuth |
| W&B | `wandb` | MLOps | api.wandb.ai | API Key |

### 2.2 Agrégateurs

| Provider | ID | Description | Modèles |
|----------|----|-------------|---------|
| OpenRouter | `openrouter` | Agrégateur multi-providers | 100+ |
| LiteLLM | `litellm` | Proxy OpenAI-compatible | Tous |
| Vercel AI Gateway | `vercel-ai-gateway` | Edge proxy | Tous |
| Dify | `dify` | Plateforme LLM | Variables |
| OCA | `oca` | Service OCA | Variables |

### 2.3 Cloud Providers

| Provider | ID | Service | Auth |
|----------|----|---------|------|
| AWS Bedrock | `bedrock` | Amazon Bedrock | AWS Keys |
| Google Vertex | `vertex` | Vertex AI | GCP Service Account |
| Claude Code | `claude-code` | CLI local | API Key |
| Qwen Code | `qwen-code` | CLI local | API Key |
| OpenAI Codex | `openai-codex` | CLI/Responses API | API Key |

### 2.4 Local Providers

| Provider | ID | Type | Endpoint |
|----------|----|------|----------|
| Ollama | `ollama` | Local | http://localhost:11434 |
| LM Studio | `lmstudio` | Local | http://localhost:1234 |
| VSCode LM | `vscode-lm` | Intégré VSCode | VSCode API |

### 2.5 Providers Spéciaux

| Provider | ID | Description |
|----------|----|-------------|
| Cline | `cline` | Service Cline propriétaire |
| Cline Pass | `cline-pass` | Variante Cline |

---

## 3. Formats API Supportés

### 3.1 Anthropic Messages API

**Providers** : `anthropic`, `bedrock`, `vertex`

**Caractéristiques** :
- Messages avec rôles (user/assistant)
- System prompt séparé
- Prompt caching (claude-3-5-sonnet, claude-3-opus)
- Tool use natif
- Vision (images)

**Exemple de requête** :
```typescript
{
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 4096,
  system: "You are a helpful assistant.",
  messages: [
    { role: "user", content: "Hello!" }
  ],
  tools: [...],
  stream: true
}
```

### 3.2 OpenAI Chat Completions

**Providers** : `openai`, `deepseek`, `qwen`, `mistral`, `groq`, `cerebras`, `together`, `fireworks`, `xai`, `moonshot`, `nebius`, `sambanova`, `minimax`, `hicap`, `nousresearch`, `zai`, `aihubmix`, `ollama`, `lmstudio`, `litellm`, `vercel-ai-gateway`, `dify`, `baseten`, `huggingface`, `huawei-cloud-maas`, `asksage`, `sapaicore`, `wandb`, `oca`

**Caractéristiques** :
- Messages avec rôles (system/user/assistant)
- Function calling (legacy)
- Vision (images)
- Streaming

**Exemple de requête** :
```typescript
{
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are helpful." },
    { role: "user", content: "Hello!" }
  ],
  tools: [...],
  stream: true
}
```

### 3.3 OpenAI Responses API

**Providers** : `openai-native`, `openai-codex`

**Caractéristiques** :
- Tool calling natif (pas de XML parsing)
- Reasoning/thinking intégré
- Output items structurés
- Streaming natif

**Exemple de requête** :
```typescript
{
  model: "gpt-4o",
  input: "Hello!",
  tools: [...],
  reasoning: { effort: "medium" },
  stream: true
}
```

### 3.4 Gemini API

**Provider** : `gemini`

**Caractéristiques** :
- Multimodal (texte, image, audio, vidéo)
- Thinking levels (low/high)
- Function calling
- Safety settings

**Exemple de requête** :
```typescript
{
  contents: [
    { role: "user", parts: [{ text: "Hello!" }] }
  ],
  tools: [...],
  generationConfig: {
    temperature: 0.7,
    thinkingConfig: { thinkingLevel: "high" }
  }
}
```

---

## 4. Modèles et Tarification

### 4.1 Définitions de Modèles

**Fichier** : `apps/vscode/src/shared/api.ts` (5500+ lignes)

**Structure** :
```typescript
export interface ModelInfo {
  name?: string
  maxTokens?: number
  contextWindow?: number
  supportsImages?: boolean
  supportsPromptCache: boolean
  supportsReasoning?: boolean
  inputPrice?: number
  outputPrice?: number
  thinkingConfig?: {
    maxBudget?: number
    outputPrice?: number
    outputPriceTiers?: PriceTier[]
    geminiThinkingLevel?: "low" | "high"
    supportsThinkingLevel?: boolean
  }
  cacheWritesPrice?: number
  cacheReadsPrice?: number
  description?: string
  tiers?: {
    contextWindow: number
    inputPrice?: number
    outputPrice?: number
    cacheWritesPrice?: number
    cacheReadsPrice?: number
  }[]
  temperature?: number
  apiFormat?: ApiFormat
}
```

### 4.2 Modèles Populaires

#### Anthropic
- `claude-opus-4-5-20251101` - 200K ctx, $15/$75 M tokens
- `claude-sonnet-4-5-20250929` - 200K ctx, $3/$15 M tokens
- `claude-3-5-haiku-20241022` - 200K ctx, $0.80/$4 M tokens

#### OpenAI
- `gpt-4o` - 128K ctx, $2.50/$10 M tokens
- `gpt-4o-mini` - 128K ctx, $0.15/$0.60 M tokens
- `o1-preview` - 128K ctx, $15/$60 M tokens
- `o1-mini` - 128K ctx, $3/$12 M tokens

#### Google
- `gemini-2.5-pro` - 1M ctx, $1.25/$10 M tokens
- `gemini-2.5-flash` - 1M ctx, $0.075/$0.30 M tokens

#### Autres
- `deepseek-chat` (DeepSeek) - 64K ctx, $0.14/$0.28 M tokens
- `qwen-turbo` (Qwen) - 128K ctx, $0.05/$0.10 M tokens
- `llama-3.3-70b-versatile` (Groq) - 128K ctx, $0.59/$0.79 M tokens

### 4.3 Tarification Dynamique

**Tiers** : Certains modèles ont une tarification par paliers de contexte.

**Exemple Claude Sonnet 1M** :
```typescript
[
  {
    contextWindow: 200000,
    inputPrice: 3.0,
    outputPrice: 15,
    cacheWritesPrice: 3.75,
    cacheReadsPrice: 0.3
  },
  {
    contextWindow: Infinity,
    inputPrice: 6,
    outputPrice: 22.5,
    cacheWritesPrice: 7.5,
    cacheReadsPrice: 0.6
  }
]
```

---

## 5. Gestion des Providers

### 5.1 Sélection de Provider

**Interface** : `webview-ui/src/components/settings/ApiOptions.tsx`

**Processus** :
1. Utilisateur sélectionne provider dans dropdown
2. Webview envoie `updateSetting("apiProvider", value)`
3. Controller met à jour `stateManager.setGlobalState("apiProvider", value)`
4. Task utilise nouveau provider via `buildApiHandler()`

### 5.2 Validation

**Par provider** : Chaque provider implémente `validateConfig()`

**Validations courantes** :
- API key présente et valide
- Base URL accessible
- Modèle disponible
- Permissions suffisantes

**Exemple** :
```typescript
// anthropic.ts
validateConfig(config: ApiConfiguration): ValidationResult {
  if (!config.apiKey) {
    return { valid: false, error: "API key required" }
  }
  return { valid: true }
}
```

### 5.3 Fallback et Retry

**Retry automatique** :
- 3 tentatives par défaut
- Backoff exponentiel (1s, 2s, 4s)
- Uniquement pour erreurs réseau (5xx, timeout)

**Fallback** :
- Si provider échoue, pas de fallback automatique
- Utilisateur doit changer de provider manuellement

---

## 6. Providers Spéciaux

### 6.1 OpenRouter

**Rôle** : Agrégateur de 100+ modèles

**Configuration** :
```typescript
{
  apiProvider: "openrouter",
  openRouterApiKey: "sk-or-...",
  apiModelId: "anthropic/claude-3-5-sonnet"
}
```

**Avantages** :
- Accès à tous les providers via une seule clé
- Modèles open-source (Llama, Mistral, etc.)
- Load balancing automatique

### 6.2 Claude Code

**Rôle** : Intégration du CLI Claude Code local

**Communication** : stdin/stdout (processus enfant)

**Usage** : Exécution locale avec outils système

### 6.3 OpenAI Codex

**Rôle** : Intégration du CLI OpenAI Codex

**API Format** : OpenAI Responses API (tool calling natif)

**Usage** : Agent de codage autonome

### 6.4 VSCode LM

**Rôle** : Utilisation des modèles intégrés VSCode

**API** : VSCode Language Model API

**Avantages** :
- Pas de clé API requise
- Intégration native
- Gratuit (limité)

---

## 7. Streaming et Transformation

### 7.1 Architecture de Streaming

```
API Provider
    ↓
ApiStream (générateur async)
    ↓
Stream Transformers
    ↓
Task.presentAssistantMessage()
    ↓
Webview (UI temps réel)
```

### 7.2 Transformers

**Emplacement** : `apps/vscode/src/core/api/transform/`

**Types** :
- **Token counting** : Comptage de tokens
- **Cost calculation** : Calcul de coût
- **Error handling** : Gestion d'erreurs
- **Retry logic** : Logique de retry
- **Rate limiting** : Limitation de débit

### 7.3 Formats de Streaming

**Anthropic** :
```
data: {"type":"content_block_start",...}
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}
data: {"type":"content_block_stop",...}
data: {"type":"message_stop",...}
```

**OpenAI** :
```
data: {"id":"...","choices":[{"delta":{"content":"Hello"}}]}
data: {"id":"...","choices":[{"delta":{},"finish_reason":"stop"}]}
data: [DONE]
```

---

## 8. Gestion des Erreurs

### 8.1 Types d'Erreurs

| Erreur | Code | Action |
|--------|------|--------|
| Rate Limit | 429 | Retry avec backoff |
| Context Window | 400/413 | Truncation + retry |
| Auth Error | 401 | Demander nouvelle clé |
| Not Found | 404 | Vérifier modèle |
| Server Error | 5xx | Retry automatique |
| Timeout | - | Retry avec timeout augmenté |

### 8.2 Retry Logic

```typescript
// apps/vscode/src/core/api/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries - 1) throw error
      
      const delay = baseDelay * Math.pow(2, attempt)
      await sleep(delay)
    }
  }
}
```

### 8.3 Context Window Exceeded

**Détection** : `checkContextWindowExceededError()`

**Actions** :
1. Détecter l'erreur
2. Tronquer la conversation (ContextManager)
3. Réessayer la requête
4. Si échec, demander à l'utilisateur

---

## 9. Token Management

### 9.1 Comptage

**Méthodes** :
- **Tiktoken** : Pour modèles OpenAI
- **Claude tokenizer** : Pour modèles Anthropic
- **Approximation** : Pour providers inconnus

**Usage** :
- Surveillance fenêtre de contexte
- Calcul de coût
- Optimisation de prompts

### 9.2 Fenêtre de Contexte

**Modèles** :
- DeepSeek : 64K tokens
- Standard : 128K tokens
- Claude : 200K tokens
- Gemini 2.5 : 1M tokens

**Buffer** :
- 27K-40K tokens de buffer (dépend du modèle)
- Truncation proactive avant erreur

---

## 10. Configuration par Défaut

### 10.1 Provider par Défaut

```typescript
// apps/vscode/src/shared/api.ts
export const DEFAULT_API_PROVIDER = "openrouter" as ApiProvider
```

### 10.2 Modèles par Défaut

**Plan Mode** : `anthropic/claude-3-5-sonnet-20241022`

**Act Mode** : `anthropic/claude-3-5-sonnet-20241022`

**Configuration** : `src/core/controller/models/getClineOnboardingModels.ts`

---

## 11. Ajout d'un Nouveau Provider

### 11.1 Étapes

1. **Créer le handler** :
   ```typescript
   // src/core/api/providers/myprovider.ts
   export class MyProviderHandler implements ApiHandler {
     constructor(private config: ApiConfiguration) {}
     
     async *stream(request: ApiRequest): AsyncGenerator<ApiStreamChunk> {
       // Implémentation du streaming
     }
     
     validateConfig(config: ApiConfiguration): ValidationResult {
       // Validation
     }
   }
   ```

2. **Ajouter au type** :
   ```typescript
   // src/shared/api.ts
   export type ApiProvider = 
     | "anthropic"
     | "myprovider"  // Ajouter
     | ...
   ```

3. **Enregistrer dans la factory** :
   ```typescript
   // src/core/api/index.ts
   case "myprovider": return new MyProviderHandler(config)
   ```

4. **Ajouter à la liste des providers** :
   ```typescript
   // src/shared/providers/providers.json
   {
     "id": "myprovider",
     "name": "My Provider",
     "models": [...]
   }
   ```

5. **Ajouter les conversions Proto** :
   ```typescript
   // src/shared/proto-conversions/models/api-configuration-conversion.ts
   function convertApiProviderToProto(provider: ApiProvider): ApiProvider {
     switch (provider) {
       case "myprovider": return ApiProvider.MY_PROVIDER
       // ...
     }
   }
   ```

6. **Ajouter le composant UI** :
   ```typescript
   // webview-ui/src/components/settings/ApiOptions.tsx
   case "myprovider":
     return <MyProviderOptions config={config} />
   ```

### 11.2 Tests

```typescript
// src/core/api/providers/__tests__/myprovider.test.ts
describe("MyProviderHandler", () => {
  it("should stream responses", async () => {
    const handler = new MyProviderHandler(config)
    const stream = handler.stream(request)
    // Test streaming
  })
  
  it("should validate config", () => {
    const result = handler.validateConfig(invalidConfig)
    expect(result.valid).toBe(false)
  })
})
```

---

## 12. Variables d'Environnement

### 12.1 Configuration

**Fichier** : `.env` (racine) ou VSCode settings

**Variables** :
```bash
# API Keys (optionnel si stocké dans secrets)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...

# URLs personnalisées
OPENAI_BASE_URL=https://custom.openai.com
ANTHROPIC_BASE_URL=https://custom.anthropic.com

# AWS (pour Bedrock/Vertex)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# GCP (pour Vertex)
GCP_PROJECT_ID=...
GCP_SERVICE_ACCOUNT=...

# Développement
IS_DEV=true
DEV_WORKSPACE_FOLDER=/path/to/workspace
```

### 12.2 Priorité

1. **Secrets VSCode** (priorité maximale)
2. **Variables d'environnement**
3. **Configuration globale** (globalState.json)
4. **Valeurs par défaut**

---

## 13. Bonnes Pratiques

### 13.1 Sécurité

- ✅ Jamais de clés API en dur dans le code
- ✅ Utiliser `StateManager` pour les secrets
- ✅ Mode 0o600 pour `secrets.json`
- ✅ Validation systématique des configs
- ❌ Pas de logging de clés API

### 13.2 Performance

- ✅ Réutilisation des connexions HTTP (keep-alive)
- ✅ Streaming pour réponses temps réel
- ✅ Cache de modèles disponibles
- ❌ Pas de requêtes inutiles (polling)

### 13.3 Fiabilité

- ✅ Retry avec backoff exponentiel
- ✅ Timeout configurable
- ✅ Gestion gracieuse des erreurs
- ✅ Fallback sur provider alternatif (manuel)

---

*Document généré par analyse statique du codebase - Dernière mise à jour : 2025-06-19*
