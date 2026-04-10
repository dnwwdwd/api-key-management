import {
  BALANCE_QUERY_ENDPOINT_SEEDS,
  FALLBACK_MODEL_SEEDS,
} from "@/lib/constants/providers";
export type ProviderKind =
  | "openai"
  | "deepseek"
  | "moonshot"
  | "zhipu"
  | "qwen"
  | "gemini"
  | "anthropic"
  | "minimax"
  | "unknown";

export type BalanceMetricType = "balance" | "usage";

type VendorPayload = unknown;

type VendorError = {
  status: number;
  rawMessage: string;
  payload: VendorPayload;
};

export type ConnectivityTestResult =
  | {
      ok: true;
      status: number;
      latencyMs: number;
    }
  | {
      ok: false;
      status: number;
      rawMessage: string;
      payload: VendorPayload;
    };

export type BalanceCheckResult =
  | {
      ok: true;
      supported: true;
      metricType: BalanceMetricType;
      numericValue: number | null;
      displayValue: string | null;
      payload: VendorPayload;
    }
  | {
      ok: true;
      supported: false;
    }
  | {
      ok: false;
      supported: true;
      status: number;
      rawMessage: string;
      payload: VendorPayload;
      metricType: BalanceMetricType;
    };

export type ModelDiscoveryResult =
  | {
      ok: true;
      source: "dynamic" | "fallback";
      models: string[];
    }
  | {
      ok: false;
      status: number;
      rawMessage: string;
      payload: VendorPayload;
    };

const requestTimeoutMs = 20_000;

const staticFallbackModels = FALLBACK_MODEL_SEEDS;

function uniqueModels(models: string[]) {
  return [...new Set(models)];
}

function getFallbackModels(
  providerKind: ProviderKind,
  providerName: string,
  baseUrl: string | null,
) {
  if (providerKind !== "unknown") {
    const direct = staticFallbackModels[providerKind];
    return direct ? [...direct] : null;
  }

  const normalizedName = providerName.toLowerCase();
  const normalizedBaseUrl = baseUrl?.toLowerCase() ?? "";
  const source = `${normalizedName} ${normalizedBaseUrl}`;

  if (source.includes("xai") || source.includes("x.ai") || source.includes("grok")) {
    return [...staticFallbackModels.xai];
  }

  if (source.includes("阿里") || source.includes("千问") || source.includes("dashscope") || source.includes("qwen")) {
    return [...staticFallbackModels.qwen];
  }

  if (source.includes("百度") || source.includes("文心") || source.includes("qianfan") || source.includes("baidu")) {
    return [...staticFallbackModels.baidu];
  }

  if (source.includes("字节") || source.includes("豆包") || source.includes("volc") || source.includes("ark")) {
    return [...staticFallbackModels.doubao];
  }

  if (source.includes("腾讯") || source.includes("混元") || source.includes("hunyuan")) {
    return [...staticFallbackModels.hunyuan];
  }

  if (source.includes("minimax")) {
    return [...staticFallbackModels.minimax];
  }

  if (source.includes("01.ai") || source.includes("零一万物") || source.includes("lingyiwanwu")) {
    return [...staticFallbackModels.lingyi];
  }

  return null;
}

function normalizeBaseUrl(baseUrl: string | null | undefined): string | null {
  const trimmed = baseUrl?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\/+$/, "");
}

function buildUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function withTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
}

async function parseVendorPayload(response: Response) {
  const text = await response.text();

  if (!text.trim()) {
    return {
      payload: null,
      rawMessage: `HTTP ${response.status}`,
    };
  }

  try {
    const payload = JSON.parse(text) as VendorPayload;
    return {
      payload,
      rawMessage: extractRawMessage(payload) ?? text,
    };
  } catch {
    return {
      payload: text,
      rawMessage: text,
    };
  }
}

function extractRawMessage(payload: VendorPayload): string | null {
  if (!payload) {
    return null;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.message === "string") {
    return record.message;
  }

  const errorObject = record.error;
  if (typeof errorObject === "string") {
    return errorObject;
  }

  if (errorObject && typeof errorObject === "object") {
    const errorRecord = errorObject as Record<string, unknown>;
    if (typeof errorRecord.message === "string") {
      return errorRecord.message;
    }
    if (typeof errorRecord.msg === "string") {
      return errorRecord.msg;
    }
  }

  if (typeof record.msg === "string") {
    return record.msg;
  }

  return null;
}

function extractFirstNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractFirstNumber(item);
      if (found !== null) {
        return found;
      }
    }
    return null;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const found = extractFirstNumber(item);
      if (found !== null) {
        return found;
      }
    }
  }

  return null;
}

function formatMetricValue(metricType: BalanceMetricType, value: number): string {
  if (metricType === "balance") {
    return value.toFixed(4);
  }

  return value.toFixed(0);
}

function parseBalanceMetric(
  providerKind: ProviderKind,
  metricType: BalanceMetricType,
  payload: VendorPayload,
): { numericValue: number | null; displayValue: string | null } {
  let numericValue: number | null = null;

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (providerKind === "deepseek") {
      const balanceInfos = record.balance_infos;
      if (Array.isArray(balanceInfos) && balanceInfos.length > 0) {
        const first = balanceInfos[0] as Record<string, unknown>;
        numericValue =
          extractFirstNumber(first.total_balance) ??
          extractFirstNumber(first.available_balance) ??
          extractFirstNumber(first.balance);
      }
    }

    if (providerKind === "moonshot") {
      numericValue =
        extractFirstNumber(record.available_balance) ??
        extractFirstNumber(record.balance) ??
        extractFirstNumber(record.data);
    }

    if (providerKind === "openai") {
      numericValue =
        extractFirstNumber(record.total_usage) ??
        extractFirstNumber(record.usage) ??
        extractFirstNumber(payload);
    }

    if (providerKind === "zhipu") {
      numericValue =
        extractFirstNumber(record.available_tokens) ??
        extractFirstNumber(record.total_tokens) ??
        extractFirstNumber(record.tokens) ??
        extractFirstNumber(record.data);
    }
  }

  if (numericValue === null) {
    numericValue = extractFirstNumber(payload);
  }

  return {
    numericValue,
    displayValue:
      numericValue === null ? null : formatMetricValue(metricType, numericValue),
  };
}

export function detectProviderKind(
  providerName: string,
  baseUrl: string | null | undefined,
): ProviderKind {
  const normalizedName = providerName.toLowerCase();
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)?.toLowerCase() ?? "";

  if (
    normalizedName.includes("deepseek") ||
    normalizedBaseUrl.includes("deepseek.com")
  ) {
    return "deepseek";
  }

  if (
    normalizedName.includes("moonshot") ||
    normalizedName.includes("kimi") ||
    normalizedBaseUrl.includes("moonshot.cn")
  ) {
    return "moonshot";
  }

  if (
    normalizedName.includes("openai") ||
    normalizedBaseUrl.includes("api.openai.com")
  ) {
    return "openai";
  }

  if (
    normalizedName.includes("zhipu") ||
    normalizedName.includes("智谱") ||
    normalizedBaseUrl.includes("bigmodel.cn")
  ) {
    return "zhipu";
  }

  if (
    normalizedName.includes("qwen") ||
    normalizedName.includes("aliyun") ||
    normalizedBaseUrl.includes("dashscope.aliyuncs.com")
  ) {
    return "qwen";
  }

  if (
    normalizedName.includes("gemini") ||
    normalizedBaseUrl.includes("generativelanguage.googleapis.com")
  ) {
    return "gemini";
  }

  if (
    normalizedName.includes("anthropic") ||
    normalizedName.includes("claude") ||
    normalizedBaseUrl.includes("anthropic.com")
  ) {
    return "anthropic";
  }

  if (
    normalizedName.includes("minimax") ||
    normalizedBaseUrl.includes("minimax.chat") ||
    normalizedBaseUrl.includes("minimaxi.com") ||
    normalizedBaseUrl.includes("minimax.io")
  ) {
    return "minimax";
  }

  return "unknown";
}

function defaultModelByProvider(providerKind: ProviderKind) {
  switch (providerKind) {
    case "deepseek":
      return "deepseek-chat";
    case "moonshot":
      return "moonshot-v1-8k";
    case "zhipu":
      return "glm-4-flash";
    case "qwen":
      return "qwen-plus";
    case "gemini":
      return "gemini-2.0-flash";
    case "minimax":
      return "MiniMax-M2.5";
    default:
      return "gpt-4o-mini";
  }
}

export function supportsBalanceQuery(providerKind: ProviderKind) {
  return (
    providerKind === "deepseek" ||
    providerKind === "moonshot" ||
    providerKind === "openai"
  );
}

