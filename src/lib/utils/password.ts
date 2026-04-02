import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

type PasswordResult<T> =
  | { ok: true; value: T }
  | { ok: false; messageKey: string };

export async function hashPassword(
  plainText: string,
): Promise<PasswordResult<string>> {
  if (!plainText || plainText.length < 8) {
    return { ok: false, messageKey: "errors.passwordTooShort" };
  }

  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const derived = (await scrypt(plainText, salt, KEY_LENGTH)) as Buffer;
  return {
    ok: true,
    value: `${salt}:${derived.toString("hex")}`,
  };
}

export async function verifyPassword(plainText: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const derived = (await scrypt(plainText, salt, KEY_LENGTH)) as Buffer;
  const digest = Buffer.from(hash, "hex");

  if (digest.length !== derived.length) {
    return false;
  }

  return crypto.timingSafeEqual(digest, derived);
}
