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
  { name: "百度 (文心)", baseUrl: "https://qianfan.baidubce.com/v2" },
  { name: "字节 (豆包)", baseUrl: "https://ark.cn-beijing.volces.com/api/v3" },
  { name: "腾讯 (混元)", baseUrl: "https://api.hunyuan.cloud.tencent.com/v1" },
  { name: "智谱 AI (Zhipu)", baseUrl: "https://open.bigmodel.cn/api/paas/v4" },
  { name: "Kimi / Moonshot", baseUrl: "https://api.moonshot.cn/v1" },
  { name: "MiniMax", baseUrl: "https://api.minimax.chat/v1" },
  { name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1" },
  { name: "01.AI", baseUrl: "https://api.lingyiwanwu.com/v1" },
] as const;

export const DEFAULT_PROVIDERS = BUILTIN_PROVIDERS.map((item) => item.name);

export const LEGACY_PROVIDER_RENAMES: Record<string, string> = {
  "零一万物": "01.AI",
  "零一万物（旧）": "01.AI",
  "01.AI（旧）": "01.AI",
};

export const LEGACY_PROVIDER_ARCHIVE_SUFFIX = "（历史）";