export async function runConnectivityTest(input: {
  providerName: string;
  providerBaseUrl: string | null;
  apiKey: string;
}): Promise<ConnectivityTestResult> {
  const providerKind = detectProviderKind(input.providerName, input.providerBaseUrl);
  const normalizedBaseUrl = normalizeBaseUrl(input.providerBaseUrl);

  if (!normalizedBaseUrl) {
    return {
      ok: false,
      status: 400,
      rawMessage: "Base URL is required",
      payload: null,
    };
  }

  const endpoint = buildUrl(normalizedBaseUrl, "/chat/completions");
  const model = defaultModelByProvider(providerKind);
  const requestBody = {
    model,
    messages: [{ role: "user", content: "ping" }],
    max_tokens: 1,
    temperature: 0,
  };

  const startedAt = Date.now();
  const { signal, clear } = withTimeoutSignal(requestTimeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal,
      cache: "no-store",
    });

    const latencyMs = Date.now() - startedAt;

    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        latencyMs,
      };
    }

    const { payload, rawMessage } = await parseVendorPayload(response);
    return {
      ok: false,
      status: response.status,
      rawMessage,
      payload,
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      rawMessage:
        error instanceof Error ? error.message : "Network request failed",
      payload: null,
    };
  } finally {
    clear();
  }
}

function getBalanceQuerySpec(providerKind: ProviderKind): {
  endpoint: string;
  metricType: BalanceMetricType;
} | null {
  const seed =
    BALANCE_QUERY_ENDPOINT_SEEDS[
      providerKind as keyof typeof BALANCE_QUERY_ENDPOINT_SEEDS
    ];

  if (!seed) {
    return null;
  }

  return {
    endpoint: seed.endpoint,
    metricType: seed.metricType as BalanceMetricType,
  };
}

export async function runBalanceCheck(input: {
  providerName: string;
  providerBaseUrl: string | null;
  apiKey: string;
}): Promise<BalanceCheckResult> {
  const providerKind = detectProviderKind(input.providerName, input.providerBaseUrl);
  const querySpec = getBalanceQuerySpec(providerKind);

  if (!querySpec) {
    return {
      ok: true,
      supported: false,
    };
  }

  const { signal, clear } = withTimeoutSignal(requestTimeoutMs);

  try {
    const response = await fetch(querySpec.endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      signal,
      cache: "no-store",
    });

    const { payload, rawMessage } = await parseVendorPayload(response);

    if (!response.ok) {
      return {
        ok: false,
        supported: true,
        status: response.status,
        rawMessage,
        payload,
        metricType: querySpec.metricType,
      };
    }

    const parsedMetric = parseBalanceMetric(
      providerKind,
      querySpec.metricType,
      payload,
    );

    return {
      ok: true,
      supported: true,
      metricType: querySpec.metricType,
      numericValue: parsedMetric.numericValue,
      displayValue: parsedMetric.displayValue,
      payload,
    };
  } catch (error) {
    return {
      ok: false,
      supported: true,
      status: 500,
      rawMessage:
        error instanceof Error ? error.message : "Network request failed",
      payload: null,
      metricType: querySpec.metricType,
    };
  } finally {
    clear();
  }
}

function getModelCandidates(baseUrl: string) {
  const normalized = normalizeBaseUrl(baseUrl);
  if (!normalized) {
    return [];
  }

  const candidates = [buildUrl(normalized, "/models"), buildUrl(normalized, "/v1/models")];
  return [...new Set(candidates)];
}

function parseModelIds(payload: VendorPayload) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const data = record.data;
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const id = (item as Record<string, unknown>).id;
      return typeof id === "string" ? id : null;
    })
    .filter((item): item is string => Boolean(item));
}

function parseGeminiModelIds(payload: VendorPayload) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const models = record.models;
  if (!Array.isArray(models)) {
    return [];
  }

  return models
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const name = (item as Record<string, unknown>).name;
      if (typeof name !== "string") {
        return null;
      }

      return name.replace(/^models\//, "");
    })
    .filter((item): item is string => Boolean(item));
}

async function requestModelList(endpoint: string, apiKey: string) {
  const { signal, clear } = withTimeoutSignal(requestTimeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      cache: "no-store",
    });

    const { payload, rawMessage } = await parseVendorPayload(response);

    if (!response.ok) {
      return {
        ok: false,
        error: {
          status: response.status,
          rawMessage,
          payload,
        } satisfies VendorError,
      } as const;
    }

    const models = parseModelIds(payload);
    if (models.length === 0) {
      return {
        ok: false,
        error: {
          status: 502,
          rawMessage: "No model ids found in provider response",
          payload,
        } satisfies VendorError,
      } as const;
    }

    return {
      ok: true,
      models,
    } as const;
  } catch (error) {
    return {
      ok: false,
      error: {
        status: 500,
        rawMessage:
          error instanceof Error ? error.message : "Network request failed",
        payload: null,
      } satisfies VendorError,
    } as const;
  } finally {
    clear();
  }
}

