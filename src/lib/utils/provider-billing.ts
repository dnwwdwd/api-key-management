type BillingPortalLink = {
  label: string;
  url: string;
};

function containsKeyword(source: string, keywords: string[]) {
  return keywords.some((keyword) => source.includes(keyword));
}

export function getProviderBillingPortalLink(
  providerName: string,
  baseUrl: string | null,
): BillingPortalLink | null {
  const normalizedName = providerName.trim().toLowerCase();
  const normalizedBaseUrl = baseUrl?.trim().toLowerCase() ?? "";
  const lookupSource = `${normalizedName} ${normalizedBaseUrl}`;

  if (containsKeyword(lookupSource, ["anthropic", "claude"])) {
    return {
      label: "Anthropic Console",
      url: "https://console.anthropic.com/settings/billing",
    };
  }

  if (containsKeyword(lookupSource, ["gemini", "google", "generativelanguage.googleapis.com"])) {
    return {
      label: "Google AI Studio",
      url: "https://aistudio.google.com/app/usage",
    };
  }

  if (containsKeyword(lookupSource, ["xai", "x.ai", "grok"])) {
    return {
      label: "xAI Console",
      url: "https://console.x.ai/",
    };
  }

  if (containsKeyword(lookupSource, ["阿里", "千问", "dashscope", "aliyun"])) {
    return {
      label: "阿里云百炼控制台",
      url: "https://bailian.console.aliyun.com/",
    };
  }

  if (containsKeyword(lookupSource, ["百度", "文心", "qianfan", "baidu"])) {
    return {
      label: "百度智能云千帆控制台",
      url: "https://console.bce.baidu.com/qianfan/overview",
    };
  }

  if (containsKeyword(lookupSource, ["字节", "豆包", "volcengine", "ark"])) {
    return {
      label: "火山引擎方舟控制台",
      url: "https://console.volcengine.com/ark",
    };
  }

  if (containsKeyword(lookupSource, ["腾讯", "混元", "hunyuan", "tencent"])) {
    return {
      label: "腾讯云混元控制台",
      url: "https://console.cloud.tencent.com/hunyuan",
    };
  }

  if (containsKeyword(lookupSource, ["智谱", "zhipu", "bigmodel"])) {
    return {
      label: "智谱开放平台",
      url: "https://open.bigmodel.cn/console/overview",
    };
  }

  if (containsKeyword(lookupSource, ["minimax"])) {
    return {
      label: "MiniMax Open Platform",
      url: "https://platform.minimaxi.com/",
    };
  }

  if (containsKeyword(lookupSource, ["01.ai", "零一万物", "lingyiwanwu"])) {
    return {
      label: "01.AI Platform",
      url: "https://platform.lingyiwanwu.com/",
    };
  }

  return null;
}
