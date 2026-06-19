# Providers IA - Documentation

## Vue d'ensemble

Azalea supporte **40+ providers IA** à travers une architecture unifiée. Chaque provider implémente une interface commune (`ApiHandler`) et est instancié via une factory (`buildApiHandler`).

## Architecture des Providers

```
apps/vscode/src/core/api/
├── index.ts              # Factory principale
├── providers/            # Implémentations providers
│   ├── anthropic.ts
│   ├── openai.ts
│   ├── openai-native.ts
│   ├── openai-codex.ts
│   ├── bedrock.ts
│   ├── vertex.ts
│   ├── gemini.ts
│   ├── ollama.ts
│   ├── lmstudio.ts
│   ├── vscode-lm.ts
│   ├── openrouter.ts
│   ├── deepseek.ts
│   ├── qwen.ts
│   ├── mistral.ts
│   ├── cerebras.ts
│   ├── together.ts
│   ├── fireworks.ts
│   ├── groq.ts
│   ├── xai.ts
│   ├── zai.ts
│   └── ... (20+ autres)
├── adapters/             # Adaptateurs de streaming
└── transform/            # Transformation de flux
```

## Interface commune

Tous les providers implémentent l'interface `ApiHandler` :

```typescript
interface ApiHandler {
  // Création d'une requête
  createMessage(systemPrompt, messages, options): Promise<Response>
  
  // Streaming
  createMessageStream(systemPrompt, messages, options): AsyncIterable<StreamChunk>
  
  // Gestion erreurs
  handleError(error): ApiError
  
  // Validation
  validateConfiguration(): boolean
}
```

## Catégories de Providers

### 1. Providers Natifs (API directe)

| Provider | Fichier | Modèles | Format |
|----------|---------|---------|--------|
| Anthropic | `anthropic.ts` | Claude 3.5, Claude 4 | Messages API |
| OpenAI | `openai.ts` | GPT-4, GPT-4o | Chat Completions |
| OpenAI Native | `openai-native.ts` | GPT-5, o1, o3 | Responses API |
| OpenAI Codex | `openai-codex.ts` | Codex | Responses API |
| Google Gemini | `gemini.ts` | Gemini 1.5, 2.0, 2.5 | Generative AI |
| AWS Bedrock | `bedrock.ts` | Claude via Bedrock | Bedrock Runtime |
| Google Vertex | `vertex.ts` | Gemini via Vertex | Vertex AI |

### 2. Providers Agrégateurs

| Provider | Fichier | Description |
|----------|---------|-------------|
| OpenRouter | `openrouter.ts` | Agrégateur 100+ modèles |
| LiteLLM | `litellm.ts` | Proxy unifié |
| Vercel AI Gateway | `vercel-ai-gateway.ts` | Vercel AI |

### 3. Providers Locaux

| Provider | Fichier | Description |
|----------|---------|-------------|
| Ollama | `ollama.ts` | Serveur local Ollama |
| LM Studio | `lmstudio.ts` | LM Studio local |
| VSCode LM | `vscode-lm.ts` | API VSCode intégrée |

### 4. Providers Spécialisés

| Provider | Fichier | Description |
|----------|---------|-------------|
| DeepSeek | `deepseek.ts` | DeepSeek V3, R1 |
| Qwen | `qwen.ts` | Alibaba Qwen |
| Qwen Code | `qwen-code.ts` | Qwen coding models |
| Mistral | `mistral.ts` | Mistral AI |
| Cerebras | `cerebras.ts` | Inférence rapide Llama |
| Together | `together.ts` | Together AI |
| Fireworks | `fireworks.ts` | Fireworks AI |
| Groq | `groq.ts` | Inférence ultra-rapide |
| xAI | `xai.ts` | Grok |
| Zhipu AI | `zai.ts` | Zhipu GLM |
| Moonshot | `moonshot.ts` | Moonshot AI |
| Huawei Cloud | `huawei-cloud-maas.ts` | Huawei MaaS |
| Baseten | `baseten.ts` | Baseten |
| Nebius | `nebius.ts` | Nebius (ex-Yandex) |
| HuggingFace | `huggingface.ts` | HF Inference API |
| SambaNova | `sambanova.ts` | SambaNova |
| AskSage | `asksage.ts` | AskSage (gouvernement) |
| HiCap | `hicap.ts` | HiCap AI |
| SAP AI Core | `sapaicore.ts` | SAP AI Core |
| Aihubmix | `aihubmix.ts` | Aihubmix |
| W&B | `wandb.ts` | Weights & Biases |
| OCA | `oca.ts` | Open Code Assistant |
| Claude Code | `claude-code.ts` | Claude Code CLI |

## Formats d'API

### 1. Anthropic Messages API

```typescript
// Utilisé par: Anthropic, Bedrock, Vertex (Claude)
{
  model: string,
  max_tokens: number,
  system: string,
  messages: Message[]
}
```

### 2. OpenAI Chat Completions

