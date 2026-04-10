export type BuiltinProviderDefinition = {
  name: string;
  baseUrl: string | null;
};

export const BUILTIN_PROVIDERS: readonly BuiltinProviderDefinition[] = [
  { name: "OpenAI", baseUrl: "https://api.openai.com/v1" },
  { name: "Anthropic", baseUrl: "https://api.anthropic.com" },
  {
    name: "Google (Gemini)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  },
  { name: "xAI (Grok)", baseUrl: "https://api.x.ai/v1" },
  {
    name: "阿里 (千问)",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  { name: "智谱 AI (Zhipu)", baseUrl: "https://open.bigmodel.cn/api/paas/v4" },
  { name: "Kimi / Moonshot", baseUrl: "https://api.moonshot.cn/v1" },
  { name: "MiniMax", baseUrl: "https://api.minimax.chat/v1" },
  { name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1" },
] as const;

export const DEFAULT_PROVIDERS = BUILTIN_PROVIDERS.map((item) => item.name);

export const REMOVED_BUILTIN_PROVIDER_NAMES = [
  "字节 (豆包)",
  "腾讯 (混元)",
  "百度 (文心)",
  "01.AI",
] as const;

export const LEGACY_PROVIDER_RENAMES: Record<string, string> = {
  "零一万物": "01.AI",
  "零一万物（旧）": "01.AI",
  "01.AI（旧）": "01.AI",
};

export const LEGACY_PROVIDER_ARCHIVE_SUFFIX = "（历史）";

export type BillingPortalSeed = {
  label: string;
  url: string;
};

type RuntimePreset = {
  keywords: string[];
  billingPortal?: BillingPortalSeed;
};

export const PROVIDER_RUNTIME_PRESETS: readonly RuntimePreset[] = [
  {
    keywords: ["anthropic", "claude"],
    billingPortal: {
      label: "Anthropic Console",
      url: "https://console.anthropic.com/settings/billing",
    },
  },
  {
    keywords: ["gemini", "google", "generativelanguage.googleapis.com"],
    billingPortal: {
      label: "Google AI Studio",
      url: "https://aistudio.google.com/app/usage",
    },
  },
  {
    keywords: ["xai", "x.ai", "grok"],
    billingPortal: {
      label: "xAI Console",
      url: "https://console.x.ai/",
    },
  },
  {
    keywords: ["阿里", "千问", "dashscope", "aliyun"],
    billingPortal: {
      label: "阿里云百炼控制台",
      url: "https://bailian.console.aliyun.com/cn-beijing?tab=model#/model-usage",
    },
  },
  {
    keywords: ["百度", "文心", "qianfan", "baidu"],
    billingPortal: {
      label: "百度智能云千帆控制台",
      url: "https://console.bce.baidu.com/qianfan/overview",
    },
  },
  {
    keywords: ["字节", "豆包", "volcengine", "ark"],
    billingPortal: {
      label: "火山引擎方舟控制台",
      url: "https://console.volcengine.com/ark",
    },
  },
  {
    keywords: ["腾讯", "混元", "hunyuan", "tencent"],
    billingPortal: {
      label: "腾讯云混元控制台",
      url: "https://console.cloud.tencent.com/hunyuan",
    },
  },
  {
    keywords: ["智谱", "zhipu", "bigmodel"],
    billingPortal: {
      label: "智谱开放平台",
      url: "https://open.bigmodel.cn/finance-center/finance/overview",
    },
  },
  {
    keywords: ["minimax"],
    billingPortal: {
      label: "MiniMax Open Platform",
      url: "https://platform.minimaxi.com/user-center/payment/balance",
    },
  },
  {
    keywords: ["01.ai", "零一万物", "lingyiwanwu"],
    billingPortal: {
      label: "01.AI Platform",
      url: "https://platform.lingyiwanwu.com/",
    },
  },
] as const;

export const BALANCE_QUERY_ENDPOINT_SEEDS = {
  deepseek: {
    endpoint: "https://api.deepseek.com/user/balance",
    metricType: "balance",
  },
  moonshot: {
    endpoint: "https://api.moonshot.cn/v1/users/me/balance",
    metricType: "balance",
  },
  openai: {
    endpoint: "https://api.openai.com/v1/dashboard/billing/usage",
    metricType: "usage",
  },
} as const;

export const FALLBACK_MODEL_SEEDS = {
  openai: ["gpt-5.2", "gpt-5.2-chat-latest", "gpt-5-mini"],
  anthropic: ["claude-sonnet-4-20250514", "claude-opus-4-1-20250805", "claude-3-5-haiku-latest"],
  gemini: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  moonshot: ["kimi-k2.5", "kimi-k2", "kimi-k2-thinking"],
  zhipu: ["glm-4.7-flash", "glm-4.5", "glm-4.5-air"],
  minimax: [
    "MiniMax-M2.7",
    "MiniMax-M2.7-highspeed",
    "MiniMax-M2.5",
    "MiniMax-M2.5-highspeed",
    "MiniMax-M2.1",
    "MiniMax-M2.1-highspeed",
    "MiniMax-M2",
  ],
  xai: ["grok-4.20-beta-latest", "grok-4-1-fast-reasoning", "grok-code-fast-1"],
  qwen: ["qwen-max-latest", "qwen-plus", "qwen-flash"],
  baidu: ["ERNIE-4.5-Turbo", "ERNIE-X1-Turbo-32K", "ERNIE-4.0-Turbo-8K"],
  doubao: ["Doubao-Seed-1.6", "Doubao-Seed-1.6-flash", "Doubao-1.5-pro-32k"],
  hunyuan: ["hunyuan-t1-latest", "hunyuan-turbos", "hunyuan-standard-256K"],
  lingyi: ["yi-lightning", "yi-large", "yi-medium"],
} as const;
