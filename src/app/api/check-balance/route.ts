import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  detectProviderKind,
  runBalanceCheck,
  supportsBalanceQuery,
} from "@/lib/integrations/provider-api";
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

  const providerKind = detectProviderKind(
    keyRecord.providerName,
    keyRecord.providerBaseUrl,
  );

  if (!supportsBalanceQuery(providerKind)) {
    return NextResponse.json({
      ok: true,
      supported: false,
      providerKind,
    });
  }

  const result = await runBalanceCheck({
    providerName: keyRecord.providerName,
    providerBaseUrl: keyRecord.providerBaseUrl,
    apiKey: keyRecord.apiKey,
  });

  if (result.ok && result.supported) {
    return NextResponse.json({
      ok: true,
      supported: true,
      providerKind,
      metricType: result.metricType,
      numericValue: result.numericValue,
      displayValue: result.displayValue,
      payload: result.payload,
    });
  }

  if (result.ok && !result.supported) {
    return NextResponse.json({
      ok: true,
      supported: false,
      providerKind,
    });
  }

  return NextResponse.json(
    {
      ok: false,
      supported: true,
      providerKind,
      status: result.status,
      metricType: result.metricType,
      rawMessage: result.rawMessage,
      payload: result.payload,
    },
    { status: result.status },
  );
}
