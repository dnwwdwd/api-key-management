import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runConnectivityTest } from "@/lib/integrations/provider-api";
import { getRuntimeApiKeyRecordById } from "@/lib/integrations/runtime-record";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseKeyId(value: unknown) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  return numeric;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const keyId = parseKeyId((payload as Record<string, unknown>)?.keyId);
  if (!keyId) {
    return NextResponse.json(
      { ok: false, message: "Invalid keyId" },
      { status: 400 },
    );
  }

  const keyRecord = await getRuntimeApiKeyRecordById(keyId);
  if (!keyRecord) {
    return NextResponse.json({ ok: false, message: "API key not found" }, { status: 404 });
  }

  if (!keyRecord.providerBaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        code: "base_url_missing",
        message: "Provider Base URL is not configured",
      },
      { status: 400 },
    );
  }

  const result = await runConnectivityTest({
    providerName: keyRecord.providerName,
    providerBaseUrl: keyRecord.providerBaseUrl,
    apiKey: keyRecord.apiKey,
  });

  if (result.ok) {
    return NextResponse.json({
      ok: true,
      status: result.status,
      latencyMs: result.latencyMs,
    });
  }

  return NextResponse.json(
    {
      ok: false,
      status: result.status,
      rawMessage: result.rawMessage,
      payload: result.payload,
    },
    { status: result.status },
  );
}
