import crypto from "node:crypto";

const ENCRYPTION_PREFIX = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

type CryptoResult<T> =
  | { ok: true; value: T }
  | { ok: false; messageKey: string };

function getEncryptionKey(): CryptoResult<Buffer> {
  const value = process.env.ENCRYPTION_KEY;
  if (!value) {
    return { ok: false, messageKey: "errors.encryptionKeyMissing" };
  }

  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    return { ok: true, value: Buffer.from(value, "hex") };
  }

  try {
    const base64Buffer = Buffer.from(value, "base64");
    if (base64Buffer.length === 32) {
      return { ok: true, value: base64Buffer };
    }
  } catch {
    // Ignore parse errors and continue to UTF-8 fallback.
  }

  const utf8Buffer = Buffer.from(value, "utf8");
  if (utf8Buffer.length === 32) {
    return { ok: true, value: utf8Buffer };
  }

  return { ok: false, messageKey: "errors.encryptionKeyInvalid" };
}

export function encryptApiKey(plainText: string): CryptoResult<string> {
  if (!plainText) {
    return { ok: false, messageKey: "errors.apiKeyPlaintextRequired" };
  }

  const keyResult = getEncryptionKey();
  if (!keyResult.ok) {
    return keyResult;
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, keyResult.value, iv);
    const cipherText = Buffer.concat([
      cipher.update(plainText, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return {
      ok: true,
      value: [
        ENCRYPTION_PREFIX,
        iv.toString("base64url"),
        tag.toString("base64url"),
        cipherText.toString("base64url"),
      ].join("."),
    };
  } catch {
    return { ok: false, messageKey: "errors.encryptFailed" };
  }
}

export function decryptApiKey(encryptedValue: string): CryptoResult<string> {
  const [prefix, ivPart, tagPart, cipherPart] = encryptedValue.split(".");

  if (!prefix || !ivPart || !tagPart || !cipherPart) {
    return { ok: false, messageKey: "errors.encryptedFormatInvalid" };
  }

  if (prefix !== ENCRYPTION_PREFIX) {
    return { ok: false, messageKey: "errors.encryptedVersionUnsupported" };
  }

  const keyResult = getEncryptionKey();
  if (!keyResult.ok) {
    return keyResult;
  }

  try {
    const iv = Buffer.from(ivPart, "base64url");
    const tag = Buffer.from(tagPart, "base64url");
    const cipherText = Buffer.from(cipherPart, "base64url");

    const decipher = crypto.createDecipheriv(ALGORITHM, keyResult.value, iv);
    decipher.setAuthTag(tag);

    const plainText = Buffer.concat([
      decipher.update(cipherText),
      decipher.final(),
    ]);

    return { ok: true, value: plainText.toString("utf8") };
  } catch {
    return { ok: false, messageKey: "errors.decryptFailed" };
  }
}
