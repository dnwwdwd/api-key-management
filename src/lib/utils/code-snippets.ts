export type SnippetLanguage = "curl" | "python" | "nodejs";

function normalizeBaseUrl(baseUrl: string | null | undefined) {
  const trimmed = baseUrl?.trim();
  if (!trimmed) {
    return "https://api.openai.com/v1";
  }

  return trimmed.replace(/\/+$/, "");
}

function buildChatEndpoint(baseUrl: string | null | undefined) {
  const normalized = normalizeBaseUrl(baseUrl);

  if (normalized.endsWith("/v1")) {
    return `${normalized}/chat/completions`;
  }

  if (normalized.endsWith("/v1beta")) {
    return `${normalized}/chat/completions`;
  }

  return `${normalized}/v1/chat/completions`;
}

export function generateCodeSnippet(input: {
  language: SnippetLanguage;
  apiKey: string;
  baseUrl: string | null;
  model: string | null;
}) {
  const endpoint = buildChatEndpoint(input.baseUrl);
  const modelName = input.model?.trim() || "your-model-name-here";

  if (input.language === "curl") {
    return `curl ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${input.apiKey}" \\
  -d '{
    "model": "${modelName}",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`;
  }

  if (input.language === "python") {
    return `import requests

url = "${endpoint}"
headers = {
    "Authorization": "Bearer ${input.apiKey}",
    "Content-Type": "application/json",
}
payload = {
    "model": "${modelName}",
    "messages": [{"role": "user", "content": "Hello"}],
}

response = requests.post(url, json=payload, headers=headers, timeout=30)
print(response.status_code)
print(response.json())`;
  }

  return `const endpoint = "${endpoint}";

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${input.apiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "${modelName}",
    messages: [{ role: "user", content: "Hello" }]
  })
});

console.log(response.status);
console.log(await response.json());`;
}