```typescript
// Utilisé par: OpenAI, DeepSeek, Qwen, Mistral, etc.
{
  model: string,
  messages: Message[],
  temperature: number,
  max_tokens: number
}
```

### 3. OpenAI Responses API (Native)

```typescript
// Utilisé par: OpenAI Native, OpenAI Codex
// Supporte tool calling natif (pas XML)
{
  model: string,
  input: string | ResponseInput,
  tools: Tool[]
}
```

### 4. Google Generative AI

```typescript
// Utilisé par: Gemini, Vertex (Gemini)
{
  model: string,
  contents: Content[],
  generationConfig: {...}
}
```

## Système de Variants

Les providers sont classés par **famille de modèles** pour adapter les prompts :

```typescript
enum ModelFamily {
  GENERIC,           // Fallback universel
  NEXT_GEN,          // Claude 4, GPT-5, Gemini 2.5
  NATIVE_NEXT_GEN,   // Providers Responses API
  GPT_5,             // GPT-5 spécifique
  GEMINI_3,          // Gemini 3
  XS,                // Modèles légers (Hermes, GLM)
  HERMES,            // Hermes 2
  GLM,               // Zhipu GLM
  TRINITY,           // Trinity (custom)
  DEVSTRAL           // Devstral (Mistral)
}
```

## Configuration Provider

### Fichier: `src/shared/api.ts`

```typescript
export type ApiProvider = 
  | "anthropic"
  | "openai"
  | "openai-native"
  | "openai-codex"
  | "bedrock"
  | "vertex"
  | "gemini"
  | "ollama"
  | "lmstudio"
  | "vscode-lm"
  | "openrouter"
  | "deepseek"
  | "qwen"
  | "mistral"
  | "cerebras"
  | "together"
  | "fireworks"
  | "groq"
  | "xai"
  | "zai"
  | // ... 20+ autres

export interface ApiConfiguration {
  apiProvider: ApiProvider
  apiKey: string
  modelId: string
  modelInfo: ModelInfo
  // ... autres champs
}
```

## Ajout d'un nouveau Provider

### Étapes requises

1. **Définir l'énumération** dans `src/shared/api.ts`
   ```typescript
   export type ApiProvider = 
     | "anthropic"
     | "openai"
     | "mon-nouveau-provider"  // Ajouter ici
   ```

2. **Créer le handler** dans `apps/vscode/src/core/api/providers/`
   ```typescript
   // mon-nouveau-provider.ts
   export class MonNouveauProviderHandler implements ApiHandler {
     async createMessage(...) { ... }
     async createMessageStream(...) { ... }
   }
   ```

3. **Enregistrer dans la factory** dans `apps/vscode/src/core/api/index.ts`
   ```typescript
   case "mon-nouveau-provider":
     return new MonNouveauProviderHandler(config)
   ```

4. **Ajouter les modèles** dans `src/shared/api.ts`
   ```typescript
   export const monNouveauProviderModels = {
     "model-1": { ... },
     "model-2": { ... }
   }
   ```

5. **Mettre à jour la UI** dans `webview-ui/src/components/settings/ApiOptions.tsx`

6. **Ajouter la validation** dans `webview-ui/src/utils/validate.ts`

## Gestion des erreurs

### Retry automatique

```typescript
// apps/vscode/src/core/api/retry.ts
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(1000 * (i + 1))
    }
  }
}
```

### Erreurs spécifiques

- **Rate Limit** : Retry avec backoff exponentiel
- **Context Window** : Message d'erreur + suggestion de compaction
- **Authentication** : Demande de re-authentification
- **Network** : Retry + notification utilisateur

## Streaming

### Architecture de streaming

```
API Provider
    ↓ stream chunks
StreamAdapter
    ↓ transform
StreamResponseHandler
    ↓ parse
Task (presentAssistantMessage)
    ↓ update
Webview (real-time UI)
```

### Types de chunks

```typescript
type StreamChunk = 
  | { type: "text", text: string, partial: boolean }
  | { type: "tool_use", tool: ToolBlock }
  | { type: "thinking", thinking: string }
  | { type: "error", error: Error }
```

## Variables d'environnement

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=...
# ... autres providers

# Configuration
AZALEA_API_URL=https://api.azalea.dev
AZALEA_HUB_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug|info|warn|error
```

## Tests

### Tests unitaires

```typescript
// apps/vscode/src/core/api/providers/__tests__/
// Tests pour chaque provider
```

### Tests d'intégration

```typescript
// Vérification connexion API
// Vérification streaming
// Vérification gestion erreurs
```

## Performance

### Optimisations

- **Connection pooling** : Réutilisation connexions HTTP
- **Streaming** : Traitement chunk par chunk (pas de buffering complet)
- **Caching** : Cache modèles et configurations
- **Retry** : Backoff exponentiel avec jitter

### Monitoring

- **Latency** : Temps de réponse par provider
- **Error rate** : Taux d'erreur par provider
- **Token usage** : Comptage tokens entrée/sortie
- **Cost** : Estimation coût par requête