async function requestAnthropicModelList(apiKey: string) {
  const { signal, clear } = withTimeoutSignal(requestTimeoutMs);

  try {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      signal,
      cache: "no-store",
    });

    const { payload, rawMessage } = await parseVendorPayload(response);

    if (!response.ok) {
      return {
        ok: false,
        error: {
          status: response.status,
          rawMessage,
          payload,
        } satisfies VendorError,
      } as const;
    }

    const models = parseModelIds(payload);
    if (models.length === 0) {
      return {
        ok: false,
        error: {
          status: 502,
          rawMessage: "No model ids found in Anthropic response",
          payload,
        } satisfies VendorError,
      } as const;
    }

    return {
      ok: true,
      models,
    } as const;
  } catch (error) {
    return {
      ok: false,
      error: {
        status: 500,
        rawMessage:
          error instanceof Error ? error.message : "Network request failed",
        payload: null,
      } satisfies VendorError,
    } as const;
  } finally {
    clear();
  }
}

export async function runModelDiscovery(input: {
  providerName: string;
  providerBaseUrl: string | null;
  apiKey: string;
}): Promise<ModelDiscoveryResult> {
  const providerKind = detectProviderKind(input.providerName, input.providerBaseUrl);
  const fallbackModels = getFallbackModels(
    providerKind,
    input.providerName,
    input.providerBaseUrl,
  );

  if (providerKind === "anthropic") {
    const result = await requestAnthropicModelList(input.apiKey);
    if (result.ok) {
      return {
        ok: true,
        source: "dynamic",
        models: uniqueModels(result.models),
      };
    }

    if (fallbackModels) {
      return {
        ok: true,
        source: "fallback",
        models: uniqueModels(fallbackModels),
      };
    }

    return {
      ok: false,
      status: result.error.status,
      rawMessage: result.error.rawMessage,
      payload: result.error.payload,
    };
  }

  if (providerKind === "gemini") {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(input.apiKey)}`;
    const { signal, clear } = withTimeoutSignal(requestTimeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        signal,
        cache: "no-store",
      });

      const { payload, rawMessage } = await parseVendorPayload(response);

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          rawMessage,
          payload,
        };
      }

      const models = parseGeminiModelIds(payload);
      if (models.length === 0) {
        if (fallbackModels) {
          return {
            ok: true,
            source: "fallback",
            models: uniqueModels(fallbackModels),
          };
        }

        return {
          ok: false,
          status: 502,
          rawMessage: "No models returned from Gemini API",
          payload,
        };
      }

      return {
        ok: true,
        source: "dynamic",
        models: uniqueModels(models),
      };
    } catch (error) {
      if (fallbackModels) {
        return {
          ok: true,
          source: "fallback",
          models: uniqueModels(fallbackModels),
        };
      }

      return {
        ok: false,
        status: 500,
        rawMessage:
          error instanceof Error ? error.message : "Network request failed",
        payload: null,
      };
    } finally {
      clear();
    }
  }

  const normalizedBaseUrl = normalizeBaseUrl(input.providerBaseUrl);
  if (!normalizedBaseUrl) {
    if (fallbackModels) {
      return {
        ok: true,
        source: "fallback",
        models: uniqueModels(fallbackModels),
      };
    }

    return {
      ok: false,
      status: 400,
      rawMessage: "Base URL is required",
      payload: null,
    };
  }

  const endpoints = getModelCandidates(normalizedBaseUrl);
  let lastError: VendorError | null = null;

  for (const endpoint of endpoints) {
    const result = await requestModelList(endpoint, input.apiKey);
    if (result.ok) {
      return {
        ok: true,
        source: "dynamic",
        models: uniqueModels(result.models),
      };
    }

    lastError = result.error;
  }

  if (fallbackModels) {
    return {
      ok: true,
      source: "fallback",
      models: uniqueModels(fallbackModels),
    };
  }

  return {
    ok: false,
    status: lastError?.status ?? 500,
    rawMessage: lastError?.rawMessage ?? "Failed to load models",
    payload: lastError?.payload ?? null,
  };
}
